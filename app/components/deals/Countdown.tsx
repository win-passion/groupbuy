"use client";

import { DAY, HOUR, useNow } from "../../lib/store";
import Icon from "../shell/Icon";

export function formatRemaining(ms: number) {
  if (ms <= 0) {
    return "Ended";
  }
  const days = Math.floor(ms / DAY);
  const hours = Math.floor((ms % DAY) / HOUR);
  const minutes = Math.floor((ms % HOUR) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

/** Live time left until `until`. Turns brand-coloured in the last 24 hours. */
export default function Countdown({
  until,
  prefix = "",
  icon = false,
  className = "",
}: {
  until: string;
  prefix?: string;
  /** Show a clock icon before the time */
  icon?: boolean;
  className?: string;
}) {
  const at = useNow(1000);

  if (at === null) {
    return <span className={`inline-block h-4 w-14 animate-pulse rounded bg-surface-muted ${className}`} />;
  }

  const remaining = Date.parse(until) - at;
  const urgent = remaining > 0 && remaining < DAY;

  return (
    <span
      className={`inline-flex items-center gap-1 tabular-nums ${urgent ? "font-bold text-brand-600" : ""} ${className}`}
      title={new Date(until).toLocaleString("en-GB", { timeZone: "Asia/Bangkok" })}
    >
      {icon && <Icon name="clock" className="h-3.5 w-3.5 shrink-0" />}
      {remaining > 0 ? `${prefix}${formatRemaining(remaining)}` : "Ended"}
    </span>
  );
}
