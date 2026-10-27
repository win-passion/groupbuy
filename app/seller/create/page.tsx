"use client";

import { BackLink, EmptyState, PageHeader } from "../../components/ui";
import { getSetting, useDb } from "../../lib/store";
import DealEditor from "../DealEditor";
import { useCanSell } from "../SellerStatusBanner";

export default function CreateDealPage() {
  const db = useDb();
  const canSell = useCanSell();

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:py-10">
      <BackLink href={"/seller"}>Back to dashboard</BackLink>
      <div className="mt-4">
        <PageHeader
          eyebrow="NEW CAMPAIGN"
          title="Create Group Deal"
          text="Set your price tiers and voting period. An admin reviews every deal before it goes live."
        />
      </div>
      <div className="mt-8">
        {db && !canSell && (
          <EmptyState
            icon="hourglass"
            title="Not approved yet"
            text="You can create deals once an admin approves your seller application."
            action={{ href: "/seller", label: "Back to dashboard" }}
          />
        )}
        {db && canSell && (
          <DealEditor
            initial={{
              title: "",
              description: "",
              categoryId: "",
              imageSrc: "",
              tiers: [{ minUnits: 1, unitPrice: 0 }],
              votingDays: getSetting(db, "votingPeriodDefaultDays"),
              maxUnitsPerBuyer: null,
            }}
          />
        )}
      </div>
    </div>
  );
}
