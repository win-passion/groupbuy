"use client";

import { useSessionUser } from "../lib/store";

const MESSAGES = {
  pending: {
    title: "Your seller application is under review",
    text: "An admin will check your shop soon. You can look around Seller Center, but you can't create deals until you're approved.",
  },
  rejected: {
    title: "Your seller application was not approved",
    text: "Contact GroupBuy support if you'd like to apply again.",
  },
  suspended: {
    title: "Your shop is suspended",
    text: "You can't create new deals while your shop is suspended. Contact GroupBuy support.",
  },
};

/** True when this seller may create and edit deals. */
export function useCanSell() {
  return useSessionUser()?.sellerStatus === "approved";
}

export default function SellerStatusBanner() {
  const status = useSessionUser()?.sellerStatus;

  if (!status || status === "approved") {
    return null;
  }

  const message = MESSAGES[status];

  return (
    <div role="status" className="mx-auto max-w-6xl px-5 pt-6">
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
        <p className="font-bold text-brand-700">{message.title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-strong">{message.text}</p>
      </div>
    </div>
  );
}
