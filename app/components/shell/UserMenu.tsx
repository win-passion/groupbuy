"use client";

import { useRouter } from "next/navigation";
import { logout as endSession, ROLE_LABELS, SessionUser } from "../../lib/store";
import Icon from "./Icon";

export function Avatar({ user }: { user: SessionUser }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-200 text-sm font-bold text-brand-700">
      {user.name.charAt(0).toUpperCase()}
    </div>
  );
}

export function useLogout() {
  const router = useRouter();

  return () => {
    endSession();
    router.push("/");
  };
}

/** Avatar, name, role and a log-out button, for the dashboard sidebar. */
export default function UserMenu({ user }: { user: SessionUser }) {
  const logout = useLogout();

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface-subtle p-3">
      <Avatar user={user} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{user.name}</p>
        <p className="text-xs text-subtle">{ROLE_LABELS[user.role]}</p>
      </div>
      <button
        type="button"
        onClick={logout}
        aria-label="Log out"
        title="Log out"
        className="rounded-xl p-2 text-subtle hover:bg-surface hover:text-brand-500"
      >
        <Icon name="logout" />
      </button>
    </div>
  );
}
