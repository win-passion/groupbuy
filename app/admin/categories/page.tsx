"use client";

import { FormEvent, useMemo, useState } from "react";
import Icon, { CATEGORY_ICONS, IconName } from "../../components/shell/Icon";
import { PageHeader, Skeleton } from "../../components/ui";
import { ActionResult, addCategory, Category, deleteCategory, moveCategory, updateCategory, useDb } from "../../lib/store";

const inputClass = "rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500";

/** Grid of the curated category icons. */
function IconPicker({ value, onChange }: { value: string; onChange: (icon: IconName) => void }) {
  return (
    <div role="radiogroup" aria-label="Icon" className="grid grid-cols-10 gap-1.5">
      {CATEGORY_ICONS.map((name) => {
        const selected = value === name;
        return (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={name}
            title={name}
            onClick={() => onChange(name)}
            className={`flex aspect-square items-center justify-center rounded-xl border transition ${
              selected ? "border-brand-500 bg-brand-500 text-white shadow-sm shadow-brand-200" : "border-line text-muted-strong hover:border-brand-300 hover:text-brand-600"
            }`}
          >
            <Icon name={name} className="h-[18px] w-[18px]" />
          </button>
        );
      })}
    </div>
  );
}

function CategoryRow({
  category,
  deals,
  first,
  last,
  onResult,
}: {
  category: Category;
  deals: number;
  first: boolean;
  last: boolean;
  onResult: (result: ActionResult) => boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [icon, setIcon] = useState(category.icon);

  function save() {
    if (onResult(updateCategory(category.id, name, icon))) {
      setEditing(false);
    }
  }

  function remove() {
    if (window.confirm(`Delete "${category.name}"?`)) {
      onResult(deleteCategory(category.id));
    }
  }

  const small =
    "inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-lg px-2 text-xs font-bold text-muted transition hover:bg-surface-subtle hover:text-ink disabled:opacity-30";

  if (editing) {
    return (
      <li className="space-y-3 bg-surface-subtle px-5 py-4">
        <input value={name} onChange={(event) => setName(event.target.value)} aria-label="Name" className={`${inputClass} w-full bg-surface`} />
        <IconPicker value={icon} onChange={setIcon} />
        <div className="flex gap-2">
          <button type="button" onClick={save} className="rounded-xl bg-ink px-4 py-2 text-xs font-bold text-white hover:bg-brand-500">
            Save
          </button>
          <button type="button" onClick={() => setEditing(false)} className={small}>
            Cancel
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center gap-3 px-5 py-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
        <Icon name={category.icon} className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{category.name}</span>
        <span className="block text-xs text-muted">
          /{category.slug} · {deals} {deals === 1 ? "deal" : "deals"}
        </span>
      </span>
      <div className="flex items-center gap-0.5">
        <button type="button" onClick={() => onResult(moveCategory(category.id, -1))} disabled={first} aria-label={`Move ${category.name} up`} className={small}>
          <Icon name="chevron-right" className="h-4 w-4 -rotate-90" />
        </button>
        <button type="button" onClick={() => onResult(moveCategory(category.id, 1))} disabled={last} aria-label={`Move ${category.name} down`} className={small}>
          <Icon name="chevron-right" className="h-4 w-4 rotate-90" />
        </button>
        <button type="button" onClick={() => setEditing(true)} aria-label={`Edit ${category.name}`} className={small}>
          <Icon name="pencil" className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={deals > 0}
          aria-label={`Delete ${category.name}`}
          title={deals > 0 ? "Move its deals to another category first" : "Delete"}
          className={`${small} hover:text-danger`}
        >
          <Icon name="close" className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

export default function AdminCategoriesPage() {
  const db = useDb();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<IconName>("tag");
  const [error, setError] = useState("");

  const categories = useMemo(() => {
    if (!db) {
      return null;
    }
    return [...db.categories]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((category) => ({ category, deals: db.deals.filter((deal) => deal.categoryId === category.id).length }));
  }, [db]);

  function handle(result: ActionResult<unknown>) {
    setError(result.ok ? "" : result.error);
    return result.ok;
  }

  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (handle(addCategory(name, icon))) {
      setName("");
      setIcon("tag");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 lg:py-10">
      <PageHeader eyebrow="ADMIN" title="Categories" text="The order here is the order buyers see on the home page." />

      <form onSubmit={add} className="mt-8 space-y-4 rounded-sheet bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm shadow-brand-200" aria-hidden="true">
            <Icon name={icon} className="h-5 w-5" />
          </span>
          <label className="min-w-0 flex-1 text-xs font-bold text-muted-strong">
            New category
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Toys & Kids" className={`${inputClass} mt-1 block w-full`} />
          </label>
          <button type="submit" className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600">
            <Icon name="plus" className="h-4 w-4" />
            Add
          </button>
        </div>
        <IconPicker value={icon} onChange={setIcon} />
      </form>
      {error && <p role="alert" className="mt-3 text-sm font-semibold text-danger">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-sheet bg-surface shadow-sm">
        {!categories ? (
          <Skeleton className="h-80" />
        ) : (
          <ul className="divide-y divide-line">
            {categories.map(({ category, deals }, index) => (
              <CategoryRow
                key={`${category.id}-${category.name}-${category.icon}`}
                category={category}
                deals={deals}
                first={index === 0}
                last={index === categories.length - 1}
                onResult={handle}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
