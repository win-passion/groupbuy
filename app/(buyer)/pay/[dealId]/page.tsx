"use client";

import { useParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import Countdown from "../../../components/deals/Countdown";
import { BackLink, EmptyState, Skeleton } from "../../../components/ui";
import { IconName } from "../../../components/shell/Icon";
import { PaymentMethod, TEST_CARDS } from "../../../lib/payments";
import {
  addAddress,
  AddressInput,
  declinePayment,
  findDealSummary,
  formatTHB,
  noShowStatus,
  orderForVote,
  payForVote,
  useDb,
  useSessionUser,
  voteFor,
} from "../../../lib/store";
import NoShowNotice from "../../NoShowNotice";

const inputClass = "mt-1 w-full rounded-xl border border-line px-4 py-3 text-sm font-normal outline-none focus:border-brand-500";

const EMPTY_ADDRESS: AddressInput = {
  recipient: "",
  phone: "",
  line1: "",
  line2: "",
  district: "",
  province: "",
  postalCode: "",
};

const ADDRESS_FIELDS: [keyof AddressInput, string, string][] = [
  ["recipient", "Recipient", "sm:col-span-1"],
  ["phone", "Phone", "sm:col-span-1"],
  ["line1", "Address", "sm:col-span-2"],
  ["line2", "Address line 2 (optional)", "sm:col-span-2"],
  ["district", "District", "sm:col-span-1"],
  ["province", "Province", "sm:col-span-1"],
  ["postalCode", "Postal code", "sm:col-span-1"],
];

/** A QR-looking 21×21 pattern (with the three corner markers) derived from `seed`. */
function qrCells(seed: string): boolean[] {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  const cells: boolean[] = [];
  for (let index = 0; index < 21 * 21; index++) {
    hash = (hash * 1103515245 + 12345) >>> 0;
    const x = index % 21;
    const y = Math.floor(index / 21);
    const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
    if (finder) {
      const fx = x > 13 ? x - 14 : x;
      const fy = y > 13 ? y - 14 : y;
      cells.push(fx === 0 || fx === 6 || fy === 0 || fy === 6 || (fx > 1 && fx < 5 && fy > 1 && fy < 5));
    } else {
      cells.push((hash >> 16) % 2 === 0);
    }
  }
  return cells;
}

/** Decorative stand-in for a PromptPay QR code. */
function MockQr({ seed }: { seed: string }) {
  const cells = useMemo(() => qrCells(seed), [seed]);

  return (
    <svg viewBox="0 0 21 21" className="h-44 w-44" role="img" aria-label="PromptPay QR code (demo)" shapeRendering="crispEdges">
      <rect width="21" height="21" fill="white" />
      {cells.map((on, index) =>
        on ? <rect key={index} x={index % 21} y={Math.floor(index / 21)} width="1" height="1" fill="currentColor" /> : null
      )}
    </svg>
  );
}

export default function PayPage() {
  const { dealId } = useParams<{ dealId: string }>();
  const db = useDb();
  const user = useSessionUser();

  const [method, setMethod] = useState<PaymentMethod>("promptpay");
  const [card, setCard] = useState({ number: "", expiry: "", cvc: "" });
  const [chosenAddress, setChosenAddress] = useState<string | null>(null);
  const [addingAddress, setAddingAddress] = useState(false);
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [error, setError] = useState("");

  const data = useMemo(() => {
    if (!db || !user) {
      return null;
    }
    const summary = findDealSummary(db, dealId);
    const vote = voteFor(db, dealId, user.id);
    const addresses = db.addresses
      .filter((row) => row.userId === user.id)
      .sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
    return {
      summary,
      vote,
      addresses,
      order: vote ? orderForVote(db, vote.id) : undefined,
      noShows: noShowStatus(db, user.id),
    };
  }, [db, user, dealId]);

  if (!data) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-10">
        <Skeleton className="h-96" />
      </div>
    );
  }

  const { summary, vote, addresses, order, noShows } = data;
  const deal = summary?.deal;
  const addressId = chosenAddress ?? addresses[0]?.id ?? null;
  const open =
    deal?.status === "payment_window" && vote?.status === "active" && deal.paymentDeadline !== null;

  if (!summary || !deal || !vote) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-10">
        <EmptyState icon="ghost" title="Nothing to pay here" text="You didn't vote on this deal." action={{ href: "/my-groups", label: "Go to My Groups" }} />
      </div>
    );
  }

  if (!open) {
    const messages: Record<string, [IconName, string, string]> = {
      paid: ["party", "Payment confirmed", order ? `You paid ${formatTHB(order.total)} for ${order.quantity} × ${deal.title}. The seller will ship it to you.` : "The seller will ship your order."],
      declined: ["wave", "You declined this deal", "No problem. Declining never counts against you."],
      expired: ["hourglass", "The payment window closed", "You didn't confirm in time, so this counts as a missed confirmation."],
      cancelled: ["ban", "The seller cancelled this deal", "Nobody was charged."],
    };
    const [icon, title, text]: [IconName, string, string] =
      messages[vote.status] ??
      (deal.status === "seller_decision"
        ? ["hourglass", "Waiting for the seller", `Voting closed at ${formatTHB(deal.lockedUnitPrice ?? 0)} per unit. You'll be asked to pay once the seller confirms the deal.`]
        : ["vote", "Nothing to pay yet", "You'll be asked to pay once voting closes and the seller confirms."]);
    return (
      <div className="mx-auto max-w-5xl px-5 py-10">
        <EmptyState
          icon={icon}
          title={title}
          text={text}
          celebrate={vote.status === "paid"}
          action={order ? { href: `/orders/${order.id}`, label: "Track your order" } : { href: "/my-groups", label: "Back to My Groups" }}
        />
      </div>
    );
  }

  const unitPrice = deal.lockedUnitPrice ?? 0;
  const total = unitPrice * vote.quantity;
  const fullPrice = (summary.tiers[0]?.unitPrice ?? unitPrice) * vote.quantity;

  function saveAddress() {
    const result = addAddress(address);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setChosenAddress(result.value);
    setAddingAddress(false);
    setAddress(EMPTY_ADDRESS);
    setError("");
  }

  function pay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!addressId) {
      setError("Add a delivery address first.");
      return;
    }
    const result = payForVote(dealId, { method, addressId, card: method === "card" ? card : undefined });
    setError(result.ok ? "" : result.error);
  }

  function decline() {
    if (window.confirm("Decline this deal? You won't be charged, and declining never counts against you.")) {
      const result = declinePayment(dealId);
      setError(result.ok ? "" : result.error);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 lg:py-10">
      <BackLink href={"/my-groups"}>Back to My Groups</BackLink>

      <div className="mt-6 rounded-hero bg-gradient-to-br from-hero-from via-hero-via to-hero-to p-6 sm:p-8">
        <p className="text-sm font-bold text-brand-600">THE FINAL PRICE IS IN</p>
        <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">
          {formatTHB(unitPrice)} × {vote.quantity} {vote.quantity === 1 ? "unit" : "units"}. Confirm and pay?
        </h1>
        <p className="mt-2 text-muted-strong">
          {deal.title} · {summary.units} units voted unlocked this price.
        </p>
        <p className="mt-4 inline-flex items-center gap-1 rounded-full bg-surface px-4 py-2 text-sm font-bold text-brand-600 shadow-sm">
          <Countdown until={deal.paymentDeadline!} icon /> left to pay
        </p>
      </div>

      <div className="mt-6">
        <NoShowNotice status={noShows} />
      </div>

      <form onSubmit={pay} className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          {/* ADDRESS */}
          <section className="rounded-sheet bg-surface p-6 shadow-sm">
            <h2 className="text-lg font-extrabold">Delivery address</h2>
            <div className="mt-4 space-y-2">
              {addresses.map((row) => (
                <label
                  key={row.id}
                  className={`flex cursor-pointer gap-3 rounded-2xl border p-4 ${addressId === row.id ? "border-brand-500 bg-brand-50" : "border-line"}`}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={addressId === row.id}
                    onChange={() => setChosenAddress(row.id)}
                    className="mt-1 accent-brand-500"
                  />
                  <span className="text-sm">
                    <b>{row.recipient}</b> · {row.phone}
                    <span className="block text-muted">
                      {[row.line1, row.line2, row.district, row.province, row.postalCode].filter(Boolean).join(", ")}
                    </span>
                  </span>
                </label>
              ))}
            </div>

            {addingAddress || addresses.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-line p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {ADDRESS_FIELDS.map(([key, label, span]) => (
                    <label key={key} className={`text-xs font-bold text-muted-strong ${span}`}>
                      {label}
                      <input
                        value={address[key]}
                        onChange={(event) => setAddress((current) => ({ ...current, [key]: event.target.value }))}
                        inputMode={key === "postalCode" || key === "phone" ? "numeric" : undefined}
                        className={inputClass}
                      />
                    </label>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={saveAddress} className="rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-500">
                    Save address
                  </button>
                  {addresses.length > 0 && (
                    <button type="button" onClick={() => setAddingAddress(false)} className="px-3 py-2.5 text-sm font-bold text-muted">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setAddingAddress(true)} className="mt-3 text-sm font-bold text-brand-500">
                + Add a new address
              </button>
            )}
          </section>

          {/* METHOD */}
          <section className="rounded-sheet bg-surface p-6 shadow-sm">
            <h2 className="text-lg font-extrabold">Payment method</h2>
            <div role="radiogroup" aria-label="Payment method" className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-surface-muted p-1.5">
              {(
                [
                  ["promptpay", "PromptPay"],
                  ["card", "Card"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={method === value}
                  onClick={() => setMethod(value)}
                  className={`rounded-xl py-3 text-sm font-bold ${method === value ? "bg-brand-500 text-white shadow-sm" : "text-muted-strong"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {method === "promptpay" ? (
              <div className="mt-5 flex flex-col items-center text-center">
                <div className="rounded-2xl border border-line p-3 text-ink">
                  <MockQr seed={`${dealId}-${vote.id}-${total}`} />
                </div>
                <p className="mt-3 text-sm text-muted">
                  Scan with your banking app to pay <b className="text-ink">{formatTHB(total)}</b>.
                </p>
                <p className="mt-1 text-xs text-subtle">Demo: press the button below to simulate a completed transfer.</p>
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-3">
                <label className="col-span-2 text-xs font-bold text-muted-strong">
                  Card number
                  <input
                    value={card.number}
                    onChange={(event) => setCard((current) => ({ ...current, number: event.target.value }))}
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="1234 5678 9012 3456"
                    className={inputClass}
                  />
                </label>
                <label className="text-xs font-bold text-muted-strong">
                  Expiry
                  <input
                    value={card.expiry}
                    onChange={(event) => setCard((current) => ({ ...current, expiry: event.target.value }))}
                    autoComplete="cc-exp"
                    placeholder="MM/YY"
                    className={inputClass}
                  />
                </label>
                <label className="text-xs font-bold text-muted-strong">
                  CVC
                  <input
                    value={card.cvc}
                    onChange={(event) => setCard((current) => ({ ...current, cvc: event.target.value }))}
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="123"
                    className={inputClass}
                  />
                </label>
                <p className="col-span-2 text-xs text-subtle">
                  Demo cards: {TEST_CARDS.success} succeeds, {TEST_CARDS.declined} is declined. Any future expiry and CVC.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* SUMMARY */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-sheet bg-surface p-6 shadow-sm">
            <div className="flex gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-subtle">
                {summary.cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={summary.cover} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold">{deal.title}</p>
                <p className="text-sm text-muted">{summary.shopName}</p>
              </div>
            </div>
            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Final unit price</dt>
                <dd className="font-bold">{formatTHB(unitPrice)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Quantity</dt>
                <dd className="font-bold">× {vote.quantity}</dd>
              </div>
              {fullPrice > total && (
                <div className="flex justify-between text-success-600">
                  <dt>You save</dt>
                  <dd className="font-bold">{formatTHB(fullPrice - total)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-line pt-3 text-base">
                <dt className="font-bold">Total</dt>
                <dd className="text-xl font-extrabold text-brand-500">{formatTHB(total)}</dd>
              </div>
            </dl>

            {error && <p role="alert" className="mt-4 text-sm font-semibold text-danger">{error}</p>}

            <button
              type="submit"
              className="mt-5 w-full rounded-2xl bg-brand-500 py-4 text-lg font-extrabold text-white shadow-lg shadow-brand-100 hover:bg-brand-600"
            >
              {method === "promptpay" ? "I've paid" : "Pay"} {formatTHB(total)}
            </button>
            <button type="button" onClick={decline} className="mt-3 w-full py-2 text-sm font-bold text-muted hover:text-danger">
              No, cancel
            </button>
            <p className="mt-2 text-center text-xs text-subtle">
              You pay for all {vote.quantity} {vote.quantity === 1 ? "unit" : "units"} you voted, or decline. Declining is never
              penalised.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
