import { HOUR, now } from "./clock";
import { registerSeeder, TABLE_NAMES } from "./db";
import { slugify } from "./catalog";
import { hashPassword } from "./hash";
import { baht } from "./money";
import { DEFAULT_SETTINGS } from "./settings";
import { Deal, DealStatus, Order, OrderStatus, SettingKey, Tables, UserRole, Vote } from "./types";

/** Every seeded account uses this password. */
export const DEMO_PASSWORD = "groupbuy123";

export type DemoAccount = { email: string; name: string; role: UserRole; note: string };

const SHOPPER_NAMES = ["Ploy", "Nat", "Mint", "Arm", "Beam", "Fah", "Ton", "Pim", "Kai", "Nok", "June"];

/**
 * Approved demo shops besides Win Gadgets (seller@), each owning the deals
 * in its category. Win Gadgets keeps electronics plus the deals that demo
 * later stages (decision, payment, shipping, review, draft).
 */
const SHOPS: {
  email: string;
  owner: string;
  shopName: string;
  description: string;
  deals: string[];
  /** Basis points; omit for the platform default */
  commissionRate?: number;
  joinedDaysAgo: number;
}[] = [
  {
    email: "seller-home@groupbuy.test",
    owner: "Nok",
    shopName: "Baan Living",
    description: "Small appliances and lighting for Thai homes and condos.",
    deals: ["coffee", "desklamp"],
    joinedDaysAgo: 120,
  },
  {
    email: "seller-beauty@groupbuy.test",
    owner: "Fon",
    shopName: "Glow Lab Beauty",
    description: "Skincare and sun care made for hot, humid weather.",
    deals: ["skincare", "sunscreen"],
    joinedDaysAgo: 95,
  },
  {
    email: "seller-fashion@groupbuy.test",
    owner: "Tee",
    shopName: "Urban Thread",
    description: "Everyday basics and bags from Bangkok.",
    deals: ["tshirt", "backpack"],
    joinedDaysAgo: 70,
  },
  {
    email: "seller-food@groupbuy.test",
    owner: "Somchai",
    shopName: "Farm Fresh Thai",
    description: "Rice and coffee straight from farmers in Isan and Chiang Rai.",
    deals: ["rice", "coffeebeans"],
    commissionRate: 800,
    joinedDaysAgo: 60,
  },
  {
    email: "seller-sports@groupbuy.test",
    owner: "Ice",
    shopName: "FitLife Sports",
    description: "Home workout gear and hydration.",
    deals: ["dumbbells", "bottle"],
    joinedDaysAgo: 45,
  },
  {
    email: "seller-gaming@groupbuy.test",
    owner: "Bank",
    shopName: "Level Up Gaming",
    description: "Controllers, keyboards and gear for PC and console players.",
    deals: ["controller", "keyboard"],
    joinedDaysAgo: 30,
  },
];

/** Shown on the login page and in the dev panel's account switcher. */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: "buyer@groupbuy.test", name: "Buyer", role: "buyer", note: "Has votes on 2 deals" },
  { email: "seller@groupbuy.test", name: "Seller", role: "seller", note: "Win Gadgets: decisions, payments and shipping" },
  { email: "pending-seller@groupbuy.test", name: "New Seller", role: "seller", note: "Application pending" },
  { email: "admin@groupbuy.test", name: "Admin", role: "admin", note: "Platform admin" },
  ...SHOPS.map((shop) => ({ email: shop.email, name: shop.owner, role: "seller" as const, note: `Demo shop: ${shop.shopName}` })),
  ...SHOPPER_NAMES.map((name, index) => ({
    email: `shopper${index + 1}@groupbuy.test`,
    name,
    role: "buyer" as const,
    note: "Demo shopper",
  })),
];

const CATEGORIES = [
  ["smartphone", "Electronics"],
  ["sofa", "Home & Living"],
  ["beauty", "Beauty"],
  ["shirt", "Fashion"],
  ["food", "Food"],
  ["sports", "Sports"],
  ["gaming", "Gaming"],
] as const;

