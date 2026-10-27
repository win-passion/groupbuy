"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import Icon from "../shell/Icon";
import { PageHeader } from "../ui";
import { HELP_PAGES } from "./HelpContent";

/** Layout for a help page: title, a menu of the four help pages, and the content. */
export default function HelpPage({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-5 lg:py-12">
      <PageHeader eyebrow="HELP" title={title} text={text} />

      <div className="mt-8 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-8">
        <nav aria-label="Help pages" className="mb-6 flex flex-wrap gap-2 lg:mb-0 lg:flex-col lg:gap-1">
          {HELP_PAGES.map((page) => {
            const active = pathname === page.href;
            return (
              <Link
                key={page.href}
                href={page.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition lg:rounded-xl lg:px-3 lg:py-2.5 ${
                  active ? "bg-ink text-white shadow-sm lg:bg-surface lg:text-brand-600" : "bg-surface text-muted-strong shadow-sm hover:text-ink lg:bg-transparent lg:shadow-none"
                }`}
              >
                <Icon name={page.icon} className="h-4 w-4" />
                {page.label}
              </Link>
            );
          })}
        </nav>

        <div className="motion-safe:animate-rise">{children}</div>
      </div>
    </div>
  );
}
