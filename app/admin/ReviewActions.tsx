"use client";

import { useState } from "react";
import { ActionResult } from "../lib/store";

/** Approve button plus a reject flow that asks for a reason. */
export default function ReviewActions({
  onApprove,
  onReject,
  rejectLabel = "Reject",
  reasonLabel = "Reason for the seller",
}: {
  onApprove: () => ActionResult;
  onReject: (reason: string) => ActionResult;
  rejectLabel?: string;
  reasonLabel?: string;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  function handle(result: ActionResult) {
    setError(result.ok ? "" : result.error);
  }

  return (
    <div>
      {rejecting ? (
        <div className="space-y-3">
          <label className="block text-sm font-bold">
            {reasonLabel}
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              autoFocus
              className="mt-2 w-full rounded-xl border border-line px-4 py-3 font-normal outline-none focus:border-brand-500"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handle(onReject(reason))}
              className="rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white hover:bg-danger"
            >
              {rejectLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                setRejecting(false);
                setError("");
              }}
              className="px-3 py-2.5 text-sm font-bold text-muted hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handle(onApprove())}
            className="rounded-xl bg-success-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-success-700"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => setRejecting(true)}
            className="rounded-xl border border-line bg-surface px-5 py-2.5 text-sm font-bold hover:border-danger hover:text-danger"
          >
            {rejectLabel}
          </button>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-sm font-semibold text-danger">{error}</p>}
    </div>
  );
}
