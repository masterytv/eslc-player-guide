import { with24h } from "@/lib/time";

/** A timeline inside a schedule item: "9:20 AM | Meet at the front desk", one step per line. */
export function ItemSteps({ steps }: { steps: string[] }) {
  if (!steps.length) return null;
  return (
    <ol className="countdown" aria-label="Timeline">
      {steps.map((line, i) => {
        const at = line.indexOf("|");
        const time = at < 0 ? "" : line.slice(0, at).trim();
        const text = at < 0 ? line : line.slice(at + 1).trim();
        return time ? (
          <li key={i}>
            <span className="cd-t">{time}</span>
            <span>{with24h(text)}</span>
          </li>
        ) : (
          <li key={i} className="cd-step">
            {with24h(text)}
          </li>
        );
      })}
    </ol>
  );
}
