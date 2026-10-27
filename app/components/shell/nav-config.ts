import { SessionUser, UserRole } from "../../lib/store";
import { IconName } from "./Icon";

export type NavItem = {
  label: string;
  href: string;
  icon: IconName;
  /** Also highlight this item on its own sub-paths */
  matchPrefix?: boolean;
  /** Other path prefixes that highlight this item, e.g. /seller/deals */
  alsoMatches?: string[];
};

/** Sidebar and bottom tab items for each role's dashboard area. */
export const DASHBOARD_NAV: Record<UserRole, NavItem[]> = {
  buyer: [
    { label: "Deals", href: "/", icon: "home" },
    { label: "My Groups", href: "/my-groups", icon: "users", alsoMatches: ["/pay"] },
    { label: "Orders", href: "/orders", icon: "box", matchPrefix: true },
  ],
  seller: [
    { label: "Dashboard", href: "/seller", icon: "grid", alsoMatches: ["/seller/deals"] },
    { label: "New Deal", href: "/seller/create", icon: "plus" },
    { label: "Orders", href: "/seller/orders", icon: "box" },
    { label: "Earnings", href: "/seller/earnings", icon: "wallet" },
    { label: "Marketplace", href: "/", icon: "home" },
  ],
  admin: [
    { label: "Dashboard", href: "/admin", icon: "shield" },
    { label: "Sellers", href: "/admin/sellers", icon: "store" },
    { label: "Deal Review", href: "/admin/deals", icon: "check" },
    { label: "Disputes", href: "/admin/disputes", icon: "alert" },
    { label: "Payouts", href: "/admin/payouts", icon: "wallet" },
    { label: "Users", href: "/admin/users", icon: "users" },
    { label: "Categories", href: "/admin/categories", icon: "tag" },
    { label: "Settings", href: "/admin/settings", icon: "gear" },
    { label: "Marketplace", href: "/", icon: "home" },
  ],
};

export const DASHBOARD_TITLES: Record<UserRole, string> = {
  buyer: "My Account",
  seller: "Seller Center",
  admin: "Admin",
};

/** Bottom tab items on the public marketplace pages (phones only). */
export function marketplaceTabs(user: SessionUser | null): NavItem[] {
  const home: NavItem = { label: "Deals", href: "/", icon: "home" };

  if (!user) {
    return [
      home,
      { label: "Log in", href: "/login", icon: "user" },
      { label: "Sign up", href: "/register", icon: "plus" },
    ];
  }

  if (user.role === "seller") {
    return [home, { label: "Seller Center", href: "/seller", icon: "grid", matchPrefix: true }];
  }

  if (user.role === "admin") {
    return [home, { label: "Admin", href: "/admin", icon: "shield", matchPrefix: true }];
  }

  return [home, { label: "My Groups", href: "/my-groups", icon: "users" }];
}

export function isActive(item: NavItem, pathname: string) {
  const path = item.href.split("?")[0];
  if (pathname === path) {
    return true;
  }
  if (item.matchPrefix && pathname.startsWith(`${path}/`)) {
    return true;
  }
  return (item.alsoMatches ?? []).some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
