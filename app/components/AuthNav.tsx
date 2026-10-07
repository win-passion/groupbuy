"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSessionUser } from "../hooks/use-session-user";
import { clearSessionUser } from "../lib/user";

export default function AuthNav() {
  const router = useRouter();
  const user = useSessionUser();

  function logout() {
    clearSessionUser();
    router.push("/");
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/login" className="hover:text-orange-500">
          Log in
        </Link>
        <Link
          href="/register"
          className="rounded-xl bg-slate-900 px-4 py-2 text-white transition hover:bg-orange-500"
        >
          Register
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {user.role === "seller" ? (
        <Link href="/seller" className="hidden text-sm font-bold hover:text-orange-500 md:block">
          Seller Center
        </Link>
      ) : (
        <Link href="/my-groups" className="hidden text-sm font-bold hover:text-orange-500 md:block">
          My Groups
        </Link>
      )}
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-600">
        {user.name.charAt(0).toUpperCase()}
      </div>
      <span className="hidden text-sm md:block">
        Hi, {user.name}
        <span className="text-gray-400"> · {user.role === "seller" ? "Seller" : "Buyer"}</span>
      </span>
      <button type="button" onClick={logout} className="text-sm hover:text-orange-500">
        Log out
      </button>
    </div>
  );
}
