"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useSessionUser } from "../hooks/use-session-user";
import { UserRole } from "../lib/user";

type RequireRoleProps = {
  role: UserRole;
  children: ReactNode;
};

export default function RequireRole({ role, children }: RequireRoleProps) {
  const router = useRouter();
  const user = useSessionUser();

  useEffect(() => {
    if (user === null) {
      router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [user, router]);

  if (user === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f8f8] text-slate-900">
        <p className="text-sm font-semibold text-gray-500">Loading...</p>
      </main>
    );
  }

  if (user.role !== role) {
    const isSellerArea = role === "seller";

    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f8f8] px-5 text-slate-900">
        <div className="w-full max-w-md rounded-[28px] bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-bold text-orange-500">ACCESS RESTRICTED</p>
          <h1 className="mt-2 text-2xl font-black">
            {isSellerArea ? "Seller account required" : "Buyer account required"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-500">
            {isSellerArea
              ? "This area is for sellers only. Register or log in with a seller account."
              : "My Groups is for buyers. Sellers manage deals in Seller Center."}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href={isSellerArea ? "/register" : "/seller"}
              className="rounded-xl bg-orange-500 py-3 text-sm font-bold text-white"
            >
              {isSellerArea ? "Create seller account" : "Go to Seller Center"}
            </Link>
            <Link href="/" className="text-sm font-bold text-gray-500 hover:text-orange-500">
              Back to home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
