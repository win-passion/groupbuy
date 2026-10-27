import HelpPage from "../../components/help/HelpPage";
import { HowItWorks } from "../../components/help/HelpContent";

export const metadata = { title: "How it works · GroupBuy" };

export default function HowItWorksPage() {
  return (
    <HelpPage title="How it works" text="Group buying in four steps: the more units everyone votes, the lower the price.">
      <HowItWorks />
    </HelpPage>
  );
}
