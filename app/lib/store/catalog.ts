import { act } from "./act";
import { auth } from "./auth-guard";
import { mutate, newId, requireDb } from "./db";
import { ActionResult, fail } from "./errors";
import { Category } from "./types";

/** Admin category management. Deals keep their category id, so renaming is safe. */

export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function checkName(categories: readonly Category[], name: string, icon: string, exceptId?: string) {
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 30) {
    fail("Use a category name of 2–30 characters.");
  }
  if (!icon.trim()) {
    fail("Pick an icon.");
  }
  const slug = slugify(trimmed);
  if (!slug) {
    fail("Use letters or numbers in the name.");
  }
  if (categories.some((category) => category.id !== exceptId && category.slug === slug)) {
    fail("A category with this name already exists.");
  }
  return { name: trimmed, slug, icon: icon.trim() };
}

export function addCategory(name: string, icon: string): ActionResult<string> {
  return act(() => {
    const db = requireDb();
    auth(db).admin();
    const fields = checkName(db.categories, name, icon);
    const id = newId("cat");
    const sortOrder = Math.max(-1, ...db.categories.map((category) => category.sortOrder)) + 1;
    mutate((tx) => {
      tx.insert("categories", { id, ...fields, sortOrder });
    });
    return id;
  });
}

export function updateCategory(categoryId: string, name: string, icon: string): ActionResult {
  return act(() => {
    const db = requireDb();
    auth(db).admin();
    if (!db.categories.some((category) => category.id === categoryId)) {
      fail("Category not found.");
    }
    const fields = checkName(db.categories, name, icon, categoryId);
    mutate((tx) => {
      tx.update("categories", categoryId, fields);
    });
    return undefined;
  });
}

/** Swaps a category with its neighbour in the list. */
export function moveCategory(categoryId: string, direction: -1 | 1): ActionResult {
  return act(() => {
    const db = requireDb();
    auth(db).admin();
    const sorted = [...db.categories].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = sorted.findIndex((category) => category.id === categoryId);
    const other = sorted[index + direction];
    if (index === -1 || !other) {
      return undefined;
    }
    mutate((tx) => {
      sorted.forEach((category, position) => {
        const order = position === index ? index + direction : position === index + direction ? index : position;
        if (category.sortOrder !== order) {
          tx.update("categories", category.id, { sortOrder: order });
        }
      });
    });
    return undefined;
  });
}

export function deleteCategory(categoryId: string): ActionResult {
  return act(() => {
    const db = requireDb();
    auth(db).admin();
    const count = db.deals.filter((deal) => deal.categoryId === categoryId).length;
    if (count > 0) {
      fail(`${count} ${count === 1 ? "deal uses" : "deals use"} this category. Move them first.`);
    }
    mutate((tx) => {
      tx.remove("categories", categoryId);
    });
    return undefined;
  });
}
