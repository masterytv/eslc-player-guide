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

  await viewer.getByRole("link", { name: "Team" }).click();
  await expect(viewer.getByRole("heading", { name: "Maddy Morrissey Buss" })).toBeVisible();

  await viewer.goto("/more/conduct");
  await expect(viewer.getByRole("heading", { name: "Lights out" })).toBeVisible();

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
  const src = await img.getAttribute("src");
  expect(src).toMatch(/^\/img\//);
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
  await viewer.context().setOffline(true);
  try {
    await viewer.goto("/schedule");
    await expect(viewer.getByRole("heading", { level: 1, name: "Schedule" })).toBeVisible();
    await expect(viewer.locator(".sync.off")).toContainText("Offline");
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
