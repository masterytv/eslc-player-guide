import { kitLabel } from "@/lib/plan";
import type { Row } from "@/lib/schema";

/** "Home · wear white" or "Away · wear green", with a swatch of the jersey colour. */
export function Kit({ game }: { game: Row<"schedule"> }) {
  const label = kitLabel(game);
  if (!label) return null;
  return (
    <p className={`kit ${game.side}`}>
      <span className="swatch" aria-hidden="true" />
      {label}
    </p>
  );
}
