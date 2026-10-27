import Link from "next/link";
import { HELP_PAGES } from "../help/HelpContent";
import Logo from "./Logo";

/** Site footer: brand, links to the help pages and a copyright line. */
export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line/70 bg-surface-subtle">
      <div className="mx-auto flex max-w-[1500px] flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-subtle sm:px-6 lg:flex-row lg:px-10">
        <div className="flex items-center gap-3">
          <Logo className="text-base" />
          <span className="hidden sm:inline">Buy together, pay less.</span>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-semibold">
          {HELP_PAGES.map((page) => (
            <Link key={page.href} href={page.href} className="text-muted-strong transition hover:text-brand-600">
              {page.label}
            </Link>
          ))}
        </nav>
        <p>© {new Date().getFullYear()} GroupBuy · Demo: data stays in your browser</p>
      </div>
    </footer>
  );
}
