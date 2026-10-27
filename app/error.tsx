"use client";

import Link from "next/link";
import { useEffect } from "react";
import Icon from "./components/shell/Icon";

/** Fallback for unexpected errors anywhere in the app. */
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-canvas px-5 py-16 text-ink">
      <div className="w-full max-w-md rounded-sheet bg-surface p-8 text-center shadow-sm">
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center" aria-hidden="true">
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-hero-from via-hero-via to-hero-to" />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-surface text-brand-500 shadow-md motion-safe:animate-float">
            <Icon name="help" className="h-8 w-8" strokeWidth={1.75} />
          </span>
        </div>
        <h1 className="mt-6 text-2xl font-extrabold">Something went wrong</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          This page hit an unexpected problem. Try again, or head back to the deals. If it keeps happening, the dev panel&apos;s
          &ldquo;Reset demo data&rdquo; restores a clean state.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={() => retry()} className="rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-600">
            Try again
          </button>
          <Link href="/" className="rounded-xl border border-line px-5 py-3 text-sm font-bold hover:border-brand-400">
            Back to deals
          </Link>
        </div>
      </div>
    </main>
  );
}
