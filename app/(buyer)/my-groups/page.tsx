"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Countdown from "../../components/deals/Countdown";
import TierProgress from "../../components/deals/TierProgress";
import Icon from "../../components/shell/Icon";
import { EmptyState, PageHeader, Skeleton, StatCard, StatusPill } from "../../components/ui";
import { dealSummary, DealSummary, formatTHB, noShowStatus, Order, orderForVote, useDb, useSessionUser, Vote } from "../../lib/store";
import NoShowNotice from "../NoShowNotice";

type Row = { vote: Vote; summary: DealSummary; order: Order | undefined };

const TABS = [
  { id: "live", label: "Voting now" },
  { id: "waiting", label: "Waiting for payment" },
  { id: "done", label: "Done" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function tabFor(row: Row): TabId {
  if (row.vote.status === "active") {
    return row.summary.closedReason ? "waiting" : "live";
  }
  return "done";
}

const DONE_LABELS: Partial<Record<Vote["status"], string>> = {
  withdrawn: "Withdrawn",
  paid: "Paid",
  declined: "Declined",
  expired: "Missed · no-show",
  cancelled: "Deal cancelled",
};

function VoteRow({ row }: { row: Row }) {
  const { vote, summary, order } = row;
  const tab = tabFor(row);
  const price = summary.currentTier?.unitPrice ?? 0;
  const { deal } = summary;
  const payNow = tab === "waiting" && deal.status === "payment_window" && deal.paymentDeadline;

  return (
    <div className="rounded-sheet bg-surface p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <div className="flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surface md:w-36">
          {summary.cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={summary.cover} alt={summary.deal.title} className="h-full w-full object-cover" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          {tab === "live" && <StatusPill tone="success">Voting open</StatusPill>}
          {payNow && <StatusPill tone="brand">Final price in · confirm and pay</StatusPill>}
          {tab === "waiting" && !payNow && <StatusPill tone="muted">Voting closed · waiting for the seller</StatusPill>}
          {tab === "done" && (
            <StatusPill tone={vote.status === "paid" ? "success" : "muted"}>{DONE_LABELS[vote.status] ?? vote.status}</StatusPill>
          )}

          <h2 className="mt-3 text-xl font-extrabold">{summary.deal.title}</h2>
          <p className="mt-1 text-sm text-muted">
            {order ? (
              <>
                Paid <b className="text-ink">{formatTHB(order.total)}</b> for {order.quantity} × {formatTHB(order.unitPrice)}
              </>
            ) : (
              <>
                Your vote: <b className="text-ink">{vote.quantity} {vote.quantity === 1 ? "unit" : "units"}</b> ·{" "}
                {formatTHB(price)} each {deal.lockedUnitPrice !== null ? "(final)" : "now"} ·{" "}
                {deal.lockedUnitPrice !== null ? "total" : "est."} <b className="text-ink">{formatTHB(price * vote.quantity)}</b>
              </>
            )}
          </p>

          {payNow && (
            <p className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand-600">
              <Countdown until={deal.paymentDeadline!} icon /> left to confirm
            </p>
          )}

          {tab === "live" && (
            <div className="mt-4">
              <TierProgress tiers={summary.tiers} units={summary.units} size="sm" />
              <div className="mt-2 flex justify-between gap-3 text-xs text-muted">
                <span className="inline-flex items-center gap-1">
                  <Icon name="users" className="h-3.5 w-3.5" />
                  {summary.units} units voted
                </span>
                {summary.deal.votingEndsAt && <Countdown until={summary.deal.votingEndsAt} icon />}
              </div>
            </div>
          )}
        </div>

        {order ? (
          <Link
            href={`/orders/${order.id}`}
            className="rounded-xl border border-line px-5 py-3 text-center text-sm font-bold transition hover:border-brand-500 hover:text-brand-500"
          >
            Track order <Icon name="arrow-right" className="inline h-4 w-4 align-[-3px]" />
          </Link>
        ) : payNow ? (
          <Link
            href={`/pay/${deal.id}`}
            className="rounded-xl bg-brand-500 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-brand-600"
          >
            Confirm &amp; pay <Icon name="arrow-right" className="inline h-4 w-4 align-[-3px]" />
          </Link>
        ) : (
          <Link
            href={`/deals/${deal.id}`}
            className="rounded-xl border border-line px-5 py-3 text-center text-sm font-bold transition hover:border-brand-500 hover:text-brand-500"
          >
            {tab === "live" ? "Change vote" : "View deal"}
          </Link>
        )}
      </div>
    </div>
  );
}

export default function MyGroupsPage() {
  const db = useDb();
  const user = useSessionUser();
  const [chosenTab, setTab] = useState<TabId | null>(null);

  const rows = useMemo(() => {
    if (!db || !user) {
      return null;
    }
    return db.votes
      .filter((vote) => vote.buyerId === user.id)
      .flatMap((vote) => {
        const deal = db.deals.find((row) => row.id === vote.dealId);
        return deal ? [{ vote, summary: dealSummary(db, deal), order: orderForVote(db, vote.id) }] : [];
      })
      .sort((a, b) => Date.parse(b.vote.updatedAt) - Date.parse(a.vote.updatedAt));
  }, [db, user]);

  const stats = useMemo(() => {
    const active = (rows ?? []).filter((row) => row.vote.status === "active");
    // Savings on open votes (at today's price) and on paid orders (at the final price).
    const counted = (rows ?? []).filter((row) => row.vote.status === "active" || row.vote.status === "paid");
    const saving = counted.reduce((sum, row) => {
      const base = row.summary.tiers[0]?.unitPrice ?? 0;
      const current = row.summary.currentTier?.unitPrice ?? base;
      return sum + (base - current) * row.vote.quantity;
    }, 0);
    return {
      open: active.filter((row) => !row.summary.closedReason).length,
      units: active.reduce((sum, row) => sum + row.vote.quantity, 0),
      saving,
    };
  }, [rows]);

  const noShows = useMemo(() => (db && user ? noShowStatus(db, user.id) : null), [db, user]);
  const paymentsDue = (rows ?? []).filter((row) => tabFor(row) === "waiting" && row.summary.deal.status === "payment_window");
  // Open on "Waiting for payment" when something needs paying.
  const tab = chosenTab ?? (paymentsDue.length > 0 ? "waiting" : "live");
  const visible = (rows ?? []).filter((row) => tabFor(row) === tab);

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:py-10">
      <PageHeader eyebrow="YOUR VOTES" title="My Groups" text="Track the deals you've voted on and what you'll pay." />

      {noShows && (
        <div className="mt-6 empty:hidden">
          <NoShowNotice status={noShows} />
        </div>
      )}

      <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
        {rows ? (
          <>
            <StatCard label="Voting now" value={stats.open} tone="brand" />
            <StatCard label="Units voted" value={stats.units} />
            <StatCard label="Saving" value={formatTHB(stats.saving)} tone="success" />
          </>
        ) : (
          [0, 1, 2].map((index) => <Skeleton key={index} className="h-24" />)
        )}
      </div>

      <div role="tablist" aria-label="Vote status" className="mt-8 flex flex-wrap gap-2">
        {TABS.map((item) => {
          const count = (rows ?? []).filter((row) => tabFor(row) === item.id).length;
          const selected = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(item.id)}
              className={`rounded-full px-4 py-2 text-sm font-bold ${
                selected ? "bg-ink text-white" : "bg-surface text-muted-strong hover:text-ink"
              }`}
            >
              {item.label} <span className={selected ? "text-brand-300" : "text-subtle"}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 space-y-5">
        {!rows ? (
          <Skeleton className="h-44" />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={tab === "live" ? "vote" : tab === "waiting" ? "hourglass" : "box"}
            title={tab === "live" ? "No open votes" : tab === "waiting" ? "Nothing waiting" : "Nothing here yet"}
            text={
              tab === "live"
                ? "Find a deal you like and vote for the number of units you want."
                : tab === "waiting"
                  ? "When voting closes on a deal you joined, it waits here for you to confirm and pay."
                  : "Deals you've paid for, withdrawn from or missed show up here."
            }
            action={tab === "live" ? { href: "/#deals", label: "Find group deals" } : undefined}
          />
        ) : (
          visible.map((row) => <VoteRow key={row.vote.id} row={row} />)
        )}
      </div>
    </div>
  );
}
