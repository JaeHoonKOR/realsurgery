// M1 흐름: 메인 → 시술 카드 → 가이드 → 병원 카드 → 병원 → CTA → 상담 1단계 → 2단계 → 완료
// E2E_BASE_URL 예: http://localhost:3100/realsurgery  또는 https://jaehoonkor.github.io/realsurgery
import { test, expect, Page } from "@playwright/test";
const BASE = (process.env.E2E_BASE_URL ?? "http://localhost:3100/realsurgery").replace(/\/$/, "");
const viewports = [{ name: "mobile", width: 375, height: 812 }, { name: "desktop", width: 1280, height: 800 }];

async function guard(page: Page) {
  const errors: string[] = [];
  page.on("console", m => { if (["error", "warning"].includes(m.type())) errors.push(m.text()); });
  page.on("response", r => { if (r.status() >= 400 && r.url().startsWith(BASE)) errors.push(`${r.status()} ${r.url()}`); });
  return errors;
}
async function assertPage(page: Page) {
  await expect(page.locator("h1")).toBeVisible();
  const visuals = await page.locator("img, svg").count(); expect(visuals, "이미지·SVG ≥ 2").toBeGreaterThanOrEqual(2);
  const unlinked = await page.locator("[data-card]").evaluateAll(els => els.filter(e => !e.closest("a[href]")).length);
  expect(unlinked, "링크 없는 카드 0").toBe(0);
}
for (const vp of viewports) test.describe(vp.name, () => {
  test.use({ viewport: { width: vp.width, height: vp.height } });
  test("M1 흐름 전체", async ({ page }) => {
    const errors = await guard(page);
    await page.goto(BASE + "/"); await assertPage(page);
    expect(await page.locator("a[data-track=select_procedure]").count()).toBeGreaterThanOrEqual(2);
    await page.locator("a[data-track=select_procedure]").first().click(); await expect(page).toHaveURL(/\/procedures\//); await assertPage(page);
    await page.locator("a[data-track=select_clinic]").first().click(); await expect(page).toHaveURL(/\/clinics\//); await assertPage(page);
    await expect(page.getByTestId("price-range")).toBeVisible();
    await page.locator("a[data-track=click_cta]").first().click(); await expect(page).toHaveURL(/\/consult/);
    await page.getByTestId("step-1").waitFor();
    await page.getByTestId("region").selectOption({ index: 1 }); await page.getByTestId("timing").first().click(); await page.getByTestId("next").click();
    await expect(page.getByTestId("step-2")).toBeVisible();
    await page.getByTestId("name").fill("테스트"); await page.getByTestId("phone").fill("01012345678"); await page.getByTestId("consent-privacy").check(); await page.getByTestId("consent-3rd").check();
    await page.getByTestId("submit").click(); await expect(page).toHaveURL(/\/consult\/done/);
    const leads = await page.evaluate(() => ((window as any).dataLayer ?? []).filter((e: any) => e.event === "generate_lead").length);
    expect(leads, "generate_lead 1회").toBe(1);
    await assertPage(page);
    expect(errors, "콘솔 error/warning·4xx 0").toEqual([]);
  });
});
