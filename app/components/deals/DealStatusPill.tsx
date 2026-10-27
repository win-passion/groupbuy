import { DealStatus } from "../../lib/store";
import { StatusPill } from "../ui";

const LABELS: Record<DealStatus, [string, "success" | "brand" | "muted" | "danger"]> = {
  draft: ["Draft", "muted"],
  pending_review: ["In review", "brand"],
  rejected: ["Changes requested", "danger"],
  live: ["Live", "success"],
  seller_decision: ["Decision needed", "brand"],
  payment_window: ["Collecting payments", "brand"],
  fulfilling: ["Shipping", "brand"],
  completed: ["Completed", "muted"],
  cancelled: ["Cancelled", "muted"],
};

export default function DealStatusPill({ status, votingClosed }: { status: DealStatus; votingClosed?: boolean }) {
  if (status === "live" && votingClosed) {
    return <StatusPill tone="brand">Voting closed</StatusPill>;
  }
  const [label, tone] = LABELS[status];
  return <StatusPill tone={tone}>{label}</StatusPill>;
}
