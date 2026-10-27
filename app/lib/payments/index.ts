/**
 * Payment provider boundary. Everything that talks to a payment provider goes
 * through this module so the provider can be swapped (Stripe or Opn Payments
 * are the candidates). For now it is a mock that charges instantly.
 *
 * A real provider is asynchronous and confirms PromptPay through a webhook;
 * when one is added, charge() becomes async and the store's pay action awaits it.
 */

export type PaymentMethod = "promptpay" | "card";

export type CardDetails = { number: string; expiry: string; cvc: string };

export type ChargeRequest = {
  method: PaymentMethod;
  /** Satang */
  amount: number;
  card?: CardDetails;
};

export type ChargeResult = { ok: true; providerRef: string } | { ok: false; error: string };

export const PROVIDER = "mock" as const;

/** Mock test cards, in the style of real provider test modes. */
export const TEST_CARDS = {
  success: "4242 4242 4242 4242",
  declined: "4000 0000 0000 0002",
};

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function validCard(card: CardDetails): string | null {
  const number = digits(card.number);
  if (number.length < 13 || number.length > 19) {
    return "Enter a valid card number.";
  }
  const expiry = card.expiry.match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!expiry || Number(expiry[1]) < 1 || Number(expiry[1]) > 12) {
    return "Enter the expiry as MM/YY.";
  }
  if (!/^\d{3,4}$/.test(card.cvc.trim())) {
    return "Enter the 3- or 4-digit security code.";
  }
  return null;
}

function reference() {
  return `mock_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function charge(request: ChargeRequest): ChargeResult {
  if (!Number.isInteger(request.amount) || request.amount <= 0) {
    return { ok: false, error: "Invalid amount." };
  }

  if (request.method === "card") {
    if (!request.card) {
      return { ok: false, error: "Enter your card details." };
    }
    const problem = validCard(request.card);
    if (problem) {
      return { ok: false, error: problem };
    }
    if (digits(request.card.number) === digits(TEST_CARDS.declined)) {
      return { ok: false, error: "Your card was declined. Try another card or PromptPay." };
    }
  }

  return { ok: true, providerRef: reference() };
}

/** Returns money to the buyer's original payment method. */
export function refund(request: { providerRef: string; amount: number }): ChargeResult {
  if (!Number.isInteger(request.amount) || request.amount <= 0) {
    return { ok: false, error: "Invalid refund amount." };
  }
  return { ok: true, providerRef: `${request.providerRef}_refund_${reference().slice(5, 11)}` };
}
