"use client";

import { useState } from "react";
import { BasisPoints, percent, setSellerCommission } from "../../lib/store";

/** Per-seller commission override; empty means the platform default. */
export default function CommissionEditor({
  sellerId,
  rate,
  defaultRate,
}: {
  sellerId: string;
  rate: BasisPoints | null;
  defaultRate: BasisPoints;
}) {
  const [value, setValue] = useState(rate === null ? "" : String(rate / 100));
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function save(next: BasisPoints | null) {
    const result = setSellerCommission(sellerId, next);
    setMessage(result.ok ? { ok: true, text: "Saved. New orders use this rate." } : { ok: false, text: result.error });
    if (result.ok && next === null) {
      setValue("");
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-end gap-2">
      <label className="text-xs font-bold text-muted-strong">
        Commission
        <span className="mt-1 flex items-center gap-1">
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={`${defaultRate / 100}`}
            className="w-24 rounded-xl border border-line px-3 py-2 text-sm font-normal outline-none focus:border-brand-500"
          />
          <span className="font-normal text-muted">%</span>
        </span>
      </label>
      <button
        type="button"
        onClick={() => save(value.trim() === "" ? null : Math.round(Number(value) * 100))}
        className="rounded-xl bg-ink px-3 py-2 text-xs font-bold text-white hover:bg-brand-500"
      >
        Save
      </button>
      {rate !== null && (
        <button type="button" onClick={() => save(null)} className="px-2 py-2 text-xs font-bold text-muted hover:text-ink">
          Use default ({percent(defaultRate)})
        </button>
      )}
      {message && (
        <p role="status" className={`w-full text-xs font-semibold ${message.ok ? "text-success-600" : "text-danger"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
