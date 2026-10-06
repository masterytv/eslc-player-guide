"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  id: string;
  name: string;
  live: boolean;
  /** The staff member is working on this one. */
  active: boolean;
  liveName: string;
  passcode: string;
  samePasscode: boolean;
}

export function TournamentActions({ id, name, live, active, liveName, passcode, samePasscode }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const post = async (path: string): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "That didn't work. Try again.");
        return false;
      }
      return true;
    } catch {
      setError("No connection. Try again when you have signal.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const open = async () => {
    if (await post("/api/admin/tournaments/view")) {
      router.push("/admin");
      router.refresh();
    }
  };

  const makeLive = async () => {
    const players = samePasscode
      ? "The team passcode is the same, so players stay logged in."
      : `Its team passcode is "${passcode}", so players will be asked for it. Share it in the group chat.`;
    if (!window.confirm(`Make ${name} the live guide? Players will see it instead of ${liveName}. ${players}`)) return;
    if (await post("/api/admin/tournaments/live")) router.refresh();
  };

  return (
    <>
      <div className="row-btns">
        {active ? (
          <Link className="pill-btn" href="/admin">
            Edit it
          </Link>
        ) : (
          <button type="button" className="pill-btn" onClick={open} disabled={busy}>
            Work on this one
          </button>
        )}
        {live ? null : (
          <button type="button" className="pill-btn primary" onClick={makeLive} disabled={busy}>
            Make live
          </button>
        )}
      </div>
      {error ? (
        <p className="form-err" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
