"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  clockOffset,
  DAY,
  formatDateTime,
  HOUR,
  loginAs,
  nextDeadline,
  now,
  resetClock,
  resetDatabase,
  ROLE_LABELS,
  shiftClock,
  TABLE_NAMES,
  useDb,
  useSessionUser,
  UserRole,
} from "../lib/store";
import { formatRemaining } from "./deals/Countdown";
import Icon from "./shell/Icon";

const HOME_BY_ROLE: Record<UserRole, string> = {
  buyer: "/",
  seller: "/seller",
  admin: "/admin",
};

const CLOCK_STEPS = [
  ["+1 hour", HOUR],
  ["+1 day", DAY],
  ["+7 days", 7 * DAY],
] as const;

function formatOffset(ms: number) {
  if (ms === 0) {
    return "real time";
  }
  const hours = Math.round(ms / HOUR);
  const days = Math.floor(hours / 24);
  const rest = hours % 24;
  return `+${days ? `${days}d ` : ""}${rest}h ahead`;
}

/**
 * Demo tools: switch accounts, move the clock and reset data. Set
 * NEXT_PUBLIC_DEV_PANEL=off to hide it.
 */
export default function DevPanel() {
  const router = useRouter();
  const db = useDb();
  const user = useSessionUser();
  const [open, setOpen] = useState(false);
  const [, setTick] = useState(0);

  // Keep the simulated clock display moving while the panel is open.
  useEffect(() => {
    if (!open) {
      return;
    }
    const timer = window.setInterval(() => setTick((tick) => tick + 1), 1000);
    return () => window.clearInterval(timer);
  }, [open]);

  if (process.env.NEXT_PUBLIC_DEV_PANEL === "off" || !db) {
    return null;
  }

  function switchTo(accountId: string) {
    const result = loginAs(accountId);
    if (result.ok) {
      router.push(HOME_BY_ROLE[result.user.role]);
    }
  }

  function reset() {
    if (window.confirm("Reset all demo data? Every account, deal and vote returns to the seed.")) {
      resetDatabase();
      router.push("/");
    }
  }

  const offset = clockOffset();
  const upcoming = nextDeadline(db.deals, now());

  return (
    <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-4 z-[60] md:bottom-4">
      {open && (
        <section
          aria-label="Dev panel"
          className="mb-3 max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-line bg-surface p-4 text-sm text-ink shadow-xl"
        >
          <div className="flex items-center justify-between">
            <p className="font-extrabold">Dev panel</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-bold text-subtle hover:text-ink"
            >
              Close
            </button>
          </div>

          <h2 className="mt-4 text-xs font-bold uppercase tracking-wider text-subtle">Clock</h2>
          <p className="mt-1 font-bold">{formatDateTime(now())}</p>
          <p className="text-xs text-muted">Asia/Bangkok · {formatOffset(offset)}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {CLOCK_STEPS.map(([label, ms]) => (
              <button
                key={label}
                type="button"
                onClick={() => shiftClock(ms)}
                className="rounded-xl border border-line px-3 py-1.5 text-xs font-bold hover:border-brand-400 hover:text-brand-600"
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={resetClock}
              disabled={offset === 0}
              className="rounded-xl px-3 py-1.5 text-xs font-bold text-muted hover:text-ink disabled:opacity-40"
            >
              Reset clock
            </button>
          </div>
          {upcoming && (
            <button
              type="button"
              onClick={() => shiftClock(upcoming.at - now() + 1000)}
              className="mt-2 w-full rounded-xl bg-brand-50 px-3 py-2 text-left text-xs hover:bg-brand-100"
            >
              <span className="inline-flex items-center gap-1.5 font-bold text-brand-700">
                <Icon name="skip-forward" className="h-3.5 w-3.5" />
                Skip to next deadline
              </span>
              <span className="block text-muted-strong">
                {upcoming.deal.title}: {upcoming.label} in {formatRemaining(upcoming.at - now())}
              </span>
            </button>
          )}

          <h2 className="mt-5 text-xs font-bold uppercase tracking-wider text-subtle">
            Log in as
          </h2>
          <ul className="mt-2 space-y-1">
            {db.accounts.map((account) => {
              const profile = db.profiles.find((row) => row.id === account.id);
              const current = user?.id === account.id;
              if (!profile) {
                return null;
              }

              return (
                <li key={account.id}>
                  <button
                    type="button"
                    onClick={() => switchTo(account.id)}
                    disabled={current}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left ${
                      current ? "bg-brand-50" : "hover:bg-surface-subtle"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{profile.fullName}</span>
                      <span className="block truncate text-xs text-muted">{account.email}</span>
                    </span>
                    <span className="shrink-0 text-xs font-bold text-muted-strong">
                      {current ? "Current" : ROLE_LABELS[profile.role]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <h2 className="mt-5 text-xs font-bold uppercase tracking-wider text-subtle">Data</h2>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {TABLE_NAMES.map((table) => (
              <div key={table} className="flex justify-between gap-2">
                <dt className="text-muted">{table}</dt>
                <dd className="font-bold">{db[table].length}</dd>
              </div>
            ))}
          </dl>
          <button
            type="button"
            onClick={reset}
            className="mt-3 w-full rounded-xl border border-danger py-2 text-xs font-bold text-danger hover:bg-surface-subtle"
          >
            Reset demo data
          </button>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-brand-500"
      >
        {open ? "Hide dev" : "Dev"}
        {offset !== 0 && <Icon name="fast-forward" className="ml-1 inline h-3.5 w-3.5 text-brand-300" />}
      </button>
    </div>
  );
}
