import { DAY, HOUR, now } from "./clock";
import { mutate, newId, subscribe, Tx } from "./db";
import { getSetting } from "./settings";
import { Deal, Order } from "./types";

/**
 * Deadline jobs (CLAUDE.md, "Scheduled jobs"). There is no server, so they run
 * lazily: before every store action and from <DeadlineRunner> while a page is
 * open. Each job uses the deadline itself as its timestamp, so jumping the
 * clock forward several days replays every step in order. Running them again
 * changes nothing.
 */

function settings(tx: Tx) {
  return { settings: tx.all("settings") };
}

function iso(ms: number) {
  return new Date(ms).toISOString();
}

export function notifyUser(tx: Tx, userId: string, type: string, payload: Record<string, unknown>, at = now()) {
  tx.insert("notifications", {
    id: newId("ntf"),
    userId,
    type,
    payload,
    readAt: null,
    createdAt: iso(at),
  });
}

/** Notifies every admin, e.g. when something lands in a review queue. */
export function notifyAdmins(tx: Tx, type: string, payload: Record<string, unknown>, at = now()) {
  for (const profile of tx.all("profiles").filter((row) => row.role === "admin")) {
    notifyUser(tx, profile.id, type, payload, at);
  }
}

function activeVotes(tx: Tx, dealId: string) {
  return tx.all("votes").filter((vote) => vote.dealId === dealId && vote.status === "active");
}

/** Voting deadline: lock the tier from units voted and hand over to the seller. */
function closeVoting(tx: Tx, deal: Deal, at: number) {
  const votes = activeVotes(tx, deal.id);
  const units = votes.reduce((sum, vote) => sum + vote.quantity, 0);

  if (units === 0) {
    tx.update("deals", deal.id, { status: "completed", unitsVotedAtClose: 0 });
    notifyUser(tx, deal.sellerId, "deal_closed_no_votes", { dealId: deal.id }, at);
    return;
  }

  const tiers = tx
    .all("dealTiers")
    .filter((tier) => tier.dealId === deal.id)
    .sort((a, b) => a.minUnits - b.minUnits);
  const tier = [...tiers].reverse().find((row) => units >= row.minUnits) ?? tiers[0];

  tx.update("deals", deal.id, {
    status: "seller_decision",
    unitsVotedAtClose: units,
    lockedTierId: tier?.id ?? null,
    lockedUnitPrice: tier?.unitPrice ?? null,
    decisionDeadline: iso(at + getSetting(settings(tx), "sellerDecisionHours") * HOUR),
  });
  notifyUser(tx, deal.sellerId, "decision_needed", { dealId: deal.id, units }, at);
}

/** Cancels a deal at the seller decision step. No buyer has paid yet. */
export function cancelAtDecision(tx: Tx, deal: Deal, reason: "seller" | "decision_timeout", at: number) {
  tx.update("deals", deal.id, { status: "cancelled", cancelReason: reason, decidedAt: iso(at) });
  for (const vote of activeVotes(tx, deal.id)) {
    tx.update("votes", vote.id, { status: "cancelled", updatedAt: iso(at) });
    notifyUser(tx, vote.buyerId, "deal_cancelled", { dealId: deal.id }, at);
  }
  if (reason === "decision_timeout") {
    notifyUser(tx, deal.sellerId, "decision_timed_out", { dealId: deal.id }, at);
  }
}

/** Payment deadline: unanswered votes become no-shows, then shipping starts. */
function closePaymentWindow(tx: Tx, deal: Deal, at: number) {
  const limit = getSetting(settings(tx), "noShowLimit");
  const lookback = getSetting(settings(tx), "noShowLookbackDays") * DAY;
  const restriction = getSetting(settings(tx), "noShowRestrictionDays") * DAY;

  for (const vote of activeVotes(tx, deal.id)) {
    tx.update("votes", vote.id, { status: "expired", respondedAt: iso(at), updatedAt: iso(at) });
    tx.insert("noShowEvents", { id: newId("noshow"), buyerId: vote.buyerId, dealId: deal.id, createdAt: iso(at) });

    const recent = tx
      .all("noShowEvents")
      .filter((event) => event.buyerId === vote.buyerId && Date.parse(event.createdAt) > at - lookback).length;
    const profile = tx.find("profiles", vote.buyerId);
    if (recent >= limit && profile) {
      const until = at + restriction;
      if (!profile.votingRestrictedUntil || Date.parse(profile.votingRestrictedUntil) < until) {
        tx.update("profiles", profile.id, { votingRestrictedUntil: iso(until) });
      }
      notifyUser(tx, vote.buyerId, "voting_restricted", { until: iso(until) }, at);
    } else {
      notifyUser(tx, vote.buyerId, "payment_missed", { dealId: deal.id, count: recent, limit }, at);
    }
  }

  const paid = tx.all("orders").some((order) => order.dealId === deal.id);
  tx.update("deals", deal.id, { status: paid ? "fulfilling" : "completed" });
  notifyUser(tx, deal.sellerId, paid ? "ready_to_ship" : "deal_closed_no_payments", { dealId: deal.id }, at);
}

