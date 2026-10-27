import { votingClosedReason } from "./actions";
import { now } from "./clock";
import { Db } from "./db";
import { getSetting } from "./settings";
import { Category, Deal, DealTier, Order, Vote } from "./types";

/** Shared derived values, so every screen shows the same numbers. */

export function dealTiers(db: Db, dealId: string): DealTier[] {
  return db.dealTiers
    .filter((tier) => tier.dealId === dealId)
    .sort((a, b) => a.minUnits - b.minUnits);
}

function countingVotes(db: Db, dealId: string): Vote[] {
  return db.votes.filter((vote) => vote.dealId === dealId && vote.status === "active");
}

/** Units from votes that still count toward the tier. */
export function unitsVoted(db: Db, dealId: string): number {
  return countingVotes(db, dealId).reduce((sum, vote) => sum + vote.quantity, 0);
}

/** The tier reached at `units`. With at least one tier this is never undefined. */
export function tierForUnits(tiers: DealTier[], units: number): DealTier | undefined {
  return [...tiers].reverse().find((tier) => units >= tier.minUnits) ?? tiers[0];
}

/** The next cheaper tier. With no votes the deal already sits at the first tier. */
export function nextTier(tiers: DealTier[], units: number): DealTier | undefined {
  return tiers.find((tier) => tier.minUnits > Math.max(units, 1));
}

export function dealCoverImage(db: Db, dealId: string): string | undefined {
  return db.dealImages
    .filter((image) => image.dealId === dealId)
    .sort((a, b) => a.sortOrder - b.sortOrder)[0]?.src;
}

export type DealSummary = {
  deal: Deal;
  tiers: DealTier[];
  units: number;
  voters: number;
  currentTier: DealTier | undefined;
  nextTier: DealTier | undefined;
  unitsToNextTier: number | null;
  /** Saving of the current price against the first-tier price, 0–100 */
  savingPercent: number;
  cover: string | undefined;
  category: Category | undefined;
  shopName: string;
  /** null while buyers can vote */
  closedReason: string | null;
};

export function dealSummary(db: Db, deal: Deal, at = now()): DealSummary {
  const tiers = dealTiers(db, deal.id);
  // Once voting closes the units and tier are locked; later vote changes
  // (paid, declined, expired) never move the price.
  const locked = deal.unitsVotedAtClose !== null;
  const votes = locked
    ? db.votes.filter((vote) => vote.dealId === deal.id && vote.status !== "withdrawn")
    : countingVotes(db, deal.id);
  const units = locked ? deal.unitsVotedAtClose! : votes.reduce((sum, vote) => sum + vote.quantity, 0);
  const currentTier = (locked && tiers.find((tier) => tier.id === deal.lockedTierId)) || tierForUnits(tiers, units);
  const next = nextTier(tiers, units);
  const basePrice = tiers[0]?.unitPrice ?? 0;

  return {
    deal,
    tiers,
    units,
    voters: votes.length,
    currentTier,
    nextTier: next,
    unitsToNextTier: next ? next.minUnits - units : null,
    savingPercent:
      currentTier && basePrice > 0
        ? Math.round(((basePrice - currentTier.unitPrice) / basePrice) * 100)
        : 0,
    cover: dealCoverImage(db, deal.id),
    category: db.categories.find((category) => category.id === deal.categoryId),
    shopName: db.sellerProfiles.find((seller) => seller.id === deal.sellerId)?.shopName ?? "GroupBuy seller",
    closedReason: votingClosedReason(deal, at),
  };
}

export function findDealSummary(db: Db, dealId: string): DealSummary | null {
  const deal = db.deals.find((row) => row.id === dealId);
  return deal ? dealSummary(db, deal) : null;
}

/** Deals buyers can see: live ones, open for voting first, then ending soonest. */
export function marketplaceDeals(db: Db): DealSummary[] {
  return db.deals
    .filter((deal) => deal.status === "live")
    .map((deal) => dealSummary(db, deal))
    .sort((a, b) => {
      if (Boolean(a.closedReason) !== Boolean(b.closedReason)) {
        return a.closedReason ? 1 : -1;
      }
      return Date.parse(a.deal.votingEndsAt ?? "") - Date.parse(b.deal.votingEndsAt ?? "");
    });
}

