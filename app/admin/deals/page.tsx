"use client";

import Link from "next/link";
import { useMemo } from "react";
import DealStatusPill from "../../components/deals/DealStatusPill";
import { EmptyState, PageHeader, Skeleton } from "../../components/ui";
import { approveDeal, dealSummary, formatDate, formatTHB, marketplaceDeals, rejectDeal, useDb } from "../../lib/store";
import ReviewActions from "../ReviewActions";

export default function AdminDealsPage() {
  const db = useDb();

  const data = useMemo(() => {
    if (!db) {
      return null;
    }
    return {
      queue: db.deals
        .filter((deal) => deal.status === "pending_review")
        .map((deal) => dealSummary(db, deal))
        .sort((a, b) => Date.parse(a.deal.createdAt) - Date.parse(b.deal.createdAt)),
      live: marketplaceDeals(db),
    };
  }, [db]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:py-10">
      <PageHeader
        eyebrow="ADMIN"
        title="Deal review"
        text="Check each deal before buyers can see it. Approving starts the voting period."
      />

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wider text-subtle">
        Waiting for review {data && `(${data.queue.length})`}
      </h2>
      <div className="mt-3 space-y-4">
        {!data ? (
          <Skeleton className="h-60" />
        ) : data.queue.length === 0 ? (
          <EmptyState icon="done" title="All caught up" text="New deals that sellers submit appear here." />
        ) : (
          data.queue.map((summary) => (
            <div key={summary.deal.id} className="rounded-sheet bg-surface p-6 shadow-sm">
              <div className="flex flex-col gap-6 lg:flex-row">
                <div className="flex h-36 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surface-subtle lg:w-44">
                  {summary.cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={summary.cover} alt={summary.deal.title} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted">
                    {summary.shopName} · {summary.category ? summary.category.name : "No category"} ·
                    created {formatDate(summary.deal.createdAt)}
                  </p>
                  <h3 className="mt-1 text-xl font-extrabold">{summary.deal.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-strong">{summary.deal.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    {summary.tiers.map((tier) => (
                      <span key={tier.id} className="rounded-full border border-line px-3 py-1">
                        {tier.minUnits}+ · <b>{formatTHB(tier.unitPrice)}</b>
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-subtle">
                    {summary.deal.votingDays}-day vote ·{" "}
                    {summary.deal.maxUnitsPerBuyer ? `max ${summary.deal.maxUnitsPerBuyer} per buyer` : "no per-buyer limit"}
                  </p>
                </div>
                <div className="lg:w-72">
                  <ReviewActions
                    onApprove={() => approveDeal(summary.deal.id)}
                    onReject={(note) => rejectDeal(summary.deal.id, note)}
                    rejectLabel="Request changes"
                    reasonLabel="What should the seller change?"
                  />
                  <Link href={`/deals/${summary.deal.id}`} className="mt-3 inline-block text-sm font-bold text-brand-500">
                    Preview buyer page ↗
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <h2 className="mt-10 text-sm font-bold uppercase tracking-wider text-subtle">Live deals</h2>
      <div className="mt-3 overflow-hidden rounded-sheet bg-surface shadow-sm">
        {!data ? (
          <Skeleton className="h-40" />
        ) : data.live.length === 0 ? (
          <p className="p-6 text-sm text-muted">No live deals.</p>
        ) : (
          <ul className="divide-y divide-line">
            {data.live.map((summary) => (
              <li key={summary.deal.id} className="flex flex-wrap items-center gap-3 px-6 py-4">
                <Link href={`/deals/${summary.deal.id}`} className="min-w-0 flex-1 font-bold hover:text-brand-500">
                  {summary.deal.title}
                  <span className="block text-xs font-normal text-muted">{summary.shopName}</span>
                </Link>
                <span className="text-sm text-muted">
                  {summary.units} units · {summary.currentTier ? formatTHB(summary.currentTier.unitPrice) : "—"}
                </span>
                <DealStatusPill status={summary.deal.status} votingClosed={Boolean(summary.closedReason)} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
