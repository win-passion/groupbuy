"use client";

import { useMemo, useState } from "react";
import { EmptyState, PageHeader, Skeleton, StatusPill } from "../../components/ui";
import { formatDate, liftVotingRestriction, noShowStatus, ROLE_LABELS, useDb } from "../../lib/store";

export default function AdminUsersPage() {
  const db = useDb();
  const [query, setQuery] = useState("");
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [error, setError] = useState("");

  const users = useMemo(() => {
    if (!db) {
      return null;
    }
    return db.profiles
      .map((profile) => ({
        profile,
        email: db.accounts.find((account) => account.id === profile.id)?.email ?? "",
        noShows: profile.role === "buyer" ? noShowStatus(db, profile.id) : null,
      }))
      .sort((a, b) => (b.noShows?.count ?? -1) - (a.noShows?.count ?? -1) || a.profile.fullName.localeCompare(b.profile.fullName));
  }, [db]);

  const needle = query.trim().toLowerCase();
  const visible = (users ?? []).filter(
    (row) =>
      (!needle || row.profile.fullName.toLowerCase().includes(needle) || row.email.toLowerCase().includes(needle)) &&
      (!onlyFlagged || (row.noShows && (row.noShows.count > 0 || row.noShows.restrictedUntil)))
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:py-10">
      <PageHeader
        eyebrow="ADMIN"
        title="Users"
        text="No-show counts cover the lookback window. Sellers never see who didn't respond."
      />

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or email"
          aria-label="Search users"
          className="w-full rounded-full border border-line bg-surface px-5 py-3 text-sm outline-none focus:border-brand-400 sm:max-w-sm"
        />
        <label className="flex items-center gap-2 text-sm font-bold text-muted-strong">
          <input type="checkbox" checked={onlyFlagged} onChange={(event) => setOnlyFlagged(event.target.checked)} className="accent-brand-500" />
          Only buyers with no-shows
        </label>
      </div>
      {error && <p role="alert" className="mt-3 text-sm font-semibold text-danger">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-sheet bg-surface shadow-sm">
        {!users ? (
          <Skeleton className="h-60" />
        ) : visible.length === 0 ? (
          <div className="p-6">
            <EmptyState icon="search-x" title="No users match" text="Try a different search." />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {visible.map(({ profile, email, noShows }) => (
              <li key={profile.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{profile.fullName}</p>
                  <p className="truncate text-xs text-muted">{email}</p>
                </div>
                <StatusPill tone="muted">{ROLE_LABELS[profile.role]}</StatusPill>
                {noShows && (
                  <span className={`text-sm ${noShows.count >= noShows.limit - 1 ? "font-bold text-danger" : "text-muted"}`}>
                    {noShows.count}/{noShows.limit} no-shows
                  </span>
                )}
                {noShows?.restrictedUntil && (
                  <>
                    <StatusPill tone="danger">Voting paused until {formatDate(noShows.restrictedUntil)}</StatusPill>
                    <button
                      type="button"
                      onClick={() => {
                        const result = liftVotingRestriction(profile.id);
                        setError(result.ok ? "" : result.error);
                      }}
                      className="rounded-xl border border-line px-3 py-1.5 text-xs font-bold hover:border-brand-400 hover:text-brand-600"
                    >
                      Lift restriction
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
