import HelpPage from "../../components/help/HelpPage";
import { Faq } from "../../components/help/HelpContent";

export const metadata = { title: "FAQ · GroupBuy" };

export default function FaqPage() {
  return (
    <HelpPage title="Frequently asked questions" text="Quick answers about voting, paying and selling on GroupBuy.">
      <Faq />
    </HelpPage>
  );
}
