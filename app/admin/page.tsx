"use client";

import Link from "next/link";
import { useMemo } from "react";
import DealStatusPill from "../components/deals/DealStatusPill";
import Icon from "../components/shell/Icon";
import { PageHeader, Skeleton, StatCard } from "../components/ui";
import { DealStatus, formatTHB, marketplaceDeals, payableOrders, sellerNet, useDb } from "../lib/store";

const STATUS_ORDER: DealStatus[] = [
  "pending_review",
  "live",
  "seller_decision",
  "payment_window",
  "fulfilling",
  "completed",
  "cancelled",
  "draft",
  "rejected",
];

export default function AdminDashboard() {
  const db = useDb();
  const stats = useMemo(() => {
    if (!db) {
      return null;
    }
    const live = marketplaceDeals(db).filter((summary) => !summary.closedReason);
    return {
      pendingSellers: db.sellerProfiles.filter((seller) => seller.applicationStatus === "pending").length,
      pendingDeals: db.deals.filter((deal) => deal.status === "pending_review").length,
      liveDeals: live.length,
      units: live.reduce((sum, summary) => sum + summary.units, 0),
      buyers: db.profiles.filter((profile) => profile.role === "buyer").length,
      sellers: db.sellerProfiles.filter((seller) => seller.applicationStatus === "approved").length,
      openDisputes: db.disputes.filter((dispute) => dispute.status === "open").length,
      payable: db.sellerProfiles.reduce(
        (sum, seller) => sum + payableOrders(db, seller.id).reduce((total, order) => total + sellerNet(order), 0),
        0
      ),
      gmv: db.orders.reduce((sum, order) => sum + order.total - order.refundedAmount, 0),
      commission: db.orders.reduce((sum, order) => sum + order.commissionAmount, 0),
      byStatus: STATUS_ORDER.map((status) => [status, db.deals.filter((deal) => deal.status === status).length] as const),
    };
  }, [db]);

  const waiting = [
    { href: "/admin/sellers", label: "Seller applications", count: stats?.pendingSellers, icon: "store" as const },
    { href: "/admin/deals", label: "Deals to review", count: stats?.pendingDeals, icon: "check" as const },
    { href: "/admin/disputes", label: "Open disputes", count: stats?.openDisputes, icon: "alert" as const },
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:py-10">
      <PageHeader eyebrow="ADMIN" title="Platform overview" />

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wider text-subtle">Waiting for you</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {waiting.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-4 rounded-2xl bg-surface p-5 shadow-sm transition hover:shadow-md"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500" aria-hidden="true">
              <Icon name={item.icon} className="h-6 w-6" />
            </span>
            <span className="flex-1 font-bold">{item.label}</span>
            {item.count === undefined ? (
              <Skeleton className="h-8 w-10 rounded-full" />
            ) : (
              <span
                className={`rounded-full px-3 py-1 text-sm font-extrabold ${
                  item.count > 0 ? "bg-brand-500 text-white" : "bg-surface-muted text-muted"
                }`}
              >
                {item.count}
              </span>
            )}
          </Link>
        ))}
        <Link href="/admin/payouts" className="flex items-center gap-4 rounded-2xl bg-surface p-5 shadow-sm transition hover:shadow-md">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success-50 text-success-600" aria-hidden="true">
            <Icon name="banknote" className="h-6 w-6" />
          </span>
          <span className="flex-1 font-bold">Payouts due</span>
          {stats ? (
            <span className="text-sm font-extrabold text-success-600">{formatTHB(stats.payable)}</span>
          ) : (
            <Skeleton className="h-6 w-16 rounded-full" />
          )}
        </Link>
      </div>

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wider text-subtle">Platform</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats ? (
          <>
            <StatCard label="Live deals" value={stats.liveDeals} tone="brand" />
            <StatCard label="Units voted" value={stats.units} />
            <StatCard label="Buyers" value={stats.buyers} />
            <StatCard label="Approved sellers" value={stats.sellers} />
            <StatCard label="Sales (after refunds)" value={formatTHB(stats.gmv)} />
            <StatCard label="Commission earned" value={formatTHB(stats.commission)} tone="success" />
          </>
        ) : (
          [0, 1, 2, 3].map((index) => <Skeleton key={index} className="h-24" />)
        )}
      </div>

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wider text-subtle">Deals by stage</h2>
      <div className="mt-3 overflow-hidden rounded-sheet bg-surface shadow-sm">
        {stats ? (
          <ul className="grid divide-line sm:grid-cols-3 sm:divide-x">
            {stats.byStatus.map(([status, count]) => (
              <li key={status} className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
                <DealStatusPill status={status} />
                <span className="text-lg font-extrabold tabular-nums">{count}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Skeleton className="h-40" />
        )}
      </div>
    </div>
  );
}
