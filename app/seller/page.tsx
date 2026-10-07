"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import RequireRole from "../components/RequireRole";
import {
  getCurrentPrice,
  isDealActive,
  loadSellerDeals,
} from "../lib/seller-deals";

function SellerDashboard() {
  const [deals] = useState(() => loadSellerDeals());

  const stats = useMemo(() => {
    const activeDeals = deals.filter(isDealActive).length;
    const totalJoined = deals.reduce((sum, deal) => sum + deal.joined, 0);
    const totalOrders = deals.reduce((sum, deal) => sum + deal.orders, 0);

    return { activeDeals, totalJoined, totalOrders };
  }, [deals]);

  return (
    <main className="min-h-screen bg-[#f8f8f8] text-slate-900">
      <nav className="flex h-20 items-center border-b bg-white px-6 lg:px-10">
        <Link href="/" className="text-2xl font-black">
          <span className="text-orange-500">Group</span>Buy
        </Link>

        <span className="ml-4 hidden text-sm font-bold text-orange-500 sm:block">
          Seller Center
        </span>

        <Link
          href="/"
          className="ml-auto text-sm font-bold hover:text-orange-500"
        >
          Home
        </Link>
      </nav>

      <div className="mx-auto max-w-6xl px-5 py-10">
        <p className="text-sm font-bold text-orange-500">SELLER DASHBOARD</p>
        <h1 className="mt-1 text-4xl font-black">Your group deals</h1>
        <p className="mt-3 text-gray-500">
          Track active campaigns and how buyers are joining.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Active Deals</p>
            <p className="mt-2 text-3xl font-black text-orange-500">
              {stats.activeDeals}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Total Joined</p>
            <p className="mt-2 text-3xl font-black">{stats.totalJoined}</p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="mt-2 text-3xl font-black">{stats.totalOrders}</p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black">My Deals</h2>
          <Link
            href="/seller/create"
            className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white hover:bg-orange-600"
          >
            + Create Group Deal
          </Link>
        </div>

        <div className="mt-6 space-y-5">
          {deals.map((deal) => {
            const progress = Math.min((deal.joined / 50) * 100, 100);
            const currentPrice = getCurrentPrice(deal);

            return (
              <div
                key={deal.id}
                className="rounded-[28px] bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        isDealActive(deal)
                          ? "bg-green-50 text-green-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {isDealActive(deal) ? "● Active" : "Ended"}
                    </span>
                    <h3 className="mt-3 text-xl font-black">{deal.name}</h3>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                      {deal.description}
                    </p>
                    <p className="mt-3 text-2xl font-black text-orange-500">
                      ฿{currentPrice.toLocaleString()}
                    </p>
                  </div>

                  <div className="w-full md:max-w-xs">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>
                        👥 {deal.joined}/50 joined
                      </span>
                      <span>Ends {deal.endDate}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-orange-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

export default function SellerPage() {
  return (
    <RequireRole role="seller">
      <SellerDashboard />
    </RequireRole>
  );
}
