export type UserRole = "buyer" | "seller";

export type SessionUser = {
  name: string;
  email: string;
  role: UserRole;
};

const SESSION_KEY = "groupbuy_user";

let cachedRaw: string | null | undefined;
let cachedUser: SessionUser | null = null;

export function getSessionUser(): SessionUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (raw === cachedRaw) {
    return cachedUser;
  }

  cachedRaw = raw;
  if (!raw) {
    cachedUser = null;
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SessionUser>;
    if (!parsed.name || !parsed.email) {
      cachedUser = null;
      return null;
    }

    cachedUser = {
      name: parsed.name,
      email: parsed.email,
      role: parsed.role === "seller" ? "seller" : "buyer",
    };
    return cachedUser;
  } catch {
    cachedUser = null;
    return null;
  }
}

export function clearSessionUser() {
  window.localStorage.removeItem(SESSION_KEY);
  notifySessionChange();
}

export function notifySessionChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("groupbuy-auth-change"));
  }
}

export function subscribeSession(onStoreChange: () => void) {
  window.addEventListener("groupbuy-auth-change", onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener("groupbuy-auth-change", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}
