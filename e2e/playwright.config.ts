import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    headless: true,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  webServer: [
    {
      command: "pnpm --filter @planning-poker/api dev",
      port: 3001,
      reuseExistingServer: true,
      cwd: "..",
    },
    {
      command: "pnpm --filter @planning-poker/web dev",
      port: 5173,
      reuseExistingServer: true,
      cwd: "..",
    },
  ],
});
