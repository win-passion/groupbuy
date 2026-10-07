"use client";

import Link from "next/link";
import RequireRole from "../components/RequireRole";

const groups = [
  {
    id: 0,
    name: "Wireless Earbuds Pro",
    image: "/assets/earphone.jpeg",
    price: 450,
    joined: 20,
    target: 50,
  },
  {
    id: 1,
    name: "Smart Watch Series 5",
    image: "/assets/watch.jpeg",
    price: 1690,
    joined: 20,
    target: 50,
  },
];

function MyGroupsContent() {
  return (
    <main className="min-h-screen bg-[#f8f8f8] text-slate-900">
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
        <p className="text-sm font-bold text-orange-500">YOUR PURCHASES</p>

        <h1 className="mt-1 text-4xl font-black">My Groups</h1>

        <p className="mt-3 text-gray-500">
          Track the group deals you have joined.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Groups Joined</p>
            <p className="mt-2 text-3xl font-black">2</p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Active Groups</p>
            <p className="mt-2 text-3xl font-black text-orange-500">2</p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Total Saved</p>
            <p className="mt-2 text-3xl font-black text-green-600">฿350</p>
          </div>
        </div>

        <div className="mt-8 space-y-5">
          {groups.map((group) => {
            const progress = Math.min((group.joined / group.target) * 100, 100);

            return (
              <div
                key={group.id}
                className="rounded-[28px] bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-6 md:flex-row md:items-center">
                  <div className="flex h-32 w-full items-center justify-center overflow-hidden rounded-2xl bg-white md:w-36">
                    <img
                      src={group.image}
                      alt={group.name}
                      className="h-full w-full object-contain p-3"
                    />
                  </div>

                  <div className="flex-1">
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-600">
                      ● Active
                    </span>

                    <h2 className="mt-3 text-xl font-black">{group.name}</h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Current Group Price
                    </p>

                    <p className="mt-1 text-2xl font-black text-orange-500">
                      ฿{group.price.toLocaleString()}
                    </p>

                    <div className="mt-5">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>
                          👥 {group.joined}/{group.target} joined
                        </span>

                        <span>2 days left</span>
                      </div>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-orange-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/product/${group.id}`}
                    className="rounded-xl border border-gray-200 px-5 py-3 text-center text-sm font-bold transition hover:border-orange-500 hover:text-orange-500"
                  >
                    View Group →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <Link
          href="/#deals"
          className="mt-8 block rounded-2xl bg-orange-500 py-4 text-center font-bold text-white"
        >
          + Find More Group Deals
        </Link>
      </div>
    </main>
  );
}

export default function MyGroupsPage() {
  return (
    <RequireRole role="buyer">
      <MyGroupsContent />
    </RequireRole>
  );
}
