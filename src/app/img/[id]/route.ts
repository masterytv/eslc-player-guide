import { currentSession } from "@/lib/session";
import { getStore } from "@/lib/store";

// Photos uploaded by staff. Each upload gets a new id, so a URL's bytes never change.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await currentSession())) return new Response("Log in to the guide first.", { status: 401 });
  const { id } = await ctx.params;
  if (!/^[a-f0-9-]{8,64}$/.test(id)) return new Response("Not found", { status: 404 });
  const image = await getStore().getImage(id);
  if (!image) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(image.bytes), {
    headers: {
      "Content-Type": image.mime,
      "Cache-Control": "private, max-age=31536000, immutable",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
