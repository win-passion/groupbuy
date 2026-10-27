"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Icon from "./Icon";
import { isActive, NavItem } from "./nav-config";

/** Most tabs that fit comfortably; beyond this the rest go under "More". */
const MAX_TABS = 5;

function Tab({ item, active, onClick }: { item: NavItem; active: boolean; onClick?: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex flex-col items-center gap-0.5 pb-2 pt-1.5 text-[11px] font-semibold motion-safe:transition ${
        active ? "text-brand-600" : "text-subtle hover:text-ink"
      }`}
    >
      <span
        className={`flex h-8 w-14 items-center justify-center rounded-full motion-safe:transition ${active ? "bg-brand-50" : ""}`}
      >
        <Icon name={item.icon} className="h-[22px] w-[22px]" strokeWidth={active ? 2.25 : 1.9} />
      </span>
      {item.label}
    </Link>
  );
}

/** Fixed bottom navigation, shown below the md breakpoint only. */
export default function BottomTabBar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const overflow = items.length > MAX_TABS;
  const primary = overflow ? items.slice(0, MAX_TABS - 1) : items;
  const extra = overflow ? items.slice(MAX_TABS - 1) : [];
  const extraActive = extra.some((item) => isActive(item, pathname));

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="More pages">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
            className="absolute inset-0 bg-ink/30"
          />
          <ul className="absolute inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] rounded-3xl border border-line bg-surface p-2 shadow-xl motion-safe:animate-rise">
            {extra.map((item) => {
              const active = isActive(item, pathname);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold ${
                      active ? "bg-brand-50 text-brand-600" : "text-ink-soft hover:bg-surface-subtle"
                    }`}
                  >
                    <Icon name={item.icon} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-line/70 bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      >
        <ul className="flex">
          {primary.map((item) => (
            <li key={item.href} className="flex-1">
              <Tab item={item} active={isActive(item, pathname)} />
            </li>
          ))}
          {overflow && (
            <li className="flex-1">
              <button
                type="button"
                onClick={() => setMoreOpen((open) => !open)}
                aria-expanded={moreOpen}
                className={`flex w-full flex-col items-center gap-0.5 pb-2 pt-1.5 text-[11px] font-semibold ${
                  extraActive || moreOpen ? "text-brand-600" : "text-subtle hover:text-ink"
                }`}
              >
                <span className={`flex h-8 w-14 items-center justify-center rounded-full ${extraActive || moreOpen ? "bg-brand-50" : ""}`}>
                  <Icon name="more" className="h-[22px] w-[22px]" />
                </span>
                More
              </button>
            </li>
          )}
        </ul>
      </nav>
    </>
  );
}

/** Spacer so page content is never hidden behind the fixed tab bar. */
export function BottomTabSpacer() {
  return <div aria-hidden="true" className="h-[calc(5rem+env(safe-area-inset-bottom))] md:hidden" />;
}