type SeedDeal = {
  key: string;
  title: string;
  description: string;
  category: string;
  image: string;
  status: DealStatus;
  /** Hours from now; negative is in the past. Only for live deals. */
  startsInHours: number;
  endsInHours: number;
  votingDays: number;
  maxUnitsPerBuyer: number | null;
  /** [minUnits, priceInBaht] from the lowest tier up */
  tiers: [number, number][];
  /** Units voted by the demo shoppers, spread across them */
  shopperUnits: number;
  /** payment_window deals: how many shoppers already paid / declined */
  paidShoppers?: number;
  declinedShoppers?: number;
  /** fulfilling deals: every voter paid; these are the shoppers' order states */
  orderStates?: OrderStatus[];
  reviewNote?: string;
};

const SEED_DEALS: SeedDeal[] = [
  {
    key: "earbuds",
    title: "Wireless Earbuds Pro",
    description:
      "Premium wireless earbuds with active noise cancellation, 30-hour battery life with the case, and fast USB-C charging.",
    category: "electronics",
    image: "/assets/earphone.jpeg",
    status: "live",
    startsInHours: -5 * 24,
    endsInHours: 2 * 24,
    votingDays: 7,
    maxUnitsPerBuyer: 5,
    tiers: [
      [1, 500],
      [20, 450],
      [50, 390],
    ],
    shopperUnits: 40,
  },
  {
    key: "watch",
    title: "Smart Watch Series 5",
    description:
      "Fitness-tracking smartwatch with heart-rate and sleep monitoring, GPS and a 7-day battery.",
    category: "electronics",
    image: "/assets/watch.jpeg",
    status: "live",
    startsInHours: -4 * 24,
    endsInHours: 3 * 24,
    votingDays: 7,
    maxUnitsPerBuyer: 3,
    tiers: [
      [1, 1990],
      [20, 1690],
      [50, 1490],
    ],
    shopperUnits: 23,
  },
  {
    key: "coffee",
    title: "Coffee Maker",
    description: "Drip coffee maker for home brewing, with a 1.2 L glass jug and keep-warm plate.",
    category: "home-living",
    image: "/assets/Boncafe-Drip-Coffee-Maker-1.jpg",
    status: "live",
    startsInHours: -2 * 24,
    endsInHours: 5 * 24,
    votingDays: 7,
    maxUnitsPerBuyer: null,
    tiers: [
      [1, 1290],
      [15, 1090],
      [30, 890],
    ],
    shopperUnits: 12,
  },
  {
    key: "skincare",
    title: "Skincare Set",
    description: "Cleanser, toner, serum and moisturiser for a complete daily routine.",
    category: "beauty",
    image: "/assets/skincareset.jpeg",
    status: "live",
    startsInHours: -6 * 24,
    endsInHours: 20,
    votingDays: 7,
    maxUnitsPerBuyer: 4,
    tiers: [
      [1, 990],
      [10, 850],
      [25, 690],
    ],
    shopperUnits: 27,
  },
  {
    key: "powerbank",
    title: "Power Bank 20,000mAh",
    description: "Fast-charging 20,000mAh power bank with USB-C in/out and two USB-A ports. Charges a phone about four times.",
    category: "electronics",
    image: "/assets/products/power-bank.jpg",
    status: "live",
    startsInHours: -3 * 24,
    endsInHours: 96,
    votingDays: 7,
    maxUnitsPerBuyer: 3,
    tiers: [
      [1, 890],
      [15, 750],
      [40, 650],
    ],
    shopperUnits: 18,
  },
  {
    key: "desklamp",
    title: "LED Desk Lamp",
    description: "Dimmable LED desk lamp with three colour temperatures, a USB charging port and a foldable arm.",
    category: "home-living",
    image: "/assets/products/desk-lamp.jpg",
    status: "live",
    startsInHours: -1 * 24,
    endsInHours: 144,
    votingDays: 7,
    maxUnitsPerBuyer: null,
    tiers: [
      [1, 690],
      [10, 590],
      [25, 490],
    ],
    shopperUnits: 8,
  },
  {
    key: "sunscreen",
    title: "Sunscreen SPF50+ (3-Pack)",
    description: "Lightweight, non-greasy SPF50+ PA++++ sunscreen for daily use. Three 50 ml tubes.",
    category: "beauty",
    image: "/assets/products/sunscreen.jpg",
    status: "live",
    startsInHours: -4 * 24,
    endsInHours: 72,
    votingDays: 7,
    maxUnitsPerBuyer: 4,
    tiers: [
      [1, 590],
      [20, 490],
      [40, 420],
    ],
    shopperUnits: 26,
  },
  {
    key: "tshirt",
    title: "Cotton T-Shirt 3-Pack",
    description: "Soft 100% cotton crew-neck tees in black, white and grey. Sizes S to XXL.",
    category: "fashion",
    image: "/assets/products/tshirt-pack.jpg",
    status: "live",
    startsInHours: -2 * 24,
    endsInHours: 120,
    votingDays: 7,
    maxUnitsPerBuyer: 4,
    tiers: [
      [1, 790],
      [12, 650],
      [30, 550],
    ],
    shopperUnits: 15,
  },
  {
    key: "backpack",
    title: "Everyday Backpack 22L",
    description: "Water-resistant 22-litre backpack with a padded 15-inch laptop sleeve and hidden back pocket.",
    category: "fashion",
    image: "/assets/products/backpack.jpg",
    status: "live",
    startsInHours: -5 * 24,
    endsInHours: 48,
    votingDays: 7,
    maxUnitsPerBuyer: 2,
    tiers: [
      [1, 1290],
      [10, 1090],
      [25, 950],
    ],
    shopperUnits: 11,
  },
  {
    key: "rice",
    title: "Thai Hom Mali Rice 5kg",
    description: "New-crop Thai jasmine rice from Thung Kula Ronghai, vacuum-packed in a 5 kg bag.",
    category: "food",
    image: "/assets/products/jasmine-rice.jpg",
    status: "live",
    startsInHours: -3 * 24,
    endsInHours: 96,
    votingDays: 7,
    maxUnitsPerBuyer: 5,
    tiers: [
      [1, 320],
      [30, 280],
      [60, 250],
    ],
    shopperUnits: 37,
  },
  {
    key: "coffeebeans",
    title: "Roasted Coffee Beans 1kg",
    description: "Medium-roast arabica from Doi Chang, with chocolate and caramel notes. Whole beans, 1 kg.",
    category: "food",
    image: "/assets/products/coffee-beans.jpg",
    status: "live",
    startsInHours: -1 * 24,
    endsInHours: 144,
    votingDays: 7,
    maxUnitsPerBuyer: 3,
    tiers: [
      [1, 650],
      [15, 560],
      [30, 490],
    ],
    shopperUnits: 9,
  },
  {
    key: "dumbbells",
    title: "Adjustable Dumbbells 2 × 10kg",
    description: "A pair of adjustable dumbbells from 2 to 10 kg each, with a quick-lock collar and storage case.",
    category: "sports",
    image: "/assets/products/dumbbells.jpg",
    status: "live",
    startsInHours: -6 * 24,
    endsInHours: 30,
    votingDays: 7,
    maxUnitsPerBuyer: 2,
    tiers: [
      [1, 2990],
      [8, 2590],
      [20, 2290],
    ],
    shopperUnits: 14,
  },
  {
    key: "bottle",
    title: "Insulated Water Bottle 1L",
    description: "Double-wall stainless steel bottle that keeps drinks cold for 24 hours. Leak-proof lid.",
    category: "sports",
    image: "/assets/products/water-bottle.jpg",
    status: "live",
    startsInHours: -2 * 24,
    endsInHours: 120,
    votingDays: 7,
    maxUnitsPerBuyer: 4,
    tiers: [
      [1, 490],
      [20, 390],
      [50, 330],
    ],
    shopperUnits: 22,
  },
  {
    key: "controller",
    title: "Wireless Game Controller",
    description: "Bluetooth controller for PC, Android and Switch with hall-effect sticks and 30-hour battery.",
    category: "gaming",
    image: "/assets/products/game-controller.jpg",
    status: "live",
    startsInHours: -3 * 24,
    endsInHours: 96,
    votingDays: 7,
    maxUnitsPerBuyer: 2,
    tiers: [
      [1, 1590],
      [10, 1390],
      [25, 1190],
    ],
    shopperUnits: 13,
  },
  {
    key: "keyboard",
    title: "Mechanical Keyboard",
    description: "75% hot-swappable mechanical keyboard with tactile switches, RGB backlight and USB-C.",
    category: "gaming",
    image: "/assets/products/mechanical-keyboard.jpg",
    status: "live",
    startsInHours: -4 * 24,
    endsInHours: 72,
    votingDays: 7,
    maxUnitsPerBuyer: 2,
    tiers: [
      [1, 2490],
      [10, 2190],
      [20, 1890],
    ],
    shopperUnits: 7,
  },
  {
    key: "speaker",
    title: "Bluetooth Speaker",
    description: "Waterproof portable speaker with 20-hour battery and deep bass.",
    category: "electronics",
    image: "/assets/products/bluetooth-speaker.jpg",
    status: "seller_decision",
    startsInHours: -7 * 24 - 2,
    endsInHours: -2,
    votingDays: 7,
    maxUnitsPerBuyer: 3,
    tiers: [
      [1, 1490],
      [15, 1290],
      [30, 1090],
    ],
    shopperUnits: 18,
  },
  {
    key: "airfryer",
    title: "Air Fryer 5L",
    description: "5-litre air fryer with 8 presets and a dishwasher-safe basket.",
    category: "home-living",
    image: "/assets/products/air-fryer.jpg",
    status: "payment_window",
    startsInHours: -8 * 24,
    endsInHours: -24,
    votingDays: 7,
    maxUnitsPerBuyer: 3,
    tiers: [
      [1, 2490],
      [10, 2190],
      [20, 1890],
    ],
    shopperUnits: 21,
    paidShoppers: 4,
    declinedShoppers: 2,
  },
  {
    key: "band",
    title: "Fitness Band",
    description: "Slim fitness band with step, sleep and heart-rate tracking and a 14-day battery.",
    category: "sports",
    image: "/assets/products/fitness-band.jpg",
    status: "fulfilling",
    startsInHours: -13 * 24,
    endsInHours: -6 * 24,
    votingDays: 7,
    maxUnitsPerBuyer: 2,
    tiers: [
      [1, 1190],
      [8, 990],
      [15, 890],
    ],
    shopperUnits: 9,
    // One state per paying shopper, in order; the demo buyer's order is shipped.
    orderStates: ["delivered", "delivered", "paid", "paid", "shipped", "disputed"],
  },
  {
    key: "blender",
    title: "Portable Blender",
    description: "Rechargeable personal blender for smoothies on the go.",
    category: "home-living",
    image: "/assets/products/portable-blender.jpg",
    status: "pending_review",
    startsInHours: 24,
    endsInHours: 8 * 24,
    votingDays: 7,
    maxUnitsPerBuyer: 2,
    tiers: [
      [1, 790],
      [20, 690],
    ],
    shopperUnits: 0,
  },
  {
    key: "yoga",
    title: "Yoga Mat Bundle",
    description: "Non-slip yoga mat with a carry strap and two foam blocks.",
    category: "sports",
    image: "/assets/products/yoga-mat.jpg",
    status: "draft",
    startsInHours: 2 * 24,
    endsInHours: 9 * 24,
    votingDays: 7,
    maxUnitsPerBuyer: null,
    tiers: [
      [1, 690],
      [10, 590],
    ],
    shopperUnits: 0,
  },
];

