@AGENTS.md

# GroupBuy

GroupBuy is a group-buying marketplace built with Next.js (App Router, `app/`). Sellers list deals with tiered prices, buyers vote to join, and the price drops as more units are voted. Buyers pay only after the final price is known.

This file has three parts:

1. **Current state**: how the app works today.
2. **Target spec**: the agreed product rules for the upgrade. Treat these as requirements.
3. **Build plan**: data model, pages and phases.

Language: **English only** in the UI. Currency: **THB**. Time zone for display and deadlines: **Asia/Bangkok**.

---

# Part 1: Current state

All five build phases (Part 3) are done. The app is a **frontend-only demo**: every rule in Part 2 runs in the browser against a `localStorage` database. There is no backend, no real payment provider and no real security (anyone can edit `localStorage`).

## Where things live

| Area | Path |
| --- | --- |
| Data store (only code that touches `localStorage`) | `app/lib/store/` (import from `app/lib/store`, the index) |
| Tables and row types | `app/lib/store/types.ts`; schema version in `db.ts` |
| Rules: deals, review, voting, decision, payment | `app/lib/store/actions.ts` |
| Rules: shipping, delivery, disputes, refunds, payouts, commission, settings | `app/lib/store/fulfilment.ts` |
| Deadline jobs | `app/lib/store/jobs.ts`, run by `app/components/DeadlineRunner.tsx` and before every action |
| Notifications text and links | `app/lib/store/notifications.ts` |
| Categories | `app/lib/store/catalog.ts` |
| Demo seed data and accounts | `app/lib/store/seed.ts` |
| Payment provider (mock) | `app/lib/payments/` |
| Layouts and navigation | `app/components/shell/` (`nav-config.ts` lists every role's pages) |
| Design tokens | `app/globals.css` |

## Demo tools

- **Dev panel** (bottom-left "Dev" button): log in as any account, move the clock forward or skip to the next deadline, see row counts, reset all data. Hide it with `NEXT_PUBLIC_DEV_PANEL=off`.
- **Two-tab testing:** open the seller, buyer and admin in separate tabs of the same browser; they share one database and update live.
- **Tests:** the store's rules were tested with Node scripts against a fake `localStorage` during the build (not committed; there is no test runner in the repo yet).

## Known limitations

- Data is per browser: different devices or browsers don't see each other's deals.
- Passwords are SHA-256 hashed but this is not real security.
- Payments, refunds and payouts are mocked and succeed instantly (test card `4000 0000 0000 0002` is declined).
- Images are picked from `public/assets/` or pasted as URLs; there is no upload.
- `@supabase/supabase-js` is still listed in `package.json` but unused.

---

# Part 2: Target spec (agreed rules)

## Roles

Every account has exactly **one** role. An account can never be both buyer and seller.

| Role       | How they get it                                                            | What they do                                                                                                                                         |
| ---------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Buyer**  | Self sign-up                                                               | Browse deals, vote with a quantity, confirm and pay at the final price, track orders, confirm delivery                                               |
| **Seller** | Self sign-up as seller, then **admin approval** before they can list deals | Create deals with price tiers and a voting period, decide Proceed/Cancel after voting, ship each order, see earnings                                 |
| **Admin**  | Created manually (never through public sign-up)                            | Approve sellers and deals, set commission per seller, manage users, handle disputes and refunds, manage categories and settings, view platform stats |

A seller whose application is pending or rejected can log in but cannot create deals.

## Deal lifecycle

```
draft → pending_review → live → seller_decision → payment_window → fulfilling → completed
              ↓                        ↓
           rejected                cancelled
```

1. **Draft**: the seller creates the deal: title, description, images, category, price tiers, voting period, optional max units per buyer.
2. **Pending review**: the admin approves or rejects the deal. A rejected deal goes back to the seller with a reason and can be edited and resubmitted.
3. **Live (voting)**: buyers vote with a quantity. No money moves.
4. **Deadline**: voting closes and the system **locks the price** from the total units voted.
5. **Seller decision**: the seller chooses **Proceed** or **Cancel deal**. No buyer has paid yet, so cancelling costs nobody money.
6. **Payment window**: every voter is asked to confirm and pay at the locked price.
7. **Fulfilling**: the seller ships every paid order to each buyer separately.
8. **Completed**: all orders are delivered, refunded or closed.

## Tiered pricing

- The seller defines the tiers, for example 1–9 units ฿1,200, 10–24 units ฿1,000, 25+ units ฿850.
- The first tier must start at 1 unit, and tiers must not overlap or leave gaps. Each higher tier must have a lower price.
- The deal **always goes ahead**, even with 1 vote: the price is simply the tier that was reached.
- The tier is calculated from **units voted** at the deadline, not from units paid. Once locked, the price never changes, even if fewer units are paid.

## Voting

- Voting is free and needs no payment details.
- A buyer picks a **quantity**, and every unit counts toward the tier.
- The seller may set an optional **max units per buyer**. There is **no stock cap**: voting stays open until the deadline.
- While the deal is live, a buyer can change their quantity or withdraw the vote.
- A buyer with an active voting restriction (see "No-show tracking") cannot vote.
- The deal page shows live progress: units voted, the current price, units needed to unlock the next tier, and a countdown.

## Seller decision (after the deadline)

- The seller sees the locked price and total units voted, then chooses **Proceed** or **Cancel deal**.
- This is the **only** point where a seller can cancel. Once buyers start paying, the seller must deliver every paid order.
- Each seller's cancellation rate is recorded and visible to the admin.

## Payment window

- Each voter gets a notification: "Final price ฿X × your quantity. Confirm and pay?"
- They can **pay** (an order is created), tap **No, cancel** (declined), or ignore it until the window closes (expired, counts as a **no-show**).
- Declining is never penalised. Only ignoring the request counts as a no-show.
- Payment methods: **PromptPay and cards**, charged immediately (no authorisation holds). No cash on delivery for now.

## Payment status box (shown to voters and the seller)

Shows **counts only, never names**, in units first, with people in smaller text:

- During the window: time left, locked price, and units **Paid**, **Waiting**, **Declined**. Counts update live.
- After the window: "28 units voted → 16 units paid · 4 declined · 8 didn't respond".

The status box is for information only; it never changes the price.

## No-show tracking

- A no-show is recorded when a buyer lets the payment window expire without answering.
- **3 no-shows within 90 days** means the buyer cannot vote for **30 days**. Browsing and other actions still work.
- The buyer is warned before the limit: "You've missed 2 confirmations. One more will pause voting for 30 days."
- The admin sees each buyer's no-show count and can lift a restriction early.
- Sellers never see which buyers no-showed.

## Delivery and payout

- The seller ships each paid order to that buyer's address and enters tracking information if available.
- The buyer confirms delivery. Delivery is auto-confirmed after a set number of days if the buyer hasn't opened a dispute.
- After delivery is confirmed, the order becomes payable to the seller: **order total minus the seller's commission**.
- Refunds happen only for problems (not delivered, damaged, wrong item) and are handled by the admin through disputes.

## Commission

- The admin sets a platform default commission rate and can override it for each seller.
- Each order **stores the commission rate at the moment of payment**, so changing a seller's rate later never changes past earnings.

## Admin settings (configurable, with defaults)

| Setting                                | Default                      |
| -------------------------------------- | ---------------------------- |
| Voting period allowed                  | 1–14 days (seller default 7) |
| Seller decision window                 | 12 hours                     |
| Buyer payment window                   | 48 hours                     |
| No-show limit / lookback / restriction | 3 / 90 days / 30 days        |
| Auto-confirm delivery after            | 7 days                       |
| Default commission rate                | 10%                          |

The defaults are starting values, not final business decisions. Store them in a settings table, never hardcode them.

## Design

- **Keep the current theme and colours.** First pull the existing colours, fonts and radii into shared design tokens (CSS variables or the Tailwind theme), then build every new screen from those tokens. Do not change the palette.
- **Tokens live in `app/globals.css` (`@theme`).** Use `brand-*` (orange), `canvas` (page background), `surface`, `surface-muted`, `surface-subtle`, `line` (borders), `ink`, `ink-soft`, `ink-muted`, `ink-faint`, `muted-strong`, `muted`, `subtle` (text), `success-*`, `danger`, the `hero-*` gradient stops, and the radii `rounded-sheet` (28px) and `rounded-hero` (32px). Do not use raw `orange-*`, `gray-*`, `slate-*`, `green-*` or `red-*` classes, or hex values, in components.
- **Font:** Plus Jakarta Sans via `next/font` in `app/layout.tsx` (`--font-jakarta` → `font-sans`). Use `font-extrabold` for headings (the font tops out at 800); headings get tight tracking from the base styles in `globals.css`.
- **Icons:** lucide-react (pinned version), always through `app/components/shell/Icon.tsx` by name (`<Icon name="truck" />`). Don't use emoji as UI icons. Category icons are stored as icon names; the admin picks them from `CATEGORY_ICONS`.
- **Surfaces:** white cards use `shadow-sm` (a soft layered shadow with a hairline edge, defined in `globals.css`) instead of borders; corner radii are `rounded-sheet` (24px) and `rounded-hero` (28px). Shared pieces live in `app/components/ui.tsx` (`EmptyState`, `StatCard`, `StatusPill`, `PageHeader`, `BackLink`, skeletons).
- **Mobile-first and responsive** across phone, tablet and desktop. No horizontal scrolling. Navigation uses a bottom tab bar on mobile and a sidebar or top navigation on larger screens.
- **Richer visuals:** a tier progress bar with markers for each tier, countdown timers, the payment status box, illustrated empty states, skeleton loaders and subtle animations. Respect `prefers-reduced-motion`.
- Each role has its own dashboard layout (buyer, seller, admin).

---

# Part 3: Build plan

## Stack

- Next.js App Router, TypeScript, Tailwind v4.
- **No backend for this upgrade: all data lives in browser `localStorage`.** Supabase is out of scope (the unused `@supabase/supabase-js` dependency can stay until someone decides).
- **One data layer:** all reads and writes go through `app/lib/store/`. Pages and components never call `localStorage` directly. Each table below is one `localStorage` key holding a JSON array (prefix `groupbuy_`), plus a schema version key for migrations. Swapping to a real backend later should only touch this folder.
- **Live updates:** the store emits a change event and listens to the browser `storage` event, so every open tab (seller, buyer, admin) updates together. Components subscribe through `useSyncExternalStore`.
- **Roles are enforced in the store functions** (for example, only an approved seller can create a deal), but this is a demo: anyone can edit `localStorage`, so there is no real security.
- **Demo seed data:** an admin account, an approved seller, a pending seller, several buyers and example deals in different states, loaded on first run and resettable from the dev panel.
- **Payments are mocked** behind `app/lib/payments/` (PromptPay and card buttons that succeed or fail on demand), so a real provider can be plugged in later.
- Money is stored as **integers in satang** (฿1 = 100), never floats.
- **Using the store:** import only from `app/lib/store` (the index). Read with `useDb()` and derive with `useMemo(() => db && selector(db, id), [db, id])`; `useDb()` is `null` and `useSessionUser()` is `undefined` until the page loads in the browser (`useSessionUser()` is `null` when signed out). Write only through store functions built on `mutate()`. Timestamps are ISO strings; use `now()` / `nowIso()` from the store, never `Date.now()`. Rates are basis points (10% = 1000). Bump `SCHEMA_VERSION` in `db.ts` when a table shape changes; that wipes and reseeds everyone's demo data.
- **Demo accounts** are defined in `app/lib/store/seed.ts` (see the table below).

### Demo accounts

All use password `groupbuy123`. The login page lists only the first four; the dev panel's "Log in as" list has everyone.

| Email | Role | Shop | Purpose |
| --- | --- | --- | --- |
| `buyer@groupbuy.test` | Buyer | – | Main demo buyer: votes, a payment to confirm, a shipped order |
| `seller@groupbuy.test` | Seller | Win Gadgets | Electronics, plus the deals that demo the decision, payment, shipping, review and draft stages |
| `pending-seller@groupbuy.test` | Seller | Ploy Crafts | Application pending (can't create deals) |
| `admin@groupbuy.test` | Admin | – | Platform admin |
| `seller-home@groupbuy.test` | Seller | Baan Living | Home & Living deals |
| `seller-beauty@groupbuy.test` | Seller | Glow Lab Beauty | Beauty deals |
| `seller-fashion@groupbuy.test` | Seller | Urban Thread | Fashion deals |
| `seller-food@groupbuy.test` | Seller | Farm Fresh Thai | Food deals; custom 8% commission |
| `seller-sports@groupbuy.test` | Seller | FitLife Sports | Sports deals |
| `seller-gaming@groupbuy.test` | Seller | Level Up Gaming | Gaming deals |
| `shopper1@` – `shopper11@groupbuy.test` | Buyer | – | Demo shoppers whose votes and orders fill the deals |
- Remove the duplicated product catalog: all deal data comes from the store.

## Data model (first draft)

| Table             | Key columns                                                                                                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `profiles`        | `id` (= auth user), `role` (buyer/seller/admin), `full_name`, `phone`, `status` (active/suspended), `voting_restricted_until`                                                                                                                          |
| `seller_profiles` | `user_id`, `shop_name`, `description`, `application_status` (pending/approved/rejected/suspended), `commission_rate` (nullable, null = platform default), `rejection_reason`                                                                           |
| `addresses`       | `user_id`, recipient, phone, address lines, `is_default`                                                                                                                                                                                               |
| `categories`      | `id`, `name`, `slug`, `sort_order`                                                                                                                                                                                                                     |
| `deals`           | `id`, `seller_id`, `category_id`, `title`, `description`, `status`, `voting_starts_at`, `voting_ends_at`, `max_units_per_buyer`, `units_voted_at_close`, `locked_tier_id`, `locked_unit_price`, `decision_deadline`, `payment_deadline`, `review_note` |
| `deal_images`     | `deal_id`, `storage_path`, `sort_order`                                                                                                                                                                                                                |
| `deal_tiers`      | `deal_id`, `min_units`, `max_units` (null for the top tier), `unit_price`                                                                                                                                                                              |
| `votes`           | `deal_id`, `buyer_id`, `quantity`, `status` (active/withdrawn/paid/declined/expired/cancelled), `responded_at`; one vote per buyer per deal                                                                                                            |
| `orders`          | `vote_id`, `deal_id`, `buyer_id`, `seller_id`, `quantity`, `unit_price`, `total`, `commission_rate`, `commission_amount`, `shipping_address` (snapshot), `status` (paid/shipped/delivered/disputed/refunded), `tracking_number`, `delivered_at`        |
| `payments`        | `order_id`, `provider`, `provider_ref`, `method` (promptpay/card), `amount`, `status`                                                                                                                                                                  |
| `payouts`         | `seller_id`, `amount`, `status`, `paid_at`; linked to the orders it covers                                                                                                                                                                             |
| `no_show_events`  | `buyer_id`, `deal_id`, `created_at`                                                                                                                                                                                                                    |
| `disputes`        | `order_id`, `opened_by`, `reason`, `status`, `resolution`, `refund_amount`                                                                                                                                                                             |
| `notifications`   | `user_id`, `type`, `payload`, `read_at`                                                                                                                                                                                                                |
| `settings`        | `key`, `value` (the admin settings above)                                                                                                                                                                                                              |

Derived numbers (units voted, current tier, payment status counts) come from shared selector functions in the store, so every screen shows the same values.

## Scheduled jobs

There is no server, so these run **lazily**: the store runs every due transition whenever data is read (and on a short interval while a page is open). Every job must be safe to run more than once. Use one `now()` helper everywhere, so the **dev panel** can shift the clock or trigger a deadline immediately (end voting now, expire the payment window, and so on).

- **Close voting** at `voting_ends_at`: compute total units and the locked tier and price, move to `seller_decision`, notify the seller.
- **Seller decision timeout**: what happens is an open decision (see below).
- **Close the payment window** at `payment_deadline`: mark unanswered votes `expired`, write `no_show_events`, apply voting restrictions, move the deal to `fulfilling`.
- **Auto-confirm delivery** after the configured number of days.
- **Payout eligibility**: mark delivered, undisputed orders as payable.

## Pages

**Layouts** (route groups do not change URLs): `app/(marketplace)/` uses `MarketplaceShell` (top nav, bottom tabs on phones); `app/(buyer)/`, `app/seller/` and `app/admin/` each wrap `DashboardShell` in `RequireRole` (sidebar from `md` up, top bar and bottom tabs on phones). Login and register have no shell. Add new pages to the right folder and their nav items to `app/components/shell/nav-config.ts`.

**Public:** home with deal listing, categories, search and filters · deal detail · login · sign up (buyer, or apply as seller).

**Buyer:** my votes (live / waiting for payment / done) · confirm-and-pay screen · orders and tracking · confirm delivery / open a dispute · addresses · notifications · account (including no-show status).

**Seller:** application status · dashboard (live deals, decisions waiting, orders to ship, earnings) · create and edit deal with a tier editor and live preview · deal detail (votes, Proceed/Cancel, payment status, orders) · orders to ship · earnings and payouts · shop profile.

**Admin:** dashboard (stats, items waiting) · seller applications · deal review queue · users (search, suspend, no-show counts, lift restrictions) · sellers (commission rate, cancellation rate) · disputes and refunds · payouts · categories · settings.

## Phases

1. **Foundation:** design tokens from the current theme, responsive layouts for the three roles, the `localStorage` store with these tables, demo seed data, login with roles (including admin), dev panel. *Done:* design tokens, role layouts, store with all tables, seed data, login/register with roles, seller application status, dev panel. *Still on the old prototype data:* home, product, my-groups, checkout and the seller pages (moved to the store in Phase 2); `app/lib/seller-deals.ts` is removed then.
2. **Deals and voting:** seller application and admin approval, deal creation with tiers, admin deal review, buyer voting, live progress and countdown. *Done:* store actions in `app/lib/store/actions.ts`; admin `/admin/sellers` and `/admin/deals`; seller dashboard, `/seller/create`, `/seller/deals/[id]` and `/seller/deals/[id]/edit` (tier editor with live preview); home grid with search and categories; `/deals/[id]` with vote box, tier progress and countdown; buyer `/my-groups`. The old `/product`, `/checkout` and `seller-deals.ts` are removed.
3. **Deadline and payment:** scheduled jobs, seller decision, payment window, payment integration, payment status box, no-show tracking. *Done:* deadline jobs in `app/lib/store/jobs.ts` (run before every action and by `<DeadlineRunner>`; they use each deadline as the event time, so clock jumps replay in order); seller Proceed/Cancel on `/seller/deals/[id]`; buyer `/pay/[dealId]` (address, mock PromptPay/card via `app/lib/payments/`, "No, cancel"); `PaymentStatusBox`; no-show warnings and restrictions; admin `/admin/users` (lift restriction) and seller cancellation rates; site-wide `ActionBanner`; dev panel "Skip to next deadline". Demo cards: 4242 4242 4242 4242 succeeds, 4000 0000 0000 0002 is declined.
4. **Fulfilment and money:** shipping, delivery confirmation, commission, payouts, disputes and refunds. *Done:* actions in `app/lib/store/fulfilment.ts`; buyer `/orders` and `/orders/[id]` (confirm delivery, report a problem); seller `/seller/orders` (ship with optional tracking) and `/seller/earnings`; admin `/admin/disputes`, `/admin/payouts`, `/admin/settings` and per-seller commission on `/admin/sellers`; jobs auto-confirm delivery and complete fulfilled deals; mobile tab bar shows 4 items plus "More" when a role has more than 5.
5. **Polish:** notifications, illustrations and animations, empty and error states, admin stats. *Done:* notifications inbox `/notifications` with a bell and unread badge in every layout (admins are notified about seller applications, submitted deals and disputes); admin `/admin/categories`; illustrated `error.tsx` and `not-found.tsx`; motion tokens in `globals.css` (`animate-rise`, `pop`, `float`, `celebrate`, always behind `motion-safe:`); admin dashboard deals-by-stage counts.

## Rules settled while building

- The voting period is set in **days**; its clock starts when an admin approves the deal (not when the seller submits).
- Pending or rejected sellers cannot create deals at all, not even drafts.
- Sellers can edit only **draft** and **rejected** deals. A deal in review must be withdrawn to draft first. Saving a rejected deal returns it to draft; it then needs resubmitting.
- Live deals cannot be edited. Tiers and the deadline are locked once buyers can vote.
- Withdrawn votes can be cast again; there is still only one vote row per buyer per deal.
- A `live` deal past `votingEndsAt` refuses votes and shows "Voting closed" until the close-voting job (Phase 3) moves it on.
- **No partial payment:** a buyer pays for the full quantity they voted, or declines.
- **Nobody paid:** when the payment window closes with no paid orders, the deal goes straight to `completed`. A deal with **zero votes** at the deadline also goes straight to `completed` (there is nobody to ask).
- **Seller decision timeout:** auto-cancel (the default until decided otherwise). It is recorded separately from cancellations the seller chose.
- **Shipping** is allowed for any paid order, including during the payment window.
- **Payable** as soon as delivery is confirmed (by the buyer, or automatically `autoConfirmDeliveryDays` after `shippedAt`). An open dispute pauses this.
- **Disputes** can be opened on paid, shipped or delivered orders until the order is paid out; one open dispute per order.
- **Refunds and commission:** commission is charged only on what the seller keeps: after a refund it is recalculated on `total - refundedAmount`, so a full refund leaves the seller ฿0 and the platform ฿0. *(Default chosen while building; confirm with the business.)* A full refund marks the order `refunded`; a partial or no refund returns it to its status before the dispute.
- **Payouts** are one transfer per seller covering every payable order, mocked as paid instantly.
- A **fulfilling** deal becomes `completed` once every order is delivered or refunded and no dispute is open.

- **Selling is not advertised publicly.** There is no "Sell on GroupBuy" promotion in the marketplace; sellers sign up through the account-type choice on `/register` and are then approved by an admin.
- **Demo product images:** the four original photos in `public/assets/` plus 16 free stock photos (Unsplash, one from Pexels) in `public/assets/products/`, cropped to 800×800; sources are listed in `public/assets/products/CREDITS.md`. Product images are shown with `object-cover` (they fill their frame). Swap in real seller photos by replacing the files or the `image` paths in `seed.ts`.

## Open decisions (ask before building these parts)

- **Payment provider:** mocked for this upgrade. For a real launch: Stripe (with Connect, for paying sellers) or Opn Payments (Omise). Check the provider's marketplace and Thai requirements before choosing.
- **Seller doesn't answer within the decision window:** auto-cancel or auto-proceed. Auto-cancel is the default until decided.
- **Reviews and ratings:** not in scope yet.
- **Delivery fees:** who sets them and whether they're included in the price.
