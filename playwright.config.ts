/**
 * O2 PRODE — Playwright config
 * Agente 14 · QA & Performance
 *
 * Runs 4 critical e2e flows × 3 viewports.
 */

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? "github" : "html",

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    locale: "es-AR",
    timezoneId: "America/Argentina/Buenos_Aires",
  },

  projects: [
    {
      name: "mobile-small",
      use: { ...devices["iPhone SE"], viewport: { width: 360, height: 640 } },
    },
    {
      name: "mobile-standard",
      use: { ...devices["iPhone 14 Pro"] },
    },
    {
      name: "desktop-centered",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1024, height: 768 } },
    },
  ],

  webServer: process.env.CI
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
