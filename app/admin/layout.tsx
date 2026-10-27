import RequireRole from "../components/RequireRole";
import DashboardShell from "../components/shell/DashboardShell";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <RequireRole role="admin">
      <DashboardShell role="admin">{children}</DashboardShell>
    </RequireRole>
  );
}
