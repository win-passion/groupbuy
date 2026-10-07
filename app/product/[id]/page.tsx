"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

const products = [
  {
    id: "0",
    name: "Wireless Earbuds Pro",
    image: "/assets/earphone.jpeg",
    description:
      "Premium wireless earbuds with active noise cancellation and long-lasting battery.",
    normalPrice: 500,
    groupPrice: 450,
    bestPrice: 390,
    target: 50,
  },
  {
    id: "1",
    name: "Smart Watch Series 5",
    image: "/assets/watch.jpeg",
    description:
      "Smart watch for fitness tracking, notifications and everyday activities.",
    normalPrice: 1990,
    groupPrice: 1690,
    bestPrice: 1490,
    target: 50,
  },
  {
    id: "2",
    name: "Coffee Maker",
    image: "/assets/Boncafe-Drip-Coffee-Maker-1.jpg",
    description:
      "Easy-to-use coffee maker for fresh coffee at home every morning.",
    normalPrice: 1290,
    groupPrice: 1090,
    bestPrice: 890,
    target: 40,
  },
  {
    id: "3",
    name: "Skincare Set",
    image: "/assets/skincareset.jpeg",
    description:
      "Complete skincare set for a simple everyday skincare routine.",
    normalPrice: 990,
    groupPrice: 790,
    bestPrice: 690,
    target: 50,
  },
];

export default function ProductPage() {
  const params = useParams();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const product =
    products.find((item) => item.id === id) ?? products[0];

  const [joined, setJoined] = useState(19);
  const [hasJoined, setHasJoined] = useState(false);

  const currentPrice =
    joined >= product.target
      ? product.bestPrice
      : joined >= 20
      ? product.groupPrice
      : product.normalPrice;

  const progress = Math.min(
    (joined / product.target) * 100,
    100
  );

  function joinGroup() {
    if (!hasJoined) {
      setJoined((previous) => previous + 1);
      setHasJoined(true);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f8f8] text-slate-900">

      {/* NAVBAR */}
      <nav className="flex h-20 items-center border-b bg-white px-6 lg:px-10">
        <Link href="/" className="text-2xl font-black">
          <span className="text-orange-500">Group</span>Buy
        </Link>

        <Link
          href="/"
          className="ml-auto text-sm font-bold hover:text-orange-500"
        >
          Home
        </Link>
      </nav>

      <div className="mx-auto max-w-6xl px-5 py-10">

        <Link
          href="/"
          className="text-sm font-semibold text-gray-500 hover:text-orange-500"
        >
          ← Back to deals
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-2">

          {/* PRODUCT IMAGE */}
          <div className="flex min-h-[520px] items-center justify-center overflow-hidden rounded-[32px] bg-white shadow-sm">
            <img
              src={product.image}
              alt={product.name}
              className="h-full max-h-[520px] w-full object-contain p-8"
            />
          </div>

          {/* PRODUCT INFORMATION */}
          <div className="rounded-[32px] bg-white p-7 shadow-sm lg:p-9">

            <span className="rounded-full bg-orange-50 px-4 py-2 text-xs font-bold text-orange-600">
              🔥 ACTIVE GROUP DEAL
            </span>

            <h1 className="mt-6 text-4xl font-black">
              {product.name}
            </h1>

            <p className="mt-3 leading-7 text-gray-500">
              {product.description}
            </p>

            {/* PRICE */}
            <div className="mt-8 rounded-2xl bg-orange-50 p-5">

              <p className="text-sm font-semibold text-gray-500">
                Current Group Price
              </p>

              <div className="mt-2 flex items-center gap-3">

                <span className="text-5xl font-black text-orange-500">
                  ฿{currentPrice.toLocaleString()}
                </span>

                {currentPrice !== product.normalPrice && (
                  <span className="text-lg text-gray-400 line-through">
                    ฿{product.normalPrice.toLocaleString()}
                  </span>
                )}

              </div>

              {joined < 20 && (
                <p className="mt-3 font-bold text-orange-600">
                  🔥 Only {20 - joined} more buyer to unlock ฿
                  {product.groupPrice.toLocaleString()}!
                </p>
              )}

              {joined >= 20 && joined < product.target && (
                <p className="mt-3 font-bold text-green-600">
                  🎉 Group price unlocked!
                </p>
              )}

            </div>

            {/* PRICE TIERS */}
            <div className="mt-8">

              <h2 className="text-lg font-bold">
                Group Price Tiers
              </h2>

              <div className="mt-4 space-y-3">

                <div className="flex justify-between rounded-2xl border p-4">
                  <div>
                    <p className="font-bold">1–19 buyers</p>
                    <p className="text-xs text-gray-400">
                      Starting price
                    </p>
                  </div>

                  <span className="font-black">
                    ฿{product.normalPrice.toLocaleString()}
                  </span>
                </div>

                <div
                  className={`flex justify-between rounded-2xl border p-4 ${
                    joined >= 20
                      ? "border-orange-300 bg-orange-50"
                      : ""
                  }`}
                >
                  <div>
                    <p className="font-bold">20+ buyers</p>
                    <p className="text-xs text-gray-400">
                      Group price
                    </p>
                  </div>

                  <span className="font-black text-orange-500">
                    ฿{product.groupPrice.toLocaleString()}{" "}
                    {joined >= 20 ? "✓" : "🔒"}
                  </span>
                </div>

                <div
                  className={`flex justify-between rounded-2xl border p-4 ${
                    joined >= product.target
                      ? "border-green-300 bg-green-50"
                      : ""
                  }`}
                >
                  <div>
                    <p className="font-bold">
                      {product.target}+ buyers
                    </p>

                    <p className="text-xs text-gray-400">
                      Best price
                    </p>
                  </div>

                  <span className="font-black text-green-600">
                    ฿{product.bestPrice.toLocaleString()}{" "}
                    {joined >= product.target ? "✓" : "🔒"}
                  </span>

                </div>

              </div>
            </div>

            {/* PROGRESS */}
            <div className="mt-8">

              <div className="flex justify-between text-sm">

                <span className="font-bold">
                  👥 {joined}/{product.target} people joined
                </span>

                <span className="text-gray-400">
                  Ends in 2 days
                </span>

              </div>

              <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-100">

                <div
                  className="h-full rounded-full bg-orange-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />

              </div>

            </div>

            {/* JOIN */}

            {!hasJoined ? (

              <button
                onClick={joinGroup}
                className="mt-8 w-full rounded-2xl bg-orange-500 py-4 text-lg font-black text-white hover:bg-orange-600"
              >
                Join This Group →
              </button>

            ) : (

              <Link
                href={`/checkout?product=${product.id}&price=${currentPrice}`}
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