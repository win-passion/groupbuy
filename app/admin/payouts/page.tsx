"use client";

import { useMemo, useState } from "react";
import { EmptyState, PageHeader, Skeleton } from "../../components/ui";
import { formatDate, formatTHB, payableOrders, payOutSeller, sellerEarnings, sellerNet, useDb } from "../../lib/store";

export default function AdminPayoutsPage() {
  const db = useDb();
  const [error, setError] = useState("");

  const data = useMemo(() => {
    if (!db) {
      return null;
    }
    const sellers = db.sellerProfiles
      .map((seller) => {
        const orders = payableOrders(db, seller.id);
        return {
          seller,
          orders,
          amount: orders.reduce((sum, order) => sum + sellerNet(order), 0),
          earnings: sellerEarnings(db, seller.id),
        };
      })
      .filter((row) => row.orders.length > 0 || row.earnings.inProgress > 0)
      .sort((a, b) => b.amount - a.amount);
    const history = [...db.payouts]
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .map((payout) => ({
        payout,
        shop: db.sellerProfiles.find((seller) => seller.id === payout.sellerId)?.shopName ?? "Seller",
      }));
    return { sellers, history };
  }, [db]);

  function pay(sellerId: string, shop: string, amount: number) {
    if (window.confirm(`Send ${formatTHB(amount)} to ${shop}?`)) {
      const result = payOutSeller(sellerId);
      setError(result.ok ? "" : result.error);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:py-10">
      <PageHeader
        eyebrow="ADMIN"
        title="Payouts"
        text="Delivered, undisputed orders are payable: order total minus refunds and commission."
      />
      {error && <p role="alert" className="mt-4 text-sm font-semibold text-danger">{error}</p>}

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wider text-subtle">Ready to pay</h2>
      <div className="mt-3 space-y-3">
        {!data ? (
          <Skeleton className="h-32" />
        ) : data.sellers.length === 0 ? (
          <EmptyState icon="banknote" title="Nothing to pay out" text="Sellers appear here once their orders are delivered." />
        ) : (
          data.sellers.map(({ seller, orders, amount, earnings }) => (
            <div key={seller.id} className="flex flex-wrap items-center gap-4 rounded-sheet bg-surface p-5 shadow-sm">
              <div className="min-w-0 flex-1">
                <p className="font-extrabold">{seller.shopName}</p>
                <p className="text-sm text-muted">
                  {orders.length} payable {orders.length === 1 ? "order" : "orders"} · {formatTHB(earnings.inProgress)} still
                  awaiting delivery
                </p>
              </div>
              <p className="text-2xl font-extrabold text-success-600">{formatTHB(amount)}</p>
              <button
                type="button"
                disabled={amount === 0}
                onClick={() => pay(seller.id, seller.shopName, amount)}
                className="rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-600 disabled:bg-surface-muted disabled:text-subtle"
              >
                Pay out
              </button>
            </div>
          ))
        )}
      </div>

      <h2 className="mt-10 text-sm font-bold uppercase tracking-wider text-subtle">History</h2>
      <div className="mt-3 overflow-hidden rounded-sheet bg-surface shadow-sm">
        {!data ? (
          <Skeleton className="h-24" />
        ) : data.history.length === 0 ? (
          <p className="p-6 text-sm text-muted">No payouts yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {data.history.map(({ payout, shop }) => (
              <li key={payout.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm">
                <span className="font-bold">{shop}</span>
                <span className="text-muted">{payout.paidAt ? formatDate(payout.paidAt) : "Pending"}</span>
                <span className="font-extrabold">{formatTHB(payout.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
