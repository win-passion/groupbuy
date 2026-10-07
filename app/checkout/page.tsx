"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

const products = [
  {
    name: "Wireless Earbuds Pro",
    image: "/assets/earphone.jpeg",
  },
  {
    name: "Smart Watch Series 5",
    image: "/assets/watch.jpeg",
  },
  {
    name: "Coffee Maker",
    image: "/assets/Boncafe-Drip-Coffee-Maker-1.jpg",
  },
  {
    name: "Skincare Set",
    image: "/assets/skincareset.jpeg",
  },
];

function CheckoutContent() {
  const searchParams = useSearchParams();

  const productId = Number(searchParams.get("product") || 0);
  const price = Number(searchParams.get("price") || 0);

  const product = products[productId] || products[0];

  const [ordered, setOrdered] = useState(false);

  if (ordered) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f8f8] px-5">
        <div className="w-full max-w-lg rounded-[32px] bg-white p-10 text-center shadow-sm">
          <div className="text-7xl">🎉</div>

          <h1 className="mt-6 text-3xl font-black">
            Order Confirmed!
          </h1>

          <p className="mt-3 text-gray-500">
            You successfully joined the group purchase.
          </p>

            <div className="mt-7 rounded-2xl bg-white p-5">
            <img
              src={product.image}
              alt={product.name}
              className="mx-auto h-32 w-32 object-contain"
            />

            <p className="mt-3 font-bold">
              {product.name}
            </p>

            <p className="mt-2 text-3xl font-black text-orange-500">
              ฿{price.toLocaleString()}
            </p>
          </div>

          <p className="mt-6 text-sm text-gray-500">
            We will notify you when the group campaign ends.
          </p>

          <Link
            href="/"
            className="mt-8 block rounded-2xl bg-orange-500 py-4 font-black text-white hover:bg-orange-600"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f8f8] text-slate-900">

      {/* NAVBAR */}
      <nav className="flex h-20 items-center border-b bg-white px-6 lg:px-10">
        <Link href="/" className="text-2xl font-black">
          <span className="text-orange-500">Group</span>Buy
        </Link>

        <span className="ml-auto text-sm font-bold">
          Secure Checkout 🔒
        </span>
      </nav>

      <div className="mx-auto max-w-5xl px-5 py-10">

        <Link
          href={`/product/${productId}`}
          className="text-sm font-semibold text-gray-500"
        >
          ← Back to product
        </Link>

        <h1 className="mt-6 text-4xl font-black">
          Checkout
        </h1>

        <p className="mt-2 text-gray-500">
          Complete your group purchase.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">

          {/* CUSTOMER INFO */}
          <div className="rounded-[28px] bg-white p-7 shadow-sm">

            <h2 className="text-xl font-black">
              Delivery Information
            </h2>

            <div className="mt-6 space-y-4">

              <div>
                <label className="text-sm font-bold">
                  Full Name
                </label>

                <input
                  placeholder="Win Pankerd"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-sm font-bold">
                  Phone Number
                </label>

                <input
                  placeholder="08X-XXX-XXXX"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-sm font-bold">
                  Delivery Address
                </label>

                <textarea
                  placeholder="Enter your delivery address"
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                />
              </div>

            </div>

            <h2 className="mt-8 text-xl font-black">
              Payment Method
            </h2>

            <div className="mt-4 rounded-2xl border-2 border-orange-400 bg-orange-50 p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💳</span>

                <div>
                  <p className="font-bold">
                    Demo Payment
                  </p>

                  <p className="text-xs text-gray-500">
                    No real payment will be charged.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* ORDER SUMMARY */}
          <div>

            <div className="rounded-[28px] bg-white p-7 shadow-sm">

              <h2 className="text-xl font-black">
                Order Summary
              </h2>

              <div className="mt-6 flex items-center gap-5 border-b pb-6">

                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-white">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-contain p-2"
                  />
                </div>

                <div>
                  <p className="font-bold">
                    {product.name}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Group Purchase
                  </p>

                  <p className="mt-2 text-xl font-black text-orange-500">
                    ฿{price.toLocaleString()}
                  </p>
                </div>

              </div>

              <div className="mt-6 space-y-3 text-sm">

                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Product
                  </span>

                  <span>
                    ฿{price.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Delivery
                  </span>

                  <span className="font-bold text-green-600">
                    FREE
                  </span>
                </div>

                <div className="flex justify-between border-t pt-4 text-lg font-black">
                  <span>Total</span>

                  <span className="text-orange-500">
                    ฿{price.toLocaleString()}
                  </span>
                </div>

              </div>

              <button
                onClick={() => setOrdered(true)}
                className="mt-7 w-full rounded-2xl bg-orange-500 py-4 text-lg font-black text-white transition hover:bg-orange-600"
              >
                Place Order →
              </button>

              <p className="mt-3 text-center text-xs text-gray-400">
                Prototype only — no real payment.
              </p>

            </div>

            <div className="mt-5 rounded-2xl bg-green-50 p-5">
              <p className="font-bold text-green-700">
                ✓ Group Price Protected
              </p>

              <p className="mt-1 text-sm leading-6 text-green-700">
                Your final price follows the group price unlocked when the
                campaign ends.
              </p>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}