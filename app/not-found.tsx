import Link from "next/link";
import Icon from "./components/shell/Icon";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-5 py-16 text-ink">
      <div className="w-full max-w-md text-center">
        <p className="text-8xl font-extrabold tracking-tight text-brand-500">
          4
          <span className="mx-1 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-400 to-brand-600 align-middle text-white shadow-lg shadow-brand-200 motion-safe:animate-float">
            <Icon name="bag" className="h-10 w-10" />
          </span>
          4
        </p>
        <h1 className="mt-6 text-3xl font-extrabold">This page isn&apos;t here</h1>
        <p className="mt-3 text-muted">The link may be old, or the deal may have ended. There are plenty of live deals to vote on.</p>
        <Link
          href="/#deals"
          className="mt-8 inline-block rounded-xl bg-brand-500 px-6 py-3 font-bold text-white shadow-lg shadow-brand-200 hover:bg-brand-600"
        >
          Browse group deals <Icon name="arrow-right" className="inline h-4 w-4 align-[-3px]" />
        </Link>
      </div>
    </main>
  );
}
