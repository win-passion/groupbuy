import { refund } from "../payments";
import { act } from "./act";
import { auth } from "./auth-guard";
import { now, nowIso } from "./clock";
import { Db, mutate, newId, requireDb } from "./db";
import { ActionResult, fail } from "./errors";
import { markDelivered, notifyAdmins, notifyUser } from "./jobs";
import { commissionOn, formatTHB } from "./money";
import { DEFAULT_SETTINGS } from "./settings";
import { BasisPoints, Dispute, Order, Satang, SettingKey } from "./types";

/**
 * Fulfilment and money (CLAUDE.md Phase 4): shipping, delivery, disputes,
 * refunds, payouts, commission and admin settings.
 */

/** What the seller receives for an order: total minus refunds minus commission. */
export function sellerNet(order: Order): Satang {
  return order.total - order.refundedAmount - order.commissionAmount;
}

function findOrder(db: Db, orderId: string): Order {
  const order = db.orders.find((row) => row.id === orderId);
  if (!order) {
    fail("Order not found.");
  }
  return order;
}

function openDisputeFor(db: Db, orderId: string): Dispute | undefined {
  return db.disputes.find((dispute) => dispute.orderId === orderId && dispute.status === "open");
}

// ---------------------------------------------------------------------------
// Seller: shipping
// ---------------------------------------------------------------------------

export function shipOrder(orderId: string, trackingNumber: string): ActionResult {
  return act(() => {
    const db = requireDb();
    const seller = auth(db).seller();
    const order = findOrder(db, orderId);
    if (order.sellerId !== seller.id) {
      fail("Order not found.");
    }
    if (order.status !== "paid") {
      fail(order.status === "disputed" ? "This order has an open dispute." : "This order has already been shipped.");
    }
    const at = nowIso();
    mutate((tx) => {
      tx.update("orders", orderId, { status: "shipped", shippedAt: at, trackingNumber: trackingNumber.trim() || null });
      notifyUser(tx, order.buyerId, "order_shipped", { orderId, trackingNumber: trackingNumber.trim() || null });
    });
    return undefined;
  });
}

// ---------------------------------------------------------------------------
// Buyer: delivery and disputes
// ---------------------------------------------------------------------------

function ownOrder(db: Db, buyerId: string, orderId: string): Order {
  const order = findOrder(db, orderId);
  if (order.buyerId !== buyerId) {
    fail("Order not found.");
  }
  return order;
}

export function confirmDelivery(orderId: string): ActionResult {
  return act(() => {
    const db = requireDb();
    const buyer = auth(db).buyer();
    const order = ownOrder(db, buyer.id, orderId);
    if (order.status !== "shipped") {
      fail(order.status === "delivered" ? "Delivery is already confirmed." : "This order hasn't been shipped yet.");
    }
    mutate((tx) => markDelivered(tx, order, now()));
    return undefined;
  });
}

export const DISPUTE_REASONS: Record<Dispute["reason"], string> = {
  not_delivered: "Not delivered",
  damaged: "Arrived damaged",
  wrong_item: "Wrong item",
  other: "Something else",
};

/** Buyers can raise a problem until the order is paid out to the seller. */
export function canDispute(db: Db, order: Order): boolean {
  return (
    ["paid", "shipped", "delivered"].includes(order.status) && order.payoutId === null && !openDisputeFor(db, order.id)
  );
}

export function openDispute(orderId: string, reason: Dispute["reason"], details: string): ActionResult<string> {
  return act(() => {
    const db = requireDb();
    const buyer = auth(db).buyer();
    const order = ownOrder(db, buyer.id, orderId);
    if (!canDispute(db, order)) {
      fail(
        order.payoutId
          ? "This order has already been paid out. Contact GroupBuy support."
          : "You can't open a dispute on this order right now."
      );
    }
    if (details.trim().length < 10) {
      fail("Describe the problem in at least 10 characters.");
    }
    const id = newId("dispute");
    mutate((tx) => {
      tx.insert("disputes", {
        id,
        orderId,
        openedBy: buyer.id,
        reason,
        details: details.trim(),
        status: "open",
        orderStatusBefore: order.status,
        resolution: null,
        resolvedAt: null,
        refundAmount: null,
        createdAt: nowIso(),
      });
      // Not payable while a dispute is open.
      tx.update("orders", orderId, { status: "disputed", payableAt: null });
      notifyUser(tx, order.sellerId, "dispute_opened", { orderId, reason });
      notifyAdmins(tx, "dispute_opened", { orderId, reason });
    });
    return id;
  });
}

