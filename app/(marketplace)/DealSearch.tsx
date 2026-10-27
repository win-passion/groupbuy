"use client";

import Form from "next/form";
import Icon from "../components/shell/Icon";

/**
 * Standard shop search bar at the top of the deals list: a full-width box
 * with a magnifier and an attached Search button. Submits to ?q=…, keeping
 * the selected category.
 */
export default function DealSearch({ query, category }: { query: string; category: string | null }) {
  return (
    <Form action="/" role="search" className="flex h-12 items-stretch">
      {category && <input type="hidden" name="category" value={category} />}
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">Search deals</span>
        <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-subtle" />
        <input
          // Remount when the URL query changes so the box shows the active search.
          key={query}
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Search for products or shops"
          className="h-full w-full rounded-l-xl border border-r-0 border-line bg-surface pl-12 pr-4 text-sm outline-none transition placeholder:text-subtle focus:border-brand-500 sm:text-base"
        />
      </label>
      <button
        type="submit"
        className="inline-flex shrink-0 items-center gap-2 rounded-r-xl bg-brand-500 px-4 text-sm font-bold text-white transition hover:bg-brand-600 sm:px-7"
      >
        <Icon name="search" className="h-5 w-5 sm:hidden" />
        <span className="hidden sm:inline">Search</span>
      </button>
    </Form>
  );
}
