"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { notifySessionChange } from "../lib/user";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const user = { name, email, password, role };
    window.localStorage.setItem("groupbuy_registered_user", JSON.stringify(user));
    window.localStorage.setItem(
      "groupbuy_user",
      JSON.stringify({ name: user.name, email: user.email, role: user.role })
    );
    notifySessionChange();
    router.push(role === "seller" ? "/seller" : "/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f8f8] px-5 py-10 text-slate-900">
      <div className="w-full max-w-md rounded-[28px] bg-white p-8 shadow-sm sm:p-10">
        <Link href="/" className="text-2xl font-black tracking-tight">
          <span className="text-orange-500">Group</span>Buy
        </Link>

        <h1 className="mt-10 text-3xl font-black">Create your account</h1>
        <p className="mt-2 text-gray-500">Join GroupBuy as a buyer or seller.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <fieldset>
            <legend className="text-sm font-bold">Account type</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1.5">
              {(["buyer", "seller"] as const).map((accountRole) => (
                <label key={accountRole} className="cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value={accountRole}
                    checked={role === accountRole}
                    onChange={() => setRole(accountRole)}
                    className="peer sr-only"
                  />
                  <span className="block rounded-xl px-4 py-3 text-center text-sm font-bold text-gray-600 transition peer-checked:bg-orange-500 peer-checked:text-white peer-checked:shadow-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-orange-500">
                    {accountRole === "buyer" ? "Buyer" : "Seller"}
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {role === "buyer"
                ? "Join group deals and unlock better prices."
                : "Sell your products through group deals."}
            </p>
          </fieldset>

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