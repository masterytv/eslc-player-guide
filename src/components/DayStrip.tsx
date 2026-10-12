"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export interface StripDay {
  date: string;
  dow: string;
  day: number;
  label: string;
  selected: boolean;
  today: boolean;
  game: boolean;
}

/** The row of days along the top of Today (or of another page that shows one day at a time: `base`). */
export function DayStrip({ days, base = "/", label = "Tournament days" }: { days: StripDay[]; base?: string; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const selected = days.find((d) => d.selected)?.date;

  useEffect(() => {
    const strip = ref.current;
    const sel = strip?.querySelector<HTMLElement>('[aria-current="date"]');
    if (strip && sel) strip.scrollLeft = sel.offsetLeft - strip.clientWidth / 2 + sel.clientWidth / 2;
  }, [selected]);

  return (
    <div className="days" ref={ref} role="navigation" aria-label={label}>
      {days.map((d) => (
        <Link
          key={d.date}
          href={`${base}?day=${d.date}`}
          scroll={false}
          replace
          className={["day", d.selected && "sel", d.today && "today", d.game && "game"].filter(Boolean).join(" ")}
          aria-current={d.selected ? "date" : undefined}
          aria-label={`${d.label}${d.today ? ", today" : ""}${d.game ? ", game day" : ""}`}
        >
          <span className="dow">{d.dow}</span>
          <span className="dnum">{d.day}</span>
          <span className="dmk" />
        </Link>
      ))}
    </div>
  );
}
