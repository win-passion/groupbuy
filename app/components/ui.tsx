import Link from "next/link";
import { ReactNode } from "react";
import Icon, { IconName } from "./shell/Icon";

/** Grey placeholder block shown while data loads. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-2xl bg-surface-muted motion-reduce:animate-none ${className}`} />;
}

export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="rounded-3xl border border-line bg-surface p-5">
          <Skeleton className="h-40" />
          <Skeleton className="mt-5 h-4 w-1/3" />
          <Skeleton className="mt-2 h-5 w-2/3" />
          <Skeleton className="mt-4 h-7 w-1/2" />
          <Skeleton className="mt-5 h-2" />
          <Skeleton className="mt-5 h-11 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

/** Friendly empty state with an illustrated icon badge. */
export function EmptyState({
  icon,
  title,
  text,
  action,
  celebrate = false,
}: {
  icon: IconName;
  title: string;
  text: string;
  action?: { href: string; label: string };
  /** Bouncy entrance for success states instead of the idle float */
  celebrate?: boolean;
}) {
  return (
    <div className="rounded-sheet border border-dashed border-line bg-surface px-6 py-12 text-center motion-safe:animate-rise">
      <div className="relative mx-auto flex h-24 w-24 items-center justify-center" aria-hidden="true">
        <span className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-hero-from via-hero-via to-hero-to rotate-6" />
        <span className="absolute -right-2 top-1 h-4 w-4 rounded-full bg-brand-200" />
        <span className="absolute -left-3 bottom-4 h-2.5 w-2.5 rounded-full bg-brand-300/70" />
        <span
          className={`relative flex h-16 w-16 items-center justify-center rounded-2xl bg-surface text-brand-500 shadow-md ${
            celebrate ? "motion-safe:animate-celebrate" : "motion-safe:animate-float"
          }`}
        >
          <Icon name={icon} className="h-8 w-8" strokeWidth={1.75} />
        </span>
      </div>
      <h3 className="mt-6 text-lg font-extrabold">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">{text}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white shadow-md shadow-brand-200 transition hover:bg-brand-600"
        >
          {action.label}
          <Icon name="arrow-right" className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

const STATUS_STYLES = {
  success: "bg-success-50 text-success-600",
  brand: "bg-brand-50 text-brand-600",
  muted: "bg-surface-muted text-muted",
  danger: "bg-surface-muted text-danger",
} as const;

const DOT_STYLES = {
  success: "bg-success-600",
  brand: "bg-brand-500",
  muted: "bg-subtle",
  danger: "bg-danger",
} as const;

export function StatusPill({
  tone,
  children,
}: {
  tone: keyof typeof STATUS_STYLES;
  children: ReactNode;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLES[tone]}`}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${DOT_STYLES[tone]}`} />
      {children}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  text,
  children,
}: {
  eyebrow: string;
  title: string;
  text?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-bold text-brand-500">{eyebrow}</p>
        <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">{title}</h1>
        {text && <p className="mt-3 text-muted">{text}</p>}
      </div>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: ReactNode;
  tone?: "brand" | "success";
  icon?: IconName;
}) {
  const color = tone === "brand" ? "text-brand-500" : tone === "success" ? "text-success-600" : "";
  const iconColor =
    tone === "brand" ? "bg-brand-50 text-brand-500" : tone === "success" ? "bg-success-50 text-success-600" : "bg-surface-muted text-muted-strong";
  return (
    <div className="rounded-2xl bg-surface p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted">{label}</p>
        {icon && (
          <span className={`hidden h-8 w-8 items-center justify-center rounded-xl sm:flex ${iconColor}`}>
            <Icon name={icon} className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className={`mt-2 text-2xl font-extrabold tracking-tight tabular-nums sm:text-3xl ${color}`}>{value}</p>
    </div>
  );
}

/** "Back to ..." link at the top of detail pages. */
export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 rounded-lg py-1 pr-2 text-sm font-semibold text-muted transition hover:text-brand-600"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface shadow-sm motion-safe:transition-transform group-hover:-translate-x-0.5">
        <Icon name="arrow-left" className="h-4 w-4" />
      </span>
      {children}
    </Link>
  );
}