/** The demo buyer's own votes, so My Groups has something to show. */
const BUYER_VOTES: Record<string, number> = { earbuds: 2, watch: 1, speaker: 1, airfryer: 2, band: 1 };


function accountId(email: string) {
  return `user_${email.split("@")[0].replace(/[^a-z0-9]/g, "")}`;
}

export function buildSeed(): Tables {
  const t = now();
  const iso = (offsetHours: number) => new Date(t + offsetHours * HOUR).toISOString();
  const createdAt = iso(-30 * 24);
  const tables = Object.fromEntries(TABLE_NAMES.map((name) => [name, []])) as unknown as Tables;

  for (const account of DEMO_ACCOUNTS) {
    const id = accountId(account.email);
    tables.accounts.push({
      id,
      email: account.email,
      passwordHash: hashPassword(account.email, DEMO_PASSWORD),
      createdAt,
    });
    tables.profiles.push({
      id,
      role: account.role,
      fullName: account.name,
      phone: "",
      status: "active",
      votingRestrictedUntil: null,
      createdAt,
    });
  }

  tables.sellerProfiles.push(
    {
      id: accountId("seller@groupbuy.test"),
      shopName: "Win Gadgets",
      description: "Gadgets and home goods at group prices.",
      applicationStatus: "approved",
      commissionRate: null,
      rejectionReason: null,
      createdAt,
    },
    {
      id: accountId("pending-seller@groupbuy.test"),
      shopName: "Ploy Crafts",
      description: "Handmade home decor.",
      applicationStatus: "pending",
      commissionRate: null,
      rejectionReason: null,
      createdAt: iso(-2),
    },
    ...SHOPS.map((shop) => ({
      id: accountId(shop.email),
      shopName: shop.shopName,
      description: shop.description,
      applicationStatus: "approved" as const,
      commissionRate: shop.commissionRate ?? null,
      rejectionReason: null,
      createdAt: iso(-shop.joinedDaysAgo * 24),
    }))
  );

  tables.addresses.push({
    id: "addr_buyer",
    userId: accountId("buyer@groupbuy.test"),
    recipient: "Buyer",
    phone: "081-234-5678",
    line1: "99/1 Sukhumvit Road",
    line2: "",
    district: "Khlong Toei",
    province: "Bangkok",
    postalCode: "10110",
    isDefault: true,
    createdAt,
  });

  CATEGORIES.forEach(([icon, name], index) => {
    const slug = slugify(name);
    tables.categories.push({ id: `cat_${slug}`, name, slug, icon, sortOrder: index });
  });

  const defaultSellerId = accountId("seller@groupbuy.test");
  const sellerByDeal = new Map(SHOPS.flatMap((shop) => shop.deals.map((key) => [key, accountId(shop.email)] as const)));
  const buyerId = accountId("buyer@groupbuy.test");
  const shopperIds = DEMO_ACCOUNTS.filter((account) => account.note === "Demo shopper").map(
    (account) => accountId(account.email)
  );

  for (const seed of SEED_DEALS) {
    const dealId = `deal_${seed.key}`;
    const hasVoting = !["draft", "pending_review"].includes(seed.status);
    const deal: Deal = {
      id: dealId,
      sellerId: sellerByDeal.get(seed.key) ?? defaultSellerId,
      categoryId: `cat_${seed.category}`,
      title: seed.title,
      description: seed.description,
      status: seed.status,
      votingDays: seed.votingDays,
      votingStartsAt: hasVoting ? iso(seed.startsInHours) : null,
      votingEndsAt: hasVoting ? iso(seed.endsInHours) : null,
      maxUnitsPerBuyer: seed.maxUnitsPerBuyer,
      unitsVotedAtClose: null,
      lockedTierId: null,
      lockedUnitPrice: null,
      decisionDeadline: null,
      paymentDeadline: null,
      decidedAt: null,
      cancelReason: null,
      reviewNote: seed.reviewNote ?? null,
      createdAt: iso(Math.min(seed.startsInHours, 0) - 24),
    };
    tables.deals.push(deal);
    tables.dealImages.push({ id: `img_${seed.key}`, dealId, src: seed.image, sortOrder: 0 });

    seed.tiers.forEach(([minUnits, price], index) => {
      const next = seed.tiers[index + 1];
      tables.dealTiers.push({
        id: `tier_${seed.key}_${index + 1}`,
        dealId,
        minUnits,
        maxUnits: next ? next[0] - 1 : null,
        unitPrice: baht(price),
      });
    });

    // Spread shopper units round-robin, respecting the per-buyer cap.
    const cap = seed.maxUnitsPerBuyer ?? 10;
    const perShopper = new Map<string, number>();
    let remaining = seed.shopperUnits;
    for (let i = 0; remaining > 0 && i < shopperIds.length * cap; i++) {
      const shopper = shopperIds[i % shopperIds.length];
      const current = perShopper.get(shopper) ?? 0;
      if (current < cap) {
        perShopper.set(shopper, current + 1);
        remaining--;
      }
    }

    const votes = [...perShopper];
    if (BUYER_VOTES[seed.key]) {
      votes.push([buyerId, BUYER_VOTES[seed.key]]);
    }
    votes.forEach(([voterId, quantity], index) => {
      const votedAt = iso(seed.startsInHours + 1 + index * 3);
      tables.votes.push({
        id: `vote_${seed.key}_${voterId}`,
        dealId,
        buyerId: voterId,
        quantity,
        status: "active",
        respondedAt: null,
        createdAt: votedAt,
        updatedAt: votedAt,
      });
    });

    if (["seller_decision", "payment_window", "fulfilling"].includes(seed.status)) {
      lockSeedDeal(tables, deal, seed, t);
    }
  }

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    tables.settings.push({ id: key as SettingKey, value });
  }

  seedNotifications(tables, t);

  return tables;
}

