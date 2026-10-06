"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PasscodeForm({ tournament }: { tournament: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/passcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: value, tournament }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ ok: false, text: body.error ?? "Couldn't change the passcode." });
      } else {
        setMsg({ ok: true, text: "Passcode changed. Share the new one in the group chat." });
        setValue("");
        router.refresh();
      }
    } catch {
      setMsg({ ok: false, text: "No connection. Try again when you have signal." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="fld">
      <label htmlFor="new-passcode">New passcode</label>
      <div className="inline">
        <input
          id="new-passcode"
          className="pass-input"
          type="text"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. green jersey salou"
        />
        <button className="btn primary" type="submit" disabled={busy || value.trim().length < 4}>
          {busy ? "Saving…" : "Change"}
        </button>
      </div>
      {msg ? (
        <p className={msg.ok ? "help" : "err"} role="status">
          {msg.text}
        </p>
      ) : null}
    </form>
  );
}
