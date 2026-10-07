"use client";

import Link from "next/link";
import { useSessionUser } from "../hooks/use-session-user";

export default function SellerSidebarPromo() {
  const user = useSessionUser();

  if (user?.role === "buyer") {
    return null;
  }

  const href = !user ? "/login?next=/seller" : "/seller";

  return (
    <div className="mt-8 rounded-2xl bg-slate-900 p-5 text-white">
      <p className="text-sm font-bold">Want to sell?</p>
      <p className="mt-2 text-xs leading-5 text-slate-400">
        Create group deals and sell more in one campaign.
      </p>
      <Link href={href} className="mt-4 block text-sm font-bold text-orange-400">
        Seller Center →
      </Link>
    </div>
  );
}
