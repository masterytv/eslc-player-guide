"use client";

import { useStoredString } from "./hooks";

export function AnthemLyrics({ lines }: { lines: string[] }) {
  const [size, setSize] = useStoredString("guide:anthem-size");
  const big = size === "big";
  return (
    <section className="sec">
      <h2 className="sec-h">
        <span>Phonetic version</span>
        <button className="pill-btn" onClick={() => setSize(big ? null : "big")} aria-pressed={big}>
          {big ? "Smaller text" : "Bigger text"}
        </button>
      </h2>
      <ol className={big ? "lyrics big" : "lyrics"}>
        {lines.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ol>
    </section>
  );
}
