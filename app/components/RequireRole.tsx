"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { ROLE_LABELS, useSessionUser, UserRole } from "../lib/store";

const DENIED_HINTS = {
  buyer: "This area is for buyers. Log in with a buyer account to join group deals.",
  seller: "This area is for sellers only. Register or log in with a seller account.",
  admin: "This area is for GroupBuy administrators only.",
};

const HOME_BY_ROLE = {
  buyer: { href: "/my-groups", label: "Go to My Groups" },
  seller: { href: "/seller", label: "Go to Seller Center" },
  admin: { href: "/admin", label: "Go to Admin" },
};

type RequireRoleProps = {
  /** Omit to allow any signed-in user */
  role?: UserRole;
  children: ReactNode;
};

export default function RequireRole({ role, children }: RequireRoleProps) {
  const router = useRouter();
  const user = useSessionUser();

  useEffect(() => {
    if (user === null) {
      router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [user, router]);

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas text-ink">
        <p className="text-sm font-semibold text-muted">Loading...</p>
      </main>
    );
  }

  if (role && user.role !== role) {
    const ownArea = HOME_BY_ROLE[user.role];

    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas px-5 text-ink">
        <div className="w-full max-w-md rounded-sheet bg-surface p-8 text-center shadow-sm">
          <p className="text-sm font-bold text-brand-500">ACCESS RESTRICTED</p>
          <h1 className="mt-2 text-2xl font-extrabold">
            {ROLE_LABELS[role]} account required
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">{DENIED_HINTS[role]}</p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href={ownArea.href}
              className="rounded-xl bg-brand-500 py-3 text-sm font-bold text-white"
            >
              {ownArea.label}
            </Link>
            <Link href="/" className="text-sm font-bold text-muted hover:text-brand-500">
              Back to home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
