"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SECTIONS } from "@/lib/sections";
import { TIME_ZONES, timeZoneOption } from "@/lib/time";

interface Props {
  tournaments: Array<{ id: string; name: string }>;
  from: string;
  timeZone: string;
  passcode: string;
}

// The event section is always filled in from this form.
const CHOICES = SECTIONS.filter((s) => s.key !== "event");

export function NewTournamentForm({ tournaments, from, timeZone, passcode: currentPasscode }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [zone, setZone] = useState(timeZone);
  const [passcode, setPasscode] = useState(currentPasscode);
  const [copyFrom, setCopyFrom] = useState(from);
  const [carry, setCarry] = useState(() => new Set(CHOICES.filter((s) => s.carryOver).map((s) => s.key)));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const zones = TIME_ZONES.some((z) => z.id === zone) ? TIME_ZONES : [{ id: zone, label: zone }, ...TIME_ZONES];

  const toggle = (key: (typeof CHOICES)[number]["key"], on: boolean) => {
    const next = new Set(carry);
    if (on) next.add(key);
    else next.delete(key);
    setCarry(next);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setError(null);
    try {
      const res = await fetch("/api/admin/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, location, startDate, endDate, timeZone: zone, passcode, copyFrom, carry: [...carry] }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push("/admin");
        router.refresh();
        return;
      }
      if (Array.isArray(body.issues)) {
        const next: Record<string, string> = {};
        for (const i of body.issues as Array<{ path: string; message: string }>) next[i.path.split(".")[0]] ??= i.message;
        setErrors(next);
      }
      setError(body.error ?? "Couldn't set it up. Try again.");
    } catch {
      setError("No connection. Try again when you have signal.");
    }
    setBusy(false);
  };

  const field = (id: string, label: string, control: React.ReactNode, help?: string) => (
    <div className="fld">
      <label htmlFor={`nt-${id}`}>{label}</label>
      {control}
      {help ? <p className="help">{help}</p> : null}
      {errors[id] ? <p className="err">{errors[id]}</p> : null}
    </div>
  );

  return (
    <form className="sec" onSubmit={submit} noValidate>
      <div className="card">
        {field(
          "name",
          "Tournament name",
          <input id="nt-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="World Sixes 2027" className={errors.name ? "bad" : undefined} />,
        )}
        {field("location", "Where", <input id="nt-location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, country" />)}
        {field(
          "startDate",
          "First day",
          <input id="nt-startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={errors.startDate ? "bad" : undefined} />,
        )}
        {field(
          "endDate",
          "Last day",
          <input id="nt-endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={errors.endDate ? "bad" : undefined} />,
        )}
        {field(
          "timeZone",
          "Time zone",
          <select id="nt-timeZone" value={zone} onChange={(e) => setZone(e.target.value)}>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {timeZoneOption(z.id)}
              </option>
            ))}
          </select>,
          "Where the tournament is. Every time in the guide is local time there.",
        )}
        {field(
          "passcode",
          "Team passcode",
          <input
            id="nt-passcode"
            type="text"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className={errors.passcode ? "bad" : undefined}
          />,
          "Keep the current one and players stay logged in when this tournament goes live. A new one signs everyone out: use it when the squad changes.",
        )}
      </div>

      <h2 className="sec-h">Start from</h2>
      <div className="card">
        {field(
          "copyFrom",
          "Copy from",
          <select id="nt-copyFrom" value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)}>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>,
          "Ticked parts are copied over for you to edit. Unticked parts start empty.",
        )}
      </div>
      <ul className="list pk carry">
        {CHOICES.map((s) => (
          <li key={s.key}>
            <label htmlFor={`carry-${s.key}`}>
              <input type="checkbox" id={`carry-${s.key}`} checked={carry.has(s.key)} onChange={(e) => toggle(s.key, e.target.checked)} />
              <span>
                <b>{s.title}</b>
                <span className="meta">{s.description}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>

      {error ? (
        <p className="form-err" role="alert">
          {error}
        </p>
      ) : null}
      <button className="btn primary" type="submit" disabled={busy}>
        {busy ? "Setting it up…" : "Start the tournament"}
      </button>
    </form>
  );
}
