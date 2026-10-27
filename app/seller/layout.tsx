import RequireRole from "../components/RequireRole";
import DashboardShell from "../components/shell/DashboardShell";
import SellerStatusBanner from "./SellerStatusBanner";

export default function SellerLayout({ children }: LayoutProps<"/seller">) {
  return (
    <RequireRole role="seller">
      <DashboardShell role="seller">
        <SellerStatusBanner />
        {children}
      </DashboardShell>
    </RequireRole>
  );
}
