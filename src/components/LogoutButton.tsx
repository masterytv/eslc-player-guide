"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "./Icon";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const logout = async () => {
    setBusy(true);
    try {
      await fetch("/api/logout", { method: "POST" });
      // Drop the offline copy too, so the guide isn't readable on a shared phone.
      if ("caches" in window) {
        for (const k of await caches.keys()) await caches.delete(k);
      }
    } finally {
      router.replace("/login");
      router.refresh();
    }
  };
  return (
    <button onClick={logout} disabled={busy}>
      <span className="mi">
        <Icon name="logout" />
      </span>
      <span>
        <span className="mt">{busy ? "Logging out…" : "Log out"}</span>
        <span className="ms">You&rsquo;ll need the passcode to get back in</span>
      </span>
      <span />
    </button>
  );
}
