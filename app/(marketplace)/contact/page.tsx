import HelpPage from "../../components/help/HelpPage";
import { Contact } from "../../components/help/HelpContent";

export const metadata = { title: "Contact us · GroupBuy" };

export default function ContactPage() {
  return (
    <HelpPage title="Contact us" text="Questions about a deal, a payment or an order? We're happy to help.">
      <Contact />
    </HelpPage>
  );
}
