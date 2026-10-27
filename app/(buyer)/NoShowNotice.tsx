import { formatDate, NoShowStatus } from "../lib/store";

/** Warning before the no-show limit, or the active restriction. Renders nothing otherwise. */
export default function NoShowNotice({ status }: { status: NoShowStatus }) {
  if (status.restrictedUntil) {
    return (
      <div role="status" className="rounded-2xl border border-danger bg-surface p-5">
        <p className="font-bold text-danger">Voting is paused until {formatDate(status.restrictedUntil)}</p>
        <p className="mt-1 text-sm leading-6 text-muted-strong">
          You missed {status.count} payment confirmations in the last {status.lookbackDays} days. You can still browse and
          pay for deals you&apos;ve already joined.
        </p>
      </div>
    );
  }

  if (status.warn) {
    return (
      <div role="status" className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
        <p className="font-bold text-brand-700">
          You&apos;ve missed {status.count} confirmations. One more will pause voting for {status.restrictionDays} days.
        </p>
        <p className="mt-1 text-sm leading-6 text-muted-strong">
          If you don&apos;t want a deal, tap &ldquo;No, cancel&rdquo;. Declining never counts against you.
        </p>
      </div>
    );
  }

  return null;
}
