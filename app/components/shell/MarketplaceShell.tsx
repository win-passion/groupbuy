"use client";

import { ReactNode } from "react";
import { useSessionUser } from "../../lib/store";
import ActionBanner from "../ActionBanner";
import AuthNav from "../AuthNav";
import BottomTabBar, { BottomTabSpacer } from "./BottomTabBar";
import Logo from "./Logo";
import { marketplaceTabs } from "./nav-config";
import SiteFooter from "./SiteFooter";

/** Layout for the public marketplace: top navigation, plus bottom tabs on phones. */
export default function MarketplaceShell({ children }: { children: ReactNode }) {
  const user = useSessionUser();

  return (
    // Column layout so <main> fills the screen and the footer sits at the bottom on short pages.
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-line/70 bg-surface/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-4 px-4 md:h-[4.5rem] md:px-6 lg:px-10">
          <Logo />

          <div className="ml-auto flex items-center gap-5 text-sm font-semibold">
            <AuthNav />
          </div>
        </div>
      </nav>

      <ActionBanner />

      <main className="flex-1">{children}</main>

      <SiteFooter />
      <BottomTabSpacer />

      <BottomTabBar items={marketplaceTabs(user ?? null)} />
    </div>
  );
}
