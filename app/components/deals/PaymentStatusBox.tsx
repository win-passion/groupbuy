"use client";

import { useMemo } from "react";
import { Deal, formatTHB, PaymentCount, paymentStatus, useDb } from "../../lib/store";
import Countdown from "./Countdown";

function Count({ label, count, tone }: { label: string; count: PaymentCount; tone: string }) {
  return (
    <div className="rounded-2xl bg-surface-subtle p-4 text-center">
      <p className={`text-2xl font-extrabold tabular-nums ${tone}`}>{count.units}</p>
      <p className="text-xs font-bold text-ink-soft">units {label}</p>
      <p className="mt-0.5 text-[11px] text-subtle">
        {count.people} {count.people === 1 ? "person" : "people"}
      </p>
    </div>
  );
}

/**
 * Live payment progress for a deal, shown to its voters and seller.
 * Counts only, never names. Information only: it never changes the price.
 */
export default function PaymentStatusBox({ deal }: { deal: Deal }) {
  const db = useDb();
  const status = useMemo(() => (db ? paymentStatus(db, deal.id) : null), [db, deal.id]);

  if (!status || deal.lockedUnitPrice === null) {
    return null;
  }

  const open = deal.status === "payment_window";
  const paidShare = status.voted.units ? (status.paid.units / status.voted.units) * 100 : 0;
  const declinedShare = status.voted.units ? (status.declined.units / status.voted.units) * 100 : 0;

  return (
    <section aria-label="Payment status" className="rounded-sheet border border-line bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold">Payment status</h2>
          <p className="mt-1 text-sm text-muted">
            Final price <b className="text-ink">{formatTHB(deal.lockedUnitPrice)}</b> per unit · locked
          </p>
        </div>
        {open && deal.paymentDeadline && (
          <p className="rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-600">
            <Countdown until={deal.paymentDeadline} icon /> left
          </p>
        )}
      </div>

      <div
        className="mt-5 flex h-3 overflow-hidden rounded-full bg-surface-muted"
        role="img"
        aria-label={`${status.paid.units} of ${status.voted.units} units paid`}
      >
        <div className="bg-success-600 motion-safe:transition-[width] motion-safe:duration-700" style={{ width: `${paidShare}%` }} />
        <div className="bg-ink-faint motion-safe:transition-[width] motion-safe:duration-700" style={{ width: `${declinedShare}%` }} />
      </div>

      {open ? (
        <div className="mt-5 grid grid-cols-3 gap-3">
          <Count label="paid" count={status.paid} tone="text-success-600" />
          <Count label="waiting" count={status.waiting} tone="text-brand-500" />
          <Count label="declined" count={status.declined} tone="text-ink-soft" />
        </div>
      ) : (
        <p className="mt-5 text-sm leading-6 text-muted-strong">
          <b className="text-ink">{status.voted.units} units voted</b> → {status.paid.units} units paid ·{" "}
          {status.declined.units} declined · {status.missed.units} didn&apos;t respond
          <span className="mt-1 block text-xs text-subtle">
            {status.paid.people} paid · {status.declined.people} declined · {status.missed.people} didn&apos;t respond
            (people)
          </span>
        </p>
      )}

      <p className="mt-4 text-xs text-subtle">The price is locked and never changes, however many units are paid.</p>
    </section>
  );
}
