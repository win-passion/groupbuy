"use client";

import { useMemo } from "react";
import { EmptyState, PageHeader, Skeleton, StatCard } from "../../components/ui";
import {
  formatDate,
  formatTHB,
  getSetting,
  percent,
  sellerEarnings,
  sellerNet,
  useDb,
  useSessionUser,
} from "../../lib/store";

export default function SellerEarningsPage() {
  const db = useDb();
  const user = useSessionUser();

  const data = useMemo(() => {
    if (!db || !user) {
      return null;
    }
    const profile = db.sellerProfiles.find((row) => row.id === user.id);
    return {
      earnings: sellerEarnings(db, user.id),
      rate: profile?.commissionRate ?? getSetting(db, "defaultCommissionRate"),
      custom: profile?.commissionRate !== null && profile?.commissionRate !== undefined,
      payouts: db.payouts
        .filter((payout) => payout.sellerId === user.id)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .map((payout) => ({ payout, orders: db.orders.filter((order) => order.payoutId === payout.id) })),
    };
  }, [db, user]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:py-10">
      <PageHeader
        eyebrow="MONEY"
        title="Earnings"
        text="You're paid for each order once delivery is confirmed: the order total minus GroupBuy's commission."
      />

      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {data ? (
          <>
            <StatCard label="Ready to pay out" value={formatTHB(data.earnings.payable)} tone="success" />
            <StatCard label="Awaiting delivery" value={formatTHB(data.earnings.inProgress)} />
            <StatCard label="Paid out" value={formatTHB(data.earnings.paidOut)} />
            <StatCard label="Commission" value={formatTHB(data.earnings.commission)} />
          </>
        ) : (
          [0, 1, 2, 3].map((index) => <Skeleton key={index} className="h-24" />)
        )}
      </div>

      {data && (
        <p className="mt-4 text-sm text-muted">
          Your commission rate is <b className="text-ink">{percent(data.rate)}</b>
          {data.custom ? " (set for your shop)" : " (platform default)"}. Each order keeps the rate from when it was paid.
          GroupBuy sends payouts for delivered orders.
        </p>
      )}

      <h2 className="mt-10 text-sm font-bold uppercase tracking-wider text-subtle">Payouts</h2>
      <div className="mt-3 space-y-3">
        {!data ? (
          <Skeleton className="h-32" />
        ) : data.payouts.length === 0 ? (
          <EmptyState icon="banknote" title="No payouts yet" text="Payouts appear here once GroupBuy pays you for delivered orders." />
        ) : (
          data.payouts.map(({ payout, orders }) => (
            <div key={payout.id} className="rounded-sheet bg-surface p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-extrabold">{formatTHB(payout.amount)}</p>
                  <p className="text-sm text-muted">
                    Paid {payout.paidAt ? formatDate(payout.paidAt) : "—"} · {orders.length} {orders.length === 1 ? "order" : "orders"}
                  </p>
                </div>
                <span className="rounded-full bg-success-50 px-3 py-1 text-xs font-bold text-success-600">Paid</span>
              </div>
              <ul className="mt-3 divide-y divide-line text-sm">
                {orders.map((order) => (
                  <li key={order.id} className="flex justify-between gap-3 py-2">
                    <span className="text-muted">
                      {order.quantity} × {db?.deals.find((deal) => deal.id === order.dealId)?.title}
                    </span>
                    <span className="font-bold">{formatTHB(sellerNet(order))}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