// ---------------------------------------------------------------------------
// Admin: disputes and refunds
// ---------------------------------------------------------------------------

/**
 * Resolves a dispute with an optional refund. A refund of the whole remaining
 * amount refunds the order; anything less returns it to its previous status.
 * Commission is recalculated on what the seller keeps.
 */
export function resolveDispute(disputeId: string, refundAmount: Satang, resolution: string): ActionResult {
  return act(() => {
    const db = requireDb();
    auth(db).admin();
    const dispute = db.disputes.find((row) => row.id === disputeId);
    if (!dispute || dispute.status !== "open") {
      fail("This dispute is already resolved.");
    }
    const order = findOrder(db, dispute.orderId);
    const refundable = order.total - order.refundedAmount;
    if (!Number.isInteger(refundAmount) || refundAmount < 0 || refundAmount > refundable) {
      fail(`Refund between ฿0 and ${formatTHB(refundable)}.`);
    }
    if (!resolution.trim()) {
      fail("Write a short resolution for the buyer and seller.");
    }

    const payment = db.payments.find((row) => row.orderId === order.id && row.status === "succeeded");
    let refundRef = "";
    if (refundAmount > 0) {
      const result = refund({ providerRef: payment?.providerRef ?? "", amount: refundAmount });
      if (!result.ok) {
        fail(result.error);
      }
      refundRef = result.providerRef;
    }

    const at = now();
    const atIso = new Date(at).toISOString();
    const refundedAmount = order.refundedAmount + refundAmount;
    const fullRefund = refundedAmount === order.total;

    mutate((tx) => {
      tx.update("disputes", disputeId, {
        status: "resolved",
        resolution: resolution.trim(),
        refundAmount,
        resolvedAt: atIso,
      });
      if (refundAmount > 0) {
        tx.insert("payments", {
          id: newId("pay"),
          orderId: order.id,
          provider: payment?.provider ?? "mock",
          providerRef: refundRef,
          method: payment?.method ?? "card",
          amount: refundAmount,
          status: "refund",
          createdAt: atIso,
        });
      }

      const base = { refundedAmount, commissionAmount: commissionOn(order.total - refundedAmount, order.commissionRate) };
      if (fullRefund) {
        tx.update("orders", order.id, { ...base, status: "refunded", payableAt: null });
      } else if (dispute.orderStatusBefore === "delivered") {
        tx.update("orders", order.id, { ...base, status: "delivered", payableAt: atIso });
      } else {
        tx.update("orders", order.id, { ...base, status: dispute.orderStatusBefore });
      }

      const payload = { orderId: order.id, refundAmount, resolution: resolution.trim() };
      notifyUser(tx, order.buyerId, "dispute_resolved", payload);
      notifyUser(tx, order.sellerId, "dispute_resolved", payload);
    });
    return undefined;
  });
}

// ---------------------------------------------------------------------------
// Admin: payouts, commission and settings
// ---------------------------------------------------------------------------

export function payableOrders(db: Db, sellerId: string): Order[] {
  return db.orders.filter(
    (order) =>
      order.sellerId === sellerId && order.status === "delivered" && order.payableAt !== null && order.payoutId === null
  );
}

/** Pays the seller every payable order in one transfer (mocked as instant). */
export function payOutSeller(sellerId: string): ActionResult<string> {
  return act(() => {
    const db = requireDb();
    auth(db).admin();
    const orders = payableOrders(db, sellerId);
    if (orders.length === 0) {
      fail("Nothing to pay out for this seller.");
    }
    const amount = orders.reduce((sum, order) => sum + sellerNet(order), 0);
    const id = newId("payout");
    const at = nowIso();
    mutate((tx) => {
      tx.insert("payouts", { id, sellerId, amount, status: "paid", paidAt: at, createdAt: at });
      for (const order of orders) {
        tx.update("orders", order.id, { payoutId: id });
      }
      notifyUser(tx, sellerId, "payout_sent", { payoutId: id, amount });
    });
    return id;
  });
}

