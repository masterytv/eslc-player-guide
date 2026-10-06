// Starts each end-to-end run from the starting content.
import { rm } from "node:fs/promises";
import pg from "pg";

await rm(".data-e2e", { recursive: true, force: true });

if (process.env.DATABASE_URL) {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query("drop table if exists guide_section, guide_image");
  await client.end();
}
