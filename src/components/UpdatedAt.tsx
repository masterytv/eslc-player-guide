"use client";

import { ago } from "@/lib/time";
import { useNow, useOnline } from "./hooks";

/** "Updated 4 min ago", or "Offline · saved copy" when the phone has no signal. */
export function UpdatedAt({ iso }: { iso: string | null }) {
  const now = useNow(60_000);
  const online = useOnline();

  if (!online) {
    return (
      <span className="sync off" role="status">
        <i />
        Offline
        <br />
        saved copy
      </span>
    );
  }
  if (!iso || now == null) return <span className="sync" />;
  return (
    <span className="sync">
      <i />
      Updated
      <br />
      {ago(iso, now)}
    </span>
  );
}
