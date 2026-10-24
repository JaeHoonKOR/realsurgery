import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { test, expect } from "../fixtures";

// docs/QUALITY.md 1절: axe-core critical·serious 0건 — P-03 시술 상세(배포 화면)
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

async function blocking(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return results.violations
    .filter((v) => v.impact === "critical" || v.impact === "serious")
    .map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

for (const slug of ["쌍꺼풀-수술", "레이저-토닝", "가슴-확대-수술"]) {
  test(`axe 0건: /procedures/${slug}/ 첫 방문`, async ({ page }) => {
    await page.goto(`procedures/${slug}/`);
    expect(await blocking(page)).toEqual([]);
  });
}

test("axe 0건: P-03 동의 후 + FAQ 열림", async ({ page }) => {
  await page.goto("procedures/쌍꺼풀-수술/");
  await page.getByTestId("consent-save").click();
  await page.getByTestId("procedure-faq").locator("summary").first().click();
  expect(await blocking(page)).toEqual([]);
});

test("axe 0건: 낮은 화면(320×568) 접힌 동의 배너·펼친 배너", async ({ browser, baseURL }, info) => {
  test.skip(info.project.name !== "mobile-375", "뷰포트를 직접 지정 — 한 프로젝트에서만");
  const ctx = await browser.newContext({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true, locale: "ko-KR" });
  const page = await ctx.newPage();
  await page.goto(`${baseURL}procedures/${encodeURIComponent("쌍꺼풀-수술")}/`);
  expect(await blocking(page)).toEqual([]);
  await page.getByTestId("consent-disclosure").click();
  expect(await blocking(page)).toEqual([]);
  await ctx.close();
});
