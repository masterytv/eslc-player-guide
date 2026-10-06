"use client";

import { countdown } from "@/lib/time";
import { useNow } from "./hooks";

/** "Starts in 3 h 10 min", kept current even when the page comes from the offline copy. */
export function Countdown({ at, initial }: { at: string; initial: string }) {
  const now = useNow(30_000);
  if (now == null) return <span className="count">{initial}</span>;
  const target = Date.parse(at);
  return <span className="count">{target > now ? `Starts in ${countdown(now, target)}` : "Under way"}</span>;
}
