"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNow } from "./hooks";
import type { SectionKey } from "@/lib/schema";
import { sectionDef, type FieldDef } from "@/lib/sections";
import { ago, dayLabel } from "@/lib/time";
import { Icon } from "./Icon";

type Row = Record<string, unknown> & { id: string };
type Obj = Record<string, unknown>;
type Status = { kind: "idle" | "saving" | "saved" | "error" | "conflict"; msg?: string };

interface Props {
  /** The tournament being edited. Saves go to it even if staff switch tournaments in another tab. */
  tournament: string;
  sectionKey: SectionKey;
  initial: Row[] | Obj;
  version: number;
  updatedAt: string | null;
  /** Trip days, for the day filter on dated sections. */
  days: string[];
  startDay: string | null;
  focusItem: string | null;
}

const newId = () => `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function emptyValue(f: FieldDef): unknown {
  if (f.type === "checkbox") return false;
  if (f.type === "lines") return [];
  if (f.type === "select") return f.options?.[0]?.value ?? "";
  return "";
}

/** Shrinks phone photos before upload: faster on hotel Wi-Fi and under the upload limit. */
async function preparePhoto(file: File): Promise<Blob> {
  const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    if (ok && file.size <= 3_500_000) return file;
    throw new Error("This photo format isn't supported. Try a JPEG or a screenshot.");
  }
  const max = 2000;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && ok && file.size <= 1_500_000) return file;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.fillStyle = "#ffffff"; // transparent PNG maps would otherwise turn black as JPEG
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob) throw new Error("Couldn't process that photo. Try another one.");
  return blob;
}

function ImageInput({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await preparePhoto(file);
      const form = new FormData();
      form.append("file", blob, "photo");
      const res = await fetch("/api/admin/images", { method: "POST", body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Couldn't upload the photo.");
      onChange(body.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't upload the photo.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="img-field">
      <div className="frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {value ? <img src={value} alt="" /> : <span>No photo yet</span>}
      </div>
      <div className="item-tools">
        <label className="tool" htmlFor={id} aria-disabled={busy}>
          <Icon name="photo" size="sm" />
          {busy ? "Uploading…" : value ? "Replace photo" : "Choose photo"}
        </label>
        <input ref={input} id={id} type="file" accept="image/*" className="sr-only" disabled={busy} onChange={(e) => pick(e.target.files?.[0])} />
        {value && !busy ? (
          <button type="button" className="tool" onClick={() => onChange("")}>
            Remove
          </button>
        ) : null}
      </div>
      {error ? <p className="err">{error}</p> : null}
    </div>
  );
}

function FieldInput({ f, id, value, onChange, error }: { f: FieldDef; id: string; value: unknown; onChange: (v: unknown) => void; error?: string }) {
  const str = typeof value === "string" ? value : "";
  const cls = error ? "bad" : undefined;
  const describedBy = [(f.help || f.type === "markdown") && `${id}-help`, error && `${id}-err`].filter(Boolean).join(" ") || undefined;
  let control: React.ReactNode;

  switch (f.type) {
    case "textarea":
    case "markdown":
      control = (
        <textarea id={id} className={[cls, f.type === "markdown" && "tall"].filter(Boolean).join(" ") || undefined} value={str} placeholder={f.placeholder} aria-describedby={describedBy} onChange={(e) => onChange(e.target.value)} />
      );
      break;
    case "lines":
      control = (
        <textarea
          id={id}
          className={cls}
          value={Array.isArray(value) ? value.join("\n") : ""}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value.split("\n"))}
        />
      );
      break;
    case "select":
      control = (
        <select id={id} className={cls} value={str} aria-describedby={describedBy} onChange={(e) => onChange(e.target.value)}>
          {f.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;
    case "checkbox":
      return (
        <div className="fld">
          <button type="button" className="switch" role="switch" aria-checked={value === true} id={id} onClick={() => onChange(value !== true)}>
            <span>{f.label}</span>
            <span className="knob" aria-hidden="true" />
          </button>
          {f.help ? <p className="help">{f.help}</p> : null}
        </div>
      );
    case "time":
      control = (
        <div className="inline">
          <input id={id} type="time" className={cls} value={str} aria-describedby={describedBy} onChange={(e) => onChange(e.target.value)} />
          {str ? (
            <button type="button" className="tool" onClick={() => onChange("")}>
              No time yet
            </button>
          ) : null}
        </div>
      );
      break;
    case "date":
      control = <input id={id} type="date" className={cls} value={str} aria-describedby={describedBy} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "image":
      control = <ImageInput id={id} value={str} onChange={onChange} />;
      break;
    default:
      control = (
        <input
          id={id}
          type={f.type === "url" ? "url" : f.type === "tel" ? "tel" : f.type === "email" ? "email" : "text"}
          inputMode={f.type === "url" ? "url" : undefined}
          autoCapitalize={f.type === "url" || f.type === "email" ? "none" : undefined}
          autoCorrect={f.type === "url" || f.type === "email" ? "off" : undefined}
          className={cls}
          value={str}
          placeholder={f.placeholder}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }

  return (
    <div className="fld">
      <label htmlFor={id}>
        {f.label}
        {f.required ? <span className="req" aria-hidden="true">*</span> : null}
      </label>
      {control}
      {f.type === "markdown" ? (
        <p className="md-help" id={`${id}-help`}>
          <code>## Heading</code> starts a new card · <code>- item</code> bullet · <code>1. step</code> numbered · <code>!! text</code> red warning ·{" "}
          <code>&gt; text</code> grey note · <code>**bold**</code> · <code>[label](https://…)</code>
        </p>
      ) : f.help ? (
        <p className="help" id={`${id}-help`}>
          {f.help}
        </p>
      ) : null}
      {error ? (
        <p className="err" id={`${id}-err`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function SectionEditor(props: Props) {
  const def = sectionDef(props.sectionKey)!;
  const router = useRouter();
  const [data, setData] = useState<Row[] | Obj>(props.initial);
  const [baseline, setBaseline] = useState(() => JSON.stringify(props.initial));
  const [version, setVersion] = useState(props.version);
  const [updatedAt, setUpdatedAt] = useState(props.updatedAt);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [open, setOpen] = useState<Set<string>>(() => new Set(props.focusItem ? [props.focusItem] : []));
  const [day, setDay] = useState<string>(props.startDay ?? "all");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const scrollTo = useRef<string | null>(props.focusItem);
  const now = useNow(30_000);
  const dirty = JSON.stringify(data) !== baseline;
  const isList = Array.isArray(data);
  const rows = useMemo(() => (Array.isArray(data) ? data : []) as Row[], [data]);

  // Unsaved edits are easy to lose on a phone: warn before closing the tab or tapping a link away.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    const guardLinks = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.("a[href]");
      if (!link || link.getAttribute("target") === "_blank") return;
      if (!window.confirm("You have unsaved changes. Leave without saving?")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", guardLinks, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", guardLinks, true);
    };
  }, [dirty]);

  // Brings a just-added (or linked-to) item into view after it renders.
  useEffect(() => {
    if (!scrollTo.current) return;
    document.getElementById(`item-${scrollTo.current}`)?.scrollIntoView({ block: "start", behavior: "smooth" });
    scrollTo.current = null;
  });

  // Dated items show in date/time order, using the saved values so a row doesn't jump while it's edited.
  const savedRows = useMemo(() => {
    const m = new Map<string, Row>();
    try {
      const parsed = JSON.parse(baseline);
      if (Array.isArray(parsed)) for (const r of parsed) m.set(r.id, r);
    } catch {
      // nothing saved yet
    }
    return m;
  }, [baseline]);

  const visible = useMemo(() => {
    if (!def.byDate) return rows;
    const key = (r: Row, i: number) => {
      const s = savedRows.get(r.id);
      return s ? `${s.date || "9999"} ${s.time || "99:99"} ${String(i).padStart(4, "0")}` : `~${String(i).padStart(4, "0")}`;
    };
    return rows
      .map((r, i) => ({ r, k: key(r, i) }))
      .filter(({ r }) => day === "all" || r.date === day || (day === "other" && !props.days.includes(String(r.date))) || !savedRows.has(r.id))
      .sort((a, b) => (a.k < b.k ? -1 : a.k > b.k ? 1 : 0))
      .map(({ r }) => r);
  }, [rows, def.byDate, day, savedRows, props.days]);

  const hasOtherDates = def.byDate && rows.some((r) => !props.days.includes(String(r.date)));

  const setObjField = (key: string, value: unknown) => setData({ ...(data as Obj), [key]: value });
  const setRowField = (id: string, key: string, value: unknown) =>
    setData(rows.map((r) => (r.id === id ? { ...r, [key]: value } : r)));

  const add = () => {
    const id = newId();
    const row: Row = { id };
    for (const f of def.fields) row[f.key] = emptyValue(f);
    Object.assign(row, def.newItem?.() ?? {});
    if (def.byDate) row.date = day !== "all" && day !== "other" ? day : props.startDay ?? props.days[0] ?? "";
    setData([...rows, row]);
    setOpen(new Set([...open, id]));
    scrollTo.current = id;
  };
  const move = (id: string, by: -1 | 1) => {
    const i = rows.findIndex((r) => r.id === id);
    const j = i + by;
    if (i < 0 || j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setData(next);
  };
  const remove = (id: string) => {
    setData(rows.filter((r) => r.id !== id));
    setConfirmDelete(null);
  };
  const toggle = (id: string) => {
    const next = new Set(open);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOpen(next);
  };

  const save = async (force = false) => {
    setStatus({ kind: "saving" });
    const sent = data;
    try {
      const res = await fetch(`/api/admin/sections/${props.sectionKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: sent, version, force, tournament: props.tournament }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setData(body.data);
        setBaseline(JSON.stringify(body.data));
        setVersion(body.version);
        setUpdatedAt(body.updatedAt);
        setErrors({});
        setStatus({ kind: "saved" });
        router.refresh();
        return;
      }
      if (res.status === 409) {
        setStatus({ kind: "conflict" });
        return;
      }
      if (res.status === 422 && Array.isArray(body.issues)) {
        const next: Record<string, string> = {};
        const toOpen = new Set(open);
        for (const issue of body.issues as Array<{ path: string; message: string }>) {
          const [first, field] = issue.path.split(".");
          if (Array.isArray(sent) && field !== undefined) {
            const row = sent[Number(first)];
            if (row) {
              next[`${row.id}.${field}`] = issue.message;
              toOpen.add(row.id);
            }
          } else {
            next[first] = issue.message;
          }
        }
        setErrors(next);
        setOpen(toOpen);
        setStatus({ kind: "error", msg: "Fix the fields marked in red, then save again." });
        return;
      }
      setStatus({ kind: "error", msg: body.error ?? "Couldn't save. Try again." });
    } catch {
      setStatus({ kind: "error", msg: "No connection. Your changes are still here; save again when you have signal." });
    }
  };

  const statusText =
    status.kind === "saving"
      ? "Saving…"
      : status.kind === "error"
        ? status.msg
        : status.kind === "conflict"
          ? "Not saved: someone else changed this."
          : dirty
            ? "Unsaved changes"
            : status.kind === "saved"
              ? "Saved. Players see it next time they open a page."
              : updatedAt && now
                ? `Last saved ${ago(updatedAt, now)}`
                : "Showing the starting content";

  const fieldsFor = (row: Obj) => def.fields.filter((f) => !f.showIf || f.showIf(row));
  const itemName = def.itemName ?? "item";

  return (
    <>
      <div className="h-row">
        <p className="meta">{def.description}.</p>
        <Link className="txt-link" href={def.viewHref}>
          View
          <Icon name="chev" size="sm" />
        </Link>
      </div>

      {status.kind === "conflict" ? (
        <div className="conflict" role="alert">
          <span>Someone else saved this section while you were editing. Load their version (your changes here will be lost), or save yours over theirs.</span>
          <div className="item-tools">
            <button type="button" className="tool" onClick={() => window.location.reload()}>
              Load their version
            </button>
            <button type="button" className="tool danger-solid" onClick={() => save(true)}>
              Save mine anyway
            </button>
          </div>
        </div>
      ) : null}

      {isList ? (
        <>
          {def.byDate && props.days.length ? (
            <div className="daypick" role="group" aria-label="Show day">
              <button type="button" aria-pressed={day === "all"} onClick={() => setDay("all")}>
                All days
              </button>
              {props.days.map((d) => (
                <button type="button" key={d} aria-pressed={day === d} onClick={() => setDay(d)}>
                  {dayLabel(d)}
                </button>
              ))}
              {hasOtherDates ? (
                <button type="button" aria-pressed={day === "other"} onClick={() => setDay("other")}>
                  Other dates
                </button>
              ) : null}
            </div>
          ) : null}

          {visible.length ? (
            visible.map((row) => {
              const idx = rows.findIndex((r) => r.id === row.id);
              const isOpen = open.has(row.id);
              const rowHasError = Object.keys(errors).some((k) => k.startsWith(`${row.id}.`));
              const summary = def.summary?.(row) ?? itemName;
              const sub = def.byDate && row.date ? dayLabel(String(row.date)) : null;
              return (
                <div key={row.id} id={`item-${row.id}`} className={["item", isOpen && "open", rowHasError && "has-error"].filter(Boolean).join(" ")}>
                  <button type="button" className="item-head" aria-expanded={isOpen} onClick={() => toggle(row.id)}>
                    <span>
                      <b>{summary}</b>
                      {sub ? <span className="meta">{sub}</span> : null}
                    </span>
                    <Icon name="chev" />
                  </button>
                  {isOpen ? (
                    <div className="item-body">
                      {fieldsFor(row).map((f) => (
                        <FieldInput
                          key={f.key}
                          f={f}
                          id={`${row.id}-${f.key}`}
                          value={row[f.key]}
                          error={errors[`${row.id}.${f.key}`]}
                          onChange={(v) => setRowField(row.id, f.key, v)}
                        />
                      ))}
                      <div className="item-tools">
                        {!def.byDate ? (
                          <>
                            <button type="button" className="tool" disabled={idx === 0} onClick={() => move(row.id, -1)} aria-label="Move up">
                              <Icon name="up" size="sm" />
                              Up
                            </button>
                            <button type="button" className="tool" disabled={idx === rows.length - 1} onClick={() => move(row.id, 1)} aria-label="Move down">
                              <Icon name="down" size="sm" />
                              Down
                            </button>
                          </>
                        ) : null}
                        {confirmDelete === row.id ? (
                          <>
                            <button type="button" className="tool danger-solid" onClick={() => remove(row.id)}>
                              Delete this {itemName}
                            </button>
                            <button type="button" className="tool" onClick={() => setConfirmDelete(null)}>
                              Keep it
                            </button>
                          </>
                        ) : (
                          <button type="button" className="tool danger" onClick={() => setConfirmDelete(row.id)}>
                            <Icon name="trash" size="sm" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="card empty">
              <h3>{rows.length ? `No ${itemName}s on this day` : `No ${itemName}s yet`}</h3>
            </div>
          )}

          <button type="button" className="add-btn" onClick={add}>
            <Icon name="plus" />
            Add {/^[aeiou]/i.test(itemName) ? "an" : "a"} {itemName}
            {def.byDate && day !== "all" && day !== "other" ? ` for ${dayLabel(day)}` : ""}
          </button>
        </>
      ) : (
        <div className="card">
          {fieldsFor(data as Obj).map((f) => (
            <FieldInput key={f.key} f={f} id={`f-${f.key}`} value={(data as Obj)[f.key]} error={errors[f.key]} onChange={(v) => setObjField(f.key, v)} />
          ))}
        </div>
      )}

      <div className="savebar">
        <p className={["status", dirty && status.kind !== "error" && "dirty", (status.kind === "error" || status.kind === "conflict") && "bad"].filter(Boolean).join(" ")} role="status">
          {statusText}
        </p>
        {dirty ? (
          <button
            type="button"
            className="btn"
            onClick={() => {
              setData(JSON.parse(baseline));
              setErrors({});
              setStatus({ kind: "idle" });
            }}
          >
            Undo
          </button>
        ) : null}
        <button type="button" className="btn primary" disabled={!dirty || status.kind === "saving"} onClick={() => save(false)}>
          Save
        </button>
      </div>
    </>
  );
}
