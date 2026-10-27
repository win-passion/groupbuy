"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { formatTHB, paymentsDue, useDb, useSessionUser } from "../lib/store";
import Countdown from "./deals/Countdown";
import Icon from "./shell/Icon";

/**
 * Site-wide nudge for time-limited actions: buyers with payments to confirm
 * and sellers with deals waiting for a Proceed/Cancel decision.
 */
export default function ActionBanner() {
  const db = useDb();
  const user = useSessionUser();
  const pathname = usePathname();

  const action = useMemo(() => {
    if (!db || !user) {
      return null;
    }
    if (user.role === "buyer") {
      const due = paymentsDue(db, user.id);
      if (due.length === 0) {
        return null;
      }
      const first = due[0];
      return {
        href: due.length === 1 ? `/pay/${first.deal.id}` : "/my-groups",
        text:
          due.length === 1
            ? `Final price for ${first.deal.title}: ${formatTHB(first.deal.lockedUnitPrice ?? 0)} × ${first.vote.quantity}. Confirm and pay?`
            : `${due.length} deals have their final price. Confirm and pay?`,
        until: first.deal.paymentDeadline!,
        cta: "Confirm & pay",
      };
    }
    if (user.role === "seller") {
      const waiting = db.deals
        .filter((deal) => deal.sellerId === user.id && deal.status === "seller_decision" && deal.decisionDeadline)
        .sort((a, b) => Date.parse(a.decisionDeadline!) - Date.parse(b.decisionDeadline!));
      if (waiting.length === 0) {
        return null;
      }
      return {
        href: waiting.length === 1 ? `/seller/deals/${waiting[0].id}` : "/seller",
        text:
          waiting.length === 1
            ? `Voting closed on ${waiting[0].title}. Proceed or cancel?`
            : `${waiting.length} deals need your Proceed or Cancel decision.`,
        until: waiting[0].decisionDeadline!,
        cta: "Decide",
      };
    }
    return null;
  }, [db, user]);

  // No need to nag on the page that handles it.
  if (!action || pathname === action.href) {
    return null;
  }

  return (
    <div role="status" className="border-b border-brand-200 bg-brand-50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 text-sm">
        <p className="min-w-0 flex-1 font-semibold text-brand-700">
          <Icon name="bell" className="mr-1.5 inline h-4 w-4 align-[-2px]" />
          {action.text}{" "}
          <span className="whitespace-nowrap font-normal text-muted-strong">
            (<Countdown until={action.until} /> left)
          </span>
        </p>
        <Link
          href={action.href}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 font-bold text-white shadow-sm shadow-brand-200 hover:bg-brand-600"
        >
          {action.cta}
          <Icon name="arrow-right" className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
