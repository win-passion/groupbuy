import { auth } from "./auth-guard";
import { act } from "./act";
import { ActionResult, fail } from "./errors";
import { cancelAtDecision, notifyAdmins, notifyUser } from "./jobs";
import { CardDetails, charge, PaymentMethod, PROVIDER } from "../payments";
import { DAY, HOUR, now, nowIso } from "./clock";
import { Db, mutate, newId, requireDb, Tx } from "./db";
import { commissionOn, formatTHB } from "./money";
import { getSetting } from "./settings";
import { Address, Deal, Satang } from "./types";

/**
 * Write actions for deals, reviews and votes. Each one checks the signed-in
 * user's role and the spec's rules (CLAUDE.md Part 2), then writes in a single
 * mutate() call. They return a result instead of throwing, for easy UI use.
 */

export type { ActionResult };


// ---------------------------------------------------------------------------
// Deal input and validation
// ---------------------------------------------------------------------------

export type TierInput = { minUnits: number; unitPrice: Satang };

export type DealInput = {
  title: string;
  description: string;
  categoryId: string;
  imageSrc: string;
  tiers: TierInput[];
  votingDays: number;
  maxUnitsPerBuyer: number | null;
};

export type DealField = keyof DealInput;
export type DealErrors = Partial<Record<DealField, string>> & { tierRows?: Record<number, string> };

export const MAX_TIERS = 6;

/** Field-by-field problems with a deal; empty when it can be submitted. */
export function validateDeal(db: Db, input: DealInput): DealErrors {
  const errors: DealErrors = {};
  const tierRows: Record<number, string> = {};

  const title = input.title.trim();
  if (title.length < 3) {
    errors.title = "Give the deal a title of at least 3 characters.";
  } else if (title.length > 80) {
    errors.title = "Keep the title under 80 characters.";
  }
  if (input.description.trim().length < 10) {
    errors.description = "Describe the product in at least 10 characters.";
  }
  if (!db.categories.some((category) => category.id === input.categoryId)) {
    errors.categoryId = "Choose a category.";
  }
  if (!input.imageSrc.trim()) {
    errors.imageSrc = "Add a product image.";
  }

  const minDays = getSetting(db, "votingPeriodMinDays");
  const maxDays = getSetting(db, "votingPeriodMaxDays");
  if (!Number.isInteger(input.votingDays) || input.votingDays < minDays || input.votingDays > maxDays) {
    errors.votingDays = `Voting must last ${minDays}–${maxDays} days.`;
  }

  if (
    input.maxUnitsPerBuyer !== null &&
    (!Number.isInteger(input.maxUnitsPerBuyer) || input.maxUnitsPerBuyer < 1)
  ) {
    errors.maxUnitsPerBuyer = "Use a whole number of at least 1, or leave it empty for no limit.";
  }

  const tiers = input.tiers;
  if (tiers.length === 0) {
    errors.tiers = "Add at least one price tier.";
  } else if (tiers.length > MAX_TIERS) {
    errors.tiers = `Use at most ${MAX_TIERS} tiers.`;
  }
  tiers.forEach((tier, index) => {
    const previous = tiers[index - 1];
    if (!Number.isInteger(tier.unitPrice) || tier.unitPrice <= 0) {
      tierRows[index] = "Enter a price above ฿0.";
    } else if (!Number.isInteger(tier.minUnits) || tier.minUnits < 1) {
      tierRows[index] = "Units must be a whole number of at least 1.";
    } else if (index === 0 && tier.minUnits !== 1) {
      tierRows[index] = "The first tier must start at 1 unit.";
    } else if (previous && tier.minUnits <= previous.minUnits) {
      tierRows[index] = `Must start above ${previous.minUnits} units.`;
    } else if (previous && tier.unitPrice >= previous.unitPrice) {
      tierRows[index] = `Must be cheaper than ${formatTHB(previous.unitPrice)}.`;
    }
  });
  if (Object.keys(tierRows).length > 0) {
    errors.tierRows = tierRows;
  }

  return errors;
}

export function hasErrors(errors: DealErrors) {
  return Object.keys(errors).length > 0;
}

