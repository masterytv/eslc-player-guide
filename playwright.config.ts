import { defineConfig, devices } from "@playwright/test";
import { E2E } from "./tests/e2e/env";

const PORT = Number(process.env.E2E_PORT ?? 3300);
const baseURL = `http://127.0.0.1:${PORT}`;

// Runs against local files by default; set E2E_DATABASE_URL to run the same tests on Postgres.

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  reporter: [["list"]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: { ...devices["Pixel 7"], baseURL, trace: "retain-on-failure" },
  webServer: {
    command: `node tests/e2e/reset.mjs && npm run build && npx next start -p ${PORT}`,
    url: `${baseURL}/login`,
    reuseExistingServer: false,
    timeout: 300_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      SESSION_SECRET: "e2e-session-secret-e2e-session-secret",
      ADMIN_PASSWORD: E2E.admin,
      VIEWER_PASSWORD: E2E.viewer,
      GUIDE_DATA_DIR: ".data-e2e",
      ...(process.env.E2E_DATABASE_URL ? { DATABASE_URL: process.env.E2E_DATABASE_URL } : {}),
    },
  },
});
