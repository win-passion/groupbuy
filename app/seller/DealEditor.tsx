"use client";

import { useRouter } from "next/navigation";
import { FormEvent, ReactNode, useMemo, useState } from "react";
import DealCard from "../components/deals/DealCard";
import {
  baht,
  DealErrors,
  DealInput,
  DealSummary,
  DealTier,
  formatTHB,
  getSetting,
  hasErrors,
  MAX_TIERS,
  saveDealDraft,
  submitDealForReview,
  useDb,
  useSessionUser,
  validateDeal,
} from "../lib/store";

const PRESET_IMAGES = [
  ["/assets/earphone.jpeg", "Earbuds"],
  ["/assets/watch.jpeg", "Watch"],
  ["/assets/Boncafe-Drip-Coffee-Maker-1.jpg", "Coffee maker"],
  ["/assets/skincareset.jpeg", "Skincare"],
  ["/assets/products/air-fryer.jpg", "Air fryer"],
  ["/assets/products/backpack.jpg", "Backpack"],
  ["/assets/products/bluetooth-speaker.jpg", "Bluetooth speaker"],
  ["/assets/products/coffee-beans.jpg", "Coffee beans"],
  ["/assets/products/desk-lamp.jpg", "Desk lamp"],
  ["/assets/products/dumbbells.jpg", "Dumbbells"],
  ["/assets/products/fitness-band.jpg", "Fitness band"],
  ["/assets/products/game-controller.jpg", "Game controller"],
  ["/assets/products/jasmine-rice.jpg", "Jasmine rice"],
  ["/assets/products/mechanical-keyboard.jpg", "Mechanical keyboard"],
  ["/assets/products/portable-blender.jpg", "Portable blender"],
  ["/assets/products/power-bank.jpg", "Power bank"],
  ["/assets/products/sunscreen.jpg", "Sunscreen"],
  ["/assets/products/tshirt-pack.jpg", "Tshirt pack"],
  ["/assets/products/water-bottle.jpg", "Water bottle"],
  ["/assets/products/yoga-mat.jpg", "Yoga mat"],
] as const;

type TierRow = { minUnits: string; price: string };

type FormState = {
  title: string;
  description: string;
  categoryId: string;
  imageSrc: string;
  votingDays: string;
  maxUnitsPerBuyer: string;
  tiers: TierRow[];
};

function toForm(input: DealInput): FormState {
  return {
    title: input.title,
    description: input.description,
    categoryId: input.categoryId,
    imageSrc: input.imageSrc,
    votingDays: String(input.votingDays),
    maxUnitsPerBuyer: input.maxUnitsPerBuyer === null ? "" : String(input.maxUnitsPerBuyer),
    tiers: input.tiers.map((tier) => ({ minUnits: String(tier.minUnits), price: String(tier.unitPrice / 100) })),
  };
}

function toInput(form: FormState): DealInput {
  const number = (value: string) => (value.trim() === "" ? NaN : Number(value));
  return {
    title: form.title,
    description: form.description,
    categoryId: form.categoryId,
    imageSrc: form.imageSrc,
    votingDays: number(form.votingDays),
    maxUnitsPerBuyer: form.maxUnitsPerBuyer.trim() === "" ? null : number(form.maxUnitsPerBuyer),
    // The first tier always starts at 1 unit; the editor locks that field.
    tiers: form.tiers.map((tier, index) => ({
      minUnits: index === 0 ? 1 : number(tier.minUnits),
      unitPrice: baht(number(tier.price) || 0),
    })),
  };
}

const inputClass =
  "mt-2 w-full rounded-xl border border-line px-4 py-3 font-normal outline-none focus:border-brand-500 aria-invalid:border-danger";

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div className="text-sm font-bold">
      <label className="block">
        {label}
        {children}
      </label>
      {hint && !error && <p className="mt-1 text-xs font-normal text-subtle">{hint}</p>}
      {error && <p className="mt-1 text-xs font-semibold text-danger">{error}</p>}
    </div>
  );
}

