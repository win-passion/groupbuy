"use client";

import { useEffect } from "react";
import { startDeadlineRunner } from "../lib/store";

/** Applies due deal deadlines while any page is open (there is no server to do it). */
export default function DeadlineRunner() {
  useEffect(() => startDeadlineRunner(), []);
  return null;
}
