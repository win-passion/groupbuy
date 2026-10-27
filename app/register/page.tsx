"use client";

import Link from "next/link";
import AuthFrame from "../components/AuthFrame";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { register } from "../lib/store";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = register({ role, name, email, password, shopName });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(role === "seller" ? "/seller" : "/");
  }

  return (
    <AuthFrame title="Create your account" subtitle="Join GroupBuy as a buyer or seller.">

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <fieldset>
            <legend className="text-sm font-bold">Account type</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl bg-surface-muted p-1.5">
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
                  <span className="block rounded-xl px-4 py-3 text-center text-sm font-bold text-muted-strong transition peer-checked:bg-brand-500 peer-checked:text-white peer-checked:shadow-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-500">
                    {accountRole === "buyer" ? "Buyer" : "Seller"}
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-sm text-muted">
              {role === "buyer"
                ? "Join group deals and unlock better prices."
                : "Sell through group deals. An admin reviews your shop before you can list deals."}
            </p>
          </fieldset>

          <label className="block text-sm font-bold">
            Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 font-normal outline-none transition focus:border-brand-500"
              required
            />
          </label>

          {role === "seller" && (
            <label className="block text-sm font-bold">
              Shop name
              <input
                value={shopName}
                onChange={(event) => setShopName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 font-normal outline-none transition focus:border-brand-500"
                required
              />
            </label>
          )}

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
              minLength={6}
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
            Create account
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-brand-500 hover:text-brand-600">
            Log in
          </Link>
        </p>
    </AuthFrame>
  );
}