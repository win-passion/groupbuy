"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type User = {
  name: string;
  email: string;
};

export default function AuthNav() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = window.localStorage.getItem("groupbuy_user");

    if (storedUser) {
      setUser(JSON.parse(storedUser) as User);
    }
  }, []);

  function logout() {
    window.localStorage.removeItem("groupbuy_user");
    setUser(null);
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
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-600">
        {user.name.charAt(0).toUpperCase()}
      </div>
      <span className="hidden text-sm md:block">Hi, {user.name}</span>
      <button type="button" onClick={logout} className="text-sm hover:text-orange-500">
        Log out
      </button>
    </div>
  );
}