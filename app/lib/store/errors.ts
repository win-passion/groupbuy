export type ActionResult<T = undefined> = { ok: true; value: T } | { ok: false; error: string };

/** A broken business rule, shown to the user as-is. */
export class RuleError extends Error {}

export function fail(message: string): never {
  throw new RuleError(message);
}

/** Runs an action, turning RuleErrors into a failed result. Other errors still throw. */
export function run<T>(fn: () => T): ActionResult<T> {
  try {
    return { ok: true, value: fn() };
  } catch (error) {
    if (error instanceof RuleError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}
