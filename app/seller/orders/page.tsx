"use client";

import { useMemo, useState } from "react";
import OrderStatusPill from "../../components/deals/OrderStatusPill";
import { EmptyState, PageHeader, Skeleton } from "../../components/ui";
import { formatDate, formatTHB, Order, sellerNet, shipOrder, useDb, useSessionUser } from "../../lib/store";

const TABS = [
  { id: "to_ship", label: "To ship", statuses: ["paid"] },
  { id: "shipped", label: "Shipped", statuses: ["shipped"] },
  { id: "delivered", label: "Delivered", statuses: ["delivered"] },
  { id: "problems", label: "Problems", statuses: ["disputed", "refunded"] },
] as const;

type TabId = (typeof TABS)[number]["id"];

function ShipForm({ order }: { order: Order }) {
  const [tracking, setTracking] = useState("");
  const [error, setError] = useState("");

  function ship() {
    const result = shipOrder(order.id, tracking);
    setError(result.ok ? "" : result.error);
  }

  return (
    <div className="w-full sm:w-64">
      <label className="block text-xs font-bold text-muted-strong">
        Tracking number (optional)
        <input
          value={tracking}
          onChange={(event) => setTracking(event.target.value)}
          placeholder="e.g. TH0123456789"
          className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal outline-none focus:border-brand-500"
        />
      </label>
      <button
        type="button"
        onClick={ship}
        className="mt-2 w-full rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white hover:bg-brand-600"
      >
        Mark as shipped
      </button>
      {error && <p role="alert" className="mt-2 text-xs font-semibold text-danger">{error}</p>}
    </div>
  );
}

export default function SellerOrdersPage() {
  const db = useDb();
  const user = useSessionUser();
  const [chosenTab, setTab] = useState<TabId | null>(null);

  const orders = useMemo(() => {
    if (!db || !user) {
      return null;
    }
    return db.orders
      .filter((order) => order.sellerId === user.id)
      .map((order) => ({ order, deal: db.deals.find((deal) => deal.id === order.dealId) }))
      .sort((a, b) => Date.parse(a.order.createdAt) - Date.parse(b.order.createdAt));
  }, [db, user]);

  const inTab = (id: TabId) =>
    (orders ?? []).filter((row) =>
      (TABS.find((item) => item.id === id)!.statuses as readonly string[]).includes(row.order.status)
    );
  const tab = chosenTab ?? (inTab("to_ship").length > 0 || !orders?.length ? "to_ship" : "shipped");
  const visible = inTab(tab);

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:py-10">
      <PageHeader eyebrow="FULFILMENT" title="Orders" text="Ship every paid order to the buyer's address. Add tracking if you have it." />

      <div role="tablist" aria-label="Order status" className="mt-8 flex flex-wrap gap-2">
        {TABS.map((item) => {
          const selected = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(item.id)}
              className={`rounded-full px-4 py-2 text-sm font-bold ${
                selected ? "bg-ink text-white" : "bg-surface text-muted-strong hover:text-ink"
              }`}
            >
              {item.label} <span className={selected ? "text-brand-300" : "text-subtle"}>{inTab(item.id).length}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 space-y-4">
        {!orders ? (
          <Skeleton className="h-40" />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={tab === "to_ship" ? "done" : "box"}
            title={tab === "to_ship" ? "Nothing to ship" : "No orders here"}
            text="Orders appear once buyers confirm and pay for a deal you proceeded with."
          />
        ) : (
          visible.map(({ order, deal }) => {
            const address = order.shippingAddress;
            return (
              <div key={order.id} className="rounded-sheet bg-surface p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <OrderStatusPill status={order.status} paidOut={Boolean(order.payoutId)} />
                    <p className="mt-2 font-extrabold">
                      {order.quantity} × {deal?.title ?? "Deal"}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Order {order.id.slice(-6).toUpperCase()} · paid {formatDate(order.createdAt)} · {formatTHB(order.total)}
                      {order.refundedAmount > 0 && ` · ${formatTHB(order.refundedAmount)} refunded`} · you get{" "}
                      <b className="text-ink">{formatTHB(sellerNet(order))}</b>
                    </p>
                    <p className="mt-3 rounded-2xl bg-surface-subtle p-3 text-sm leading-6 text-muted-strong">
                      <b className="text-ink">{address.recipient}</b> · {address.phone}
                      <br />
                      {[address.line1, address.line2, address.district, address.province, address.postalCode]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {order.trackingNumber && (
                      <p className="mt-2 text-xs text-muted">Tracking: {order.trackingNumber}</p>
                    )}
                    {order.status === "disputed" && (
                      <p className="mt-2 text-sm font-semibold text-danger">
                        The buyer reported a problem. An admin will resolve it; payout waits until then.
                      </p>
                    )}
                  </div>
                  {order.status === "paid" && <ShipForm order={order} />}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
