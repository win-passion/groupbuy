"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import Countdown from "../../../components/deals/Countdown";
import TierProgress from "../../../components/deals/TierProgress";
import Icon from "../../../components/shell/Icon";
import PaymentStatusBox from "../../../components/deals/PaymentStatusBox";
import { BackLink, EmptyState, Skeleton } from "../../../components/ui";
import { findDealSummary, formatDateTime, formatTHB, useDb, useSessionUser, voteFor } from "../../../lib/store";
import VotePanel from "./VotePanel";

function DealSkeleton() {
  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-2" aria-busy="true" aria-label="Loading deal">
      <Skeleton className="h-80 rounded-hero lg:h-[520px]" />
      <div>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-4 h-10 w-3/4" />
        <Skeleton className="mt-6 h-12 w-40" />
        <Skeleton className="mt-8 h-24" />
        <Skeleton className="mt-6 h-64" />
      </div>
    </div>
  );
}

export default function DealPage() {
  const { id } = useParams<{ id: string }>();
  const db = useDb();
  const user = useSessionUser();
  const summary = useMemo(() => (db ? findDealSummary(db, id) : undefined), [db, id]);
  const myVote = db && user && summary ? voteFor(db, summary.deal.id, user.id) : undefined;
  const isVoter = Boolean(myVote && myVote.status !== "withdrawn");
  const isStaff = Boolean(user && summary && (user.role === "admin" || user.id === summary.deal.sellerId));
  // Everyone sees live deals. After voting, only the deal's voters, its seller
  // and admins can still open it. Sellers and admins can also preview drafts.
  const visible = summary && (summary.deal.status === "live" || isVoter || isStaff);
  const locked = summary?.deal.lockedUnitPrice != null;

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:py-10">
      <BackLink href={"/#deals"}>Back to deals</BackLink>

      {summary === undefined || user === undefined ? (
        <DealSkeleton />
      ) : !summary || !visible ? (
        <div className="mt-6">
          <EmptyState
            icon="ghost"
            title="Deal not found"
            text="This deal may have ended or isn't live yet."
            action={{ href: "/#deals", label: "Browse live deals" }}
          />
        </div>
      ) : (
        <>
          {["draft", "pending_review", "rejected"].includes(summary.deal.status) && (
            <p className="mt-6 rounded-2xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">
              Preview — buyers can&apos;t see this deal until it is approved and live.
            </p>
          )}

          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-hero bg-surface shadow-sm lg:sticky lg:top-28 lg:self-start">
              {summary.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={summary.cover} alt={summary.deal.title} className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <Icon name="bag" className="h-24 w-24 text-subtle" strokeWidth={1.25} />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {summary.category && (
                  <Link
                    href={`/?category=${summary.category.slug}#deals`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 font-bold text-brand-600"
                  >
                    <Icon name={summary.category.icon} className="h-4 w-4" />
                    {summary.category.name}
                  </Link>
                )}
                <span className="text-muted">by {summary.shopName}</span>
              </div>

              <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">{summary.deal.title}</h1>

              <div className="mt-6 flex flex-wrap items-end gap-x-4 gap-y-1">
                <p className="text-4xl font-extrabold text-brand-500 sm:text-5xl">
                  {summary.currentTier ? formatTHB(summary.currentTier.unitPrice) : "—"}
                </p>
                {summary.savingPercent > 0 && summary.tiers[0] && (
                  <p className="pb-1 text-lg text-subtle">
                    <span className="line-through">{formatTHB(summary.tiers[0].unitPrice)}</span>{" "}
                    <span className="font-bold text-success-600">Save {summary.savingPercent}%</span>
                  </p>
                )}
              </div>
              <p className="mt-1 text-sm text-muted">{locked ? "Final price per unit · locked when voting closed" : "Current price per unit"}</p>

              {/* LIVE PROGRESS */}
              <div className="mt-6 rounded-sheet bg-surface p-6 shadow-sm">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-2xl font-extrabold tabular-nums">{summary.units}</p>
                    <p className="text-xs text-muted">units voted</p>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold tabular-nums">{summary.voters}</p>
                    <p className="text-xs text-muted">{summary.voters === 1 ? "buyer" : "buyers"}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold">
                      {summary.deal.votingEndsAt ? <Countdown until={summary.deal.votingEndsAt} /> : "—"}
                    </p>
                    <p className="text-xs text-muted">left to vote</p>
                  </div>
                </div>

                <div className="mt-6">
                  <TierProgress tiers={summary.tiers} units={summary.units} />
                </div>

                <p className="mt-2 text-center text-sm font-bold text-brand-600">
                  {locked
                    ? `Voting closed at ${summary.units} units · final price ${formatTHB(summary.deal.lockedUnitPrice ?? 0)}`
                    : summary.nextTier && summary.unitsToNextTier !== null
                    ? `${summary.unitsToNextTier} more ${summary.unitsToNextTier === 1 ? "unit" : "units"} to unlock ${formatTHB(summary.nextTier.unitPrice)}`
                    : summary.tiers.length > 1
                      ? "Best price unlocked"
                      : "Fixed group price"}
                </p>
              </div>

              {/* TIERS */}
              <div className="mt-6 rounded-sheet bg-surface p-6 shadow-sm">
                <h2 className="text-lg font-extrabold">Price tiers</h2>
                <div className="mt-4 space-y-2">
                  {summary.tiers.map((tier) => {
                    const current = tier.id === summary.currentTier?.id;
                    return (
                      <div
                        key={tier.id}
                        className={`flex items-center justify-between rounded-2xl border p-4 ${
                          current ? "border-brand-500 bg-brand-50" : "border-line"
                        }`}
                      >
                        <span className="font-bold">
                          {tier.maxUnits === null ? `${tier.minUnits}+ units` : `${tier.minUnits}–${tier.maxUnits} units`}
                          {current && <span className="ml-2 text-xs font-bold text-brand-600">CURRENT</span>}
                        </span>
                        <span className={`font-extrabold ${current ? "text-brand-600" : ""}`}>{formatTHB(tier.unitPrice)}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-4 text-xs leading-5 text-subtle">
                  The deal always goes ahead. When voting closes
                  {summary.deal.votingEndsAt ? ` (${formatDateTime(summary.deal.votingEndsAt)})` : ""}, the tier reached
                  by units voted sets the final price for everyone.
                </p>
              </div>

              {locked && (isVoter || isStaff) && ["payment_window", "fulfilling", "completed"].includes(summary.deal.status) && (
                <div className="mt-6">
                  <PaymentStatusBox deal={summary.deal} />
                </div>
              )}

              <div className="mt-6">
                <VotePanel key={user?.id ?? "guest"} summary={summary} user={user} />
              </div>

              <div className="mt-6 rounded-sheet bg-surface p-6 shadow-sm">
                <h2 className="text-lg font-extrabold">About this product</h2>
                <p className="mt-3 whitespace-pre-line leading-7 text-muted-strong">{summary.deal.description}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
