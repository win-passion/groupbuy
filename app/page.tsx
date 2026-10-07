import Link from "next/link";
import AuthNav from "./components/AuthNav";

const products = [
  {
    name: "Wireless Earbuds Pro",
    emoji: "🎧",
    price: "฿390",
    oldPrice: "฿500",
    joined: 42,
    target: 50,
    discount: "SAVE 22%",
  },
  {
    name: "Smart Watch Series 5",
    emoji: "⌚",
    price: "฿1,490",
    oldPrice: "฿1,990",
    joined: 38,
    target: 50,
    discount: "SAVE 25%",
  },
  {
    name: "Coffee Maker",
    emoji: "☕",
    price: "฿890",
    oldPrice: "฿1,290",
    joined: 27,
    target: 40,
    discount: "SAVE 31%",
  },
  {
    name: "Skincare Set",
    emoji: "🧴",
    price: "฿690",
    oldPrice: "฿990",
    joined: 34,
    target: 50,
    discount: "SAVE 30%",
  },
];

const categories = [
  ["📱", "Electronics"],
  ["🏠", "Home & Living"],
  ["💄", "Beauty"],
  ["👕", "Fashion"],
  ["🍔", "Food"],
  ["⚽", "Sports"],
  ["🎮", "Gaming"],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8f8f8] text-slate-900">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 flex h-20 items-center border-b bg-white/95 px-6 backdrop-blur lg:px-10">
        <Link href="/" className="text-2xl font-black tracking-tight">
          <span className="text-orange-500">Group</span>Buy
        </Link>

        <div className="mx-10 hidden max-w-xl flex-1 md:block">
          <input
            placeholder="Search products, brands and group deals..."
            className="w-full rounded-full border border-gray-200 bg-gray-50 px-6 py-3 text-sm outline-none focus:border-orange-400"
          />
        </div>

        <div className="ml-auto flex items-center gap-6 text-sm font-semibold">
          <a href="#how" className="hidden hover:text-orange-500 md:block">
            How it works
          </a>

          <Link href="/my-groups" className="hidden hover:text-orange-500 md:block">
            My Groups
          </Link>

          <Link href="/seller" className="hidden hover:text-orange-500 lg:block">
            Sell on GroupBuy
          </Link>

          <span className="text-xl">🛒</span>

          <AuthNav />
        </div>
      </nav>

      <div className="mx-auto flex max-w-[1500px]">
        {/* SIDEBAR */}
        <aside className="hidden w-60 shrink-0 p-6 lg:block">
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
            Categories
          </p>

          <div className="space-y-1">
            {categories.map(([icon, name], index) => (
              <div
                key={name}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                  index === 0
                    ? "bg-orange-50 text-orange-600"
                    : "hover:bg-white"
                }`}
              >
                <span>{icon}</span>
                {name}
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl bg-slate-900 p-5 text-white">
            <p className="text-sm font-bold">Want to sell?</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Create group deals and sell more in one campaign.
            </p>

            <Link
              href="/seller"
              className="mt-4 block text-sm font-bold text-orange-400"
            >
              Seller Center →
            </Link>
          </div>
        </aside>

        <div className="min-w-0 flex-1 p-5 lg:p-8">
          {/* HERO */}
          <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#fff3e9] via-[#fff8f2] to-[#ffe6d1] px-8 py-14 lg:px-16 lg:py-16">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-bold text-orange-600 shadow-sm">
                🔥 SAVE MORE TOGETHER
              </div>

              <h1 className="mt-6 text-5xl font-black leading-[1.05] tracking-tight lg:text-7xl">
                Buy together.
                <br />
                <span className="text-orange-500">Pay less.</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                Join other shoppers, grow the group and unlock lower prices
                together.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#deals"
                  className="rounded-xl bg-orange-500 px-7 py-4 font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600"
                >
                  Explore Deals →
                </a>

                <a
                  href="#how"
                  className="rounded-xl border border-orange-200 bg-white px-7 py-4 font-bold"
                >
                  How It Works
                </a>
              </div>

              <div className="mt-9 flex gap-8 text-sm">
                <div>
                  <p className="text-xl font-black">12K+</p>
                  <p className="text-gray-500">Members</p>
                </div>

                <div>
                  <p className="text-xl font-black">350+</p>
                  <p className="text-gray-500">Group Deals</p>
                </div>

                <div>
                  <p className="text-xl font-black">30%</p>
                  <p className="text-gray-500">Avg. Saving</p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-24 -right-16 hidden h-96 w-96 rounded-full bg-orange-300/30 lg:block" />
            <div className="absolute right-20 top-16 hidden text-[150px] lg:block">
              🛍️
            </div>
          </section>

          {/* HOW */}
          <section id="how" className="mt-8 rounded-3xl border bg-white p-7">
            <div className="grid gap-6 md:grid-cols-4">
              {[
                ["01", "Find a Deal", "Choose a product you want."],
                ["02", "Join the Group", "Join buyers who want the same item."],
                ["03", "Unlock Price", "More buyers unlock better prices."],
                ["04", "Pay & Receive", "Checkout and wait for delivery."],
              ].map(([number, title, text]) => (
                <div key={number} className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 font-black text-orange-500">
                    {number}
                  </div>

                  <div>
                    <p className="font-bold">{title}</p>
                    <p className="mt-1 text-sm leading-5 text-gray-500">
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* DEALS */}
          <section id="deals" className="mt-12">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <p className="text-sm font-bold text-orange-500">
                  TRENDING NOW
                </p>
                <h2 className="mt-1 text-3xl font-black">Hot Group Deals 🔥</h2>
              </div>

              <span className="hidden text-sm font-bold text-orange-500 sm:block">
                View all →
              </span>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {products.map((product, index) => {
                const progress = (product.joined / product.target) * 100;

                return (
                  <div
                    key={product.name}
                    className="group overflow-hidden rounded-3xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="relative flex h-52 items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-7xl">
                      {product.emoji}

                      <span className="absolute left-4 top-4 rounded-full bg-orange-500 px-3 py-1 text-[11px] font-bold text-white">
                        {product.discount}
                      </span>
                    </div>

                    <div className="p-5">
                      <p className="text-xs font-semibold text-gray-400">
                        Group Deal
                      </p>

                      <h3 className="mt-1 font-bold">{product.name}</h3>

                      <div className="mt-3 flex items-end gap-2">
                        <span className="text-2xl font-black text-orange-500">
                          {product.price}
                        </span>

                        <span className="pb-1 text-sm text-gray-400 line-through">
                          {product.oldPrice}
                        </span>
                      </div>

                      <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-orange-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="mt-2 flex justify-between text-xs text-gray-500">
                        <span>
                          👥 {product.joined}/{product.target} joined
                        </span>
                        <span>2d left</span>
                      </div>

                      <Link
                        href={index === 0 ? "/product" : "/product"}
                        className="mt-5 block w-full rounded-xl bg-slate-900 py-3 text-center text-sm font-bold text-white transition group-hover:bg-orange-500"
                      >
                        View Group Deal →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* WHY */}
          <section className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              ["💸", "Lower Prices", "Prices fall as more people join."],
              ["🤝", "Buy Together", "Invite friends or join existing groups."],
              ["🔒", "Clear & Simple", "See targets, prices and progress before joining."],
            ].map(([icon, title, text]) => (
              <div key={title} className="rounded-3xl bg-white p-7">
                <div className="text-3xl">{icon}</div>
                <h3 className="mt-4 text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-500">{text}</p>
              </div>
            ))}
          </section>

          <footer className="mt-14 border-t py-8 text-center text-sm text-gray-400">
            GroupBuy Prototype • Buy Together, Pay Less.
          </footer>
        </div>
      </div>
    </main>
  );
}