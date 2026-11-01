import { gameCountdown } from "@/lib/plan";
import { with24h } from "@/lib/time";

/** The steps before and after a game, at their clock times for this game's start. */
export function GameCountdown({ lines, start }: { lines: string[]; start: string }) {
  const steps = gameCountdown(lines, start);
  if (!steps.length) return null;
  return (
    <ol className="countdown" aria-label="Game countdown">
      {steps.map((s, i) =>
        s.offset ? (
          <li key={i}>
            <span className="cd-t">
              {s.time || "After"}
              <small>{s.h24 ? `${s.h24} · ${s.offset}` : s.offset}</small>
            </span>
            <span>{with24h(s.text)}</span>
          </li>
        ) : (
          <li key={i} className="cd-note">
            {with24h(s.text)}
          </li>
        ),
      )}
    </ol>
  );
}
