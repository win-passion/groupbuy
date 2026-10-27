import RequireRole from "../components/RequireRole";
import DashboardShell from "../components/shell/DashboardShell";

export default function BuyerLayout({ children }: LayoutProps<"/">) {
  return (
    <RequireRole role="buyer">
      <DashboardShell role="buyer">{children}</DashboardShell>
    </RequireRole>
  );
}
