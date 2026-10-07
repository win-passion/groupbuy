"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { notifySessionChange } from "../lib/user";

const demoUser = {
  name: "Demo User",
  email: "demo@groupbuy.test",
  password: "groupbuy123",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";
  const [email, setEmail] = useState(demoUser.email);
  const [password, setPassword] = useState(demoUser.password);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const registeredUser = window.localStorage.getItem("groupbuy_registered_user");
    const user = registeredUser ? JSON.parse(registeredUser) : demoUser;

    if (email !== user.email || password !== user.password) {
      setError("Those credentials do not match. Try the demo account below.");
      return;
    }

    window.localStorage.setItem(
      "groupbuy_user",
      JSON.stringify({ name: user.name, email: user.email, role: user.role ?? "buyer" })
    );
    notifySessionChange();
    router.push(nextPath);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f8f8] px-5 py-10 text-slate-900">
      <div className="w-full max-w-md rounded-[28px] bg-white p-8 shadow-sm sm:p-10">
        <Link href="/" className="text-2xl font-black tracking-tight">
          <span className="text-orange-500">Group</span>Buy
        </Link>

        <h1 className="mt-10 text-3xl font-black">Welcome back</h1>
        <p className="mt-2 text-gray-500">Log in to keep browsing your group deals.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block text-sm font-bold">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-orange-500"
              required
            />
          </label>

          <label className="block text-sm font-bold">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-orange-500"
              required
            />
          </label>

          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-xl bg-orange-500 py-3 font-bold text-white transition hover:bg-orange-600"
          >
            Log in
          </button>
        </form>

        <div className="mt-6 rounded-2xl bg-orange-50 p-4 text-sm">
          <p className="font-bold text-orange-700">Demo account</p>
          <p className="mt-1 text-gray-600">demo@groupbuy.test</p>
          <p className="text-gray-600">groupbuy123</p>
        </div>

        <p className="mt-7 text-center text-sm text-gray-500">
          New to GroupBuy?{" "}
          <Link href="/register" className="font-bold text-orange-500 hover:text-orange-600">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f8f8f8]">
          <p className="text-sm text-gray-500">Loading...</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}