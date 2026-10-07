import { devices, expect, test, type Browser, type Page } from "@playwright/test";
import { E2E } from "./env";

// One story, in order: players read, staff edit, players see the edits, then
// the passcode changes. Later steps build on earlier ones.
test.describe.configure({ mode: "serial" });

async function open(browser: Browser, passcode?: string): Promise<Page> {
  const ctx = await browser.newContext({ ...devices["Pixel 7"], baseURL: test.info().project.use.baseURL });
  const page = await ctx.newPage();
  if (passcode) await login(page, passcode);
  return page;
}

async function login(page: Page, passcode: string) {
  await page.goto("/login");
  await page.getByLabel("Team passcode").fill(passcode);
  await page.getByRole("button", { name: "Open the guide" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}

async function save(page: Page) {
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator(".savebar .status")).toHaveText(/Saved/);
}

let viewer: Page;
let admin: Page;

test.beforeAll(async ({ browser }) => {
  viewer = await open(browser, E2E.viewer);
  admin = await open(browser, E2E.admin);
});

test("asks for the passcode and rejects a wrong one", async ({ page, request }) => {
  await page.goto("/schedule");
  await expect(page).toHaveURL(/\/login\?next=%2Fschedule/);
  await page.getByLabel("Team passcode").fill("wrong-code");
  await page.getByRole("button", { name: "Open the guide" }).click();
  await expect(page.locator(".msg[role=alert]")).toContainText("didn't work");
  await page.getByLabel("Team passcode").fill(E2E.viewer);
  await page.getByRole("button", { name: "Open the guide" }).click();
  await expect(page).toHaveURL(/\/schedule$/);
  await expect(page.getByRole("heading", { level: 1, name: "Schedule" })).toBeVisible();

  const photo = await request.get("/img/0b6f0b9e-7a1c-4d6b-9f4e-3c2a1b0d9e8f", { maxRedirects: 0 });
  expect(photo.status()).toBe(307);
  expect(photo.headers()["location"]).toContain("/login");
  const api = await request.put("/api/admin/sections/daily", { data: { data: [], version: 0 } });
  expect(api.status()).toBe(401);
});

test("players see the guide but no editing tools", async () => {
  await viewer.goto("/?day=2026-11-02");
  await expect(viewer.getByText("Ireland vs Finland").first()).toBeVisible();
  await expect(viewer.locator(".edit-link")).toHaveCount(0);
  await expect(viewer.locator(".quick").getByRole("link", { name: "Offence" })).toHaveAttribute("href", "/more/game-plan/offence");
  await expect(viewer.locator(".quick").getByRole("link", { name: "Defence" })).toHaveAttribute("href", "/more/game-plan/defence");

  await viewer.getByRole("link", { name: "Team" }).click();
  await expect(viewer.getByRole("heading", { name: "Maddy Morrissey Buss" })).toBeVisible();

  await viewer.goto("/more/conduct");
  await expect(viewer.getByRole("heading", { name: "Lights out" })).toBeVisible();

  await viewer.goto("/more");
  await viewer.getByRole("link", { name: /^Defence/ }).click();
  await expect(viewer).toHaveURL(/\/more\/game-plan\/defence$/);
  await expect(viewer.getByText("From Ashley O’Brien, Defensive Coordinator")).toBeVisible();
  await expect(viewer.getByRole("heading", { name: "Forcing Angles: House Pattern" })).toBeVisible();

  await viewer.goto("/admin");
  await expect(viewer).toHaveURL(/\/login\?.*admin=1/);
  await expect(viewer.getByText("That page is for staff")).toBeVisible();

  const api = await viewer.request.put("/api/admin/sections/daily", { data: { data: [], version: 0 } });
  expect(api.status()).toBe(403);
});

test("packing ticks stay on the phone", async () => {
  await viewer.goto("/more/packing");
  await viewer.getByLabel("Turfs").check();
  await expect(viewer.locator(".progress-top b")).toHaveText("1");
  await viewer.reload();
  await expect(viewer.getByLabel("Turfs")).toBeChecked();
  await expect(viewer.locator(".progress-top b")).toHaveText("1");
});

test("staff add a daily note and players see it straight away", async () => {
  await admin.goto("/admin/daily?day=2026-11-02");
  await admin.getByRole("button", { name: /Add a note for Mon 2 Nov/ }).click();
  await admin.getByLabel("What's happening").last().fill("Team lunch at the villas");
  await admin.getByLabel("Time").last().fill("12:15");
  await save(admin);

  await viewer.goto("/?day=2026-11-02");
  const item = viewer.locator(".tl-item", { hasText: "Team lunch at the villas" });
  await expect(item).toBeVisible();
  await expect(item.locator(".tl-time")).toHaveText("12:15PM");
});

test("the editor explains what needs fixing", async () => {
  await admin.goto("/admin/links");
  await admin.getByRole("button", { name: "Add a link" }).click();
  await admin.getByLabel(/^Label/).last().fill("Team photos");
  await admin.getByLabel(/^Link/).last().fill("photos.example");
  await admin.getByRole("button", { name: "Save", exact: true }).click();
  await expect(admin.getByText("Links start with https://")).toBeVisible();
  await expect(admin.locator(".savebar .status")).toHaveText(/Fix the fields/);

  await admin.getByLabel(/^Link/).last().fill("https://photos.example/ireland");
  await save(admin);
  await viewer.goto("/more/links");
  await expect(viewer.getByRole("link", { name: /Team photos/ })).toHaveAttribute("href", "https://photos.example/ireland");
});

test("the guide opens at once from the phone's saved copy, then shows the latest", async () => {
  await expect
    .poll(() => viewer.evaluate(async () => !!(await (await caches.open("pages-v1")).match("/more/links"))), { timeout: 20_000 })
    .toBe(true);

  await admin.goto("/admin/links");
  await admin.getByRole("button", { name: "Add a link" }).click();
  await admin.getByLabel(/^Label/).last().fill("Kit order form");
  await admin.getByLabel(/^Link/).last().fill("https://kit.example/ireland");
  await save(admin);

  const res = await viewer.goto("/more/links");
  // The page arrives from the saved copy, from before the change...
  expect(res?.fromServiceWorker()).toBe(true);
  const html = await res!.text();
  expect(html).toContain("data-saved-copy");
  expect(html).not.toContain("Kit order form");
  // ...then refreshes itself in place.
  await expect(viewer.getByRole("link", { name: /Kit order form/ })).toBeVisible();
  await expect(viewer.locator(".sync")).toContainText("Updated");
  await expect(viewer.locator("html")).not.toHaveAttribute("data-saved-copy");
});

test("staff are warned before leaving unsaved changes", async () => {
  await admin.goto("/admin/anthem");
  await admin.getByLabel("Credit").fill("Edited but not saved");
  admin.once("dialog", (d) => d.dismiss());
  await admin.getByRole("link", { name: "Back" }).click();
  await expect(admin).toHaveURL(/\/admin\/anthem$/);
  await expect(admin.getByLabel("Credit")).toHaveValue("Edited but not saved");
  await admin.getByRole("button", { name: "Undo" }).click();
  await expect(admin.locator(".savebar .status")).not.toHaveText(/Unsaved/);
});

test("two staff editing at once are warned instead of overwriting each other", async ({ browser }) => {
  const second = await open(browser, E2E.admin);
  await admin.goto("/admin/event");
  await second.goto("/admin/event");

  await admin.getByLabel("Alert banner").fill("Bus leaves at 13:30 today");
  await save(admin);

  await second.getByLabel("Alert banner").fill("Wear green to the opening ceremony");
  await second.getByRole("button", { name: "Save", exact: true }).click();
  await expect(second.getByText("Someone else saved this section")).toBeVisible();
  await second.getByRole("button", { name: "Save mine anyway" }).click();
  await expect(second.locator(".savebar .status")).toHaveText(/Saved/);

  await viewer.goto("/");
  await expect(viewer.locator(".alert")).toHaveText("Wear green to the opening ceremony");
});

test("staff can replace a map photo from their phone", async () => {
  await admin.goto("/admin/maps?item=m4");
  await admin.locator('input[type="file"]').setInputFiles("public/icons/icon-512.png");
  await expect(admin.locator(".img-field img")).toHaveAttribute("src", /^\/img\//);
  await save(admin);

  await viewer.goto("/venue");
  const img = viewer.getByRole("img", { name: "Field map" });
  await expect(img).toHaveAttribute("src", /^\/img\//);
  const src = await img.getAttribute("src");
  const res = await viewer.request.get(src!);
  expect(res.status()).toBe(200);
  // Small images upload untouched; only large phone photos are shrunk to JPEG first.
  expect(res.headers()["content-type"]).toBe("image/png");
});

test("players can add games to their calendar", async () => {
  const one = await viewer.request.get("/cal/s3");
  expect(one.status()).toBe(200);
  expect(one.headers()["content-type"]).toContain("text/calendar");
  expect(await one.text()).toContain("SUMMARY:Ireland vs Finland");
  const all = await viewer.request.get("/cal/games");
  expect((await all.text()).match(/BEGIN:VEVENT/g)).toHaveLength(4);
});

test("the guide still opens with no signal", async () => {
  await viewer.goto("/");
  await viewer.evaluate(() => navigator.serviceWorker.ready);
  await expect
    .poll(() => viewer.evaluate(async () => !!(await (await caches.open("pages-v1")).match("/schedule"))), { timeout: 20_000 })
    .toBe(true);
  // The game plan is saved too, without opening it first.
  await expect
    .poll(() => viewer.evaluate(async () => !!(await (await caches.open("pages-v1")).match("/more/game-plan/offence"))), { timeout: 20_000 })
    .toBe(true);
  await viewer.context().setOffline(true);
  try {
    await viewer.goto("/schedule");
    await expect(viewer.getByRole("heading", { level: 1, name: "Schedule" })).toBeVisible();
    await expect(viewer.locator(".sync.off")).toContainText("Offline");
    await viewer.goto("/more/game-plan/offence");
    await expect(viewer.getByRole("heading", { name: "Wheel motion" })).toBeVisible();
  } finally {
    await viewer.context().setOffline(false);
  }
});

test("changing the team passcode signs players out", async () => {
  await admin.goto("/admin/access");
  await expect(admin.locator(".passcode-big")).toHaveText(E2E.viewer);

  await admin.getByLabel("New passcode").fill(E2E.admin);
  await admin.getByRole("button", { name: "Change" }).click();
  await expect(admin.getByText("That's the staff password")).toBeVisible();

  await admin.getByLabel("New passcode").fill("blue-socks-2026");
  await admin.getByRole("button", { name: "Change" }).click();
  await expect(admin.getByText("Passcode changed")).toBeVisible();
  await expect(admin.locator(".passcode-big")).toHaveText("blue-socks-2026");

  await viewer.goto("/schedule");
  await expect(viewer).toHaveURL(/\/login\?expired=1/);
  await viewer.getByLabel("Team passcode").fill(E2E.viewer);
  await viewer.getByRole("button", { name: "Open the guide" }).click();
  await expect(viewer.locator(".msg[role=alert]")).toContainText("didn't work");
  await login(viewer, "blue-socks-2026");
  await expect(viewer.getByRole("heading", { level: 1, name: "Today" })).toBeVisible();

  // Staff stay signed in.
  await admin.goto("/admin");
  await expect(admin.getByRole("heading", { level: 1, name: "Edit the guide" })).toBeVisible();
});

test("staff start the next tournament, get it ready, then switch players over", async () => {
  await admin.goto("/admin/tournaments");
  await admin.getByRole("link", { name: "Start the next tournament" }).click();
  await admin.getByLabel("Tournament name", { exact: true }).fill("World Sixes 2027");
  await admin.getByLabel("Where", { exact: true }).fill("Toronto, Canada");
  await admin.getByLabel("First day", { exact: true }).fill("2027-07-08");
  await admin.getByLabel("Last day", { exact: true }).fill("2027-07-14");
  await admin.getByLabel("Time zone", { exact: true }).selectOption("America/Toronto");
  await expect(admin.getByLabel("Team passcode", { exact: true })).toHaveValue("blue-socks-2026");
  await admin.getByLabel("Team passcode", { exact: true }).fill("maple-leaf-2027");
  await expect(admin.locator("#carry-staff")).toBeChecked();
  await expect(admin.locator("#carry-schedule")).not.toBeChecked();
  await admin.getByRole("button", { name: "Start the tournament" }).click();
  await admin.waitForURL(/\/admin$/);
  await expect(admin.locator(".preview-bar")).toContainText("You’re working on World Sixes 2027. Players see ESLC 2026.");

  // Staff carried over; the schedule starts empty.
  await admin.goto("/team");
  await expect(admin.getByRole("heading", { name: "Maddy Morrissey Buss" })).toBeVisible();
  await admin.goto("/schedule");
  await expect(admin.getByText("Nothing here yet")).toBeVisible();

  await admin.goto("/admin/schedule");
  await admin.getByRole("button", { name: "Add an event" }).click();
  await admin.getByLabel(/^Day/).fill("2027-07-10");
  await admin.getByLabel("Opponent", { exact: true }).fill("Canada");
  await admin.getByLabel("Start time").fill("10:00");
  await save(admin);

  // Players still see ESLC.
  await viewer.goto("/schedule");
  await expect(viewer.getByRole("heading", { name: "vs Finland" })).toBeVisible();
  await expect(viewer.getByRole("heading", { name: "vs Canada" })).toHaveCount(0);

  await admin.goto("/admin/tournaments");
  const worlds = admin.locator(".card", { hasText: "World Sixes 2027" });
  admin.once("dialog", (d) => d.accept());
  await worlds.getByRole("button", { name: "Make live" }).click();
  await expect(worlds.locator(".chip.live-now")).toHaveText("Live");
  await expect(admin.locator(".preview-bar")).toHaveCount(0);

  // A new passcode signs players out, and lets them into the new tournament.
  await viewer.goto("/schedule");
  await expect(viewer).toHaveURL(/\/login\?expired=1/);
  await login(viewer, "maple-leaf-2027");
  await viewer.goto("/schedule");
  const add = viewer.getByRole("link", { name: "Add the Canada game to your calendar" });
  await expect(add).toBeVisible();
  // Times are Toronto time: 10:00 in July is 14:00 UTC.
  const ics = await (await viewer.request.get((await add.getAttribute("href"))!)).text();
  expect(ics).toContain("DTSTART:20270710T140000Z");
  await viewer.goto("/");
  await expect(viewer.getByText("All times are Canada Eastern time.")).toBeVisible();

  // Staff can still open the old tournament without changing what players see.
  await admin.goto("/admin/tournaments");
  await admin.locator(".card", { hasText: "ESLC 2026" }).getByRole("button", { name: "Work on this one" }).click();
  await admin.waitForURL(/\/admin$/);
  await expect(admin.locator(".preview-bar")).toContainText("You’re working on ESLC 2026. Players see World Sixes 2027.");
  await viewer.goto("/schedule");
  await expect(viewer.getByRole("heading", { name: "vs Canada" })).toBeVisible();
});
