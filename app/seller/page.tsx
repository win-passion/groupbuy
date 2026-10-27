"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Countdown from "../components/deals/Countdown";
import DealStatusPill from "../components/deals/DealStatusPill";
import TierProgress from "../components/deals/TierProgress";
import Icon from "../components/shell/Icon";
import { EmptyState, PageHeader, Skeleton, StatCard } from "../components/ui";
import { dealSummary, DealSummary, formatTHB, useDb, useSessionUser } from "../lib/store";
import { useCanSell } from "./SellerStatusBanner";

const TABS = [
  { id: "decide", label: "Decide now", statuses: ["seller_decision"] },
  { id: "live", label: "Live", statuses: ["live"] },
  { id: "payments", label: "Payments & shipping", statuses: ["payment_window", "fulfilling"] },
  { id: "review", label: "In review", statuses: ["pending_review"] },
  { id: "drafts", label: "Drafts", statuses: ["draft", "rejected"] },
  { id: "ended", label: "Ended", statuses: ["completed", "cancelled"] },
] as const;

type TabId = (typeof TABS)[number]["id"];

function SellerDealRow({ summary }: { summary: DealSummary }) {
  const { deal } = summary;
  return (
    <Link
      href={`/seller/deals/${deal.id}`}
      className="group block rounded-sheet bg-surface p-5 shadow-sm transition hover:shadow-md sm:p-6"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <div className="flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surface md:w-32">
          {summary.cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={summary.cover} alt={deal.title} className="h-full w-full object-cover" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <DealStatusPill status={deal.status} votingClosed={Boolean(summary.closedReason)} />
          <h3 className="mt-3 text-xl font-extrabold">{deal.title || "Untitled deal"}</h3>
          {deal.status === "rejected" && deal.reviewNote && (
            <p className="mt-1 text-sm text-danger">Admin: {deal.reviewNote}</p>
          )}
          <p className="mt-1 text-sm text-muted">
            {summary.tiers.length} {summary.tiers.length === 1 ? "tier" : "tiers"} from{" "}
            {summary.tiers[0] ? formatTHB(summary.tiers[0].unitPrice) : "—"} · {deal.votingDays}-day vote
          </p>

          {deal.status === "seller_decision" && deal.lockedUnitPrice !== null && (
            <p className="mt-3 text-sm font-bold text-brand-600">
              {summary.units} units at {formatTHB(deal.lockedUnitPrice)} ·{" "}
              {deal.decisionDeadline && <Countdown until={deal.decisionDeadline} />} to decide
            </p>
          )}

          {deal.status === "live" && (
            <div className="mt-4">
              <TierProgress tiers={summary.tiers} units={summary.units} size="sm" />
              <div className="mt-2 flex justify-between gap-3 text-xs text-muted">
                <span>
                  <Icon name="users" className="mr-1 inline h-3.5 w-3.5 align-[-2px]" />
                  {summary.units} units · {summary.voters} {summary.voters === 1 ? "buyer" : "buyers"} · now{" "}
                  {summary.currentTier ? formatTHB(summary.currentTier.unitPrice) : "—"}
                </span>
                {deal.votingEndsAt && <Countdown until={deal.votingEndsAt} icon />}
              </div>
            </div>
          )}
        </div>

        <span className="inline-flex items-center gap-1 text-sm font-bold text-brand-500">
          Manage
          <Icon name="chevron-right" className="h-4 w-4 motion-safe:transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

export default function SellerDashboard() {
  const db = useDb();
  const user = useSessionUser();
  const canSell = useCanSell();
  const [chosenTab, setTab] = useState<TabId | null>(null);

  const deals = useMemo(() => {
    if (!db || !user) {
      return null;
    }
    return db.deals
      .filter((deal) => deal.sellerId === user.id)
      .map((deal) => dealSummary(db, deal))
      .sort((a, b) => Date.parse(b.deal.createdAt) - Date.parse(a.deal.createdAt));
  }, [db, user]);

  const inTab = (id: TabId) =>
    (deals ?? []).filter((summary) =>
      (TABS.find((item) => item.id === id)!.statuses as readonly string[]).includes(summary.deal.status)
    );

  const live = inTab("live");
  const stats = {
    live: live.filter((summary) => !summary.closedReason).length,
    units: live.reduce((sum, summary) => sum + summary.units, 0),
    review: inTab("review").length,
    drafts: inTab("drafts").length,
  };
  // Open on "Decide now" when a decision is waiting.
  const tab = chosenTab ?? (inTab("decide").length > 0 ? "decide" : "live");
  const visible = inTab(tab);

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:py-10">
      <PageHeader
        eyebrow="SELLER DASHBOARD"
        title={user?.shopName ?? "Your group deals"}
        text="Track your campaigns and how buyers are voting."
      >
        {canSell && (
          <Link
            href="/seller/create"
            className="rounded-xl bg-brand-500 px-5 py-3 text-center text-sm font-bold text-white hover:bg-brand-600"
          >
            + Create Group Deal
          </Link>
        )}
      </PageHeader>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {deals ? (
          <>
            <StatCard label="Voting now" value={stats.live} tone="brand" />
            <StatCard label="Units voted" value={stats.units} />
            <StatCard label="In review" value={stats.review} />
            <StatCard label="Drafts" value={stats.drafts} />
          </>
        ) : (
          [0, 1, 2, 3].map((index) => <Skeleton key={index} className="h-24" />)
        )}
      </div>

      <div role="tablist" aria-label="Deal status" className="mt-8 flex flex-wrap gap-2">
        {TABS.map((item) => {
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
              {item.label} <span className={selected ? "text-brand-300" : "text-subtle"}>{inTab(item.id).length}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 space-y-5">
        {!deals ? (
          <Skeleton className="h-40" />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={({ decide: "done", live: "rocket", payments: "card", review: "check", drafts: "pencil", ended: "box" } as const)[tab]}
            title={
              {
                decide: "No decisions waiting",
                live: "No live deals",
                payments: "No payments in progress",
                review: "Nothing in review",
                drafts: "No drafts",
                ended: "No ended deals yet",
              }[tab]
            }
            text={
              canSell
                ? "Create a group deal with price tiers. Once an admin approves it, buyers can start voting."
                : "You can create deals once your seller application is approved."
            }
            action={canSell && (tab === "live" || tab === "drafts") ? { href: "/seller/create", label: "Create a deal" } : undefined}
          />
        ) : (
          visible.map((summary) => <SellerDealRow key={summary.deal.id} summary={summary} />)
        )}
      </div>
    </div>
  );
}
