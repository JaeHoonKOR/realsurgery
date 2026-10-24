import { defineConfig } from "@playwright/test";
import { detectBasePath } from "./scripts/serve-out.mjs";

// out/(pnpm build 결과)를 GitHub Pages와 같은 basePath로 서빙해 검사한다.
const PORT = 4173;
const basePath: string = detectBasePath();
const origin = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "tests",
  testMatch: ["e2e/**/*.spec.ts", "a11y/**/*.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"]],
  outputDir: "test-results/playwright",
  use: {
    baseURL: `${origin}${basePath}/`,
    locale: "ko-KR",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "mobile-375",
      use: {
        browserName: "chromium",
        viewport: { width: 375, height: 812 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "desktop-1280",
      use: { browserName: "chromium", viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    command: `node scripts/serve-out.mjs --port ${PORT}`,
    url: `${origin}${basePath}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