/** The editable fields of a stored deal, for the edit form. */
export function dealToInput(db: Db, dealId: string): DealInput | null {
  const deal = db.deals.find((row) => row.id === dealId);
  if (!deal) {
    return null;
  }
  return {
    title: deal.title,
    description: deal.description,
    categoryId: deal.categoryId,
    imageSrc:
      db.dealImages.filter((image) => image.dealId === dealId).sort((a, b) => a.sortOrder - b.sortOrder)[0]
        ?.src ?? "",
    tiers: db.dealTiers
      .filter((tier) => tier.dealId === dealId)
      .sort((a, b) => a.minUnits - b.minUnits)
      .map(({ minUnits, unitPrice }) => ({ minUnits, unitPrice })),
    votingDays: deal.votingDays,
    maxUnitsPerBuyer: deal.maxUnitsPerBuyer,
  };
}

// ---------------------------------------------------------------------------
// Seller actions
// ---------------------------------------------------------------------------

const EDITABLE: Deal["status"][] = ["draft", "rejected"];

function ownDeal(db: Db, sellerId: string, dealId: string): Deal {
  const deal = db.deals.find((row) => row.id === dealId);
  if (!deal || deal.sellerId !== sellerId) {
    fail("Deal not found.");
  }
  return deal;
}

function writeDealContent(tx: Tx, dealId: string, input: DealInput) {
  for (const tier of tx.all("dealTiers").filter((row) => row.dealId === dealId)) {
    tx.remove("dealTiers", tier.id);
  }
  input.tiers.forEach((tier, index) => {
    const next = input.tiers[index + 1];
    tx.insert("dealTiers", {
      id: newId("tier"),
      dealId,
      minUnits: tier.minUnits,
      maxUnits: next ? next.minUnits - 1 : null,
      unitPrice: tier.unitPrice,
    });
  });

  for (const image of tx.all("dealImages").filter((row) => row.dealId === dealId)) {
    tx.remove("dealImages", image.id);
  }
  tx.insert("dealImages", { id: newId("img"), dealId, src: input.imageSrc.trim(), sortOrder: 0 });
}

/**
 * Creates a draft, or saves changes to a draft or rejected deal (which returns
 * it to draft). Drafts may be incomplete; submitting checks everything.
 */
export function saveDealDraft(input: DealInput, dealId?: string): ActionResult<string> {
  return act(() => {
    const db = requireDb();
    const seller = auth(db).approvedSeller();
    if (input.title.trim().length === 0) {
      fail("Give the deal a title before saving.");
    }

    const fields = {
      title: input.title.trim(),
      description: input.description.trim(),
      categoryId: input.categoryId,
      votingDays: input.votingDays,
      maxUnitsPerBuyer: input.maxUnitsPerBuyer,
    };

    return mutate((tx) => {
      if (dealId) {
        const deal = ownDeal(db, seller.id, dealId);
        if (!EDITABLE.includes(deal.status)) {
          fail("Only drafts and rejected deals can be edited.");
        }
        tx.update("deals", dealId, { ...fields, status: "draft" });
        writeDealContent(tx, dealId, input);
        return dealId;
      }

      const id = newId("deal");
      tx.insert("deals", {
        id,
        sellerId: seller.id,
        ...fields,
        status: "draft",
        votingStartsAt: null,
        votingEndsAt: null,
        unitsVotedAtClose: null,
        lockedTierId: null,
        lockedUnitPrice: null,
        decisionDeadline: null,
        paymentDeadline: null,
        decidedAt: null,
        cancelReason: null,
        reviewNote: null,
        createdAt: nowIso(),
      });
      writeDealContent(tx, id, input);
      return id;
    });
  });
}

export function submitDealForReview(dealId: string): ActionResult {
  return act(() => {
    const db = requireDb();
    const seller = auth(db).approvedSeller();
    const deal = ownDeal(db, seller.id, dealId);
    if (!EDITABLE.includes(deal.status)) {
      fail("This deal has already been submitted.");
    }
    const input = dealToInput(db, dealId);
    if (!input || hasErrors(validateDeal(db, input))) {
      fail("Fix the highlighted problems before submitting.");
    }
    mutate((tx) => {
      tx.update("deals", dealId, { status: "pending_review" });
      notifyAdmins(tx, "deal_submitted", { dealId });
    });
    return undefined;
  });
}

