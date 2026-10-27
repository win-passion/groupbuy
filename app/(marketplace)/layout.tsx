import MarketplaceShell from "../components/shell/MarketplaceShell";

export default function MarketplaceLayout({ children }: LayoutProps<"/">) {
  return <MarketplaceShell>{children}</MarketplaceShell>;
}
