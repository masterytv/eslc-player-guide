import { loadGuide } from "@/lib/content";
import { calendar } from "@/lib/ics";
import { slugify } from "@/lib/schema";
import { currentSession } from "@/lib/session";

// /cal/<schedule item id> for one event, /cal/games for every game.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await currentSession())) return new Response("Log in to the guide first.", { status: 401 });
  const { id } = await ctx.params;
  const { guide } = await loadGuide();
  const rows = id === "games" ? guide.schedule.filter((s) => s.type === "game") : guide.schedule.filter((s) => s.id === id);
  if (!rows.length) return new Response("That event isn't in the schedule any more.", { status: 404 });
  const name = id === "games" ? "ireland-games" : slugify(rows[0].opponent ? `ireland-vs-${rows[0].opponent}` : rows[0].title || "event");
  return new Response(calendar(rows, guide), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name || "event"}.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
