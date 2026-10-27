/**
 * Table row types for the localStorage store. They follow the data model in
 * CLAUDE.md (Part 3). Conventions:
 * - every row has a string `id`
 * - timestamps are ISO strings (UTC); format them in Asia/Bangkok for display
 * - money is an integer number of satang (฿1 = 100)
 * - rates are integer basis points (10% = 1000)
 */

export type UserRole = "buyer" | "seller" | "admin";

export type Satang = number;
export type BasisPoints = number;
export type IsoDate = string;

/** Login credentials. Replaces Supabase Auth for the demo. */
export type Account = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: IsoDate;
};

export type Profile = {
  /** Same as the account id */
  id: string;
  role: UserRole;
  fullName: string;
  phone: string;
  status: "active" | "suspended";
  votingRestrictedUntil: IsoDate | null;
  createdAt: IsoDate;
};

export type SellerApplicationStatus = "pending" | "approved" | "rejected" | "suspended";

export type SellerProfile = {
  /** Same as the seller's profile id */
  id: string;
  shopName: string;
  description: string;
  applicationStatus: SellerApplicationStatus;
  /** null means the platform default from settings */
  commissionRate: BasisPoints | null;
  rejectionReason: string | null;
  createdAt: IsoDate;
};

export type Address = {
  id: string;
  userId: string;
  recipient: string;
  phone: string;
  line1: string;
  line2: string;
  district: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
  createdAt: IsoDate;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  /** An icon name from app/components/shell/Icon.tsx (CATEGORY_ICONS) */
  icon: string;
  sortOrder: number;
};

export type DealStatus =
  | "draft"
  | "pending_review"
  | "rejected"
  | "live"
  | "seller_decision"
  | "payment_window"
  | "fulfilling"
  | "completed"
  | "cancelled";

export type Deal = {
  id: string;
  sellerId: string;
  categoryId: string;
  title: string;
  description: string;
  status: DealStatus;
  /** Length of the voting period; the clock starts when an admin approves the deal */
  votingDays: number;
  /** Set on approval (seed data may set them earlier) */
  votingStartsAt: IsoDate | null;
  votingEndsAt: IsoDate | null;
  maxUnitsPerBuyer: number | null;
  unitsVotedAtClose: number | null;
  lockedTierId: string | null;
  lockedUnitPrice: Satang | null;
  decisionDeadline: IsoDate | null;
  paymentDeadline: IsoDate | null;
  /** When the seller chose Proceed or Cancel, or the decision window ran out */
  decidedAt: IsoDate | null;
  cancelReason: "seller" | "decision_timeout" | null;
  /** Admin's note when rejecting a deal */
  reviewNote: string | null;
  createdAt: IsoDate;
};

export type DealImage = {
  id: string;
  dealId: string;
  /** A path under /public for now, e.g. /assets/watch.jpeg */
  src: string;
  sortOrder: number;
};

export type DealTier = {
  id: string;
  dealId: string;
  minUnits: number;
  /** null for the top tier */
  maxUnits: number | null;
  unitPrice: Satang;
};

export type VoteStatus = "active" | "withdrawn" | "paid" | "declined" | "expired" | "cancelled";

export type Vote = {
  id: string;
  dealId: string;
  buyerId: string;
  quantity: number;
  status: VoteStatus;
  respondedAt: IsoDate | null;
  createdAt: IsoDate;
  updatedAt: IsoDate;
};

export type ShippingAddressSnapshot = Omit<Address, "id" | "userId" | "isDefault" | "createdAt">;

export type OrderStatus = "paid" | "shipped" | "delivered" | "disputed" | "refunded";

export type Order = {
  id: string;
  voteId: string;
  dealId: string;
  buyerId: string;
  sellerId: string;
  quantity: number;
  unitPrice: Satang;
  total: Satang;
  /** Rate at the moment of payment; never changes */
  commissionRate: BasisPoints;
  /** Commission on (total - refundedAmount); recalculated after a refund */
  commissionAmount: Satang;
  refundedAmount: Satang;
  shippingAddress: ShippingAddressSnapshot;
  status: OrderStatus;
  trackingNumber: string | null;
  shippedAt: IsoDate | null;
  deliveredAt: IsoDate | null;
  /** Set once the order can be paid out to the seller */
  payableAt: IsoDate | null;
  payoutId: string | null;
  createdAt: IsoDate;
};

export type Payment = {
  id: string;
  /** null for a failed attempt that created no order */
  orderId: string | null;
  provider: "mock";
  providerRef: string;
  method: "promptpay" | "card";
  amount: Satang;
  /** "refund" rows record money returned to the buyer */
  status: "succeeded" | "failed" | "refund";
  createdAt: IsoDate;
};

export type Payout = {
  id: string;
  sellerId: string;
  amount: Satang;
  status: "pending" | "paid";
  paidAt: IsoDate | null;
  createdAt: IsoDate;
};

export type NoShowEvent = {
  id: string;
  buyerId: string;
  dealId: string;
  createdAt: IsoDate;
};

export type Dispute = {
  id: string;
  orderId: string;
  openedBy: string;
  reason: "not_delivered" | "damaged" | "wrong_item" | "other";
  details: string;
  status: "open" | "resolved";
  /** Order status when the dispute was opened, to return to if there is no full refund */
  orderStatusBefore: OrderStatus;
  resolution: string | null;
  resolvedAt: IsoDate | null;
  refundAmount: Satang | null;
  createdAt: IsoDate;
};

export type Notification = {
  id: string;
  userId: string;
  type: string;
  payload: Record<string, unknown>;
  readAt: IsoDate | null;
  createdAt: IsoDate;
};

export type SettingKey =
  | "votingPeriodMinDays"
  | "votingPeriodMaxDays"
  | "votingPeriodDefaultDays"
  | "sellerDecisionHours"
  | "paymentWindowHours"
  | "noShowLimit"
  | "noShowLookbackDays"
  | "noShowRestrictionDays"
  | "autoConfirmDeliveryDays"
  | "defaultCommissionRate";

export type Setting = {
  /** The setting key */
  id: SettingKey;
  value: number;
};

export type Tables = {
  accounts: Account[];
  profiles: Profile[];
  sellerProfiles: SellerProfile[];
  addresses: Address[];
  categories: Category[];
  deals: Deal[];
  dealImages: DealImage[];
  dealTiers: DealTier[];
  votes: Vote[];
  orders: Order[];
  payments: Payment[];
  payouts: Payout[];
  noShowEvents: NoShowEvent[];
  disputes: Dispute[];
  notifications: Notification[];
  settings: Setting[];
};

export type TableName = keyof Tables;
export type Row<T extends TableName> = Tables[T][number];
