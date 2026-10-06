"use client";

import { useMemo } from "react";
import { useStoredString } from "./hooks";
import { Icon } from "./Icon";

interface Item {
  id: string;
  category: string;
  item: string;
  must: boolean;
}
interface Note {
  id: string;
  category: string;
  level: "info" | "warning";
  text: string;
}

const KEY = "guide:packed";

function parsePacked(raw: string | null): Set<string> {
  try {
    const v = JSON.parse(raw ?? "[]");
    return new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

function NoteView({ note }: { note: Note }) {
  return note.level === "warning" ? (
    <p className="warn">
      <Icon name="warn" />
      <span>{note.text}</span>
    </p>
  ) : (
    <p className="info">
      <Icon name="info" />
      <span>{note.text}</span>
    </p>
  );
}

/** The checklist. Ticks are saved on the player's own phone only. */
export function PackingList({ items, notes }: { items: Item[]; notes: Note[] }) {
  const [raw, setRaw] = useStoredString(KEY);
  const packed = useMemo(() => parsePacked(raw), [raw]);

  const categories = useMemo(() => {
    const order: string[] = [];
    const by = new Map<string, Item[]>();
    for (const it of items) {
      if (!by.has(it.category)) {
        by.set(it.category, []);
        order.push(it.category);
      }
      by.get(it.category)!.push(it);
    }
    return order.map((c) => ({ name: c, items: by.get(c)! }));
  }, [items]);

  const known = new Set(items.map((i) => i.id));
  const count = [...packed].filter((id) => known.has(id)).length;
  const pct = items.length ? Math.round((count / items.length) * 100) : 0;

  const save = (next: Set<string>) => setRaw(next.size ? JSON.stringify([...next]) : null);
  const toggle = (id: string, on: boolean) => {
    const next = new Set(packed);
    if (on) next.add(id);
    else next.delete(id);
    save(next);
  };

  const topNotes = notes.filter((n) => !n.category || !categories.some((c) => c.name.toLowerCase() === n.category.toLowerCase()));

  return (
    <>
      <div className="progress">
        <div className="progress-top">
          <span>
            <b>{count}</b> <span className="meta">of {items.length} packed</span>
          </span>
          <button className="txt-link" onClick={() => save(new Set())} disabled={!count}>
            Clear all
          </button>
        </div>
        <div className="bar">
          <i style={{ width: `${pct}%` }} />
        </div>
        <p className="meta">Saved on this phone only.</p>
      </div>
      {topNotes.map((n) => (
        <NoteView key={n.id} note={n} />
      ))}
      {categories.map((c) => (
        <section className="sec" key={c.name}>
          <h2 className="sec-h">{c.name}</h2>
          <ul className="list pk">
            {c.items.map((it) => (
              <li key={it.id}>
                <label htmlFor={`pk-${it.id}`}>
                  <input type="checkbox" id={`pk-${it.id}`} checked={packed.has(it.id)} onChange={(e) => toggle(it.id, e.target.checked)} />
                  <span>{it.item}</span>
                  {it.must ? <span className="must">Must</span> : <span />}
                </label>
              </li>
            ))}
          </ul>
          {notes
            .filter((n) => n.category && n.category.toLowerCase() === c.name.toLowerCase())
            .map((n) => (
              <NoteView key={n.id} note={n} />
            ))}
        </section>
      ))}
    </>
  );
}
