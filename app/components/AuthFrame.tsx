import { ReactNode } from "react";
import Icon, { IconName } from "./shell/Icon";
import Logo from "./shell/Logo";

const POINTS: [IconName, string, string][] = [
  ["vote", "Vote for free", "Pick how many units you want. No card needed."],
  ["price-drop", "Watch the price drop", "More units voted unlocks cheaper tiers for everyone."],
  ["lock", "Pay the final price", "You only pay once voting closes and the price locks."],
];

/** Shared layout for login and sign-up: a form card, plus a brand panel on large screens. */
export default function AuthFrame({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-canvas px-4 py-8 text-ink sm:px-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:p-6">
      <section className="relative hidden overflow-hidden rounded-hero bg-gradient-to-br from-hero-from via-hero-via to-hero-to p-12 lg:flex lg:flex-col">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-50 [background-image:radial-gradient(var(--color-brand-200)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]"
        />
        <div className="relative">
          <Logo />
        </div>
        <div className="relative mt-auto">
          <h2 className="max-w-md text-4xl font-extrabold leading-tight tracking-tight">
            Buy together. <span className="text-brand-500">Pay less.</span>
          </h2>
          <ul className="mt-8 space-y-5">
            {POINTS.map(([icon, heading, text]) => (
              <li key={heading} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface text-brand-500 shadow-sm">
                  <Icon name={icon} className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-bold">{heading}</span>
                  <span className="block text-sm text-muted-strong">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex items-center justify-center lg:py-6">
        <div className="w-full max-w-md rounded-sheet bg-surface p-7 shadow-sm motion-safe:animate-rise sm:p-10 lg:shadow-none lg:bg-transparent">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h1 className="mt-8 text-3xl font-extrabold tracking-tight lg:mt-0">{title}</h1>
          <p className="mt-2 text-muted">{subtitle}</p>
          {children}
        </div>
      </section>
    </main>
  );
}
