import { ReactNode } from "react";
import Icon, { IconName } from "../shell/Icon";

/** The four help pages, in footer order. */
export const HELP_PAGES = [
  { href: "/contact", label: "Contact us", icon: "help" },
  { href: "/how-it-works", label: "How it works", icon: "vote" },
  { href: "/faq", label: "FAQ", icon: "inbox" },
  { href: "/shipping-refunds", label: "Shipping & refunds", icon: "truck" },
] as const satisfies readonly { href: string; label: string; icon: IconName }[];

function InfoCard({ icon, title, children }: { icon: IconName; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-4 rounded-2xl bg-surface p-5 shadow-sm">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <div className="min-w-0 text-sm">
        <p className="font-bold">{title}</p>
        <div className="mt-1 leading-6 text-muted-strong">{children}</div>
      </div>
    </div>
  );
}

export function Contact() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <InfoCard icon="inbox" title="Email">
        <a href="mailto:support@groupbuy.test" className="font-semibold text-brand-600 hover:underline">
          support@groupbuy.test
        </a>
        <p className="text-xs text-subtle">We reply within one working day.</p>
      </InfoCard>
      <InfoCard icon="smartphone" title="Phone">
        <a href="tel:+6620000000" className="font-semibold text-brand-600 hover:underline">
          02-000-0000
        </a>
        <p className="text-xs text-subtle">Mon–Fri, 9:00–18:00 (Bangkok time)</p>
      </InfoCard>
      <InfoCard icon="users" title="LINE Official">
        <span className="font-semibold text-ink">@groupbuy</span>
        <p className="text-xs text-subtle">Chat with us every day, 9:00–21:00.</p>
      </InfoCard>
      <InfoCard icon="pin" title="Office">
        GroupBuy Co., Ltd.
        <br />
        99 Sukhumvit Road, Khlong Toei, Bangkok 10110
      </InfoCard>
    </div>
  );
}

const STEPS: [IconName, string, string][] = [
  ["search", "Find a deal", "Pick a product and see every price tier up front, with live progress and the deadline."],
  ["vote", "Vote for free", "Choose how many units you want. No payment details needed, and you can change or withdraw your vote until voting closes."],
  ["lock", "Price locks", "When voting closes, the tier reached by all units voted sets one final price for everyone."],
  ["truck", "Pay & receive", "Confirm and pay the final price with PromptPay or card, then the seller ships to your address."],
];

export function HowItWorks() {
  return (
    <ol className="grid gap-4 sm:grid-cols-2">
      {STEPS.map(([icon, title, text], index) => (
        <li key={title} className="flex gap-4 rounded-2xl bg-surface p-5 shadow-sm">
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
            <Icon name={icon} className="h-5 w-5" />
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-white">
              {index + 1}
            </span>
          </span>
          <span className="text-sm">
            <span className="block font-bold">{title}</span>
            <span className="mt-1 block leading-6 text-muted-strong">{text}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

const FAQ: [string, string][] = [
  ["Is voting free?", "Yes. Voting needs no payment details. You only pay after voting closes and the final price is set."],
  [
    "What if not many people vote?",
    "The deal still goes ahead at the tier that was reached. You'll see the final price before you pay, and you can decline.",
  ],
  ["Can I change my vote?", "Yes. Change your quantity or withdraw your vote any time until voting closes."],
  [
    "What happens if I don't pay?",
    "Tap “No, cancel” if you don't want the deal; that never counts against you. Ignoring the payment request counts as a missed confirmation, and three in 90 days pause voting for 30 days.",
  ],
  ["How do I pay?", "PromptPay or a credit/debit card, charged once you confirm."],
  [
    "How do I become a seller?",
    "Choose “Seller” when you create an account. Our team reviews every shop before it can list deals.",
  ],
];

export function Faq() {
  return (
    <div className="space-y-3">
      {FAQ.map(([question, answer]) => (
        <details key={question} className="group rounded-2xl bg-surface p-5 shadow-sm open:shadow-md">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold [&::-webkit-details-marker]:hidden">
            {question}
            <Icon name="chevron-right" className="h-4 w-4 shrink-0 text-subtle motion-safe:transition-transform group-open:rotate-90" />
          </summary>
          <p className="mt-3 text-sm leading-6 text-muted-strong">{answer}</p>
        </details>
      ))}
    </div>
  );
}

const POLICIES: [IconName, string, string][] = [
  ["truck", "Delivery", "Each seller ships your order to your address after the payment window closes, with tracking when available."],
  ["delivered", "Confirm delivery", "Tap “Yes, it arrived” when it's with you. Orders are confirmed automatically 7 days after shipping."],
  ["help", "Report a problem", "Not delivered, damaged or the wrong item? Report it from your order and our team will step in."],
  ["coins", "Refunds", "Approved refunds go back to your original payment method, in full or in part."],
];

export function ShippingRefunds() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {POLICIES.map(([icon, title, text]) => (
        <InfoCard key={title} icon={icon} title={title}>
          {text}
        </InfoCard>
      ))}
    </div>
  );
}
