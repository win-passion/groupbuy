import Link from "next/link";
import Icon from "./Icon";

/** Brand mark (orange tile with a bag) plus the GroupBuy wordmark. */
export default function Logo({ className = "text-xl", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" aria-label="GroupBuy home" className={`inline-flex items-center gap-2 font-extrabold tracking-tight ${className}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-md shadow-brand-200">
        <Icon name="bag" className="h-5 w-5" strokeWidth={2.25} />
      </span>
      {!compact && (
        <span>
          <span className="text-brand-500">Group</span>Buy
        </span>
      )}
    </Link>
  );
}
