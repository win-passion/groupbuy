import { Setting, SettingKey } from "./types";

/** Starting values only; admins change them on the settings page. */
export const DEFAULT_SETTINGS: Record<SettingKey, number> = {
  votingPeriodMinDays: 1,
  votingPeriodMaxDays: 14,
  votingPeriodDefaultDays: 7,
  sellerDecisionHours: 12,
  paymentWindowHours: 48,
  noShowLimit: 3,
  noShowLookbackDays: 90,
  noShowRestrictionDays: 30,
  autoConfirmDeliveryDays: 7,
  /** Basis points: 1000 = 10% */
  defaultCommissionRate: 1000,
};

/** Works with a Db snapshot, or inside mutate() as getSetting({ settings: tx.all("settings") }, key). */
export function getSetting(db: { settings: readonly Setting[] }, key: SettingKey): number {
  return db.settings.find((setting) => setting.id === key)?.value ?? DEFAULT_SETTINGS[key];
}
