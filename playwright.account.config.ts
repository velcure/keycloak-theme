import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/account",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:8082",
    locale: "de-DE",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
  },
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report/account" }],
  ],
});
