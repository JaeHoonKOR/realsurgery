import { test, expect } from "../fixtures";
import { tooSmall, visibleTargets } from "./touch-targets";

test.describe("홈 P-01", () => {
  test("basePath 하위에서 렌더링되고 필수 영역이 있다", async ({ page }) => {
    const res = await page.goto("./");
    expect(res?.status()).toBe(200);
    await expect(page).toHaveTitle(/리얼성형/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ko");
    for (const id of ["site-header", "home-hero", "hero-price-card", "home-categories", "home-popular", "home-clinics", "site-footer"]) {
      await expect(page.getByTestId(id)).toBeVisible();
    }
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/시술 가격·회복기간,\s*한 번에 비교/);
    await expect(page.getByTestId("site-footer")).toContainText(
      "본 정보는 의료 조언이 아니며 진단·치료는 의료진 상담 필요",
    );
  });

  test("가로 스크롤이 없다", async ({ page }) => {
    await page.goto("./");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("Pretendard Variable 서브셋이 basePath 경로로 로드되고 본문 타이포가 토큰과 같다", async ({ page }) => {
    const fontResponses: string[] = [];
    page.on("response", (r) => {
      if (r.url().endsWith(".woff2") && r.ok()) fontResponses.push(r.url());
    });
    await page.goto("./");
    // 웹폰트는 첫 페인트 뒤에 붙는다(app/layout.tsx FONT_LOADER) → 로드 완료까지 기다린다
    // (document.fonts.check 는 해당 @font-face 가 아직 없을 때도 true 라서 FontFace 상태를 직접 본다)
    const pretendardLoaded = () =>
      page.evaluate(async () => {
        await document.fonts.ready;
        return [...document.fonts].some(
          (f) => f.family.replace(/["']/g, "") === "Pretendard Variable" && f.status === "loaded",
        );
      });
    await expect.poll(pretendardLoaded, { timeout: 10_000 }).toBe(true);
    const result = await page.evaluate(() => {
      const body = getComputedStyle(document.body);
      return {
        loaded: document.fonts.check('16px "Pretendard Variable"', "시술 가격"),
        family: body.fontFamily,
        size: body.fontSize,
        lineHeight: body.lineHeight,
        wordBreak: body.wordBreak,
      };
    });
    expect(result.loaded).toBe(true);
    expect(result.family).toContain("Pretendard Variable");
    expect(result.size).toBe("16px");
    expect(result.lineHeight).toBe("27.2px");
    expect(result.wordBreak).toBe("keep-all");
    expect(fontResponses.length).toBeGreaterThan(0);
    const base = new URL(page.url()).pathname; // 예: /realsurgery/
    for (const url of fontResponses) expect(new URL(url).pathname.startsWith(`${base}fonts/pretendard/`)).toBe(true);
  });

  test("웹폰트 교체(swap)로 생기는 CLS 가 0.05 이하다 (폭 360~1280 스윕)", async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1280", "폭 스윕은 한 프로젝트에서만 실행");
    // 웹폰트는 첫 페인트 뒤에 붙으므로(app/layout.tsx FONT_LOADER) swap 은 항상 페인트 이후 → 실제 layout-shift 로 측정된다.
    const VIEWPORTS = [
      { width: 360, height: 780 },
      { width: 375, height: 812 },
      { width: 390, height: 844 },
      { width: 412, height: 823 }, // Lighthouse 모바일 기본
      { width: 430, height: 932 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
      { width: 1280, height: 800 },
    ];
    const SELECTOR = "[data-testid], h1, h2, main p, dl > div, footer p";

    async function measure(viewport: { width: number; height: number }) {
      const ctx = await browser.newContext({ viewport });
      const page = await ctx.newPage();
      await page.addInitScript(() => {
        const w = window as unknown as { __cls: number; __tops: number[] | null };
        w.__cls = 0;
        w.__tops = null;
        new PerformanceObserver((list) => {
          for (const e of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
            if (!e.hadRecentInput) w.__cls += e.value;
          }
        }).observe({ type: "layout-shift", buffered: true });
      });
      await page.goto(testInfo.project.use.baseURL ?? "./");
      // 폴백 폰트 상태의 블록 위치(웹폰트 CSS가 붙기 전)
      const before = await page.evaluate(
        (sel) => [...document.querySelectorAll(sel)].map((el) => Math.round(el.getBoundingClientRect().top)),
        SELECTOR,
      );
      await expect
        .poll(() =>
          page.evaluate(async () => {
            await document.fonts.ready;
            return [...document.fonts].some(
              (f) => f.family.replace(/["']/g, "") === "Pretendard Variable" && f.status === "loaded",
            );
          }),
        )
        .toBe(true);
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      const after = await page.evaluate(
        (sel) => [...document.querySelectorAll(sel)].map((el) => Math.round(el.getBoundingClientRect().top)),
        SELECTOR,
      );
      const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
      await ctx.close();
      const maxShift = Math.max(0, ...after.map((top, i) => Math.abs(top - (before[i] ?? top))));
      return { cls, maxShift };
    }

    const report: string[] = [];
    for (const vp of VIEWPORTS) {
      const { cls, maxShift } = await measure(vp);
      report.push(`${vp.width}px: CLS ${cls.toFixed(3)} / 최대 이동 ${maxShift}px`);
      expect(cls, `폭 ${vp.width}px 에서 CLS ${cls.toFixed(3)} (${report.join(", ")})`).toBeLessThanOrEqual(0.05);
    }
    testInfo.annotations.push({ type: "font-swap", description: report.join(", ") });
    console.log(`[font-swap] ${report.join(" | ")}`);
  });

  test("모바일 터치 타겟 44px 이상 — 보이는 인터랙티브 요소 전부(첫 방문·동의 후)", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-375", "모바일 기준");
    await page.goto("./");
    const first = await visibleTargets(page);
    for (const area of ["site-logo", "consent-banner"]) {
      expect(first.some((t) => t.label.startsWith(`[${area}]`)), `${area} 의 요소를 찾지 못함`).toBe(true);
    }
    expect(tooSmall(first), "첫 방문 화면의 44px 미만 요소").toEqual([]);
    await page.getByTestId("consent-save").click();
    await expect(page.getByTestId("consent-banner")).toBeHidden();
    expect(tooSmall(await visibleTargets(page)), "동의 후 화면의 44px 미만 요소").toEqual([]);
  });

  test("canonical·description 메타가 있다", async ({ page }) => {
    await page.goto("./");
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toMatch(/^https?:\/\/.+\/$/);
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description?.length ?? 0).toBeGreaterThanOrEqual(120);
    expect(description?.length ?? 0).toBeLessThanOrEqual(150);
  });

  test("공통 틀(T-100b): 헤더·푸터·동의 배너, Consent Mode 기본 denied", async ({ page }) => {
    await page.goto("./");
    await expect(page.getByTestId("site-logo")).toHaveText("리얼성형");
    await expect(page.getByTestId("site-footer").getByTestId("footer-info")).toContainText("상담 연락 시간");
    await expect(page.getByTestId("consent-banner")).toBeVisible();
    const first = await page.evaluate(() => {
      const e = window.dataLayer?.[0];
      return e ? Array.from(e as ArrayLike<unknown>) : null;
    });
    expect(first?.slice(0, 2)).toEqual(["consent", "default"]);
    expect(first?.[2]).toMatchObject({ analytics_storage: "denied", ad_storage: "denied" });
    await page.getByTestId("consent-save").click();
    await expect(page.getByTestId("consent-banner")).toBeHidden();
    await page.reload();
    await expect(page.getByTestId("consent-banner")).toBeHidden();
  });

  test("모든 내부 링크·CTA 가 실제 화면으로 이어진다(아직 없는 화면 링크 노출 금지)", async ({ page, request }) => {
    await page.goto("./");
    const hrefs = await page.$$eval("a[href]", (as) =>
      as.map((a) => (a as HTMLAnchorElement).href).filter((h) => h.startsWith(location.origin)),
    );
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of new Set(hrefs.map((h) => h.split("#")[0]!))) {
      const res = await request.get(href);
      expect(res.status(), href).toBe(200);
    }
  });

  test("하드코딩된 GA·Pixel 태그가 없다", async ({ page }) => {
    await page.goto("./");
    const html = await page.content();
    expect(html).not.toMatch(/gtag\(|fbq\(|googletagmanager\.com\/gtag|connect\.facebook\.net/);
  });
});
