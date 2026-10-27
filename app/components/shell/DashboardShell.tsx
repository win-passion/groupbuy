"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { useSessionUser, UserRole } from "../../lib/store";
import ActionBanner from "../ActionBanner";
import BottomTabBar, { BottomTabSpacer } from "./BottomTabBar";
import Icon from "./Icon";
import Logo from "./Logo";
import NotificationBell from "./NotificationBell";
import { DASHBOARD_NAV, DASHBOARD_TITLES, isActive } from "./nav-config";
import UserMenu, { Avatar, useLogout } from "./UserMenu";

/**
 * Layout for the buyer, seller and admin areas: a sidebar from the md
 * breakpoint up, and a top bar plus bottom tab bar on phones.
 * Wrap it in <RequireRole> so the user is always signed in here.
 */
export default function DashboardShell({
  role,
  children,
}: {
  role: UserRole;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const user = useSessionUser();
  const logout = useLogout();
  const items = DASHBOARD_NAV[role];
  const title = DASHBOARD_TITLES[role];

  return (
    <div className="min-h-screen bg-canvas text-ink md:flex">
      {/* SIDEBAR (tablet and desktop) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-surface p-5 md:flex">
        <div className="flex items-start justify-between gap-2 px-2">
          <div>
            <Logo />
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-brand-500">
              {title}
            </p>
          </div>
          <NotificationBell className="-mr-2" />
        </div>

        <nav aria-label="Main" className="mt-8 flex-1 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const active = isActive(item, pathname);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold motion-safe:transition ${
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-muted-strong hover:bg-surface-subtle hover:text-ink"
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    active ? "bg-surface text-brand-600 shadow-sm" : "text-subtle"
                  }`}
                >
                  <Icon name={item.icon} className="h-[18px] w-[18px]" />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {user && <UserMenu user={user} />}
      </aside>

      {/* TOP BAR (phones) */}
      <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-line/70 bg-surface/85 px-4 backdrop-blur-xl md:hidden">
        <Logo compact />
        <span className="text-xs font-bold uppercase tracking-wider text-brand-500">
          {title}
        </span>
        {user && (
          <div className="ml-auto flex items-center gap-1">
            <NotificationBell />
            <Avatar user={user} />
            <button
              type="button"
              onClick={logout}
              aria-label="Log out"
              className="rounded-xl p-2 text-subtle hover:text-brand-500"
            >
              <Icon name="logout" />
            </button>
          </div>
        )}
      </header>

      <main className="min-w-0 flex-1">
        <ActionBanner />
        {children}
        <BottomTabSpacer />
      </main>

      <BottomTabBar items={items} />
    </div>
  );
}
