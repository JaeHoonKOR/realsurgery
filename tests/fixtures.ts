import { test as base, expect } from "@playwright/test";

/**
 * 모든 브라우저 테스트 공통: 콘솔 error·warning 0, 페이지 예외 0, 같은 출처 4xx/5xx 응답 0 (docs/QUALITY.md 1절 "콘솔").
 */
export const test = base.extend<{ pageIssues: string[] }>({
  pageIssues: [
    async ({ page, baseURL }, use) => {
      const issues: string[] = [];
      const origin = new URL(baseURL ?? "http://localhost").origin;
      page.on("console", (msg) => {
        if (msg.type() === "error" || msg.type() === "warning") issues.push(`console.${msg.type()}: ${msg.text()}`);
      });
      page.on("pageerror", (err) => issues.push(`pageerror: ${err.message}`));
      page.on("response", (res) => {
        if (res.url().startsWith(origin) && res.status() >= 400) issues.push(`HTTP ${res.status()}: ${res.url()}`);
      });
      await use(issues);
      expect(issues, "콘솔·네트워크 오류가 없어야 한다").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
