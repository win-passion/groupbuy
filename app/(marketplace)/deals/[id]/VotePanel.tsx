"use client";

import Link from "next/link";
import Icon from "../../../components/shell/Icon";
import { useState } from "react";
import {
  castVote,
  DealSummary,
  formatTHB,
  SessionUser,
  tierForUnits,
  useDb,
  voteFor,
  withdrawVote,
} from "../../../lib/store";

/** Upper bound for the quantity stepper when the seller set no per-buyer limit. */
const NO_LIMIT_MAX = 99;

function QuantityStepper({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const button =
    "flex h-11 w-11 items-center justify-center rounded-xl border border-line text-lg font-extrabold hover:border-brand-400 hover:text-brand-600 disabled:opacity-40";
  return (
    <div className="flex items-center gap-3">
      <button type="button" className={button} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Fewer units">
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isFinite(next)) {
            onChange(Math.max(1, Math.min(max, Math.round(next))));
          }
        }}
        aria-label="Units"
        className="h-11 w-16 rounded-xl border border-line text-center text-lg font-extrabold outline-none focus:border-brand-500"
      />
      <button type="button" className={button} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="More units">
        +
      </button>
    </div>
  );
}

export default function VotePanel({
  summary,
  user,
}: {
  summary: DealSummary;
  user: SessionUser | null;
}) {
  const db = useDb();
  const { deal, tiers, units, closedReason } = summary;
  const myVote = db && user ? voteFor(db, deal.id, user.id) : undefined;
  const activeVote = myVote?.status === "active" ? myVote : undefined;
  const max = deal.maxUnitsPerBuyer ?? NO_LIMIT_MAX;

  const [quantity, setQuantity] = useState(activeVote?.quantity ?? 1);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const box = "rounded-sheet border border-line bg-surface p-6";

  if (closedReason) {
    const units = `${myVote?.quantity ?? 0} ${myVote?.quantity === 1 ? "unit" : "units"}`;
    const [title, text] =
      myVote?.status === "paid"
        ? ["You've paid", `Your order for ${units} is confirmed. The seller ships it to your address.`]
        : myVote?.status === "declined"
          ? ["You declined this deal", "No charge, and declining never counts against you."]
          : myVote?.status === "expired"
            ? ["Payment window closed", "You didn't confirm in time, so this counted as a missed confirmation."]
            : myVote?.status === "cancelled" || deal.status === "cancelled"
              ? ["This deal was cancelled", "The seller cancelled after voting closed. Nobody was charged."]
              : activeVote && deal.status === "payment_window"
                ? ["The final price is in", `Confirm and pay for your ${units} before the payment window closes.`]
                : activeVote
                  ? ["Voting closed", `You voted for ${units}. The price is locked; you'll be asked to pay once the seller confirms the deal.`]
                  : [closedReason, "Browse other live deals in the meantime."];

    return (
      <div className={box}>
        <p className="font-extrabold">{title}</p>
        <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
        {activeVote && deal.status === "payment_window" && (
          <Link
            href={`/pay/${deal.id}`}
            className="mt-5 block rounded-2xl bg-brand-500 py-4 text-center font-extrabold text-white hover:bg-brand-600"
          >
            Confirm &amp; pay <Icon name="arrow-right" className="inline h-4 w-4 align-[-3px]" />
          </Link>
        )}
      </div>
    );
  }

  if (!user) {
    return (
      <div className={box}>
        <p className="font-extrabold">Vote to join this group</p>
        <p className="mt-2 text-sm leading-6 text-muted">Voting is free. Log in or create a buyer account to vote.</p>
        <Link
          href={`/login?next=/deals/${deal.id}`}
          className="mt-5 block rounded-2xl bg-brand-500 py-4 text-center font-extrabold text-white hover:bg-brand-600"
        >
          Log in to vote
        </Link>
      </div>
    );
  }

  if (user.role !== "buyer") {
    return (
      <div className={box}>
        <p className="font-extrabold">Only buyers can vote</p>
        <p className="mt-2 text-sm leading-6 text-muted">
          You&apos;re logged in as {user.role === "seller" ? "a seller" : "an admin"}. Use a buyer account to vote on deals.
        </p>
      </div>
    );
  }

  // Units if this buyer's vote changes to `quantity`.
  const unitsAfter = units - (activeVote?.quantity ?? 0) + quantity;
  const priceAfter = tierForUnits(tiers, unitsAfter)?.unitPrice ?? 0;
  const priceNow = summary.currentTier?.unitPrice ?? 0;
  const unchanged = activeVote?.quantity === quantity;

  function submit() {
    setError("");
    const result = castVote(deal.id, quantity);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaved(activeVote ? "Vote updated." : "You're in! Your vote counts toward the next tier.");
  }

  function withdraw() {
    setError("");
    const result = withdrawVote(deal.id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setQuantity(1);
    setSaved("Your vote was withdrawn.");
  }

  return (
    <div className={box}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-extrabold">{activeVote ? "Your vote" : "Vote to join this group"}</p>
          <p className="mt-1 text-sm text-muted">
            {activeVote
              ? `You voted for ${activeVote.quantity} ${activeVote.quantity === 1 ? "unit" : "units"}. Change or withdraw it until voting closes.`
              : "Free to vote. No payment details needed."}
          </p>
        </div>
        {activeVote && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success-50 px-3 py-1 text-xs font-bold text-success-600">
            <Icon name="tick" className="h-3.5 w-3.5" strokeWidth={3} />
            Voted
          </span>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <QuantityStepper value={quantity} max={max} onChange={(value) => { setQuantity(value); setSaved(""); }} />
        <p className="text-xs text-muted">
          {deal.maxUnitsPerBuyer ? `Up to ${deal.maxUnitsPerBuyer} per buyer` : "No limit per buyer"}
        </p>
      </div>

      <p className="mt-4 rounded-2xl bg-surface-subtle p-4 text-sm leading-6 text-muted-strong">
        {unchanged ? (
          <>The group is at <b>{units} units</b> with your vote.</>
        ) : (
          <>
            With your vote the group reaches <b>{unitsAfter} units</b>
            {priceAfter < priceNow ? (
              <>
                {" "}and unlocks <b className="text-brand-600">{formatTHB(priceAfter)}</b> per unit
              </>
            ) : (
              <> at {formatTHB(priceAfter)} per unit</>
            )}
            .
          </>
        )}{" "}
        You pay the locked price × your units only after voting closes.
      </p>

      {error && <p role="alert" className="mt-4 text-sm font-semibold text-danger">{error}</p>}
      {saved && !error && (
        <p key={saved} role="status" className="mt-4 text-sm font-semibold text-success-600 motion-safe:animate-pop">
          {saved}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={unchanged}
        className="mt-5 w-full rounded-2xl bg-brand-500 py-4 text-lg font-extrabold text-white shadow-lg shadow-brand-100 transition hover:bg-brand-600 disabled:bg-brand-300 disabled:shadow-none"
      >
        {activeVote ? (unchanged ? "Vote saved" : `Update vote to ${quantity}`) : `Vote for ${quantity} ${quantity === 1 ? "unit" : "units"}`}
      </button>

      {activeVote && (
        <button type="button" onClick={withdraw} className="mt-3 w-full py-2 text-sm font-bold text-muted hover:text-danger">
          Withdraw my vote
        </button>
      )}
    </div>
  );
}
