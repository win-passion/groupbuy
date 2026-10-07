export const DEFAULT_DEAL_IMAGE = "/assets/earphone.jpeg";

/** Matches homepage / product catalog so stored deals get the right thumbnail. */
export const DEAL_IMAGE_BY_NAME: Record<string, string> = {
  "Wireless Earbuds Pro": "/assets/earphone.jpeg",
  "Smart Watch Series 5": "/assets/watch.jpeg",
  "Coffee Maker": "/assets/Boncafe-Drip-Coffee-Maker-1.jpg",
  "Skincare Set": "/assets/skincareset.jpeg",
  "Portable Blender": "/assets/Boncafe-Drip-Coffee-Maker-1.jpg",
  "Yoga Mat Bundle": "/assets/skincareset.jpeg",
};

function resolveDealImage(raw: Partial<SellerDeal>): string {
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (name && DEAL_IMAGE_BY_NAME[name]) {
    return DEAL_IMAGE_BY_NAME[name];
  }
  if (typeof raw.image === "string" && raw.image.trim()) {
    return raw.image.trim();
  }
  return DEFAULT_DEAL_IMAGE;
}

export type SellerDeal = {
  id: string;
  name: string;
  description: string;
  image: string;
  normalPrice: number;
  priceAt20: number;
  priceAt50: number;
  endDate: string;
  joined: number;
  orders: number;
};

const STORAGE_KEY = "groupbuy_seller_deals";

const seedDeals: SellerDeal[] = [
  {
    id: "seed-1",
    name: "Wireless Earbuds Pro",
    description:
      "Premium wireless earbuds with active noise cancellation.",
    image: DEAL_IMAGE_BY_NAME["Wireless Earbuds Pro"],
    normalPrice: 500,
    priceAt20: 450,
    priceAt50: 390,
    endDate: "2026-10-20",
    joined: 42,
    orders: 31,
  },
  {
    id: "seed-2",
    name: "Smart Watch Series 5",
    description: "Fitness tracking smartwatch with heart-rate monitor.",
    image: DEAL_IMAGE_BY_NAME["Smart Watch Series 5"],
    normalPrice: 1990,
    priceAt20: 1690,
    priceAt50: 1490,
    endDate: "2026-10-18",
    joined: 38,
    orders: 24,
  },
  {
    id: "seed-3",
    name: "Coffee Maker",
    description: "Drip coffee maker for home brewing.",
    image: DEAL_IMAGE_BY_NAME["Coffee Maker"],
    normalPrice: 1290,
    priceAt20: 1090,
    priceAt50: 890,
    endDate: "2026-10-15",
    joined: 27,
    orders: 19,
  },
];

function toFiniteNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeDeal(raw: Partial<SellerDeal>, index: number): SellerDeal {
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : `deal-${index}`,
    name: typeof raw.name === "string" ? raw.name : "Untitled deal",
    description: typeof raw.description === "string" ? raw.description : "",
    image: resolveDealImage(raw),
    normalPrice: toFiniteNumber(raw.normalPrice),
    priceAt20: toFiniteNumber(raw.priceAt20),
    priceAt50: toFiniteNumber(raw.priceAt50),
    endDate: typeof raw.endDate === "string" ? raw.endDate : "",
    joined: toFiniteNumber(raw.joined),
    orders: toFiniteNumber(raw.orders),
  };
}

export function getCurrentPrice(deal: SellerDeal) {
  const joined = toFiniteNumber(deal.joined);
  if (joined >= 50) {
    return toFiniteNumber(deal.priceAt50, deal.normalPrice);
  }
  if (joined >= 20) {
    return toFiniteNumber(deal.priceAt20, deal.normalPrice);
  }
  return toFiniteNumber(deal.normalPrice);
}

export function loadSellerDeals(): SellerDeal[] {
  if (typeof window === "undefined") {
    return seedDeals;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedDeals));
    return seedDeals;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SellerDeal>[];
    if (!Array.isArray(parsed)) {
      return seedDeals;
    }
    const deals = parsed.map(normalizeDeal);
    const shouldPersist = deals.some(
      (deal, index) => parsed[index]?.image !== deal.image
    );
    if (shouldPersist) {
      saveSellerDeals(deals);
    }
    return deals;
  } catch {
    return seedDeals;
  }
}

export function saveSellerDeals(deals: SellerDeal[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
}

export function addSellerDeal(
  deal: Omit<SellerDeal, "id" | "joined" | "orders" | "image"> & {
    image?: string;
  }
): SellerDeal {
  const newDeal: SellerDeal = {
    ...deal,
    image: resolveDealImage({
      name: deal.name,
      image: deal.image?.trim() || undefined,
    }),
    normalPrice: toFiniteNumber(deal.normalPrice),
    priceAt20: toFiniteNumber(deal.priceAt20),
    priceAt50: toFiniteNumber(deal.priceAt50),
    id: `deal-${Date.now()}`,
    joined: 0,
    orders: 0,
  };

  const deals = loadSellerDeals();
  const next = [newDeal, ...deals];
  saveSellerDeals(next);
  return newDeal;
}

export function isDealActive(deal: SellerDeal) {
  const end = new Date(`${deal.endDate}T23:59:59`);
  return end.getTime() >= Date.now();
}
