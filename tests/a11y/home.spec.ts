import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "../fixtures";

// docs/QUALITY.md 1절: axe-core critical·serious 0건
const ROUTES = ["./"];

for (const route of ROUTES) {
  test(`axe critical·serious 0건: ${route}`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
      .analyze();
    const blocking = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    const summary = blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
    expect(summary).toEqual([]);
  });
}
