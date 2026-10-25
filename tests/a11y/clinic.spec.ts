import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "../fixtures";

// docs/QUALITY.md 1절: axe-core critical·serious 0건 — P-04 병원 목록(비교 표 열림 포함)·P-05 병원 상세

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

// 동의 배너(첫 방문)는 모바일에서 화면 아래를 덮으므로 비교함을 누르기 전에 선택을 끝낸 상태로 시작한다.
// 배너 자체의 접근성은 tests/a11y/home.spec.ts 가 첫 방문 상태로 검사한다.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("rs_consent", JSON.stringify({ v: 1, analytics: false, ads: false, at: new Date().toISOString() }));
    } catch {
      /* 저장소 차단 환경 */
    }
  });
});

async function blocking(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return results.violations
    .filter((v) => v.impact === "critical" || v.impact === "serious")
    .map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

test("axe critical·serious 0건: P-04 목록 + 비교 표", async ({ page }) => {
  await page.goto("clinics/");
  expect(await blocking(page)).toEqual([]);
  const cards = page.getByTestId("clinic-card");
  await cards.nth(0).locator("label").click();
  await cards.nth(1).locator("label").click();
  await page.getByTestId("compare-open").click();
  await expect(page.getByTestId("compare-table")).toBeVisible();
  expect(await blocking(page)).toEqual([]);
});

test("axe critical·serious 0건: P-05 상세", async ({ page }) => {
  await page.goto("clinics/");
  const href = await page.getByTestId("clinic-card-link").first().getAttribute("href");
  await page.goto(href!);
  expect(await blocking(page)).toEqual([]);
});
