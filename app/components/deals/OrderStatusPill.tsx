import { OrderStatus } from "../../lib/store";
import { StatusPill } from "../ui";

const LABELS: Record<OrderStatus, [string, "success" | "brand" | "muted" | "danger"]> = {
  paid: ["Paid · waiting to ship", "brand"],
  shipped: ["Shipped", "brand"],
  delivered: ["Delivered", "success"],
  disputed: ["Problem reported", "danger"],
  refunded: ["Refunded", "muted"],
};

export default function OrderStatusPill({ status, paidOut }: { status: OrderStatus; paidOut?: boolean }) {
  if (paidOut) {
    return <StatusPill tone="success">Paid out</StatusPill>;
  }
  const [label, tone] = LABELS[status];
  return <StatusPill tone={tone}>{label}</StatusPill>;
}
