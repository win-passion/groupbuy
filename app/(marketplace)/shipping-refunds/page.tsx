import HelpPage from "../../components/help/HelpPage";
import { ShippingRefunds } from "../../components/help/HelpContent";

export const metadata = { title: "Shipping & refunds · GroupBuy" };

export default function ShippingRefundsPage() {
  return (
    <HelpPage title="Shipping & refunds" text="How delivery works, and what happens if something goes wrong.">
      <ShippingRefunds />
    </HelpPage>
  );
}
