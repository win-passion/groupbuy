"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { BackLink, EmptyState, PageHeader, Skeleton } from "../../../../components/ui";
import { dealToInput, useDb, useSessionUser } from "../../../../lib/store";
import DealEditor from "../../../DealEditor";

export default function EditDealPage() {
  const { id } = useParams<{ id: string }>();
  const db = useDb();
  const user = useSessionUser();
  const deal = useMemo(() => db?.deals.find((row) => row.id === id && row.sellerId === user?.id), [db, id, user]);
  // DealEditor copies these into its own state once, so later store updates don't reset the form.
  const initial = useMemo(() => (db && deal ? dealToInput(db, deal.id) : null), [db, deal]);

  const editable = deal && (deal.status === "draft" || deal.status === "rejected");

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:py-10">
      <BackLink href={`/seller/deals/${id}`}>Back to deal</BackLink>

      {!db || user === undefined ? (
        <Skeleton className="mt-6 h-96" />
      ) : !deal || !initial ? (
        <div className="mt-6">
          <EmptyState icon="ghost" title="Deal not found" text="It may have been deleted." action={{ href: "/seller", label: "Back to dashboard" }} />
        </div>
      ) : !editable ? (
        <div className="mt-6">
          <EmptyState
            icon="lock"
            title="This deal can't be edited"
            text="Only drafts and deals with requested changes can be edited. Withdraw it from review first if it's waiting for an admin."
            action={{ href: `/seller/deals/${id}`, label: "Back to deal" }}
          />
        </div>
      ) : (
        <>
          <div className="mt-4">
            <PageHeader eyebrow="EDIT DEAL" title={deal.title || "Untitled deal"} />
          </div>
          {deal.status === "rejected" && deal.reviewNote && (
            <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-5">
              <p className="font-bold text-brand-700">Admin feedback</p>
              <p className="mt-1 text-sm leading-6 text-muted-strong">{deal.reviewNote}</p>
            </div>
          )}
          <div className="mt-8">
            <DealEditor dealId={deal.id} initial={initial} />
          </div>
        </>
      )}
    </div>
  );
}
