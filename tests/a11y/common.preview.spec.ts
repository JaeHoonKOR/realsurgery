import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { test, expect } from "../fixtures";

// docs/QUALITY.md 1절: axe-core critical·serious 0건 — 공통 컴포넌트 미리보기(개발 서버)의 상태별 검사
async function blocking(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
    .analyze();
  return results.violations
    .filter((v) => v.impact === "critical" || v.impact === "serious")
    .map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

test("axe critical·serious 0건: 미리보기 첫 방문(동의 배너 표시)", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByTestId("consent-banner")).toBeVisible();
  expect(await blocking(page)).toEqual([]);
});

test("axe critical·serious 0건: 검색 자동완성 열림·결과 없음", async ({ page }) => {
  await page.goto("./");
  const input = page.getByRole("combobox", { name: "시술 검색" });
  await input.fill("눈");
  await input.press("ArrowDown");
  await expect(page.getByRole("listbox")).toBeVisible();
  expect(await blocking(page)).toEqual([]);
  await input.fill("없는시술명");
  await expect(page.getByRole("status").filter({ hasText: "일치하는 시술이 없습니다" })).toBeVisible();
  expect(await blocking(page)).toEqual([]);
});

test("axe critical·serious 0건: 동의 후(배너 숨김)", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId("consent-accept-all").click();
  await expect(page.getByTestId("consent-banner")).toBeHidden();
  expect(await blocking(page)).toEqual([]);
});
