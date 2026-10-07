// Turns guide.html (with the pictures in ./shots) into the coaches' PDF. Run `npm run guide:pdf`.
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, "Player-Guide-How-it-works.pdf");

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(path.join(here, "guide.html")).href, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: out, format: "A4", printBackground: true, preferCSSPageSize: true });
  console.log(`Saved ${path.relative(process.cwd(), out)}`);
} finally {
  await browser.close();
}