/** Puts a seeded deal past its voting deadline, as the deadline jobs would. */
function lockSeedDeal(tables: Tables, deal: Deal, seed: SeedDeal, t: number) {
  const iso = (offsetHours: number) => new Date(t + offsetHours * HOUR).toISOString();
  const votes = tables.votes.filter((vote) => vote.dealId === deal.id);
  const units = votes.reduce((sum, vote) => sum + vote.quantity, 0);
  const tiers = tables.dealTiers.filter((tier) => tier.dealId === deal.id).sort((a, b) => a.minUnits - b.minUnits);
  const tier = [...tiers].reverse().find((row) => units >= row.minUnits) ?? tiers[0];

  deal.unitsVotedAtClose = units;
  deal.lockedTierId = tier.id;
  deal.lockedUnitPrice = tier.unitPrice;
  deal.decisionDeadline = iso(seed.endsInHours + DEFAULT_SETTINGS.sellerDecisionHours);

  if (seed.status === "seller_decision") {
    return;
  }
  const decidedHours = seed.endsInHours + 2;
  deal.decidedAt = iso(decidedHours);
  deal.paymentDeadline = iso(decidedHours + DEFAULT_SETTINGS.paymentWindowHours);

  const makeOrder = (vote: Vote, index: number, status: OrderStatus): Order => {
    const respondedAt = iso(decidedHours + 1 + index);
    const total = tier.unitPrice * vote.quantity;
    const orderId = `order_${seed.key}_${index + 1}`;
    Object.assign(vote, { status: "paid", respondedAt, updatedAt: respondedAt });
    tables.payments.push({
      id: `pay_${seed.key}_${index + 1}`,
      orderId,
      provider: "mock",
      providerRef: `mock_seed_${seed.key}_${index + 1}`,
      method: index % 2 ? "card" : "promptpay",
      amount: total,
      status: "succeeded",
      createdAt: respondedAt,
    });
    const shipped = status !== "paid";
    const shippedAt = iso(decidedHours + 60 + index * 4);
    const deliveredAt = iso(decidedHours + 100 + index * 4);
    const isBuyer = vote.buyerId === "user_buyer";
    return {
      id: orderId,
      voteId: vote.id,
      dealId: deal.id,
      buyerId: vote.buyerId,
      sellerId: deal.sellerId,
      quantity: vote.quantity,
      unitPrice: tier.unitPrice,
      total,
      commissionRate: DEFAULT_SETTINGS.defaultCommissionRate,
      commissionAmount: Math.round((total * DEFAULT_SETTINGS.defaultCommissionRate) / 10_000),
      refundedAmount: 0,
      shippingAddress: isBuyer
        ? {
            recipient: "Buyer",
            phone: "081-234-5678",
            line1: "99/1 Sukhumvit Road",
            line2: "",
            district: "Khlong Toei",
            province: "Bangkok",
            postalCode: "10110",
          }
        : {
            recipient: vote.buyerId.replace("user_shopper", "Shopper "),
            phone: "080-000-0000",
            line1: `${index + 10} Rama IV Road`,
            line2: "",
            district: "Pathum Wan",
            province: "Bangkok",
            postalCode: "10330",
          },
      status,
      trackingNumber: shipped ? `TH${String(4_810_000 + index * 137).padStart(10, "0")}` : null,
      shippedAt: shipped ? shippedAt : null,
      deliveredAt: status === "delivered" ? deliveredAt : null,
      payableAt: status === "delivered" ? deliveredAt : null,
      payoutId: null,
      createdAt: respondedAt,
    };
  };

  const shopperVotes = votes.filter((vote) => vote.buyerId.startsWith("user_shopper"));

  if (seed.status === "fulfilling") {
    const states = seed.orderStates ?? [];
    shopperVotes.forEach((vote, index) => {
      const order = makeOrder(vote, index, states[index] ?? "paid");
      tables.orders.push(order);
      if (order.status === "disputed") {
        // A damaged-item dispute on a delivered order, for the admin queue.
        Object.assign(order, { deliveredAt: order.shippedAt, payableAt: null });
        tables.disputes.push({
          id: `dispute_${seed.key}_${index + 1}`,
          orderId: order.id,
          openedBy: vote.buyerId,
          reason: "damaged",
          details: "The strap arrived snapped and the screen has a crack.",
          status: "open",
          orderStatusBefore: "delivered",
          resolution: null,
          resolvedAt: null,
          refundAmount: null,
          createdAt: iso(decidedHours + 110),
        });
      }
    });
    const buyerVote = votes.find((vote) => vote.buyerId === "user_buyer");
    if (buyerVote) {
      const order = makeOrder(buyerVote, shopperVotes.length, "shipped");
      // Shipped two days ago, so it auto-confirms in five.
      order.shippedAt = new Date(t - 2 * 24 * HOUR).toISOString();
      tables.orders.push(order);
    }
    return;
  }

  shopperVotes.forEach((vote, index) => {
    if (index < (seed.paidShoppers ?? 0)) {
      tables.orders.push(makeOrder(vote, index, "paid"));
    } else if (index < (seed.paidShoppers ?? 0) + (seed.declinedShoppers ?? 0)) {
      const respondedAt = iso(decidedHours + 1 + index);
      Object.assign(vote, { status: "declined", respondedAt, updatedAt: respondedAt });
    }
  });
}