/** Create and edit form for a seller's deal, with a tier editor and live preview. */
export default function DealEditor({ dealId, initial }: { dealId?: string; initial: DealInput }) {
  const router = useRouter();
  const db = useDb();
  const user = useSessionUser();
  const [form, setForm] = useState(() => toForm(initial));
  const [showErrors, setShowErrors] = useState(false);
  const [error, setError] = useState("");

  const input = useMemo(() => toInput(form), [form]);
  const errors: DealErrors = useMemo(() => (db ? validateDeal(db, input) : {}), [db, input]);
  const shown = showErrors ? errors : {};
  const canSubmit = user?.sellerStatus === "approved";

  const preview = useMemo<DealSummary | null>(() => {
    if (!db) {
      return null;
    }
    const tiers: DealTier[] = input.tiers.map((tier, index) => ({
      id: `preview-${index}`,
      dealId: "preview",
      minUnits: tier.minUnits,
      maxUnits: null,
      unitPrice: tier.unitPrice,
    }));
    return {
      deal: {
        id: "preview",
        sellerId: user?.id ?? "",
        categoryId: input.categoryId,
        title: input.title || "Your deal title",
        description: input.description,
        status: "draft",
        votingDays: input.votingDays,
        votingStartsAt: null,
        votingEndsAt: null,
        maxUnitsPerBuyer: input.maxUnitsPerBuyer,
        unitsVotedAtClose: null,
        lockedTierId: null,
        lockedUnitPrice: null,
        decisionDeadline: null,
        paymentDeadline: null,
        decidedAt: null,
        cancelReason: null,
        reviewNote: null,
        createdAt: "",
      },
      tiers,
      units: 0,
      voters: 0,
      currentTier: tiers[0],
      nextTier: tiers[1],
      unitsToNextTier: tiers[1] ? tiers[1].minUnits : null,
      savingPercent: 0,
      cover: input.imageSrc || undefined,
      category: db.categories.find((category) => category.id === input.categoryId),
      shopName: user?.shopName ?? "Your shop",
      closedReason: "Preview",
    };
  }, [db, input, user]);

  if (!db) {
    return null;
  }

  const minDays = getSetting(db, "votingPeriodMinDays");
  const maxDays = getSetting(db, "votingPeriodMaxDays");
  const categories = [...db.categories].sort((a, b) => a.sortOrder - b.sortOrder);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setTier(index: number, patch: Partial<TierRow>) {
    setForm((current) => ({
      ...current,
      tiers: current.tiers.map((tier, i) => (i === index ? { ...tier, ...patch } : tier)),
    }));
  }

  function addTier() {
    setForm((current) => {
      const last = current.tiers[current.tiers.length - 1];
      const lastMin = Number(last?.minUnits) || 1;
      const lastPrice = Number(last?.price) || 0;
      return {
        ...current,
        tiers: [
          ...current.tiers,
          {
            minUnits: String(lastMin === 1 ? 10 : lastMin * 2),
            price: lastPrice ? String(Math.floor(lastPrice * 0.9)) : "",
          },
        ],
      };
    });
  }

  function removeTier(index: number) {
    setForm((current) => ({ ...current, tiers: current.tiers.filter((_, i) => i !== index) }));
  }

  function save(submit: boolean) {
    setError("");
    if (submit && hasErrors(errors)) {
      setShowErrors(true);
      setError("Fix the highlighted fields before submitting.");
      return;
    }
    const saved = saveDealDraft(input, dealId);
    if (!saved.ok) {
      setError(saved.error);
      return;
    }
    if (submit) {
      const submitted = submitDealForReview(saved.value);
      if (!submitted.ok) {
        setError(submitted.error);
        return;
      }
    }
    router.push(`/seller/deals/${saved.value}`);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save(true);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <section className="space-y-5 rounded-sheet bg-surface p-6 shadow-sm sm:p-7">
          <h2 className="text-lg font-extrabold">Product</h2>

          <Field label="Title" error={shown.title}>
            <input
              value={form.title}
              onChange={(event) => set("title", event.target.value)}
              aria-invalid={Boolean(shown.title)}
              className={inputClass}
              placeholder="Wireless Earbuds Pro"
            />
          </Field>

          <Field label="Description" error={shown.description}>
            <textarea
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
              aria-invalid={Boolean(shown.description)}
              rows={4}
              className={inputClass}
              placeholder="What's included, key features, warranty..."
            />
          </Field>

          <Field label="Category" error={shown.categoryId}>
            <select
              value={form.categoryId}
              onChange={(event) => set("categoryId", event.target.value)}
              aria-invalid={Boolean(shown.categoryId)}
              className={inputClass}
            >
              <option value="">Choose a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>

          <fieldset>
            <legend className="text-sm font-bold">Image</legend>
            <div className="mt-2 grid grid-cols-5 gap-2 sm:grid-cols-8">
              {PRESET_IMAGES.map(([src, label]) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => set("imageSrc", src)}
                  aria-pressed={form.imageSrc === src}
                  className={`flex aspect-square items-center justify-center overflow-hidden rounded-xl border-2 bg-surface ${
                    form.imageSrc === src ? "border-brand-500" : "border-line hover:border-brand-300"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={label} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
            <Field label="" hint="Or paste an image URL" error={shown.imageSrc}>
              <input
                value={form.imageSrc}
                onChange={(event) => set("imageSrc", event.target.value)}
                aria-label="Image URL"
                aria-invalid={Boolean(shown.imageSrc)}
                className={inputClass}
                placeholder="https://..."
              />
            </Field>
          </fieldset>
        </section>

        <section className="rounded-sheet bg-surface p-6 shadow-sm sm:p-7">
          <h2 className="text-lg font-extrabold">Price tiers</h2>
          <p className="mt-1 text-sm text-muted">
            The price drops as buyers vote for more units. The first tier starts at 1 unit, and each tier must be
            cheaper than the one before.
          </p>

          <div className="mt-5 space-y-3">
            {form.tiers.map((tier, index) => {
              const next = form.tiers[index + 1];
              const from = Number(tier.minUnits);
              const to = next ? Number(next.minUnits) - 1 : null;
              const range =
                Number.isFinite(from) && from >= 1
                  ? to === null
                    ? `${from}+ units`
                    : to >= from
                      ? `${from}–${to} units`
                      : ""
                  : "";
              const rowError = shown.tierRows?.[index];

              return (
                <div key={index} className={`rounded-2xl border p-4 ${rowError ? "border-danger" : "border-line"}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-subtle">
                      Tier {index + 1} {range && <span className="normal-case tracking-normal text-muted">· {range}</span>}
                    </p>
                    {index > 0 && (
                      <button type="button" onClick={() => removeTier(index)} className="text-xs font-bold text-muted hover:text-danger">
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <label className="text-xs font-bold text-muted-strong">
                      From units
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        value={index === 0 ? "1" : tier.minUnits}
                        disabled={index === 0}
                        onChange={(event) => setTier(index, { minUnits: event.target.value })}
                        className={`${inputClass} disabled:bg-surface-subtle disabled:text-muted`}
                      />
                    </label>
                    <label className="text-xs font-bold text-muted-strong">
                      Price per unit (฿)
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.01"
                        value={tier.price}
                        onChange={(event) => setTier(index, { price: event.target.value })}
                        className={inputClass}
                      />
                    </label>
                  </div>
                  {rowError && <p className="mt-2 text-xs font-semibold text-danger">{rowError}</p>}
                </div>
              );
            })}
          </div>
          {shown.tiers && <p className="mt-2 text-xs font-semibold text-danger">{shown.tiers}</p>}

          {form.tiers.length < MAX_TIERS && (
            <button
              type="button"
              onClick={addTier}
              className="mt-4 w-full rounded-xl border border-dashed border-brand-300 py-3 text-sm font-bold text-brand-600 hover:bg-brand-50"
            >
              + Add tier
            </button>
          )}
        </section>

        <section className="space-y-5 rounded-sheet bg-surface p-6 shadow-sm sm:p-7">
          <h2 className="text-lg font-extrabold">Voting</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Voting period (days)"
              hint={`${minDays}–${maxDays} days. Starts when an admin approves the deal.`}
              error={shown.votingDays}
            >
              <input
                type="number"
                inputMode="numeric"
                min={minDays}
                max={maxDays}
                value={form.votingDays}
                onChange={(event) => set("votingDays", event.target.value)}
                aria-invalid={Boolean(shown.votingDays)}
                className={inputClass}
              />
            </Field>
            <Field label="Max units per buyer" hint="Optional. Leave empty for no limit." error={shown.maxUnitsPerBuyer}>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={form.maxUnitsPerBuyer}
                onChange={(event) => set("maxUnitsPerBuyer", event.target.value)}
                aria-invalid={Boolean(shown.maxUnitsPerBuyer)}
                className={inputClass}
                placeholder="No limit"
              />
            </Field>
          </div>
        </section>

        {error && <p role="alert" className="text-sm font-semibold text-danger">{error}</p>}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => save(false)}
            className="rounded-xl border border-line bg-surface px-6 py-3 text-sm font-bold hover:border-brand-400"
          >
            Save draft
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            title={canSubmit ? undefined : "Your seller application must be approved first"}
            className="rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-white hover:bg-brand-600 disabled:bg-brand-300"
          >
            Submit for review
          </button>
        </div>
        {!canSubmit && (
          <p className="text-right text-xs text-muted">You can submit deals once your seller application is approved.</p>
        )}
      </form>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-subtle">Live preview</p>
        {preview && <DealCard summary={preview} href={null} />}
        {preview && preview.tiers.length > 0 && (
          <div className="mt-4 rounded-2xl bg-surface p-4 text-sm shadow-sm">
            {preview.tiers.map((tier, index) => (
              <div key={index} className="flex justify-between py-1">
                <span className="text-muted">
                  {Number.isFinite(tier.minUnits) ? `${tier.minUnits}+ units` : "—"}
                </span>
                <span className="font-bold">{tier.unitPrice > 0 ? formatTHB(tier.unitPrice) : "—"}</span>
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
