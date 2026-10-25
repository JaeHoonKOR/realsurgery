import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "../fixtures";

// docs/QUALITY.md 1절: axe-core critical·serious 0건 — P-02 시술 가이드 목록, P-03 시술 상세(본문 있음·비수술)
const ROUTES = ["procedures/", encodeURI("procedures/쌍꺼풀-수술/"), encodeURI("procedures/레이저-토닝/")];

for (const route of ROUTES) {
  test(`axe critical·serious 0건: ${decodeURI(route)}`, async ({ page }) => {
    await page.goto(route);
    // 접힌 FAQ·목차를 펼친 상태도 함께 검사
    for (const summary of await page.locator("details summary").all()) await summary.click();
    const toc = page.getByTestId("procedure-toc").getByRole("button");
    if ((await toc.count()) && (await toc.isVisible())) await toc.click();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
      .analyze();
    const blocking = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    const summary = blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
    expect(summary).toEqual([]);
  });
}
