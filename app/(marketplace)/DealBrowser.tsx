"use client";

import Link from "next/link";
import { useMemo } from "react";
import DealCard from "../components/deals/DealCard";
import Icon from "../components/shell/Icon";
import { EmptyState, Skeleton, SkeletonCards } from "../components/ui";
import { marketplaceDeals, useDb } from "../lib/store";

function categoryHref(slug: string | null, q: string) {
  const params = new URLSearchParams();
  if (slug) {
    params.set("category", slug);
  }
  if (q) {
    params.set("q", q);
  }
  const query = params.toString();
  return `/${query ? `?${query}` : ""}#deals`;
}

/** Category list: a sidebar list on desktop, wrapping chips on smaller screens. */
export function CategoryNav({ active, q, variant }: { active: string | null; q: string; variant: "sidebar" | "chips" }) {
  const db = useDb();
  const categories = useMemo(
    () => (db ? [...db.categories].sort((a, b) => a.sortOrder - b.sortOrder) : null),
    [db]
  );

  if (!categories) {
    return variant === "sidebar" ? <Skeleton className="h-80" /> : <Skeleton className="h-10" />;
  }

  const items = [{ slug: null, name: "All deals", icon: "sparkles" }, ...categories];

  if (variant === "chips") {
    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const selected = item.slug === active;
          return (
            <Link
              key={item.name}
              href={categoryHref(item.slug, q)}
              aria-current={selected ? "page" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                selected ? "border-brand-500 bg-brand-500 text-white shadow-sm shadow-brand-200" : "border-line bg-surface text-muted-strong hover:border-brand-300"
              }`}
            >
              <Icon name={item.icon} className="h-3.5 w-3.5" />
              {item.name}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {items.map((item) => {
        const selected = item.slug === active;
        return (
          <Link
            key={item.name}
            href={categoryHref(item.slug, q)}
            aria-current={selected ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              selected ? "bg-surface text-brand-600 shadow-sm" : "text-muted-strong hover:bg-surface/70 hover:text-ink"
            }`}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                selected ? "bg-brand-500 text-white" : "bg-surface-muted text-muted-strong"
              }`}
            >
              <Icon name={item.icon} className="h-4 w-4" />
            </span>
            {item.name}
          </Link>
        );
      })}
    </div>
  );
}

export function DealGrid({ q, category }: { q: string; category: string | null }) {
  const db = useDb();
  const result = useMemo(() => {
    if (!db) {
      return null;
    }
    const categoryRow = category ? db.categories.find((row) => row.slug === category) : undefined;
    const needle = q.trim().toLowerCase();
    const deals = marketplaceDeals(db).filter(
      (summary) =>
        (!category || summary.deal.categoryId === categoryRow?.id) &&
        (!needle ||
          summary.deal.title.toLowerCase().includes(needle) ||
          summary.deal.description.toLowerCase().includes(needle) ||
          summary.shopName.toLowerCase().includes(needle))
    );
    return { deals, categoryName: categoryRow?.name };
  }, [db, q, category]);

  const heading = result?.categoryName ?? (q ? `Results for “${q}”` : "Hot group deals");

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-500">
            <Icon name={q || category ? "search" : "flame"} className="h-4 w-4" />
            {q || category ? "Filtered" : "Trending now"}
          </p>
          <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">{heading}</h2>
        </div>
        {(q || category) && (
          <Link href="/#deals" className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-bold text-brand-500 hover:bg-brand-50">
            <Icon name="close" className="h-4 w-4" />
            Clear filters
          </Link>
        )}
      </div>

      {!result ? (
        <SkeletonCards />
      ) : result.deals.length === 0 ? (
        <EmptyState
          icon="search-x"
          title="No deals here yet"
          text={q ? "Try another search, or browse every live deal." : "New group deals appear here as soon as sellers launch them."}
          action={{ href: "/#deals", label: "See all deals" }}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {result.deals.map((summary) => (
            <DealCard key={summary.deal.id} summary={summary} />
          ))}
        </div>
      )}
    </>
  );
}
