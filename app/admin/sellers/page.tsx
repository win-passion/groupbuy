"use client";

import { useMemo, useState } from "react";
import { EmptyState, PageHeader, Skeleton, StatusPill } from "../../components/ui";
import { approveSeller, formatDate, getSetting, rejectSeller, SellerApplicationStatus, sellerDecisionStats, useDb } from "../../lib/store";
import ReviewActions from "../ReviewActions";
import CommissionEditor from "./CommissionEditor";

const FILTERS: { id: SellerApplicationStatus; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

const TONES = { pending: "brand", approved: "success", rejected: "danger", suspended: "muted" } as const;

export default function AdminSellersPage() {
  const db = useDb();
  const [filter, setFilter] = useState<SellerApplicationStatus>("pending");

  const sellers = useMemo(() => {
    if (!db) {
      return null;
    }
    return db.sellerProfiles
      .map((seller) => ({
        seller,
        profile: db.profiles.find((profile) => profile.id === seller.id),
        email: db.accounts.find((account) => account.id === seller.id)?.email ?? "",
        deals: db.deals.filter((deal) => deal.sellerId === seller.id).length,
        decisions: sellerDecisionStats(db, seller.id),
      }))
      .sort((a, b) => Date.parse(b.seller.createdAt) - Date.parse(a.seller.createdAt));
  }, [db]);

  const visible = (sellers ?? []).filter((row) => row.seller.applicationStatus === filter);

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:py-10">
      <PageHeader eyebrow="ADMIN" title="Seller applications" text="Approve sellers before they can create deals." />

      <div role="tablist" aria-label="Application status" className="mt-8 flex flex-wrap gap-2">
        {FILTERS.map((item) => {
          const selected = filter === item.id;
          const count = (sellers ?? []).filter((row) => row.seller.applicationStatus === item.id).length;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setFilter(item.id)}
              className={`rounded-full px-4 py-2 text-sm font-bold ${
                selected ? "bg-ink text-white" : "bg-surface text-muted-strong hover:text-ink"
              }`}
            >
              {item.label} <span className={selected ? "text-brand-300" : "text-subtle"}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 space-y-4">
        {!sellers ? (
          <Skeleton className="h-36" />
        ) : visible.length === 0 ? (
          <EmptyState
            icon="store"
            title={filter === "pending" ? "No applications waiting" : `No ${filter} sellers`}
            text="New seller sign-ups appear here for approval."
          />
        ) : (
          visible.map(({ seller, profile, email, deals, decisions }) => (
            <div key={seller.id} className="rounded-sheet bg-surface p-6 shadow-sm">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <StatusPill tone={TONES[seller.applicationStatus]}>{seller.applicationStatus}</StatusPill>
                  <h2 className="mt-3 text-xl font-extrabold">{seller.shopName}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {profile?.fullName} · {email} · applied {formatDate(seller.createdAt)} · {deals}{" "}
                    {deals === 1 ? "deal" : "deals"}
                  </p>
                  {seller.description && <p className="mt-3 text-sm leading-6 text-muted-strong">{seller.description}</p>}
                  {seller.applicationStatus === "approved" && (
                    <p className="mt-3 text-sm text-muted-strong">
                      Cancellation rate{" "}
                      <b className={decisions.cancelRate >= 30 ? "text-danger" : "text-ink"}>{decisions.cancelRate}%</b>
                      <span className="text-muted">
                        {" "}
                        · {decisions.cancelled} cancelled, {decisions.timedOut} timed out of {decisions.decided} decisions
                      </span>
                    </p>
                  )}
                  {seller.applicationStatus === "approved" && db && (
                    <CommissionEditor
                      key={`${seller.id}-${seller.commissionRate}`}
                      sellerId={seller.id}
                      rate={seller.commissionRate}
                      defaultRate={getSetting(db, "defaultCommissionRate")}
                    />
                  )}
                  {seller.rejectionReason && (
                    <p className="mt-3 text-sm text-danger">Reason: {seller.rejectionReason}</p>
                  )}
                </div>
                {seller.applicationStatus === "pending" && (
                  <div className="md:w-72">
                    <ReviewActions
                      onApprove={() => approveSeller(seller.id)}
                      onReject={(reason) => rejectSeller(seller.id, reason)}
                    />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
