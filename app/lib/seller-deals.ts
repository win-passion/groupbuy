export type SellerDeal = {
  id: string;
  name: string;
  description: string;
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
    name: "Portable Blender",
    description: "Blend smoothies anywhere with USB recharge.",
    normalPrice: 890,
    priceAt20: 690,
    priceAt50: 590,
    endDate: "2026-10-20",
    joined: 18,
    orders: 12,
  },
  {
    id: "seed-2",
    name: "Yoga Mat Bundle",
    description: "Non-slip mat with carry strap included.",
    normalPrice: 1290,
    priceAt20: 990,
    priceAt50: 790,
    endDate: "2026-10-15",
    joined: 34,
    orders: 28,
  },
];

export function getCurrentPrice(deal: SellerDeal) {
  if (deal.joined >= 50) {
    return deal.priceAt50;
  }
  if (deal.joined >= 20) {
    return deal.priceAt20;
  }
  return deal.normalPrice;
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
    return JSON.parse(raw) as SellerDeal[];
  } catch {
    return seedDeals;
  }
}

export function saveSellerDeals(deals: SellerDeal[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
}

export function addSellerDeal(
  deal: Omit<SellerDeal, "id" | "joined" | "orders">
): SellerDeal {
  const newDeal: SellerDeal = {
    ...deal,
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