/** null returns the seller to the platform default. Past orders keep their rate. */
export function setSellerCommission(sellerId: string, rate: BasisPoints | null): ActionResult {
  return act(() => {
    const db = requireDb();
    auth(db).admin();
    if (rate !== null && (!Number.isInteger(rate) || rate < 0 || rate > 5000)) {
      fail("Commission must be between 0% and 50%.");
    }
    if (!db.sellerProfiles.some((row) => row.id === sellerId)) {
      fail("Seller not found.");
    }
    mutate((tx) => {
      tx.update("sellerProfiles", sellerId, { commissionRate: rate });
    });
    return undefined;
  });
}

export const SETTING_LIMITS: Record<SettingKey, { label: string; unit: string; min: number; max: number }> = {
  votingPeriodMinDays: { label: "Shortest voting period", unit: "days", min: 1, max: 30 },
  votingPeriodMaxDays: { label: "Longest voting period", unit: "days", min: 1, max: 60 },
  votingPeriodDefaultDays: { label: "Default voting period", unit: "days", min: 1, max: 60 },
  sellerDecisionHours: { label: "Seller decision window", unit: "hours", min: 1, max: 168 },
  paymentWindowHours: { label: "Buyer payment window", unit: "hours", min: 1, max: 336 },
  noShowLimit: { label: "No-shows before a restriction", unit: "no-shows", min: 1, max: 20 },
  noShowLookbackDays: { label: "No-show lookback", unit: "days", min: 1, max: 365 },
  noShowRestrictionDays: { label: "Voting restriction", unit: "days", min: 1, max: 365 },
  autoConfirmDeliveryDays: { label: "Auto-confirm delivery after", unit: "days", min: 1, max: 60 },
  defaultCommissionRate: { label: "Default commission", unit: "basis points", min: 0, max: 5000 },
};

export function updateSettings(values: Partial<Record<SettingKey, number>>): ActionResult {
  return act(() => {
    const db = requireDb();
    auth(db).admin();
    const current = Object.fromEntries(
      (Object.keys(DEFAULT_SETTINGS) as SettingKey[]).map((key) => [
        key,
        db.settings.find((row) => row.id === key)?.value ?? DEFAULT_SETTINGS[key],
      ])
    ) as Record<SettingKey, number>;
    const next = { ...current, ...values };

    for (const [key, value] of Object.entries(next) as [SettingKey, number][]) {
      const limit = SETTING_LIMITS[key];
      if (!Number.isInteger(value) || value < limit.min || value > limit.max) {
        fail(`${limit.label} must be a whole number from ${limit.min} to ${limit.max}.`);
      }
    }
    if (next.votingPeriodMinDays > next.votingPeriodMaxDays) {
      fail("The shortest voting period can't be longer than the longest.");
    }
    if (next.votingPeriodDefaultDays < next.votingPeriodMinDays || next.votingPeriodDefaultDays > next.votingPeriodMaxDays) {
      fail("The default voting period must be between the shortest and longest.");
    }

    mutate((tx) => {
      for (const [key, value] of Object.entries(next) as [SettingKey, number][]) {
        if (tx.find("settings", key)) {
          tx.update("settings", key, { value });
        } else {
          tx.insert("settings", { id: key, value });
        }
      }
    });
    return undefined;
  });
}

// ---------------------------------------------------------------------------
// Read helpers
// ---------------------------------------------------------------------------

export type Earnings = {
  /** Paid or shipped, not yet delivered (or disputed) */
  inProgress: Satang;
  payable: Satang;
  paidOut: Satang;
  commission: Satang;
};

export function sellerEarnings(db: Db, sellerId: string): Earnings {
  const result: Earnings = { inProgress: 0, payable: 0, paidOut: 0, commission: 0 };
  for (const order of db.orders) {
    if (order.sellerId !== sellerId || order.status === "refunded") {
      continue;
    }
    const net = sellerNet(order);
    result.commission += order.commissionAmount;
    if (order.payoutId) {
      result.paidOut += net;
    } else if (order.status === "delivered" && order.payableAt) {
      result.payable += net;
    } else {
      result.inProgress += net;
    }
  }
  return result;
}

export function disputeForOrder(db: Db, orderId: string): Dispute | undefined {
  return [...db.disputes]
    .filter((dispute) => dispute.orderId === orderId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
}
