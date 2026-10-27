import { DealTier, formatTHB } from "../../lib/store";

/**
 * Progress bar from 0 to the top tier, with a marker for each tier.
 * Reached markers are filled; the label under each shows its unit price.
 */
export default function TierProgress({
  tiers,
  units,
  size = "md",
}: {
  tiers: DealTier[];
  units: number;
  size?: "sm" | "md";
}) {
  const top = tiers[tiers.length - 1]?.minUnits ?? 1;
  // A single-tier deal is always at its only price.
  const scale = Math.max(top, 1);
  const filled = tiers.length <= 1 ? 100 : Math.min((units / scale) * 100, 100);
  const markers = tiers.filter((tier) => tier.minUnits > 1);
  const bar = size === "sm" ? "h-2" : "h-3";

  return (
    <div>
      <div
        role="progressbar"
        aria-label="Units voted toward the top price tier"
        aria-valuemin={0}
        aria-valuemax={scale}
        aria-valuenow={Math.min(units, scale)}
        className={`relative ${bar} rounded-full bg-surface-muted`}
      >
        <div
          className={`${bar} rounded-full bg-brand-500 motion-safe:transition-[width] motion-safe:duration-700`}
          style={{ width: `${filled}%` }}
        />
        {markers.map((tier) => {
          const reached = units >= tier.minUnits;
          return (
            <span
              key={tier.id}
              aria-hidden="true"
              className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${
                size === "sm" ? "h-3 w-3" : "h-4 w-4"
              } ${reached ? "border-surface bg-brand-600" : "border-brand-300 bg-surface"}`}
              style={{ left: `${(tier.minUnits / scale) * 100}%` }}
            />
          );
        })}
      </div>

      {size === "md" && markers.length > 0 && (
        <div className="relative mt-2 h-9 text-[11px]">
          {markers.map((tier, index) => {
            const left = (tier.minUnits / scale) * 100;
            const isLast = index === markers.length - 1 && left > 85;
            return (
              <div
                key={tier.id}
                className={`absolute whitespace-nowrap ${isLast ? "-translate-x-full text-right" : "-translate-x-1/2 text-center"}`}
                style={{ left: `${left}%` }}
              >
                <p className={`font-bold ${units >= tier.minUnits ? "text-brand-600" : "text-ink-soft"}`}>
                  {formatTHB(tier.unitPrice)}
                </p>
                <p className="text-subtle">{tier.minUnits}+ units</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