/** Pulls a deal back from the review queue so it can be edited. */
export function withdrawFromReview(dealId: string): ActionResult {
  return act(() => {
    const db = requireDb();
    const seller = auth(db).seller();
    const deal = ownDeal(db, seller.id, dealId);
    if (deal.status !== "pending_review") {
      fail("This deal is not waiting for review.");
    }
    mutate((tx) => {
      tx.update("deals", dealId, { status: "draft" });
    });
    return undefined;
  });
}

export function deleteDraft(dealId: string): ActionResult {
  return act(() => {
    const db = requireDb();
    const seller = auth(db).seller();
    const deal = ownDeal(db, seller.id, dealId);
    if (!EDITABLE.includes(deal.status)) {
      fail("Only drafts and rejected deals can be deleted.");
    }
    mutate((tx) => {
      for (const table of ["dealTiers", "dealImages"] as const) {
        for (const row of tx.all(table).filter((item) => item.dealId === dealId)) {
          tx.remove(table, row.id);
        }
      }
      tx.remove("deals", dealId);
    });
    return undefined;
  });
}

// ---------------------------------------------------------------------------
// Admin actions
// ---------------------------------------------------------------------------

export function approveSeller(sellerId: string): ActionResult {
  return act(() => {
    const db = requireDb();
    auth(db).admin();
    if (!db.sellerProfiles.some((row) => row.id === sellerId)) {
      fail("Seller not found.");
    }
    mutate((tx) => {
      tx.update("sellerProfiles", sellerId, { applicationStatus: "approved", rejectionReason: null });
      notifyUser(tx, sellerId, "seller_approved", {});
    });
    return undefined;
  });
}

export function rejectSeller(sellerId: string, reason: string): ActionResult {
  return act(() => {
    const db = requireDb();
    auth(db).admin();
    if (!reason.trim()) {
      fail("Give the seller a reason.");
    }
    if (!db.sellerProfiles.some((row) => row.id === sellerId)) {
      fail("Seller not found.");
    }
    mutate((tx) => {
      tx.update("sellerProfiles", sellerId, {
        applicationStatus: "rejected",
        rejectionReason: reason.trim(),
      });
      notifyUser(tx, sellerId, "seller_rejected", { reason: reason.trim() });
    });
    return undefined;
  });
}

function dealInReview(db: Db, dealId: string): Deal {
  const deal = db.deals.find((row) => row.id === dealId);
  if (!deal || deal.status !== "pending_review") {
    fail("This deal is not waiting for review.");
  }
  return deal;
}

/** Puts the deal live; the voting period starts now. */
export function approveDeal(dealId: string): ActionResult {
  return act(() => {
    const db = requireDb();
    auth(db).admin();
    const deal = dealInReview(db, dealId);
    const start = now();
    mutate((tx) => {
      tx.update("deals", dealId, {
        status: "live",
        reviewNote: null,
        votingStartsAt: new Date(start).toISOString(),
        votingEndsAt: new Date(start + deal.votingDays * DAY).toISOString(),
      });
      notifyUser(tx, deal.sellerId, "deal_approved", { dealId });
    });
    return undefined;
  });
}

export function rejectDeal(dealId: string, note: string): ActionResult {
  return act(() => {
    const db = requireDb();
    auth(db).admin();
    const deal = dealInReview(db, dealId);
    if (!note.trim()) {
      fail("Tell the seller what to change.");
    }
    mutate((tx) => {
      tx.update("deals", dealId, { status: "rejected", reviewNote: note.trim() });
      notifyUser(tx, deal.sellerId, "deal_rejected", { dealId, note: note.trim() });
    });
    return undefined;
  });
}

// ---------------------------------------------------------------------------
// Buyer actions
// ---------------------------------------------------------------------------

/** Why voting is closed for this deal right now, or null when it's open. */
export function votingClosedReason(deal: Deal, at = now()): string | null {
  if (deal.status !== "live" || !deal.votingStartsAt || !deal.votingEndsAt) {
    return "This deal is not open for voting.";
  }
  if (at < Date.parse(deal.votingStartsAt)) {
    return "Voting has not started yet.";
  }
  if (at >= Date.parse(deal.votingEndsAt)) {
    return "Voting has closed for this deal.";
  }
  return null;
}

