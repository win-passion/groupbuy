"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Countdown from "../../../components/deals/Countdown";
import DealStatusPill from "../../../components/deals/DealStatusPill";
import PaymentStatusBox from "../../../components/deals/PaymentStatusBox";
import TierProgress from "../../../components/deals/TierProgress";
import Icon from "../../../components/shell/Icon";
import { BackLink, EmptyState, Skeleton, StatCard } from "../../../components/ui";
import {
  ActionResult,
  cancelDeal,
  deleteDraft,
  findDealSummary,
  formatDateTime,
  formatTHB,
  proceedDeal,
  submitDealForReview,
  useDb,
  useSessionUser,
  withdrawFromReview,
} from "../../../lib/store";

export default function SellerDealPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const db = useDb();
  const user = useSessionUser();
  const [error, setError] = useState("");
  const summary = useMemo(() => (db ? findDealSummary(db, id) : undefined), [db, id]);

  if (summary === undefined || user === undefined) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-10">
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!summary || summary.deal.sellerId !== user?.id) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-10">
        <EmptyState icon="ghost" title="Deal not found" text="It may have been deleted." action={{ href: "/seller", label: "Back to dashboard" }} />
      </div>
    );
  }

  const { deal } = summary;
  const editable = deal.status === "draft" || deal.status === "rejected";
  const canSubmit = user.sellerStatus === "approved";

  function act(result: ActionResult) {
    setError(result.ok ? "" : result.error);
    return result.ok;
  }

  function cancel() {
    if (window.confirm("Cancel this deal? Every voter is told it won't go ahead. This is recorded in your cancellation rate.")) {
      act(cancelDeal(deal.id));
    }
  }

  const orders = db ? db.orders.filter((order) => order.dealId === deal.id) : [];
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const commission = orders.reduce((sum, order) => sum + order.commissionAmount, 0);
  const refunded = orders.reduce((sum, order) => sum + order.refundedAmount, 0);

  function remove() {
    if (window.confirm("Delete this deal? This can't be undone.")) {
      if (act(deleteDraft(deal.id))) {
        router.push("/seller");
      }
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:py-10">
      <BackLink href={"/seller"}>Back to dashboard</BackLink>

      <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-start">
        <div className="flex h-40 w-full shrink-0 items-center justify-center overflow-hidden rounded-sheet bg-surface shadow-sm md:w-48">
          {summary.cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={summary.cover} alt={deal.title} className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <DealStatusPill status={deal.status} votingClosed={Boolean(summary.closedReason)} />
          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{deal.title || "Untitled deal"}</h1>
          <p className="mt-2 text-muted">
            {summary.category ? `${summary.category.name} · ` : ""}
            {deal.votingDays}-day vote
            {deal.maxUnitsPerBuyer ? ` · max ${deal.maxUnitsPerBuyer} per buyer` : " · no per-buyer limit"}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {editable && (
              <>
                <Link href={`/seller/deals/${deal.id}/edit`} className="rounded-xl border border-line bg-surface px-5 py-3 text-sm font-bold hover:border-brand-400">
                  Edit deal
                </Link>
                <button
                  type="button"
                  onClick={() => act(submitDealForReview(deal.id))}
                  disabled={!canSubmit}
                  className="rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-600 disabled:bg-brand-300"
                >
                  Submit for review
                </button>
                <button type="button" onClick={remove} className="px-3 py-3 text-sm font-bold text-muted hover:text-danger">
                  Delete
                </button>
              </>
            )}
            {deal.status === "pending_review" && (
              <button
                type="button"
                onClick={() => act(withdrawFromReview(deal.id))}
                className="rounded-xl border border-line bg-surface px-5 py-3 text-sm font-bold hover:border-brand-400"
              >
                Withdraw to edit
              </button>
            )}
            {deal.status === "live" && (
              <Link href={`/deals/${deal.id}`} className="rounded-xl border border-line bg-surface px-5 py-3 text-sm font-bold hover:border-brand-400">
                View buyer page ↗
              </Link>
            )}
          </div>
          {error && <p role="alert" className="mt-3 text-sm font-semibold text-danger">{error}</p>}
        </div>
      </div>

      {deal.status === "rejected" && deal.reviewNote && (
        <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-5">
          <p className="font-bold text-brand-700">Changes requested by the admin</p>
          <p className="mt-1 text-sm leading-6 text-muted-strong">{deal.reviewNote}</p>
        </div>
      )}
      {deal.status === "pending_review" && (
        <p className="mt-6 rounded-2xl bg-surface p-5 text-sm text-muted-strong shadow-sm">
          <Icon name="check" className="mr-1.5 inline h-4 w-4 align-[-2px] text-brand-500" />
          An admin is reviewing this deal. Voting starts as soon as it&apos;s approved and runs for {deal.votingDays}{" "}
          days.
        </p>
      )}

      {deal.status === "seller_decision" && deal.lockedUnitPrice !== null && (
        <section className="mt-6 rounded-hero bg-gradient-to-br from-hero-from via-hero-via to-hero-to p-6 sm:p-8">
          <p className="text-sm font-bold text-brand-600">VOTING CLOSED · YOUR DECISION</p>
          <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
            {summary.units} units voted → {formatTHB(deal.lockedUnitPrice)} per unit
          </h2>
          <p className="mt-2 text-muted-strong">
            Up to <b>{formatTHB(deal.lockedUnitPrice * summary.units)}</b> if every voter pays. {summary.voters}{" "}
            {summary.voters === 1 ? "buyer" : "buyers"} will be asked to confirm and pay.
          </p>
          <p className="mt-4 inline-block rounded-full bg-surface px-4 py-2 text-sm font-bold text-brand-600 shadow-sm">
            {deal.decisionDeadline && <Countdown until={deal.decisionDeadline} icon />} to decide · the deal is cancelled
            automatically if you don&apos;t
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => act(proceedDeal(deal.id))}
              className="rounded-2xl bg-brand-500 px-8 py-4 font-extrabold text-white shadow-lg shadow-brand-200 hover:bg-brand-600"
            >
              Proceed: ask buyers to pay
            </button>
            <button
              type="button"
              onClick={cancel}
              className="rounded-2xl border border-line bg-surface px-8 py-4 font-bold hover:border-danger hover:text-danger"
            >
              Cancel deal
            </button>
          </div>
          <p className="mt-4 text-xs text-muted">
            This is your only chance to cancel. Once buyers start paying, you must deliver every paid order.
          </p>
        </section>
      )}

      {deal.status === "cancelled" && (
        <p className="mt-6 rounded-2xl bg-surface p-5 text-sm text-muted-strong shadow-sm">
          <Icon name="ban" className="mr-1.5 inline h-4 w-4 align-[-2px]" />
          {deal.cancelReason === "decision_timeout"
            ? "This deal was cancelled automatically because no decision was made in time."
            : "You cancelled this deal after voting closed."}{" "}
          Nobody was charged.
        </p>
      )}

      {["payment_window", "fulfilling", "completed"].includes(deal.status) && deal.lockedUnitPrice !== null && (
        <>
          <div className="mt-6">
            <PaymentStatusBox deal={deal} />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard label="Paid orders" value={orders.length} tone="brand" />
            <StatCard label="Order total" value={formatTHB(revenue)} />
            <StatCard label="Commission" value={formatTHB(commission)} />
            <StatCard label="Your earnings" value={formatTHB(revenue - refunded - commission)} tone="success" />
          </div>
          {deal.status !== "payment_window" && orders.length > 0 && (
            <Link
              href="/seller/orders"
              className="mt-4 block rounded-2xl bg-surface p-5 text-sm font-bold text-muted-strong shadow-sm hover:text-brand-600"
            >
              <Icon name="box" className="mr-1.5 inline h-4 w-4 align-[-2px] text-brand-500" />
              {orders.filter((order) => order.status === "paid").length} to ship ·{" "}
              {orders.filter((order) => order.status === "shipped").length} shipped ·{" "}
              {orders.filter((order) => order.status === "delivered").length} delivered → Manage orders
            </Link>
          )}
        </>
      )}

      {deal.status === "live" && (
        <>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard label="Units voted" value={summary.units} tone="brand" />
            <StatCard label="Buyers" value={summary.voters} />
            <StatCard label="Current price" value={summary.currentTier ? formatTHB(summary.currentTier.unitPrice) : "—"} />
            <StatCard label="Time left" value={deal.votingEndsAt ? <Countdown until={deal.votingEndsAt} /> : "—"} />
          </div>
          <div className="mt-6 rounded-sheet bg-surface p-6 shadow-sm">
            <TierProgress tiers={summary.tiers} units={summary.units} />
            <p className="mt-2 text-sm text-muted">
              {summary.nextTier && summary.unitsToNextTier !== null
                ? `${summary.unitsToNextTier} more units unlock ${formatTHB(summary.nextTier.unitPrice)}.`
                : "Top tier reached."}{" "}
              Voting closes {deal.votingEndsAt ? formatDateTime(deal.votingEndsAt) : ""}. You&apos;ll then choose to proceed
              or cancel.
            </p>
          </div>
        </>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-sheet bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-extrabold">Price tiers</h2>
          <div className="mt-4 space-y-2">
            {summary.tiers.map((tier) => (
              <div key={tier.id} className="flex justify-between rounded-2xl border border-line p-4">
                <span className="font-bold">
                  {tier.maxUnits === null ? `${tier.minUnits}+ units` : `${tier.minUnits}–${tier.maxUnits} units`}
                </span>
                <span className="font-extrabold">{formatTHB(tier.unitPrice)}</span>
              </div>
            ))}
            {summary.tiers.length === 0 && <p className="text-sm text-muted">No tiers yet.</p>}
          </div>
        </div>
        <div className="rounded-sheet bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-extrabold">Description</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-strong">{deal.description || "No description yet."}</p>
        </div>
      </div>
    </div>
  );
}
