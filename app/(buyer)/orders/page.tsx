"use client";

import Link from "next/link";
import { useMemo } from "react";
import OrderStatusPill from "../../components/deals/OrderStatusPill";
import { EmptyState, PageHeader, Skeleton } from "../../components/ui";
import { dealCoverImage, formatDate, formatTHB, useDb, useSessionUser } from "../../lib/store";

export default function OrdersPage() {
  const db = useDb();
  const user = useSessionUser();

  const orders = useMemo(() => {
    if (!db || !user) {
      return null;
    }
    return db.orders
      .filter((order) => order.buyerId === user.id)
      .map((order) => ({
        order,
        deal: db.deals.find((deal) => deal.id === order.dealId),
        cover: dealCoverImage(db, order.dealId),
      }))
      .sort((a, b) => Date.parse(b.order.createdAt) - Date.parse(a.order.createdAt));
  }, [db, user]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:py-10">
      <PageHeader eyebrow="YOUR PURCHASES" title="Orders" text="Track deliveries and confirm when your order arrives." />

      <div className="mt-8 space-y-4">
        {!orders ? (
          <Skeleton className="h-36" />
        ) : orders.length === 0 ? (
          <EmptyState
            icon="box"
            title="No orders yet"
            text="When you confirm and pay for a deal, the order appears here."
            action={{ href: "/my-groups", label: "Go to My Groups" }}
          />
        ) : (
          orders.map(({ order, deal, cover }) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex flex-col gap-4 rounded-sheet bg-surface p-5 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center"
            >
              <div className="flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surface-subtle sm:w-24">
                {cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cover} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <OrderStatusPill status={order.status} />
                <p className="mt-2 font-extrabold">{deal?.title ?? "Deal"}</p>
                <p className="mt-1 text-sm text-muted">
                  {order.quantity} × {formatTHB(order.unitPrice)} · ordered {formatDate(order.createdAt)}
                  {order.trackingNumber && ` · tracking ${order.trackingNumber}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-extrabold">{formatTHB(order.total)}</p>
                {order.refundedAmount > 0 && (
                  <p className="text-xs font-bold text-success-600">{formatTHB(order.refundedAmount)} refunded</p>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