function hasOpenDispute(tx: Tx, orderId: string) {
  return tx.all("disputes").some((dispute) => dispute.orderId === orderId && dispute.status === "open");
}

/** Delivery confirmed (by the buyer or automatically): the order becomes payable to the seller. */
export function markDelivered(tx: Tx, order: Order, at: number) {
  tx.update("orders", order.id, { status: "delivered", deliveredAt: iso(at), payableAt: iso(at) });
  notifyUser(tx, order.sellerId, "order_delivered", { orderId: order.id }, at);
}

/** Shipped orders are confirmed automatically after the configured days, unless disputed. */
function autoConfirmDeliveries(tx: Tx, at: number): number {
  const wait = getSetting(settings(tx), "autoConfirmDeliveryDays") * DAY;
  let ran = 0;
  for (const order of tx.all("orders")) {
    if (order.status !== "shipped" || !order.shippedAt || hasOpenDispute(tx, order.id)) {
      continue;
    }
    const due = Date.parse(order.shippedAt) + wait;
    if (due <= at) {
      markDelivered(tx, order, due);
      notifyUser(tx, order.buyerId, "delivery_auto_confirmed", { orderId: order.id }, due);
      ran++;
    }
  }
  return ran;
}

/** A fulfilling deal completes once every order is delivered or refunded and no dispute is open. */
function completeFulfilledDeals(tx: Tx, at: number): number {
  let ran = 0;
  for (const deal of tx.all("deals")) {
    if (deal.status !== "fulfilling") {
      continue;
    }
    const orders = tx.all("orders").filter((order) => order.dealId === deal.id);
    const done = orders.every(
      (order) => (order.status === "delivered" || order.status === "refunded") && !hasOpenDispute(tx, order.id)
    );
    if (done) {
      tx.update("deals", deal.id, { status: "completed" });
      notifyUser(tx, deal.sellerId, "deal_completed", { dealId: deal.id }, at);
      ran++;
    }
  }
  return ran;
}

/** Runs every due job inside an existing mutate(). Returns how many ran. */
export function runDueJobs(tx: Tx, at: number): number {
  let ran = 0;
  // Each pass can make the next deadline due (e.g. voting closes, then the
  // decision window also ends), so repeat until nothing changes.
  for (let pass = 0; pass < 10; pass++) {
    let changed = false;
    for (const deal of tx.all("deals")) {
      const due = (value: string | null) => value !== null && Date.parse(value) <= at;
      if (deal.status === "live" && due(deal.votingEndsAt)) {
        closeVoting(tx, deal, Date.parse(deal.votingEndsAt!));
      } else if (deal.status === "seller_decision" && due(deal.decisionDeadline)) {
        cancelAtDecision(tx, deal, "decision_timeout", Date.parse(deal.decisionDeadline!));
      } else if (deal.status === "payment_window" && due(deal.paymentDeadline)) {
        closePaymentWindow(tx, deal, Date.parse(deal.paymentDeadline!));
      } else {
        continue;
      }
      changed = true;
      ran++;
    }
    if (!changed) {
      break;
    }
  }
  ran += autoConfirmDeliveries(tx, at);
  ran += completeFulfilledDeals(tx, at);
  return ran;
}

/** Applies every due deadline. Writes (and notifies) only when something was due. */
export function syncDeadlines(): number {
  if (typeof window === "undefined") {
    return 0;
  }
  return mutate((tx) => runDueJobs(tx, now()));
}

/** Keeps deadlines applied while a page is open. Returns a cleanup function. */
export function startDeadlineRunner(intervalMs = 5000) {
  let queued = false;
  const runSoon = () => {
    if (!queued) {
      queued = true;
      queueMicrotask(() => {
        queued = false;
        syncDeadlines();
      });
    }
  };
  runSoon();
  const timer = window.setInterval(runSoon, intervalMs);
  const unsubscribe = subscribe(runSoon);
  return () => {
    window.clearInterval(timer);
    unsubscribe();
  };
}

/** The next deadline across all deals, for the dev panel's "skip ahead" button. */
export function nextDeadline(deals: readonly Deal[], at: number): { at: number; deal: Deal; label: string } | null {
  let best: { at: number; deal: Deal; label: string } | null = null;
  for (const deal of deals) {
    const candidate =
      deal.status === "live" && deal.votingEndsAt
        ? { value: deal.votingEndsAt, label: "voting closes" }
        : deal.status === "seller_decision" && deal.decisionDeadline
          ? { value: deal.decisionDeadline, label: "seller decision due" }
          : deal.status === "payment_window" && deal.paymentDeadline
            ? { value: deal.paymentDeadline, label: "payment window closes" }
            : null;
    if (!candidate) {
      continue;
    }
    const time = Date.parse(candidate.value);
    if (time > at && (!best || time < best.at)) {
      best = { at: time, deal, label: candidate.label };
    }
  }
  return best;
}
