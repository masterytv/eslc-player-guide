"use client";

import { useState } from "react";

export function LoginForm({ next, notice }: { next: string; notice: string | null }) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setError("Enter the passcode from the team group chat.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode, next }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Couldn't log in. Try again.");
        setBusy(false);
        return;
      }
      window.location.href = body.next ?? "/";
    } catch {
      setError("No connection. Check your signal and try again.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      {notice && !error ? <p className="msg">{notice}</p> : null}
      {error ? (
        <p className="msg" role="alert">
          {error}
        </p>
      ) : null}
      <label htmlFor="passcode">Team passcode</label>
      <input
        id="passcode"
        name="passcode"
        type="password"
        autoComplete="current-password"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={passcode}
        onChange={(e) => setPasscode(e.target.value)}
        placeholder="From the group chat"
      />
      <button className="go" type="submit" disabled={busy}>
        {busy ? "Opening…" : "Open the guide"}
      </button>
    </form>
  );
}
