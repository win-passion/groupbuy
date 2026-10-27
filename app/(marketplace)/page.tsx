import Link from "next/link";
import Icon from "../components/shell/Icon";
import { CategoryNav, DealGrid } from "./DealBrowser";
import DealSearch from "./DealSearch";

/** Decorative card showing a price dropping through tiers, for the hero. */
function HeroIllustration() {
  const tiers = [
    { units: "1+", price: "฿500", reached: true },
    { units: "20+", price: "฿450", reached: true },
    { units: "50+", price: "฿390", reached: false },
  ];
  return (
    <div aria-hidden="true" className="relative hidden w-80 shrink-0 xl:block">
      <div className="absolute -right-6 -top-6 h-40 w-40 rounded-full bg-brand-300/30 blur-2xl" />
      <div className="relative rotate-2 rounded-3xl bg-surface p-5 shadow-xl motion-safe:animate-rise">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
            <Icon name="headphones" className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-bold">Wireless Earbuds Pro</p>
            <p className="text-xs text-muted">42 units voted</p>
          </div>
        </div>
        <div className="mt-4 h-2.5 rounded-full bg-surface-muted">
          <div className="h-2.5 w-[84%] rounded-full bg-gradient-to-r from-brand-400 to-brand-600" />
        </div>
        <div className="mt-4 space-y-2">
          {tiers.map((tier) => (
            <div
              key={tier.units}
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${
                tier.reached ? "bg-brand-50 font-bold text-brand-700" : "border border-dashed border-line text-muted"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Icon name={tier.reached ? "done" : "lock"} className="h-4 w-4" />
                {tier.units} units
              </span>
              <span>{tier.price}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-bold text-white">
          <Icon name="zap" className="h-3.5 w-3.5 text-brand-300" />8 more to unlock ฿390
        </p>
      </div>
      <div className="absolute -bottom-6 -left-8 -rotate-3 rounded-2xl bg-surface px-4 py-3 shadow-lg motion-safe:animate-float">
        <p className="flex items-center gap-2 text-sm font-bold">
          <span className="flex -space-x-2">
            {["bg-brand-200", "bg-brand-300", "bg-brand-400"].map((color) => (
              <span key={color} className={`h-6 w-6 rounded-full border-2 border-surface ${color}`} />
            ))}
          </span>
          Everyone gets the lower price
        </p>
      </div>
    </div>
  );
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const category = typeof params.category === "string" ? params.category : null;

  return (
    <div className="mx-auto max-w-[1500px] p-4 sm:p-5 lg:p-8">
      {/* HERO (full width) */}
      <section className="relative overflow-hidden rounded-hero bg-gradient-to-br from-hero-from via-hero-via to-hero-to px-6 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-40 [background-image:radial-gradient(var(--color-brand-200)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_left,black,transparent_70%)]"
        />
        <div className="relative z-10 flex items-center justify-between gap-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-surface/90 px-3.5 py-1.5 text-xs font-bold text-brand-600 shadow-sm">
              <Icon name="flame" className="h-4 w-4" />
              Save more together
            </div>

            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Buy together.
              <br />
              <span className="bg-gradient-to-r from-brand-500 to-brand-600 bg-clip-text text-transparent">Pay less.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-ink-muted sm:text-lg sm:leading-8">
              Vote for the deals you want. The more units everyone votes, the lower the price, and you only pay once
              it&apos;s final.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#deals"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 font-bold text-white shadow-lg shadow-brand-200 transition hover:bg-brand-600"
              >
                Explore deals
                <Icon name="arrow-right" className="h-5 w-5" />
              </a>

              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 rounded-xl bg-surface/80 px-6 py-3.5 font-bold text-ink shadow-sm ring-1 ring-brand-200 transition hover:bg-surface"
              >
                How it works
              </Link>
            </div>
          </div>

          <HeroIllustration />
        </div>
      </section>

      {/* CATEGORIES + DEALS */}
      <div id="deals" className="mt-10 scroll-mt-24 lg:flex lg:gap-8">
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-24">
            {/* Same height as the search bar, so the two line up */}
            <p className="mb-4 flex h-12 items-center px-3 text-xs font-bold uppercase tracking-wider text-subtle">Categories</p>
            <CategoryNav active={category} q={q} variant="sidebar" />
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <div className="mb-4">
            <DealSearch query={q} category={category} />
          </div>
          <div className="mb-6 lg:hidden">
            <CategoryNav active={category} q={q} variant="chips" />
          </div>
          <DealGrid q={q} category={category} />
        </section>
      </div>
    </div>
  );
}
