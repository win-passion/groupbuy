"use client";

import RequireRole from "../components/RequireRole";
import DashboardShell from "../components/shell/DashboardShell";
import { useSessionUser } from "../lib/store";

/** The inbox is shared by every role, so it uses the signed-in user's own dashboard layout. */
export default function NotificationsLayout({ children }: LayoutProps<"/notifications">) {
  const user = useSessionUser();

  return (
    <RequireRole>
      {user && <DashboardShell role={user.role}>{children}</DashboardShell>}
    </RequireRole>
  );
}
