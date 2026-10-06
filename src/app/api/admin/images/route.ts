import { randomUUID } from "node:crypto";
import { adminOrError } from "@/lib/session";
import { getStore, StorageNotConfigured } from "@/lib/store";

// Vercel caps request bodies at 4.5 MB; the editor shrinks photos well below this first.
const MAX_BYTES = 4_000_000;

/** The real type from the file's first bytes, whatever the browser claimed. */
function sniff(bytes: Buffer): string | null {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length > 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (bytes.length > 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

export async function POST(req: Request) {
  const auth = await adminOrError();
  if (auth instanceof Response) return auth;

  let file: FormDataEntryValue | null = null;
  try {
    file = (await req.formData()).get("file");
  } catch {
    // handled below
  }
  if (!(file instanceof File) || file.size === 0) return Response.json({ error: "Choose a photo to upload." }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "That photo is too large. Try a screenshot of it instead." }, { status: 413 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const mime = sniff(bytes);
  if (!mime) return Response.json({ error: "Upload a JPEG, PNG or WebP photo." }, { status: 415 });

  const id = randomUUID();
  try {
    await getStore().putImage(id, mime, bytes);
  } catch (err) {
    if (err instanceof StorageNotConfigured) return Response.json({ error: err.message }, { status: 503 });
    console.error("Image upload failed", err);
    return Response.json({ error: "Couldn't upload the photo. Try again in a minute." }, { status: 500 });
  }
  return Response.json({ url: `/img/${id}` });
}