/** The buyer's vote on a deal, in any status. */
export function voteFor(db: Db, dealId: string, buyerId: string): Vote | undefined {
  return db.votes.find((vote) => vote.dealId === dealId && vote.buyerId === buyerId);
}

export type PaymentCount = { units: number; people: number };

export type PaymentStatus = {
  voted: PaymentCount;
  paid: PaymentCount;
  waiting: PaymentCount;
  declined: PaymentCount;
  /** Let the window expire (no-shows) */
  missed: PaymentCount;
};

/** Counts for the payment status box. Never includes names. */
export function paymentStatus(db: Db, dealId: string): PaymentStatus {
  const empty = (): PaymentCount => ({ units: 0, people: 0 });
  const result: PaymentStatus = { voted: empty(), paid: empty(), waiting: empty(), declined: empty(), missed: empty() };
  const bucket = { active: "waiting", paid: "paid", declined: "declined", expired: "missed" } as const;
  for (const vote of db.votes) {
    if (vote.dealId !== dealId || !(vote.status in bucket)) {
      continue;
    }
    const key = bucket[vote.status as keyof typeof bucket];
    for (const count of [result[key], result.voted]) {
      count.units += vote.quantity;
      count.people += 1;
    }
  }
  return result;
}

export type NoShowStatus = {
  /** No-shows inside the lookback window */
  count: number;
  limit: number;
  lookbackDays: number;
  restrictionDays: number;
  restrictedUntil: string | null;
  /** One more no-show triggers a restriction */
  warn: boolean;
};

export function noShowStatus(db: Db, buyerId: string, at = now()): NoShowStatus {
  const limit = getSetting(db, "noShowLimit");
  const lookbackDays = getSetting(db, "noShowLookbackDays");
  const since = at - lookbackDays * 24 * 60 * 60 * 1000;
  const count = db.noShowEvents.filter((event) => event.buyerId === buyerId && Date.parse(event.createdAt) > since).length;
  const until = db.profiles.find((profile) => profile.id === buyerId)?.votingRestrictedUntil ?? null;
  const restrictedUntil = until && Date.parse(until) > at ? until : null;
  return {
    count,
    limit,
    lookbackDays,
    restrictionDays: getSetting(db, "noShowRestrictionDays"),
    restrictedUntil,
    warn: !restrictedUntil && count === limit - 1,
  };
}

/** How often a seller cancels at the decision step (visible to admins). */
export function sellerDecisionStats(db: Db, sellerId: string) {
  const decided = db.deals.filter((deal) => deal.sellerId === sellerId && deal.decidedAt !== null);
  const cancelled = decided.filter((deal) => deal.cancelReason === "seller").length;
  const timedOut = decided.filter((deal) => deal.cancelReason === "decision_timeout").length;
  return {
    decided: decided.length,
    cancelled,
    timedOut,
    /** 0–100, counting both chosen cancellations and timeouts */
    cancelRate: decided.length ? Math.round(((cancelled + timedOut) / decided.length) * 100) : 0,
  };
}

/** Votes waiting for this buyer to confirm and pay, soonest deadline first. */
export function paymentsDue(db: Db, buyerId: string, at = now()): { vote: Vote; deal: Deal }[] {
  return db.votes
    .filter((vote) => vote.buyerId === buyerId && vote.status === "active")
    .flatMap((vote) => {
      const deal = db.deals.find((row) => row.id === vote.dealId);
      return deal?.status === "payment_window" && deal.paymentDeadline && Date.parse(deal.paymentDeadline) > at
        ? [{ vote, deal }]
        : [];
    })
    .sort((a, b) => Date.parse(a.deal.paymentDeadline!) - Date.parse(b.deal.paymentDeadline!));
}

export function orderForVote(db: Db, voteId: string): Order | undefined {
  return db.orders.find((order) => order.voteId === voteId);
}
