"use client";

import { useState } from "react";
import Link from "next/link";

export default function ProductPage() {
  const [joined, setJoined] = useState(19);
  const [hasJoined, setHasJoined] = useState(false);

  const price = joined >= 50 ? 390 : joined >= 20 ? 450 : 500;
  const progress = Math.min((joined / 50) * 100, 100);

  const joinGroup = () => {
    if (!hasJoined && joined < 50) {
      setJoined((value) => value + 1);
      setHasJoined(true);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f8f8] text-slate-900">
      <nav className="flex h-20 items-center border-b bg-white px-6 lg:px-10">
        <Link href="/" className="text-2xl font-black">
          <span className="text-orange-500">Group</span>Buy
        </Link>

        <Link
          href="/my-groups"
          className="ml-auto text-sm font-bold hover:text-orange-500"
        >
          My Groups
        </Link>
      </nav>

      <div className="mx-auto max-w-6xl px-5 py-10">
        <Link href="/" className="text-sm font-semibold text-gray-500">
          ← Back to deals
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          {/* IMAGE */}
          <div className="flex min-h-[520px] items-center justify-center overflow-hidden rounded-[32px] bg-white shadow-sm">
            <img
              src="/assets/earphone.jpeg"
              alt="Wireless Earbuds Pro"
              className="h-full max-h-[520px] w-full object-contain p-8"
            />
          </div>

          {/* INFO */}
          <div className="rounded-[32px] bg-white p-7 shadow-sm lg:p-9">
            <span className="rounded-full bg-orange-50 px-4 py-2 text-xs font-bold text-orange-600">
              🔥 ACTIVE GROUP DEAL
            </span>

            <h1 className="mt-6 text-4xl font-black tracking-tight">
              Wireless Earbuds Pro
            </h1>

            <p className="mt-3 leading-7 text-gray-500">
              Premium wireless earbuds with active noise cancellation,
              long-lasting battery and fast charging.
            </p>

            {/* PRICE */}
            <div className="mt-8 rounded-2xl bg-orange-50 p-5">
              <p className="text-sm font-semibold text-gray-500">
                Your current group price
              </p>

              <div className="mt-1 flex items-center gap-3">
                <span className="text-5xl font-black text-orange-500">
                  ฿{price}
                </span>

                <span className="text-lg text-gray-400 line-through">
                  ฿500
                </span>
              </div>

              {joined < 20 && (
                <p className="mt-3 text-sm font-bold text-orange-600">
                  Just {20 - joined} more buyer to unlock ฿450!
                </p>
              )}

              {joined >= 20 && joined < 50 && (
                <p className="mt-3 text-sm font-bold text-orange-600">
                  🎉 ฿450 unlocked! {50 - joined} more buyers to unlock ฿390.
                </p>
              )}

              {joined >= 50 && (
                <p className="mt-3 text-sm font-bold text-green-600">
                  🎉 Best group price unlocked!
                </p>
              )}
            </div>

            {/* TIERS */}
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Group Price Tiers</h2>
                <span className="text-xs text-gray-400">
                  More buyers = lower price
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-2xl border p-4">
                  <div>
                    <p className="font-bold">1+ buyer</p>
                    <p className="text-xs text-gray-400">Starting price</p>
                  </div>
                  <span className="font-black">฿500 ✓</span>
                </div>

                <div
                  className={`flex items-center justify-between rounded-2xl border p-4 ${
                    joined >= 20
                      ? "border-orange-300 bg-orange-50"
                      : ""
                  }`}
                >
                  <div>
                    <p className="font-bold">20+ buyers</p>
                    <p className="text-xs text-gray-400">Group price</p>
                  </div>

                  <span className="font-black text-orange-500">
                    ฿450 {joined >= 20 ? "✓" : "🔒"}
                  </span>
                </div>

                <div
                  className={`flex items-center justify-between rounded-2xl border p-4 ${
                    joined >= 50
                      ? "border-green-300 bg-green-50"
                      : ""
                  }`}
                >
                  <div>
                    <p className="font-bold">50 buyers</p>
                    <p className="text-xs text-gray-400">Best price</p>
                  </div>

                  <span className="font-black text-green-600">
                    ฿390 {joined >= 50 ? "✓" : "🔒"}
                  </span>
                </div>
              </div>
            </div>

            {/* PROGRESS */}
            <div className="mt-8">
              <div className="flex justify-between text-sm">
                <span className="font-bold">
                  👥 {joined}/50 people joined
                </span>
                <span className="text-gray-400">Ends in 2 days</span>
              </div>

              <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-orange-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* BUTTON */}
            {!hasJoined ? (
              <button
                onClick={joinGroup}
                className="mt-8 w-full rounded-2xl bg-orange-500 py-4 text-lg font-black text-white shadow-lg shadow-orange-100 transition hover:bg-orange-600"
              >
                Join This Group →
              </button>
            ) : (
              <Link
                href="/checkout"
                className="mt-8 block w-full rounded-2xl bg-slate-900 py-4 text-center text-lg font-black text-white"
              >
                Continue to Checkout →
              </Link>
            )}

            <p className="mt-4 text-center text-xs text-gray-400">
              You pay the final unlocked group price when the campaign ends.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}