"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const user = { name, email, password };
    window.localStorage.setItem("groupbuy_registered_user", JSON.stringify(user));
    window.localStorage.setItem(
      "groupbuy_user",
      JSON.stringify({ name: user.name, email: user.email })
    );
    router.push("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f8f8] px-5 py-10 text-slate-900">
      <div className="w-full max-w-md rounded-[28px] bg-white p-8 shadow-sm sm:p-10">
        <Link href="/" className="text-2xl font-black tracking-tight">
          <span className="text-orange-500">Group</span>Buy
        </Link>

        <h1 className="mt-10 text-3xl font-black">Create your account</h1>
        <p className="mt-2 text-gray-500">Join groups and unlock better prices together.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block text-sm font-bold">
            Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-orange-500"
              required
            />
          </label>

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
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-orange-500"
              required
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-orange-500 py-3 font-bold text-white transition hover:bg-orange-600"
          >
            Create account
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-orange-500 hover:text-orange-600">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}