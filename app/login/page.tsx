"use client";

import Link from "next/link";
import AuthFrame from "../components/AuthFrame";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import Icon from "../components/shell/Icon";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, login, ROLE_LABELS } from "../lib/store";

const ROLE_ICONS = { buyer: "user", seller: "store", admin: "shield" } as const;

// The main demo roles; extra shops and shoppers are in the dev panel's account switcher.
const LOGIN_DEMOS = DEMO_ACCOUNTS.filter((account) => account.note !== "Demo shopper" && !account.note.startsWith("Demo shop:"));

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";
  const [email, setEmail] = useState(LOGIN_DEMOS[0].email);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = login(email, password);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(nextPath);
  }

  function fillDemo(demoEmail: string) {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setError("");
  }

  return (
    <AuthFrame title="Welcome back" subtitle="Log in to keep browsing your group deals.">

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block text-sm font-bold">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 font-normal outline-none transition focus:border-brand-500"
              required
            />
          </label>

          <label className="block text-sm font-bold">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 font-normal outline-none transition focus:border-brand-500"
              required
            />
          </label>

          {error && <p className="text-sm font-semibold text-danger">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-xl bg-brand-500 py-3.5 font-bold text-white shadow-md shadow-brand-200 transition hover:bg-brand-600"
          >
            Log in
          </button>
        </form>

        <div className="mt-6 rounded-2xl bg-brand-50 p-4 text-sm">
          <p className="inline-flex items-center gap-1.5 font-bold text-brand-700">
            <Icon name="sparkles" className="h-4 w-4" />
            Demo accounts
          </p>
          <p className="mt-1 text-muted-strong">
            Password for all: <span className="font-bold">{DEMO_PASSWORD}</span>
          </p>
          <div className="mt-3 grid gap-2">
            {LOGIN_DEMOS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => fillDemo(account.email)}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
                  email === account.email
                    ? "border-brand-400 bg-surface"
                    : "border-transparent hover:bg-surface"
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface text-brand-500 shadow-sm">
                  <Icon name={ROLE_ICONS[account.role]} className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{account.email}</span>
                  <span className="block text-xs text-muted">{account.note}</span>
                </span>
                <span className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-xs font-bold text-muted-strong">
                  {ROLE_LABELS[account.role]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <p className="mt-7 text-center text-sm text-muted">
          New to GroupBuy?{" "}
          <Link href="/register" className="font-bold text-brand-500 hover:text-brand-600">
            Create an account
          </Link>
        </p>
    </AuthFrame>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-canvas">
          <p className="text-sm text-muted">Loading...</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
