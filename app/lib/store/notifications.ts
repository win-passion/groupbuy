import { act } from "./act";
import { auth } from "./auth-guard";
import { formatDate, nowIso } from "./clock";
import { Db, mutate, requireDb } from "./db";
import { ActionResult, fail } from "./errors";
import { formatTHB } from "./money";
import { Notification, UserRole } from "./types";

export type NotificationView = {
  /** An icon name from app/components/shell/Icon.tsx */
  icon: string;
  title: string;
  body: string;
  /** Where tapping the notification goes */
  href: string;
};

/** Turns a stored notification into display text and a link for the person who received it. */
export function describeNotification(db: Db, notification: Notification, role: UserRole): NotificationView {
  const payload = notification.payload as Record<string, unknown>;
  const dealId = typeof payload.dealId === "string" ? payload.dealId : null;
  const orderId = typeof payload.orderId === "string" ? payload.orderId : null;
  const order = orderId ? db.orders.find((row) => row.id === orderId) : undefined;
  const deal = db.deals.find((row) => row.id === (dealId ?? order?.dealId));
  const title = deal?.title ?? "your deal";
  const sellerDeal = dealId ? `/seller/deals/${dealId}` : "/seller";

  switch (notification.type) {
    // Buyers
    case "payment_requested":
      return {
        icon: "card",
        title: "The final price is in",
        body: `${title}: ${formatTHB(Number(payload.unitPrice) || 0)} × ${payload.quantity}. Confirm and pay before the window closes.`,
        href: `/pay/${dealId}`,
      };
    case "deal_cancelled":
      return { icon: "ban", title: "Deal cancelled", body: `${title} won't go ahead. Nobody was charged.`, href: "/my-groups" };
    case "order_shipped":
      return {
        icon: "truck",
        title: "Your order has shipped",
        body: payload.trackingNumber ? `${title} · tracking ${payload.trackingNumber}` : `${title} is on its way.`,
        href: `/orders/${orderId}`,
      };
    case "delivery_auto_confirmed":
      return { icon: "box", title: "Delivery confirmed", body: `${title} was confirmed as delivered automatically.`, href: `/orders/${orderId}` };
    case "payment_missed":
      return {
        icon: "hourglass",
        title: "You missed a payment confirmation",
        body: `${title}: the payment window closed. That's ${payload.count} of ${payload.limit} allowed before voting is paused.`,
        href: "/my-groups",
      };
    case "voting_restricted":
      return {
        icon: "pause",
        title: "Voting is paused",
        body: `After missed payment confirmations you can vote again on ${formatDate(String(payload.until))}.`,
        href: "/my-groups",
      };
    case "voting_restored":
      return { icon: "done", title: "You can vote again", body: "An admin lifted your voting restriction.", href: "/" };

    // Sellers
    case "seller_approved":
      return { icon: "party", title: "Your shop is approved", body: "You can now create group deals.", href: "/seller/create" };
    case "seller_rejected":
      return { icon: "pencil", title: "Seller application not approved", body: String(payload.reason ?? ""), href: "/seller" };
    case "deal_approved":
      return { icon: "rocket", title: "Your deal is live", body: `${title} is open for voting.`, href: sellerDeal };
    case "deal_rejected":
      return { icon: "pencil", title: "Changes requested", body: `${title}: ${payload.note}`, href: sellerDeal };
    case "decision_needed":
      return {
        icon: "vote",
        title: "Voting closed: your decision",
        body: `${title} closed at ${payload.units} units. Proceed or cancel before the window ends.`,
        href: sellerDeal,
      };
    case "decision_timed_out":
      return { icon: "timer", title: "Deal cancelled automatically", body: `No decision was made on ${title} in time.`, href: sellerDeal };
    case "deal_closed_no_votes":
      return { icon: "archive", title: "Voting closed with no votes", body: `${title} ended without any votes.`, href: sellerDeal };
    case "deal_closed_no_payments":
      return { icon: "archive", title: "No payments received", body: `Nobody paid for ${title}, so it's closed.`, href: sellerDeal };
    case "order_paid":
      return { icon: "coins", title: "New paid order", body: `${payload.quantity} × ${title}. Ship it to the buyer.`, href: "/seller/orders" };
    case "ready_to_ship":
      return { icon: "box", title: "Payment window closed", body: `${title}: ship every paid order.`, href: "/seller/orders" };
    case "order_delivered":
      return { icon: "done", title: "Order delivered", body: `An order of ${title} was delivered and is now payable.`, href: "/seller/earnings" };
    case "deal_completed":
      return { icon: "flag", title: "Deal completed", body: `Every order of ${title} is delivered or refunded.`, href: sellerDeal };
    case "payout_sent":
      return { icon: "banknote", title: "Payout sent", body: `${formatTHB(Number(payload.amount) || 0)} is on its way to you.`, href: "/seller/earnings" };

    // Shared
    case "dispute_opened":
      return {
        icon: "alert",
        title: "A buyer reported a problem",
        body: `${title}: an admin will review it.`,
        href: role === "admin" ? "/admin/disputes" : "/seller/orders",
      };
    case "dispute_resolved": {
      const refund = Number(payload.refundAmount) || 0;
      return {
        icon: "peace",
        title: "Dispute resolved",
        body: `${title}: ${refund ? `${formatTHB(refund)} refunded. ` : "no refund. "}${payload.resolution ?? ""}`,
        href: role === "buyer" && orderId ? `/orders/${orderId}` : "/seller/orders",
      };
    }

    // Admins
    case "seller_applied":
      return { icon: "store", title: "New seller application", body: `${payload.shopName} wants to sell on GroupBuy.`, href: "/admin/sellers" };
    case "deal_submitted":
      return { icon: "check", title: "Deal submitted for review", body: title, href: "/admin/deals" };

    default:
      return { icon: "bell", title: "Update", body: notification.type.replace(/_/g, " "), href: "/" };
  }
}

export function notificationsFor(db: Db, userId: string): Notification[] {
  return db.notifications
    .filter((notification) => notification.userId === userId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function unreadCount(db: Db, userId: string): number {
  return db.notifications.filter((notification) => notification.userId === userId && !notification.readAt).length;
}

export function markNotificationRead(notificationId: string): ActionResult {
  return act(() => {
    const db = requireDb();
    const user = auth(db).user();
    const notification = db.notifications.find((row) => row.id === notificationId);
    if (!notification || notification.userId !== user.id) {
      fail("Notification not found.");
    }
    if (!notification.readAt) {
      mutate((tx) => {
        tx.update("notifications", notificationId, { readAt: nowIso() });
      });
    }
    return undefined;
  });
}

export function markAllNotificationsRead(): ActionResult {
  return act(() => {
    const db = requireDb();
    const user = auth(db).user();
    const at = nowIso();
    mutate((tx) => {
      for (const notification of tx.all("notifications")) {
        if (notification.userId === user.id && !notification.readAt) {
          tx.update("notifications", notification.id, { readAt: at });
        }
      }
    });
    return undefined;
  });
}
