"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import RequireRole from "../../components/RequireRole";
import { addSellerDeal } from "../../lib/seller-deals";

function CreateDealForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [normalPrice, setNormalPrice] = useState("");
  const [priceAt20, setPriceAt20] = useState("");
  const [priceAt50, setPriceAt50] = useState("");
  const [endDate, setEndDate] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    addSellerDeal({
      name,
      description,
      normalPrice: Number(normalPrice),
      priceAt20: Number(priceAt20),
      priceAt50: Number(priceAt50),
      endDate,
    });

    router.push("/seller");
  }

  return (
    <main className="min-h-screen bg-[#f8f8f8] text-slate-900">
      <nav className="flex h-20 items-center border-b bg-white px-6 lg:px-10">
        <Link href="/" className="text-2xl font-black">
          <span className="text-orange-500">Group</span>Buy
        </Link>
        <Link
          href="/seller"
          className="ml-auto text-sm font-bold hover:text-orange-500"
        >
          ← Back to dashboard
        </Link>
      </nav>

      <div className="mx-auto max-w-2xl px-5 py-10">
        <p className="text-sm font-bold text-orange-500">NEW CAMPAIGN</p>
        <h1 className="mt-1 text-4xl font-black">Create Group Deal</h1>
        <p className="mt-3 text-gray-500">
          Set tier prices at 20 and 50 buyers. Your deal appears on the dashboard
          right after you create it.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5 rounded-[28px] bg-white p-7 shadow-sm"
        >
          <label className="block text-sm font-bold">
            Product Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-orange-500"
              required
            />
          </label>

          <label className="block text-sm font-bold">
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-orange-500"
              required
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm font-bold">
              Normal Price (฿)
              <input
                type="number"
                min={1}
                value={normalPrice}
                onChange={(event) => setNormalPrice(event.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-orange-500"
                required
              />
            </label>
            <label className="block text-sm font-bold">
              Price at 20 buyers (฿)
              <input
                type="number"
                min={1}
                value={priceAt20}
                onChange={(event) => setPriceAt20(event.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-orange-500"
                required
              />
            </label>
            <label className="block text-sm font-bold">
              Price at 50 buyers (฿)
              <input
                type="number"
                min={1}
                value={priceAt50}
                onChange={(event) => setPriceAt50(event.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-orange-500"
                required
              />
            </label>
          </div>

          <label className="block text-sm font-bold">
            End Date
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-orange-500"
              required
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-orange-500 py-3 font-bold text-white transition hover:bg-orange-600"
          >
            Create Group Deal
          </button>
        </form>
      </div>
    </main>
  );
}

export default function CreateSellerDealPage() {
  return (
    <RequireRole role="seller">
      <CreateDealForm />
    </RequireRole>
  );
}
