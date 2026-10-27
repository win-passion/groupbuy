import { Row, TableName, Tables } from "./types";

/**
 * Low-level localStorage database. Each table is one key holding a JSON array.
 * Only files inside app/lib/store/ may import this module.
 */

const PREFIX = "groupbuy_";
const SCHEMA_VERSION = 9;
const VERSION_KEY = `${PREFIX}schema_version`;
/** Bumped on every write, so any tab can tell its cache is stale. */
const REV_KEY = `${PREFIX}rev`;
const CLOCK_KEY = `${PREFIX}clock_offset_ms`;
const CHANGE_EVENT = "groupbuy-store-change";

export const TABLE_NAMES: TableName[] = [
  "accounts",
  "profiles",
  "sellerProfiles",
  "addresses",
  "categories",
  "deals",
  "dealImages",
  "dealTiers",
  "votes",
  "orders",
  "payments",
  "payouts",
  "noShowEvents",
  "disputes",
  "notifications",
  "settings",
];

export type Db = Readonly<Tables> & { rev: string };

function tableKey(table: TableName) {
  return `${PREFIX}${table}`;
}

function emptyTables(): Tables {
  return Object.fromEntries(TABLE_NAMES.map((name) => [name, []])) as unknown as Tables;
}

function readTable(table: TableName): unknown[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(tableKey(table)) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readRev() {
  return window.localStorage.getItem(REV_KEY) ?? "0";
}

function writeRev() {
  const rev = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  window.localStorage.setItem(REV_KEY, rev);
  return rev;
}

let seeder: (() => Tables) | null = null;

/** Registered by seed.ts; runs when the stored schema is missing or outdated. */
export function registerSeeder(fn: () => Tables) {
  seeder = fn;
}

/** Wipes every groupbuy_* key (including the old prototype keys) and reseeds. */
export function resetDatabase() {
  for (const key of Object.keys(window.localStorage)) {
    if (key.startsWith(PREFIX) && key !== CLOCK_KEY) {
      window.localStorage.removeItem(key);
    }
  }
  const tables = seeder ? seeder() : emptyTables();
  for (const name of TABLE_NAMES) {
    window.localStorage.setItem(tableKey(name), JSON.stringify(tables[name]));
  }
  window.localStorage.setItem(VERSION_KEY, String(SCHEMA_VERSION));
  writeRev();
  cache = null;
}

function ensureSchema() {
  if (window.localStorage.getItem(VERSION_KEY) !== String(SCHEMA_VERSION)) {
    resetDatabase();
  }
}

let cache: Db | null = null;

/**
 * Current snapshot of every table. Returns the same object until something
 * writes, so it is safe as a useSyncExternalStore snapshot. Null on the server.
 */
export function getDb(): Db | null {
  if (typeof window === "undefined") {
    return null;
  }
  ensureSchema();
  const rev = readRev();
  if (cache?.rev === rev) {
    return cache;
  }
  const tables = Object.fromEntries(
    TABLE_NAMES.map((name) => [name, readTable(name)])
  ) as unknown as Tables;
  cache = { ...tables, rev };
  return cache;
}

export function requireDb(): Db {
  const db = getDb();
  if (!db) {
    throw new Error("The GroupBuy store is only available in the browser.");
  }
  return db;
}

/** Mutable view of the database inside a mutate() call. */
export type Tx = {
  all<T extends TableName>(table: T): readonly Row<T>[];
  find<T extends TableName>(table: T, id: string): Row<T> | undefined;
  insert<T extends TableName>(table: T, row: Row<T>): Row<T>;
  update<T extends TableName>(table: T, id: string, patch: Partial<Row<T>>): Row<T>;
  remove<T extends TableName>(table: T, id: string): void;
};

/**
 * Runs `fn` against fresh data and writes only the tables it changed, then
 * notifies every subscriber in this tab (other tabs get the storage event).
 * If `fn` throws, nothing is written.
 */
export function mutate<R>(fn: (tx: Tx) => R): R {
  const base = requireDb();
  const changed = new Map<TableName, unknown[]>();

  function rows<T extends TableName>(table: T): Row<T>[] {
    return (changed.get(table) ?? base[table]) as Row<T>[];
  }

  function writable<T extends TableName>(table: T): Row<T>[] {
    if (!changed.has(table)) {
      changed.set(table, [...base[table]]);
    }
    return changed.get(table) as Row<T>[];
  }

  const tx: Tx = {
    all: (table) => rows(table),
    find: (table, id) => rows(table).find((row) => row.id === id),
    insert(table, row) {
      const list = writable(table);
      if (list.some((existing) => existing.id === row.id)) {
        throw new Error(`Duplicate id ${row.id} in ${table}`);
      }
      list.push(row);
      return row;
    },
    update(table, id, patch) {
      const list = writable(table);
      const index = list.findIndex((row) => row.id === id);
      if (index === -1) {
        throw new Error(`No row ${id} in ${table}`);
      }
      const next = { ...list[index], ...patch, id };
      list[index] = next;
      return next;
    },
    remove(table, id) {
      const list = writable(table);
      const index = list.findIndex((row) => row.id === id);
      if (index !== -1) {
        list.splice(index, 1);
      }
    },
  };

  const result = fn(tx);

  if (changed.size > 0) {
    for (const [table, list] of changed) {
      window.localStorage.setItem(tableKey(table), JSON.stringify(list));
    }
    writeRev();
    notify();
  }
  return result;
}

export function notify() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribe(onChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === null || event.key.startsWith(PREFIX)) {
      onChange();
    }
  }
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function newId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `${prefix}_${random}`;
}

// Session and clock are small values, not tables, but live here so that only
// this module touches localStorage.

const SESSION_KEY = `${PREFIX}session`;

export function readSessionAccountId(): string | null {
  return window.localStorage.getItem(SESSION_KEY);
}

export function writeSessionAccountId(accountId: string | null) {
  if (accountId) {
    window.localStorage.setItem(SESSION_KEY, accountId);
  } else {
    window.localStorage.removeItem(SESSION_KEY);
  }
  notify();
}

export function readClockOffset(): number {
  if (typeof window === "undefined") {
    return 0;
  }
  const value = Number(window.localStorage.getItem(CLOCK_KEY));
  return Number.isFinite(value) ? value : 0;
}

export function writeClockOffset(offsetMs: number) {
  window.localStorage.setItem(CLOCK_KEY, String(offsetMs));
  writeRev();
  notify();
}
