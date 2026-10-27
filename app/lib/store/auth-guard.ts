import { sessionUserFor, SessionUser } from "./auth";
import { formatDate, now } from "./clock";
import { Db, readSessionAccountId } from "./db";
import { fail } from "./errors";
import { UserRole } from "./types";

/** Role checks for store actions. Each method throws a RuleError when the check fails. */
export function auth(db: Db) {
  function user(): SessionUser {
    const current = sessionUserFor(db, readSessionAccountId());
    if (!current) {
      fail("Please log in first.");
    }
    if (db.profiles.find((row) => row.id === current.id)?.status === "suspended") {
      fail("Your account is suspended.");
    }
    return current;
  }

  function role(expected: UserRole): SessionUser {
    const current = user();
    if (current.role !== expected) {
      fail(`Only ${expected}s can do this.`);
    }
    return current;
  }

  return {
    user,
    admin: () => role("admin"),
    buyer: () => role("buyer"),
    seller: () => role("seller"),
    /** A seller whose application has been approved */
    approvedSeller() {
      const current = role("seller");
      if (current.sellerStatus !== "approved") {
        fail("Your seller application must be approved before you can create deals.");
      }
      return current;
    },
    /** A buyer without an active voting restriction */
    voter() {
      const current = role("buyer");
      const until = db.profiles.find((row) => row.id === current.id)?.votingRestrictedUntil;
      if (until && Date.parse(until) > now()) {
        fail(`Voting is paused on your account until ${formatDate(until)} after missed payment confirmations.`);
      }
      return current;
    },
  };
}
