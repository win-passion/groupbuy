"use client";

import { useSyncExternalStore } from "react";
import { getSessionUser, subscribeSession } from "../lib/user";

export function useSessionUser() {
  return useSyncExternalStore(subscribeSession, getSessionUser, () => null);
}
