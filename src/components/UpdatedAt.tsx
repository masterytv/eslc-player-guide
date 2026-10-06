"use client";

import { ago } from "@/lib/time";
import { useNow, useOnline, useSavedCopy } from "./hooks";

/** "Updated 4 min ago"; "Saved copy" while a page from the phone's copy refreshes; "Offline" with no signal. */
export function UpdatedAt({ iso }: { iso: string | null }) {
  const now = useNow(60_000);
  const online = useOnline();
  const saved = useSavedCopy();

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
  if (saved) {
    return (
      <span className="sync off" role="status">
        <i />
        Saved copy
        <br />
        {saved.updating || !saved.at || now == null ? "updating…" : ago(new Date(saved.at).toISOString(), now)}
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
