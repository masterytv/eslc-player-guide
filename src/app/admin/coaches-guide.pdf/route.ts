import { readFile } from "node:fs/promises";
import path from "node:path";

// The coaches' guide (docs/coach-guide), for staff to read or share from their phone. It's under
// /admin, so only staff can open it. next.config.ts ships the file with this route.
const GUIDE = path.join(process.cwd(), "docs/coach-guide/Player-Guide-How-it-works.pdf");

export async function GET() {
  const pdf = await readFile(GUIDE);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="Player-Guide-How-it-works.pdf"',
      "Cache-Control": "private, no-cache",
    },
  });
}
