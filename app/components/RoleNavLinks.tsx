"use client";

import Link from "next/link";
import { useSessionUser } from "../hooks/use-session-user";

export default function RoleNavLinks() {
  const user = useSessionUser();

  if (!user) {
    return (
      <>
        <Link href="/login?next=/my-groups" className="hidden hover:text-orange-500 md:block">
          My Groups
        </Link>
        <Link href="/login?next=/seller" className="hidden hover:text-orange-500 lg:block">
          Sell on GroupBuy
        </Link>
      </>
    );
  }

  if (user.role === "seller") {
    return (
      <Link href="/seller" className="hidden hover:text-orange-500 lg:block">
        Seller Center
      </Link>
    );
  }

  return (
    <Link href="/my-groups" className="hidden hover:text-orange-500 md:block">
      My Groups
    </Link>
  );
}
