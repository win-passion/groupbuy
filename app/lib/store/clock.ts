import { readClockOffset, writeClockOffset } from "./db";

/**
 * The app's single source of "now". The dev panel can move it forward so
 * deadlines can be tested without waiting. Always use these helpers instead of
 * Date.now() or new Date() for anything deal-related.
 */
export function now(): number {
  return Date.now() + readClockOffset();
}

export function nowIso(): string {
  return new Date(now()).toISOString();
}

export function clockOffset(): number {
  return readClockOffset();
}

export function shiftClock(ms: number) {
  writeClockOffset(readClockOffset() + ms);
}

export function resetClock() {
  writeClockOffset(0);
}

export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;

export const TIME_ZONE = "Asia/Bangkok";

export function formatDateTime(iso: string | number) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** "just now", "5m ago", "3h ago", "2d ago", then a date. */
export function formatRelative(iso: string | number, at = now()) {
  const diff = at - new Date(iso).getTime();
  if (diff < 60_000) {
    return "just now";
  }
  if (diff < HOUR) {
    return `${Math.floor(diff / 60_000)}m ago`;
  }
  if (diff < DAY) {
    return `${Math.floor(diff / HOUR)}h ago`;
  }
  if (diff < 7 * DAY) {
    return `${Math.floor(diff / DAY)}d ago`;
  }
  return formatDate(iso);
}

export function formatDate(iso: string | number) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}
