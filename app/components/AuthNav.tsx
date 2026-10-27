"use client";

import Link from "next/link";
import { ROLE_LABELS, useSessionUser } from "../lib/store";
import Icon from "./shell/Icon";
import NotificationBell from "./shell/NotificationBell";
import { Avatar, useLogout } from "./shell/UserMenu";

const AREA_LINKS = {
  buyer: { href: "/my-groups", label: "My Groups", icon: "users" },
  seller: { href: "/seller", label: "Seller Center", icon: "store" },
  admin: { href: "/admin", label: "Admin", icon: "shield" },
} as const;

export default function AuthNav() {
  const user = useSessionUser();
  const logout = useLogout();

  if (user === undefined) {
    return <div aria-hidden="true" className="h-9 w-24" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className="hidden rounded-xl px-3 py-2 text-muted-strong transition hover:text-brand-500 sm:block">
          Log in
        </Link>
        <Link
          href="/register"
          className="rounded-xl bg-ink px-4 py-2.5 text-white shadow-sm transition hover:bg-brand-500"
        >
          Sign up
        </Link>
      </div>
    );
  }

  const area = AREA_LINKS[user.role];

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <Link
        href={area.href}
        className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-muted-strong transition hover:bg-brand-50 hover:text-brand-600 md:inline-flex"
      >
        <Icon name={area.icon} className="h-4 w-4" />
        {area.label}
      </Link>
      <NotificationBell />
      <div className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-1 md:pr-3">
        <Avatar user={user} />
        <span className="hidden leading-tight md:block">
          <span className="block text-sm font-bold">{user.name}</span>
          <span className="block text-[11px] font-medium text-subtle">{ROLE_LABELS[user.role]}</span>
        </span>
      </div>
      <button
        type="button"
        onClick={logout}
        aria-label="Log out"
        title="Log out"
        className="rounded-xl p-2 text-subtle transition hover:bg-surface-subtle hover:text-brand-500"
      >
        <Icon name="logout" />
      </button>
    </div>
  );
}