/** Creates or changes the buyer's vote. One vote per buyer per deal. */
export function castVote(dealId: string, quantity: number): ActionResult {
  return act(() => {
    const db = requireDb();
    const buyer = auth(db).voter();
    const deal = db.deals.find((row) => row.id === dealId);
    if (!deal) {
      fail("Deal not found.");
    }
    const closed = votingClosedReason(deal);
    if (closed) {
      fail(closed);
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      fail("Choose at least 1 unit.");
    }
    if (deal.maxUnitsPerBuyer !== null && quantity > deal.maxUnitsPerBuyer) {
      fail(`You can vote for up to ${deal.maxUnitsPerBuyer} units on this deal.`);
    }

    const existing = db.votes.find((vote) => vote.dealId === dealId && vote.buyerId === buyer.id);
    const at = nowIso();
    mutate((tx) => {
      if (existing) {
        tx.update("votes", existing.id, { quantity, status: "active", updatedAt: at });
      } else {
        tx.insert("votes", {
          id: newId("vote"),
          dealId,
          buyerId: buyer.id,
          quantity,
          status: "active",
          respondedAt: null,
          createdAt: at,
          updatedAt: at,
        });
      }
    });
    return undefined;
  });
}

export function withdrawVote(dealId: string): ActionResult {
  return act(() => {
    const db = requireDb();
    const buyer = auth(db).buyer();
    const deal = db.deals.find((row) => row.id === dealId);
    if (!deal) {
      fail("Deal not found.");
    }
    const closed = votingClosedReason(deal);
    if (closed) {
      fail(closed);
    }
    const vote = db.votes.find(
      (row) => row.dealId === dealId && row.buyerId === buyer.id && row.status === "active"
    );
    if (!vote) {
      fail("You haven't voted on this deal.");
    }
    mutate((tx) => {
      tx.update("votes", vote.id, { status: "withdrawn", updatedAt: nowIso() });
    });
    return undefined;
  });
}


// ---------------------------------------------------------------------------
// After the deadline: seller decision
// ---------------------------------------------------------------------------

function dealAwaitingDecision(db: Db, sellerId: string, dealId: string): Deal {
  const deal = ownDeal(db, sellerId, dealId);
  if (deal.status !== "seller_decision") {
    fail("This deal is not waiting for your decision.");
  }
  return deal;
}

/** Opens the payment window and asks every voter to confirm and pay. */
export function proceedDeal(dealId: string): ActionResult {
  return act(() => {
    const db = requireDb();
    const seller = auth(db).seller();
    const deal = dealAwaitingDecision(db, seller.id, dealId);
    const at = now();
    const paymentDeadline = new Date(at + getSetting(db, "paymentWindowHours") * HOUR).toISOString();
    mutate((tx) => {
      tx.update("deals", dealId, { status: "payment_window", decidedAt: new Date(at).toISOString(), paymentDeadline });
      for (const vote of tx.all("votes").filter((row) => row.dealId === dealId && row.status === "active")) {
        notifyUser(tx, vote.buyerId, "payment_requested", {
          dealId,
          unitPrice: deal.lockedUnitPrice,
          quantity: vote.quantity,
          paymentDeadline,
        });
      }
    });
    return undefined;
  });
}

/** The only point where a seller can cancel. Nobody has paid yet. */
export function cancelDeal(dealId: string): ActionResult {
  return act(() => {
    const db = requireDb();
    const seller = auth(db).seller();
    const deal = dealAwaitingDecision(db, seller.id, dealId);
    mutate((tx) => cancelAtDecision(tx, deal, "seller", now()));
    return undefined;
  });
}

// ---------------------------------------------------------------------------
// Payment window: buyer confirms and pays, or declines
// ---------------------------------------------------------------------------

export type AddressInput = Omit<Address, "id" | "userId" | "isDefault" | "createdAt">;

export function addAddress(input: AddressInput): ActionResult<string> {
  return act(() => {
    const db = requireDb();
    const buyer = auth(db).buyer();
    const required: (keyof AddressInput)[] = ["recipient", "phone", "line1", "district", "province", "postalCode"];
    if (required.some((key) => !input[key].trim())) {
      fail("Fill in every address field except line 2.");
    }
    if (!/^\d{5}$/.test(input.postalCode.trim())) {
      fail("Postal code must be 5 digits.");
    }
    const id = newId("addr");
    const isDefault = !db.addresses.some((address) => address.userId === buyer.id);
    const trimmed = Object.fromEntries(
      Object.entries(input).map(([key, value]) => [key, value.trim()])
    ) as AddressInput;
    mutate((tx) => {
      tx.insert("addresses", { id, userId: buyer.id, ...trimmed, isDefault, createdAt: nowIso() });
    });
    return id;
  });
}

