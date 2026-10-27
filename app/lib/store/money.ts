import { BasisPoints, Satang } from "./types";

export function baht(amount: number): Satang {
  return Math.round(amount * 100);
}

/** ฿1,200 or ฿1,200.50 */
export function formatTHB(amount: Satang) {
  const value = amount / 100;
  return `฿${value.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function percent(rate: BasisPoints) {
  return `${(rate / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
}

/** Commission on a total, rounded to the nearest satang. */
export function commissionOn(total: Satang, rate: BasisPoints): Satang {
  return Math.round((total * rate) / 10_000);
}
