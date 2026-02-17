import { defineConfig } from "@playwright/test";

const baseURL = process.env.BASE_URL || "http://localhost:5173";
const isExternal = !!process.env.BASE_URL;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: isExternal ? 120_000 : 60_000,
  expect: { timeout: isExternal ? 15_000 : 10_000 },
  retries: 0,
  reporter: "list",
  use: {
    baseURL,
    headless: true,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  ...(isExternal
    ? {}
    : {
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
      }),
});