/** A starting inbox for each demo role, matching the seeded deals. */
function seedNotifications(tables: Tables, t: number) {
  const iso = (offsetHours: number) => new Date(t + offsetHours * HOUR).toISOString();
  const airfryer = tables.deals.find((deal) => deal.id === "deal_airfryer");
  const buyerAirfryer = tables.votes.find((vote) => vote.id === "vote_airfryer_user_buyer");
  const buyerBand = tables.orders.find((order) => order.dealId === "deal_band" && order.buyerId === "user_buyer");
  const disputed = tables.disputes[0];
  const rows: [string, string, Record<string, unknown>, number, boolean][] = [
    // [userId, type, payload, hours ago, read]
    ["user_buyer", "payment_requested", {
      dealId: "deal_airfryer",
      unitPrice: airfryer?.lockedUnitPrice,
      quantity: buyerAirfryer?.quantity,
      paymentDeadline: airfryer?.paymentDeadline,
    }, 22, false],
    ["user_buyer", "order_shipped", { orderId: buyerBand?.id, trackingNumber: buyerBand?.trackingNumber }, 48, false],
    ["user_seller", "decision_needed", { dealId: "deal_speaker", units: 19 }, 2, false],
    ["user_seller", "dispute_opened", { orderId: disputed?.orderId, reason: "damaged" }, 30, false],
    ["user_seller", "order_paid", { dealId: "deal_airfryer", orderId: "order_airfryer_1", quantity: 1 }, 21, true],
    ["user_seller", "deal_approved", { dealId: "deal_earbuds" }, 5 * 24, true],
    ["user_admin", "seller_applied", { sellerId: "user_pendingseller", shopName: "Ploy Crafts" }, 2, false],
    ["user_admin", "deal_submitted", { dealId: "deal_blender" }, 20, false],
    ["user_admin", "dispute_opened", { orderId: disputed?.orderId, reason: "damaged" }, 30, false],
  ];
  rows.forEach(([userId, type, payload, hoursAgo, read], index) => {
    tables.notifications.push({
      id: `ntf_seed_${index + 1}`,
      userId,
      type,
      payload,
      readAt: read ? iso(-hoursAgo + 1) : null,
      createdAt: iso(-hoursAgo),
    });
  });
}

registerSeeder(buildSeed);
