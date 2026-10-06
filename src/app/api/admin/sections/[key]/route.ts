import { issuesOf, isSectionKey, normalizeSection, sectionSchemas, type Guide, type SectionKey } from "@/lib/schema";
import { adminOrError } from "@/lib/session";
import { FORCE, getStore, StorageNotConfigured } from "@/lib/store";

export async function PUT(req: Request, ctx: { params: Promise<{ key: string }> }) {
  const auth = await adminOrError();
  if (auth instanceof Response) return auth;

  const { key } = await ctx.params;
  if (!isSectionKey(key)) return Response.json({ error: "That part of the guide doesn't exist." }, { status: 404 });

  let body: { data?: unknown; version?: unknown; force?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "The changes didn't arrive in one piece. Try saving again." }, { status: 400 });
  }

  const parsed = sectionSchemas[key].safeParse(body.data);
  if (!parsed.success) {
    return Response.json({ error: "Some fields need fixing.", issues: issuesOf(parsed.error) }, { status: 422 });
  }
  const data = normalizeSection(key as SectionKey, parsed.data as Guide[SectionKey]);
  const version = typeof body.version === "number" && Number.isInteger(body.version) && body.version >= 0 ? body.version : 0;

  try {
    const result = await getStore().write(key, data, body.force === true ? FORCE : version);
    if (!result.ok) {
      return Response.json({ error: "Someone else saved this section while you were editing." }, { status: 409 });
    }
    return Response.json({ data, version: result.version, updatedAt: result.updatedAt });
  } catch (err) {
    if (err instanceof StorageNotConfigured) return Response.json({ error: err.message }, { status: 503 });
    console.error(`Saving section "${key}" failed`, err);
    return Response.json({ error: "Couldn't save right now. Try again in a minute." }, { status: 500 });
  }
}
