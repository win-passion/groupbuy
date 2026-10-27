"use client";

import { useMemo, useState } from "react";
import OrderStatusPill from "../../components/deals/OrderStatusPill";
import { EmptyState, PageHeader, Skeleton, StatusPill } from "../../components/ui";
import { baht, Dispute, DISPUTE_REASONS, formatDateTime, formatTHB, Order, resolveDispute, useDb } from "../../lib/store";

type RefundChoice = "none" | "partial" | "full";

function ResolveForm({ dispute, order }: { dispute: Dispute; order: Order }) {
  const refundable = order.total - order.refundedAmount;
  const [choice, setChoice] = useState<RefundChoice>("full");
  const [amount, setAmount] = useState("");
  const [resolution, setResolution] = useState("");
  const [error, setError] = useState("");

  function submit() {
    const refund = choice === "full" ? refundable : choice === "partial" ? baht(Number(amount) || 0) : 0;
    if (choice === "partial" && (refund <= 0 || refund >= refundable)) {
      setError(`A partial refund must be between ฿0 and ${formatTHB(refundable)}.`);
      return;
    }
    const result = resolveDispute(dispute.id, refund, resolution);
    setError(result.ok ? "" : result.error);
  }

  const options: [RefundChoice, string][] = [
    ["full", `Full refund (${formatTHB(refundable)})`],
    ["partial", "Partial refund"],
    ["none", "No refund"],
  ];

  return (
    <div className="space-y-3">
      <fieldset>
        <legend className="text-sm font-bold">Outcome</legend>
        <div className="mt-2 space-y-1">
          {options.map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input type="radio" name={`refund-${dispute.id}`} checked={choice === value} onChange={() => setChoice(value)} className="accent-brand-500" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      {choice === "partial" && (
        <label className="block text-sm font-bold">
          Refund amount (฿)
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 font-normal outline-none focus:border-brand-500"
          />
        </label>
      )}
      <label className="block text-sm font-bold">
        Resolution (shown to buyer and seller)
        <textarea
          value={resolution}
          onChange={(event) => setResolution(event.target.value)}
          rows={2}
          className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 font-normal outline-none focus:border-brand-500"
        />
      </label>
      {error && <p role="alert" className="text-sm font-semibold text-danger">{error}</p>}
      <button type="button" onClick={submit} className="w-full rounded-xl bg-ink py-2.5 text-sm font-bold text-white hover:bg-brand-500">
        Resolve dispute
      </button>
      <p className="text-xs text-subtle">
        Commission is recalculated on what the seller keeps. With no or a partial refund, the order returns to{" "}
        {dispute.orderStatusBefore}.
      </p>
    </div>
  );
}

export default function AdminDisputesPage() {
  const db = useDb();
  const [showResolved, setShowResolved] = useState(false);

  const disputes = useMemo(() => {
    if (!db) {
      return null;
    }
    return db.disputes
      .map((dispute) => {
        const order = db.orders.find((row) => row.id === dispute.orderId);
        return {
          dispute,
          order,
          deal: db.deals.find((deal) => deal.id === order?.dealId),
          buyer: db.profiles.find((profile) => profile.id === order?.buyerId)?.fullName,
          shop: db.sellerProfiles.find((seller) => seller.id === order?.sellerId)?.shopName,
        };
      })
      .sort((a, b) => Date.parse(b.dispute.createdAt) - Date.parse(a.dispute.createdAt));
  }, [db]);

  const visible = (disputes ?? []).filter((row) => (row.dispute.status === "open") !== showResolved);
  const openCount = (disputes ?? []).filter((row) => row.dispute.status === "open").length;

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:py-10">
      <PageHeader eyebrow="ADMIN" title="Disputes & refunds" text="Refunds only happen for problems: not delivered, damaged or wrong item." />

      <div role="tablist" className="mt-8 flex gap-2">
        {[false, true].map((resolved) => (
          <button
            key={String(resolved)}
            type="button"
            role="tab"
            aria-selected={showResolved === resolved}
            onClick={() => setShowResolved(resolved)}
            className={`rounded-full px-4 py-2 text-sm font-bold ${
              showResolved === resolved ? "bg-ink text-white" : "bg-surface text-muted-strong hover:text-ink"
            }`}
          >
            {resolved ? "Resolved" : `Open ${openCount}`}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {!disputes ? (
          <Skeleton className="h-48" />
        ) : visible.length === 0 ? (
          <EmptyState icon="peace" title={showResolved ? "No resolved disputes" : "No open disputes"} text="Problems buyers report on their orders appear here." />
        ) : (
          visible.map(({ dispute, order, deal, buyer, shop }) =>
            order ? (
              <div key={dispute.id} className="rounded-sheet bg-surface p-6 shadow-sm">
                <div className="flex flex-col gap-6 lg:flex-row">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <StatusPill tone={dispute.status === "open" ? "danger" : "muted"}>{DISPUTE_REASONS[dispute.reason]}</StatusPill>
                      <OrderStatusPill status={order.status} />
                    </div>
                    <p className="mt-3 font-extrabold">
                      {order.quantity} × {deal?.title} · {formatTHB(order.total)}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Buyer {buyer} · seller {shop} · opened {formatDateTime(dispute.createdAt)}
                      {order.trackingNumber && ` · tracking ${order.trackingNumber}`}
                    </p>
                    <p className="mt-3 rounded-2xl bg-surface-subtle p-4 text-sm leading-6 text-muted-strong">&ldquo;{dispute.details}&rdquo;</p>
                    {dispute.status === "resolved" && (
                      <p className="mt-3 text-sm text-muted-strong">
                        <b className="text-ink">Resolved:</b> {dispute.resolution}
                        {dispute.refundAmount ? ` · ${formatTHB(dispute.refundAmount)} refunded` : " · no refund"}
                      </p>
                    )}
                  </div>
                  {dispute.status === "open" && (
                    <div className="lg:w-80">
                      <ResolveForm dispute={dispute} order={order} />
                    </div>
                  )}
                </div>
              </div>
            ) : null
          )
        )}
      </div>
    </div>
  );
}
