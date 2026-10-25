import { defineConfig } from "@playwright/test";
import { detectBasePath } from "./scripts/serve-out.mjs";

// 1) out/(pnpm build 결과)를 GitHub Pages와 같은 basePath로 서빙해 실제 배포 화면을 검사한다.
// 2) 공통 컴포넌트 미리보기(next dev, RS_PREVIEW=1 → app/**/page.preview.tsx)를 검사한다. 배포에는 포함되지 않는 화면.
const PORT = Number(process.env.PW_PORT ?? 4173);
const PREVIEW_PORT = Number(process.env.PW_PREVIEW_PORT ?? 4174);
const basePath: string = detectBasePath();
const origin = `http://localhost:${PORT}`;
const previewOrigin = `http://localhost:${PREVIEW_PORT}`;

const mobile = {
  browserName: "chromium" as const,
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
};
const desktop = { browserName: "chromium" as const, viewport: { width: 1280, height: 800 } };
const PREVIEW_SPEC = /\.preview\.spec\.ts$/;

export default defineConfig({
  testDir: "tests",
  testMatch: ["e2e/**/*.spec.ts", "a11y/**/*.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"]],
  outputDir: "test-results/playwright",
  use: {
    locale: "ko-KR",
    // 로컬·샌드박스에서 Playwright 브라우저 대신 다른 Chromium 을 쓸 때만(미설정이면 기본 브라우저)
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile-375", testIgnore: PREVIEW_SPEC, use: { ...mobile, baseURL: `${origin}${basePath}/` } },
    { name: "desktop-1280", testIgnore: PREVIEW_SPEC, use: { ...desktop, baseURL: `${origin}${basePath}/` } },
    {
      name: "preview-375",
      testMatch: PREVIEW_SPEC,
      use: { ...mobile, baseURL: `${previewOrigin}${basePath}/preview/` },
    },
    {
      name: "preview-1280",
      testMatch: PREVIEW_SPEC,
      use: { ...desktop, baseURL: `${previewOrigin}${basePath}/preview/` },
    },
  ],
  webServer: [
    {
      command: `node scripts/serve-out.mjs --port ${PORT}`,
      url: `${origin}${basePath}/`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: `node scripts/preview.mjs --port ${PREVIEW_PORT}`,
      url: `${previewOrigin}${basePath}/preview/`,
      reuseExistingServer: !process.env.CI,
      // 개발 서버 첫 컴파일 포함
      timeout: 180_000,
    },
  ],
});
