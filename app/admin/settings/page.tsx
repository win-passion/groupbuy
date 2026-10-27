"use client";

import { FormEvent, useState } from "react";
import { PageHeader, Skeleton } from "../../components/ui";
import { DEFAULT_SETTINGS, Db, getSetting, SETTING_LIMITS, SettingKey, updateSettings, useDb } from "../../lib/store";

const GROUPS: { title: string; keys: SettingKey[] }[] = [
  { title: "Voting", keys: ["votingPeriodMinDays", "votingPeriodMaxDays", "votingPeriodDefaultDays"] },
  { title: "After voting", keys: ["sellerDecisionHours", "paymentWindowHours", "autoConfirmDeliveryDays"] },
  { title: "No-shows", keys: ["noShowLimit", "noShowLookbackDays", "noShowRestrictionDays"] },
  { title: "Money", keys: ["defaultCommissionRate"] },
];

const KEYS = Object.keys(DEFAULT_SETTINGS) as SettingKey[];

/** Commission is stored in basis points but edited as a percentage. */
function toField(key: SettingKey, value: number) {
  return key === "defaultCommissionRate" ? String(value / 100) : String(value);
}

function fromField(key: SettingKey, value: string) {
  const number = Number(value);
  return key === "defaultCommissionRate" ? Math.round(number * 100) : number;
}

function SettingsForm({ db }: { db: Db }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(KEYS.map((key) => [key, toField(key, getSetting(db, key))])) as Record<SettingKey, string>
  );
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = updateSettings(
      Object.fromEntries(KEYS.map((key) => [key, fromField(key, values[key])])) as Record<SettingKey, number>
    );
    setMessage(result.ok ? { ok: true, text: "Settings saved. New deals and deadlines use them from now on." } : { ok: false, text: result.error });
  }

  return (
    <form onSubmit={save} className="mt-8 space-y-6">
      {GROUPS.map((group) => (
        <section key={group.title} className="rounded-sheet bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-extrabold">{group.title}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {group.keys.map((key) => {
              const limit = SETTING_LIMITS[key];
              const percent = key === "defaultCommissionRate";
              return (
                <label key={key} className="block text-sm font-bold">
                  {limit.label}
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      inputMode="decimal"
                      step={percent ? "0.01" : "1"}
                      value={values[key]}
                      onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}
                      className="w-full rounded-xl border border-line px-4 py-3 font-normal outline-none focus:border-brand-500"
                    />
                    <span className="shrink-0 text-xs font-normal text-muted">{percent ? "%" : limit.unit}</span>
                  </div>
                  <span className="mt-1 block text-xs font-normal text-subtle">
                    Default {toField(key, DEFAULT_SETTINGS[key])}
                    {percent ? "%" : ` ${limit.unit}`}
                  </span>
                </label>
              );
            })}
          </div>
        </section>
      ))}

      {message && (
        <p role="status" className={`text-sm font-semibold ${message.ok ? "text-success-600" : "text-danger"}`}>
          {message.text}
        </p>
      )}
      <div className="flex justify-end">
        <button type="submit" className="rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-white hover:bg-brand-600">
          Save settings
        </button>
      </div>
    </form>
  );
}

export default function AdminSettingsPage() {
  const db = useDb();

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 lg:py-10">
      <PageHeader
        eyebrow="ADMIN"
        title="Settings"
        text="Changes apply to new deals and future deadlines. Existing orders keep the commission they were paid with."
      />
      {db ? <SettingsForm db={db} /> : <Skeleton className="mt-8 h-96" />}
    </div>
  );
}