function voteAwaitingPayment(db: Db, buyerId: string, dealId: string) {
  const deal = db.deals.find((row) => row.id === dealId);
  if (!deal) {
    fail("Deal not found.");
  }
  if (deal.status !== "payment_window" || !deal.paymentDeadline || now() >= Date.parse(deal.paymentDeadline)) {
    fail("The payment window for this deal is closed.");
  }
  const vote = db.votes.find((row) => row.dealId === dealId && row.buyerId === buyerId);
  if (!vote || vote.status !== "active") {
    fail(vote?.status === "paid" ? "You've already paid for this deal." : "You have no payment to confirm on this deal.");
  }
  return { deal, vote };
}

export type PayInput = { method: PaymentMethod; addressId: string; card?: CardDetails };

/** Charges the full voted quantity at the locked price and creates the order. */
export function payForVote(dealId: string, input: PayInput): ActionResult<string> {
  return act(() => {
    const db = requireDb();
    const buyer = auth(db).buyer();
    const { deal, vote } = voteAwaitingPayment(db, buyer.id, dealId);
    const address = db.addresses.find((row) => row.id === input.addressId && row.userId === buyer.id);
    if (!address) {
      fail("Choose a delivery address.");
    }
    const unitPrice = deal.lockedUnitPrice;
    if (unitPrice === null) {
      fail("This deal has no final price yet.");
    }

    const total = unitPrice * vote.quantity;
    const result = charge({ method: input.method, amount: total, card: input.card });
    const at = nowIso();

    if (!result.ok) {
      // Record the failed attempt; the vote stays open so the buyer can retry.
      mutate((tx) => {
        tx.insert("payments", {
          id: newId("pay"),
          orderId: null,
          provider: PROVIDER,
          providerRef: "",
          method: input.method,
          amount: total,
          status: "failed",
          createdAt: at,
        });
      });
      fail(result.error);
    }

    const sellerRate = db.sellerProfiles.find((row) => row.id === deal.sellerId)?.commissionRate;
    const commissionRate = sellerRate ?? getSetting(db, "defaultCommissionRate");
    const orderId = newId("order");
    const { recipient, phone, line1, line2, district, province, postalCode } = address;

    mutate((tx) => {
      tx.insert("orders", {
        id: orderId,
        voteId: vote.id,
        dealId,
        buyerId: buyer.id,
        sellerId: deal.sellerId,
        quantity: vote.quantity,
        unitPrice,
        total,
        commissionRate,
        commissionAmount: commissionOn(total, commissionRate),
        refundedAmount: 0,
        shippingAddress: { recipient, phone, line1, line2, district, province, postalCode },
        status: "paid",
        trackingNumber: null,
        shippedAt: null,
        deliveredAt: null,
        payableAt: null,
        payoutId: null,
        createdAt: at,
      });
      tx.insert("payments", {
        id: newId("pay"),
        orderId,
        provider: PROVIDER,
        providerRef: result.providerRef,
        method: input.method,
        amount: total,
        status: "succeeded",
        createdAt: at,
      });
      tx.update("votes", vote.id, { status: "paid", respondedAt: at, updatedAt: at });
      notifyUser(tx, deal.sellerId, "order_paid", { dealId, orderId, quantity: vote.quantity });
    });
    return orderId;
  });
}

/** "No, cancel": never penalised, unlike letting the window expire. */
export function declinePayment(dealId: string): ActionResult {
  return act(() => {
    const db = requireDb();
    const buyer = auth(db).buyer();
    const { vote } = voteAwaitingPayment(db, buyer.id, dealId);
    const at = nowIso();
    mutate((tx) => {
      tx.update("votes", vote.id, { status: "declined", respondedAt: at, updatedAt: at });
    });
    return undefined;
  });
}

/** Admin: lets a buyer vote again before their restriction ends. */
export function liftVotingRestriction(buyerId: string): ActionResult {
  return act(() => {
    const db = requireDb();
    auth(db).admin();
    if (!db.profiles.some((row) => row.id === buyerId)) {
      fail("User not found.");
    }
    mutate((tx) => {
      tx.update("profiles", buyerId, { votingRestrictedUntil: null });
      notifyUser(tx, buyerId, "voting_restored", {});
    });
    return undefined;
  });
}
