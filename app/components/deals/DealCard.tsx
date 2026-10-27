import Link from "next/link";
import { DealSummary, formatTHB } from "../../lib/store";
import Icon from "../shell/Icon";
import Countdown from "./Countdown";
import TierProgress from "./TierProgress";

/** Marketplace card for a deal. `href` null renders a non-clickable preview. */
export default function DealCard({
  summary,
  href = `/deals/${summary.deal.id}`,
}: {
  summary: DealSummary;
  href?: string | null;
}) {
  const { deal, tiers, units, voters, currentTier, unitsToNextTier, nextTier, savingPercent, cover, category } = summary;
  const basePrice = tiers[0]?.unitPrice;
  const topReached = tiers.length > 1 && !nextTier;

  const body = (
    <>
      <div className="relative flex h-52 items-center justify-center overflow-hidden bg-gradient-to-b from-surface-subtle to-surface">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={deal.title}
            className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-500 group-hover:scale-105"
          />
        ) : (
          <Icon name="bag" className="h-14 w-14 text-subtle" strokeWidth={1.5} />
        )}

        {savingPercent > 0 && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-brand-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
            <Icon name="price-drop" className="h-3.5 w-3.5" />
            {savingPercent}% off
          </span>
        )}
        {category && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-surface/90 px-2.5 py-1 text-[11px] font-semibold text-muted-strong shadow-sm backdrop-blur">
            <Icon name={category.icon} className="h-3.5 w-3.5" />
            {category.name}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="inline-flex items-center gap-1 text-xs font-semibold text-subtle">
          <Icon name="store" className="h-3.5 w-3.5" />
          {summary.shopName}
        </p>

        <h3 className="mt-1.5 line-clamp-2 font-bold leading-snug">{deal.title}</h3>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold tracking-tight text-brand-500">
            {currentTier ? formatTHB(currentTier.unitPrice) : "—"}
          </span>
          {basePrice !== undefined && currentTier && currentTier.unitPrice < basePrice && (
            <span className="text-sm text-subtle line-through">{formatTHB(basePrice)}</span>
          )}
        </div>

        <div className="mt-4">
          <TierProgress tiers={tiers} units={units} size="sm" />
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <Icon name="users" className="h-3.5 w-3.5" />
            {units} units · {voters} {voters === 1 ? "buyer" : "buyers"}
          </span>
          {deal.votingEndsAt ? <Countdown until={deal.votingEndsAt} icon /> : <span>Not live yet</span>}
        </div>

        <p
          className={`mt-3 inline-flex min-h-7 items-center gap-1.5 self-start rounded-lg px-2 py-1 text-xs font-semibold ${
            nextTier || topReached ? "bg-brand-50 text-brand-700" : "text-transparent"
          }`}
        >
          {nextTier && unitsToNextTier !== null ? (
            <>
              <Icon name="zap" className="h-3.5 w-3.5" />
              {unitsToNextTier} more to unlock {formatTHB(nextTier.unitPrice)}
            </>
          ) : topReached ? (
            <>
              <Icon name="sparkles" className="h-3.5 w-3.5" />
              Best price unlocked
            </>
          ) : (
            "—"
          )}
        </p>

        <div className="mt-auto pt-4">
          <span className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 text-sm font-bold text-white transition group-hover:bg-brand-500">
            View deal
            <Icon name="arrow-right" className="h-4 w-4 motion-safe:transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </>
  );

  const className =
    "group flex flex-col overflow-hidden rounded-3xl border border-line/70 bg-surface shadow-sm motion-safe:animate-rise motion-safe:transition hover:-translate-y-1 hover:shadow-xl";

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
