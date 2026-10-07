// Retakes the phone screenshots in ./shots for the coaches' guide.
//
// Runs the app's production build on its own (example passwords, an empty content folder,
// never a database), so the pictures show the starting content and nothing real is changed.
// Run `npm run build` first, then `npm run guide:screenshots`.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, devices } from "@playwright/test";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const out = path.join(here, "shots");
const PORT = 3410;
const base = `http://localhost:${PORT}`;
const PASSCODE = "example-passcode";
const STAFF = "staff-example";

if (!existsSync(path.join(root, ".next/BUILD_ID"))) {
  console.error("No production build yet: run `npm run build` first.");
  process.exit(1);
}

const data = mkdtempSync(path.join(tmpdir(), "guide-shots-"));
const env = { ...process.env, SESSION_SECRET: "guide-screenshots-secret-guide-screenshots", ADMIN_PASSWORD: STAFF, VIEWER_PASSWORD: PASSCODE, GUIDE_DATA_DIR: data };
// Never touch a real database from here.
delete env.DATABASE_URL;
const server = spawn(path.join(root, "node_modules/.bin/next"), ["start", "-p", String(PORT)], { cwd: root, env, stdio: "ignore" });

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`${base}/login`)).ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("The app didn't start on port " + PORT);
}

let browser;

async function phone(passcode) {
  const ctx = await browser.newContext({ ...devices["iPhone 13"], deviceScaleFactor: 2, colorScheme: "light", serviceWorkers: "block", baseURL: base });
  const page = await ctx.newPage();
  if (passcode) {
    await page.goto("/login");
    await page.getByLabel("Team passcode").fill(passcode);
    await page.getByRole("button", { name: "Open the guide" }).click();
    await page.waitForURL((u) => !u.pathname.startsWith("/login"));
  }
  return page;
}

async function shot(page, name) {
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  console.log(`  ${name}.png`);
}

try {
  await waitForServer();
  browser = await chromium.launch();

  const visitor = await phone();
  await visitor.goto("/login");
  await shot(visitor, "login");

  const player = await phone(PASSCODE);
  for (const [url, name] of [
    ["/", "today"],
    ["/schedule", "schedule"],
    ["/team", "team"],
    ["/venue", "venue"],
    ["/more", "more"],
    ["/more/game-plan/defence", "gameplan"],
  ]) {
    await player.goto(url);
    await shot(player, name);
  }

  const staff = await phone(STAFF);
  await staff.goto("/more/game-plan/offence");
  await shot(staff, "staff-gameplan");
  await staff.goto("/admin");
  await shot(staff, "admin-home");
  await staff.goto("/admin/schedule");
  await staff.locator(".item-head").first().click();
  await shot(staff, "admin-schedule");
  await staff.goto("/admin/playbook?item=gp2");
  await staff.getByLabel("Page text").scrollIntoViewIfNeeded();
  await staff.evaluate(() => window.scrollBy(0, 120));
  await shot(staff, "admin-gameplan");

  // A made-up tournament, only in this throwaway copy, to show the steps.
  await staff.goto("/admin/tournaments/new");
  await staff.locator("#nt-name").fill("Example Cup 2027");
  await staff.locator("#nt-location").fill("Dublin, Ireland");
  await staff.locator("#nt-startDate").fill("2027-07-08");
  await staff.locator("#nt-endDate").fill("2027-07-14");
  await staff.locator("#nt-timeZone").selectOption("Europe/Dublin");
  await staff.evaluate(() => document.activeElement?.blur());
  await shot(staff, "new-tournament");
  await staff.getByRole("heading", { name: "Start from" }).scrollIntoViewIfNeeded();
  await shot(staff, "new-tournament-copy");
  await staff.getByRole("button", { name: "Start the tournament" }).click();
  await staff.waitForURL((u) => u.pathname === "/admin");
  await shot(staff, "draft-admin");
  await staff.goto("/admin/tournaments");
  await shot(staff, "tournaments-draft");
} finally {
  await browser?.close();
  server.kill();
  rmSync(data, { recursive: true, force: true });
}
