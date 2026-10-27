import { useMemo, useSyncExternalStore } from "react";
import { sessionUserFor, SessionUser } from "./auth";
import { now } from "./clock";
import { Db, getDb, readSessionAccountId, subscribe } from "./db";

function getServerDb() {
  return null;
}

function getSessionId() {
  return readSessionAccountId();
}

function getServerSessionId() {
  return undefined;
}

/**
 * The whole database; null until the page has loaded in the browser.
 * The object only changes when data changes, so derive values with
 * useMemo(() => db && unitsVoted(db, id), [db, id]).
 */
export function useDb(): Db | null {
  return useSyncExternalStore(subscribe, getDb, getServerDb);
}

/**
 * The signed-in user: undefined while loading, null when signed out.
 * Check for undefined before redirecting to the login page.
 */
export function useSessionUser(): SessionUser | null | undefined {
  const db = useDb();
  const sessionId = useSyncExternalStore(subscribe, getSessionId, getServerSessionId);
  return useMemo(() => {
    if (!db || sessionId === undefined) {
      return undefined;
    }
    return sessionUserFor(db, sessionId);
  }, [db, sessionId]);
}

function subscribeTicker(intervalMs: number) {
  return (onTick: () => void) => {
    const timer = window.setInterval(onTick, intervalMs);
    const unsubscribe = subscribe(onTick);
    return () => {
      window.clearInterval(timer);
      unsubscribe();
    };
  };
}

const tickers = new Map<number, (onTick: () => void) => () => void>();

/**
 * The store's clock, re-rendering every `intervalMs` (and when the dev panel
 * moves the clock). Rounded to the interval so snapshots stay stable.
 * Null until the page has loaded in the browser.
 */
export function useNow(intervalMs = 1000): number | null {
  if (!tickers.has(intervalMs)) {
    tickers.set(intervalMs, subscribeTicker(intervalMs));
  }
  return useSyncExternalStore(
    tickers.get(intervalMs)!,
    () => Math.floor(now() / intervalMs) * intervalMs,
    () => null
  );
}
