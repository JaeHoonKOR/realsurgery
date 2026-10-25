import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { test, expect } from "../fixtures";

// docs/QUALITY.md 1절: axe-core critical·serious 0건 — P-06(1단계·2단계 오류 상태)·P-07·C-01
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

async function blocking(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return results.violations
    .filter((v) => v.impact === "critical" || v.impact === "serious")
    .map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

for (const route of ["consult/?procedure_id=double-eyelid", "privacy/", "terms/"]) {
  test(`axe critical·serious 0건: ${route}`, async ({ page }) => {
    await page.goto(route);
    expect(await blocking(page)).toEqual([]);
  });
}

test("axe critical·serious 0건: 상담 폼 2단계 오류 상태 → 완료 화면", async ({ page }) => {
  await page.goto("consult/?procedure_id=double-eyelid");
  await page.getByTestId("consent-save").click();
  await page.locator("label", { hasText: "서울 강남·서초" }).click();
  await page.locator("label", { hasText: "1개월 내" }).click();
  await page.getByTestId("consult-submit").click();
  await page.getByTestId("consult-submit").click();
  await expect(page.locator("#phone-error")).toBeVisible();
  expect(await blocking(page)).toEqual([]);

  await page.locator("#consult-name").fill("김지은");
  await page.locator("#consult-phone").fill("01055554444");
  await page.locator("label", { hasText: /^저녁$/ }).click();
  await page.locator("label", { hasText: "약관 전체 동의" }).click();
  await page.getByTestId("consult-submit").click();
  await page.waitForURL(/\/consult\/done\/$/);
  await expect(page.getByTestId("consult-done")).toBeVisible();
  expect(await blocking(page)).toEqual([]);
});
