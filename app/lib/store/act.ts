import { ActionResult, run } from "./errors";
import { syncDeadlines } from "./jobs";

/** Runs a store action after applying due deadlines, so it sees the current state. */
export function act<T>(fn: () => T): ActionResult<T> {
  syncDeadlines();
  return run(fn);
}
