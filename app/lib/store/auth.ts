import { nowIso } from "./clock";
import { Db, mutate, newId, requireDb, writeSessionAccountId } from "./db";
import { hashPassword } from "./hash";
import { notifyAdmins } from "./jobs";
import { SellerApplicationStatus, UserRole } from "./types";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** Sellers only: whether they may create deals yet */
  sellerStatus: SellerApplicationStatus | null;
  shopName: string | null;
};

export const ROLE_LABELS: Record<UserRole, string> = {
  buyer: "Buyer",
  seller: "Seller",
  admin: "Admin",
};

export function sessionUserFor(db: Db, accountId: string | null): SessionUser | null {
  if (!accountId) {
    return null;
  }
  const account = db.accounts.find((row) => row.id === accountId);
  const profile = db.profiles.find((row) => row.id === accountId);
  if (!account || !profile) {
    return null;
  }
  const seller = db.sellerProfiles.find((row) => row.id === accountId) ?? null;
  return {
    id: account.id,
    name: profile.fullName,
    email: account.email,
    role: profile.role,
    sellerStatus: profile.role === "seller" ? (seller?.applicationStatus ?? "pending") : null,
    shopName: seller?.shopName ?? null,
  };
}

type Result = { ok: true; user: SessionUser } | { ok: false; error: string };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function login(email: string, password: string): Result {
  const db = requireDb();
  const normalized = normalizeEmail(email);
  const account = db.accounts.find((row) => row.email === normalized);
  if (!account || account.passwordHash !== hashPassword(normalized, password)) {
    return { ok: false, error: "That email and password don't match." };
  }
  return loginAs(account.id);
}

/** Logs in without a password. Used by the dev panel's account switcher. */
export function loginAs(accountId: string): Result {
  const db = requireDb();
  const user = sessionUserFor(db, accountId);
  if (!user) {
    return { ok: false, error: "Account not found." };
  }
  const profile = db.profiles.find((row) => row.id === accountId);
  if (profile?.status === "suspended") {
    return { ok: false, error: "This account is suspended. Contact GroupBuy support." };
  }
  writeSessionAccountId(accountId);
  return { ok: true, user };
}

export function logout() {
  writeSessionAccountId(null);
}

export type RegisterInput = {
  role: "buyer" | "seller";
  name: string;
  email: string;
  password: string;
  /** Required for sellers */
  shopName?: string;
};

/** Public sign-up. Sellers start as a pending application; admins are never created here. */
export function register(input: RegisterInput): Result {
  const email = normalizeEmail(input.email);
  const name = input.name.trim();
  const shopName = input.shopName?.trim() ?? "";

  if (!name) {
    return { ok: false, error: "Please enter your name." };
  }
  if (input.password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }
  if (input.role === "seller" && !shopName) {
    return { ok: false, error: "Please enter your shop name." };
  }
  if (requireDb().accounts.some((row) => row.email === email)) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const id = newId("user");
  const createdAt = nowIso();
  mutate((tx) => {
    tx.insert("accounts", { id, email, passwordHash: hashPassword(email, input.password), createdAt });
    tx.insert("profiles", {
      id,
      role: input.role,
      fullName: name,
      phone: "",
      status: "active",
      votingRestrictedUntil: null,
      createdAt,
    });
    if (input.role === "seller") {
      tx.insert("sellerProfiles", {
        id,
        shopName,
        description: "",
        applicationStatus: "pending",
        commissionRate: null,
        rejectionReason: null,
        createdAt,
      });
      notifyAdmins(tx, "seller_applied", { sellerId: id, shopName });
    }
  });
  return loginAs(id);
}
