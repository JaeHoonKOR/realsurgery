import type { Browser, Page, Route } from "@playwright/test";
import { loadContent } from "../../lib/content";
import { test, expect } from "../fixtures";
import { tooSmall, visibleTargets } from "./touch-targets";

/**
 * P-03 시술 상세 가이드 (/procedures/{slug}) — 정적 export(out/) 화면 검증. screen-spec 4절 P-03, 5절 이벤트, 6절 SEO/AEO.
 * 상담 폼(P-06, T-101)·병원 상세(P-05, T-104)는 아직 없으므로 배포 화면에는 CTA·하단 바·병원 링크가 나오지 않는다(깨진 링크 금지).
 * 그 요소들은 tests/e2e/procedure.preview.spec.ts(모든 경로를 있는 것으로 보는 미리보기)에서 검증한다.
 */

const content = loadContent();
const eyelid = content.procedures.find((p) => p.id === "double-eyelid")!;
const PATH = (slug: string) => `procedures/${slug}/`;
const isMobile = (name: string) => name === "mobile-375";

type Entry = Record<string, unknown>;
const events = (page: Page) =>
  page.evaluate(() => (window.dataLayer ?? []).filter((e) => typeof (e as { event?: unknown }).event === "string") as Record<string, unknown>[]);
const ofType = async (page: Page, name: string) => (await events(page)).filter((e: Entry) => e.event === name);

test.describe("P-03 구성 요소 (4절 표 전 행)", () => {
  test("시술 10개 전부 정적 생성: 200, H1 = 시술명, 본문 H2 5개, FAQ, 출처", async ({ page }) => {
    for (const p of content.procedures) {
      const res = await page.goto(PATH(p.slug));
      expect(res?.status(), p.slug).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(p.name);
      await expect(page.getByTestId("procedure-body").locator("h2")).toHaveCount(5);
      await expect(page.getByTestId("procedure-faq").locator("details")).toHaveCount(p.faqs.length);
      await expect(page.getByTestId("procedure-sources").locator("li")).toHaveCount(p.sources.length);
    }
  });

  test("요약 박스·목차·본문·가격 표·FAQ·관련 시술·메타가 있고 순서대로 놓인다", async ({ page }) => {
    await page.goto(PATH(eyelid.slug));
    const ids = [
      "breadcrumb",
      "procedure-summary",
      "procedure-toc",
      "procedure-body",
      "procedure-prices",
      "procedure-faq",
      "procedure-meta",
      "procedure-related",
    ];
    for (const id of ids) await expect(page.getByTestId(id), id).toBeVisible();
    // 요약 박스 4칸
    await expect(page.locator("[data-fact] dt")).toHaveText(["가격 범위", "소요시간", "회복기간", "마취 방식"]);
    await expect(page.locator("[data-fact-value]")).toHaveText(["50만~250만 원", "약 1시간", "약 7일", "국소 마취 (수면 마취 병행 가능)"]);
    // 본문 H2: 검색 질문 형태 5개 + 앵커, 섹션마다 출처 각주
    const h2 = page.getByTestId("procedure-body").locator("h2");
    await expect(h2).toHaveText([/누가 받나요\?$/, /비용은 얼마인가요\?$/, /회복은 며칠 걸리나요\?$/, /부작용과 주의할 점은 무엇인가요\?$/, /비슷한 시술은 어떻게 다른가요\?$/]);
    expect(await h2.evaluateAll((els) => els.map((e) => e.id))).toEqual(["guide-who", "guide-cost", "guide-recovery", "guide-risks", "guide-compare"]);
    const citesPerSection = await page.getByTestId("procedure-body").evaluate((body) => {
      const counts: number[] = [];
      for (const el of body.children) {
        if (el.tagName === "H2") counts.push(0);
        else if (counts.length) counts[counts.length - 1]! += el.querySelectorAll("sup[data-cite]").length;
      }
      return counts;
    });
    expect(citesPerSection.every((n) => n > 0), JSON.stringify(citesPerSection)).toBe(true);
    // 가격 표: 병원별 최저~최고가, 예시 데이터 표기
    await expect(page.getByTestId("procedure-prices").locator("tbody tr")).toHaveCount(2);
    await expect(page.getByTestId("procedure-prices-demo")).toBeVisible();
    // FAQ 5개, 관련 시술 4개
    await expect(page.getByTestId("procedure-faq").locator("summary")).toHaveCount(5);
    await expect(page.getByTestId("procedure-related").getByRole("link")).toHaveCount(4);
    // 메타: 작성자·의료 자문·최종 수정일
    const meta = page.getByTestId("procedure-meta");
    await expect(meta).toContainText("리얼성형 편집팀");
    await expect(meta).toContainText("의료 자문");
    await expect(meta.locator("time")).toHaveAttribute("datetime", "2026-10-25");
    // 브레드크럼 홈 › 시술 가이드 › 눈 › 쌍꺼풀 수술
    await expect(page.getByTestId("breadcrumb").getByRole("listitem")).toHaveText(["홈", "시술 가이드", "눈", "쌍꺼풀 수술"]);

    // DOM 순서 = 표의 영역 순서(요약 → 목차 → 본문 → 가격 → FAQ → 메타 → 관련)
    const tops = await page.evaluate(
      (list) => list.map((id) => document.querySelector(`[data-testid="${id}"]`)!.compareDocumentPosition(document.querySelector('[data-testid="procedure-related"]')!)),
      ids.slice(0, -1),
    );
    for (const t of tops) expect(t & 4 /* Node.DOCUMENT_POSITION_FOLLOWING */).toBeTruthy();
  });

  test("아직 없는 화면으로 가는 요소는 숨긴다: 상담 CTA·하단 바(P-06), 병원 링크(P-05), 추천템(파트너스 전)", async ({ page }) => {
    await page.goto(PATH(eyelid.slug));
    for (const id of ["consult-cta-mid", "consult-cta-bottom", "bottom-bar", "procedure-affiliates"]) {
      await expect(page.getByTestId(id), id).toHaveCount(0);
    }
    await expect(page.getByTestId("procedure-prices").getByRole("link")).toHaveCount(0);
  });

  test("없는 slug 는 404", async ({ request, baseURL }) => {
    const res = await request.get(`${baseURL}${PATH(encodeURIComponent("없는-시술"))}`);
    expect(res.status()).toBe(404);
  });
});

test.describe("P-03 이벤트 (5절)", () => {
  test("view_procedure 1회 → 스크롤 25/50/75/100 → FAQ 열기 expand_faq → 관련 시술 select_procedure", async ({ page }) => {
    await page.goto(PATH(eyelid.slug));
    await expect.poll(() => ofType(page, "view_procedure")).toEqual([
      { event: "view_procedure", procedure_id: "double-eyelid", procedure_name: "쌍꺼풀 수술", category: "eye" },
    ]);

    for (const f of [0.3, 0.55, 0.8, 1]) {
      await page.evaluate((r) => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * r), f);
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    }
    await expect.poll(async () => (await ofType(page, "scroll_depth")).map((e) => e.percent)).toEqual([25, 50, 75, 100]);
    expect((await ofType(page, "scroll_depth"))[0]).toEqual({ event: "scroll_depth", percent: 25, page_type: "procedure" });

    await page.getByTestId("consent-save").click();
    const faq = page.getByTestId("procedure-faq").locator("summary").nth(2);
    await faq.click();
    await expect(page.getByTestId("procedure-faq").locator("details").nth(2)).toHaveAttribute("open", "");
    await expect(page.getByTestId("procedure-faq").locator("details p").nth(2)).toBeVisible();
    await faq.click(); // 닫기는 이벤트 없음
    expect(await ofType(page, "expand_faq")).toEqual([{ event: "expand_faq", procedure_id: "double-eyelid", question_index: 3 }]);

    const card = page.getByTestId("procedure-related").getByRole("link").first();
    await expect(card).toHaveAttribute("data-track", "select_procedure");
    await card.click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("눈매교정");
    expect(await ofType(page, "select_procedure")).toEqual([{ event: "select_procedure", procedure_id: "ptosis-correction", from_page: "procedure" }]);
    // 다른 시술로 이동하면 그 시술의 view_procedure 가 다시 1회
    await expect.poll(async () => (await ofType(page, "view_procedure")).map((e) => e.procedure_id)).toEqual(["double-eyelid", "ptosis-correction"]);
  });

  test("목차 링크는 해당 H2 로 이동하고 고정 헤더에 가리지 않는다", async ({ page }) => {
    await page.goto(PATH(eyelid.slug));
    await page.getByTestId("consent-save").click();
    await page.getByTestId("procedure-toc").getByRole("link", { name: /회복은 며칠/ }).click();
    await expect(page).toHaveURL(/#guide-recovery$/);
    const header = await page.getByTestId("site-header").boundingBox();
    const h2 = await page.locator("#guide-recovery").boundingBox();
    expect(h2!.y).toBeGreaterThanOrEqual(header!.y + header!.height);
    expect(h2!.y).toBeLessThan(page.viewportSize()!.height / 2);
  });
});

test.describe("P-03 SEO·AEO (6절)", () => {
  test("title·description·canonical·OG, JSON-LD 4종(평점 없음), 첫 문단 직답", async ({ page }) => {
    await page.goto(PATH(eyelid.slug));
    const title = await page.title();
    expect(title).toBe("쌍꺼풀 수술 가격·회복기간·부작용 총정리 (2026) | 리얼성형");
    expect(title.length).toBeLessThanOrEqual(60);
    const description = (await page.locator('meta[name="description"]').getAttribute("content")) ?? "";
    expect(description.length).toBeGreaterThanOrEqual(120);
    expect(description.length).toBeLessThanOrEqual(150);
    expect(description).toContain("50만~250만 원");
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toMatch(/\/procedures\/%EC%8C%8D%EA%BA%BC%ED%92%80-%EC%88%98%EC%88%A0\/$/);
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");

    // @graph 와 중첩(MedicalWebPage.mainEntity = MedicalProcedure)까지 @type 노드를 모은다
    const nodes = await page.$$eval('script[type="application/ld+json"]', (els) => {
      const out: { "@type": string; [k: string]: unknown }[] = [];
      const visit = (v: unknown) => {
        if (Array.isArray(v)) v.forEach(visit);
        else if (v && typeof v === "object") {
          const o = v as { "@type"?: unknown };
          if (typeof o["@type"] === "string") out.push(o as { "@type": string });
          Object.values(o).forEach(visit);
        }
      };
      for (const el of els) visit(JSON.parse(el.textContent ?? "{}"));
      return out;
    });
    const types = new Set(nodes.map((n) => n["@type"]));
    for (const t of ["BreadcrumbList", "FAQPage", "MedicalProcedure", "MedicalWebPage"]) expect(types.has(t), t).toBe(true);
    const html = await page.content();
    expect(html).not.toMatch(/AggregateRating|aggregateRating/);
    const proc = nodes.find((n) => n["@type"] === "MedicalProcedure")!;
    expect(proc).toMatchObject({ procedureType: "https://schema.org/SurgicalProcedure", bodyLocation: "윗눈꺼풀" });
    for (const k of ["howPerformed", "preparation", "followup"]) expect(proc[k], k).toBeTruthy();
    await expect(page.getByTestId("procedure-answer")).toHaveText(proc.description as string);

    // 첫 문단(요약 박스 직답) = 2~3문장
    const answer = (await page.getByTestId("procedure-answer").textContent()) ?? "";
    expect(answer.split(/(?<=[.?!])\s+/).length).toBeGreaterThanOrEqual(2);
  });

  test("완성 HTML: JS 없이도 본문·FAQ 답변이 들어 있다(네이버봇 렌더링 불필요)", async ({ request, baseURL }) => {
    const html = await (await request.get(`${baseURL}${PATH(encodeURIComponent(eyelid.slug))}`)).text();
    expect(html).toContain("쌍꺼풀 수술은 누가 받나요?");
    expect(html).toContain(eyelid.faqs[4]!.answer);
    expect(html).not.toMatch(/<template id="B:/); // 스트리밍 fallback 없음
    // RSC 페이로드는 외부 파일(scripts/externalize-rsc.mjs) — 문서는 화면 HTML 만, gzip 14KB(TCP 첫 전송 창) 이하
    expect(html).not.toContain("self.__next_f.push([1,");
    const src = html.match(/<script src="([^"]+\.rsc\.js[^"]*)"><\/script>/)?.[1];
    expect(src).toBeTruthy();
    const rsc = await request.get(new URL(src!, baseURL).href);
    expect(rsc.status()).toBe(200);
    const js = await rsc.text();
    expect(js).toMatch(/^\(self\.__next_f=self\.__next_f\|\|\[\]\)\.push\(\[0\]\)/);
    expect(js.trimEnd()).toMatch(/self\.__rs_rsc_ok=1;$/); // 끝까지 실행됐다는 표시 → 그때만 하이드레이션
    // 하이드레이션 보류 GATE 가 모든 스크립트보다 앞
    expect(html.indexOf("<script")).toBe(html.indexOf("<script>(function(s){var d,p=new Promise"));
    // 문서 크기: 시술 전체(docs/content/procedure-mdx.md)
    const { gzipSync } = await import("node:zlib");
    for (const p of content.procedures) {
      const doc = await (await request.get(`${baseURL}${PATH(encodeURIComponent(p.slug))}`)).text();
      expect(gzipSync(Buffer.from(doc)).length, p.slug).toBeLessThanOrEqual(14 * 1024);
    }
  });
});

test.describe("RSC 페이로드(*.rsc.js) 실패 — 정적 HTML 유지 (리뷰 T-103 r1 반려 1, scripts/externalize-rsc.mjs)", () => {
  // 실패를 일부러 만드는 검사라 공통 fixture(콘솔·4xx 0)를 쓰지 않고 직접 수집해, 예상한 페이로드 실패 외에는 0 인지 본다.
  type Env = { browser: Browser; baseURL?: string; viewport: { width: number; height: number } | null; isMobile: boolean; hasTouch: boolean };
  const open = async ({ browser, baseURL, viewport, isMobile: mobile, hasTouch }: Env, handle: (route: Route, nth: number) => Promise<void>) => {
    const ctx = await browser.newContext({ viewport, isMobile: mobile, hasTouch, locale: "ko-KR" });
    const page = await ctx.newPage();
    const issues: string[] = [];
    const rscUrls: string[] = [];
    page.on("pageerror", (e) => issues.push(`pageerror: ${e.message}`));
    page.on("console", (m) => {
      if ((m.type() === "error" || m.type() === "warning") && !/Failed to load resource/.test(m.text())) issues.push(`console.${m.type()}: ${m.text()}`);
    });
    page.on("response", (r) => {
      if (r.status() >= 400 && !/\.rsc\.js/.test(r.url())) issues.push(`HTTP ${r.status()}: ${r.url()}`);
    });
    await page.route("**/*.rsc.js*", (route) => {
      rscUrls.push(route.request().url());
      return handle(route, rscUrls.length);
    });
    await page.goto(`${baseURL}${PATH(encodeURIComponent(eyelid.slug))}`);
    return { ctx, page, issues, rscUrls };
  };

  /** JS 청크는 다 실행됐고(window.next — app-bootstrap), 재요청까지 끝난 뒤에도 하이드레이션이 시작되지 않았는지(app-index 미실행). */
  const settledWithoutHydration = async (page: Page, rscUrls: string[]) => {
    await page.waitForLoadState("load");
    await expect.poll(() => page.evaluate(() => (window as unknown as { next?: { appDir?: boolean } }).next?.appDir)).toBe(true);
    await expect.poll(() => rscUrls.length).toBe(2);
    expect(rscUrls[1]).toMatch(/[?&]retry=1$/);
    await page.waitForTimeout(500);
    // app-index 가 실행되면 self.__next_f 를 배열로 만든다 → undefined 면 하이드레이션 스트림이 열리지 않은 것
    expect(await page.evaluate(() => (self as unknown as { __next_f?: unknown }).__next_f)).toBeUndefined();
  };

  const staticContentIntact = async (page: Page) => {
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(eyelid.name);
    await expect(page.getByTestId("procedure-answer")).toBeVisible();
    await expect(page.getByTestId("procedure-body").locator("h2")).toHaveCount(5);
    await expect(page.getByTestId("procedure-body")).toContainText("쌍꺼풀 수술은 누가 받나요?");
    // FAQ 답변 텍스트가 DOM 에 있고, <details> 는 JS 없이도 열린다
    await expect(page.getByTestId("procedure-faq").locator("details p").nth(4)).toHaveText(eyelid.faqs[4]!.answer);
    await page.getByTestId("procedure-faq").locator("summary").first().scrollIntoViewIfNeeded();
    await page.getByTestId("procedure-faq").locator("summary").first().click();
    await expect(page.getByTestId("procedure-faq").locator("details p").first()).toBeVisible();
    expect(await page.evaluate(() => document.body.innerText.length)).toBeGreaterThan(2000);
  };

  test("abort: 재요청까지 실패해도 H1·본문·FAQ 답변이 남고 화면이 비지 않는다", async ({ browser, baseURL, viewport, isMobile: mobile, hasTouch }) => {
    const { ctx, page, issues, rscUrls } = await open({ browser, baseURL, viewport, isMobile: mobile, hasTouch }, (r) => r.abort());
    await settledWithoutHydration(page, rscUrls);
    await staticContentIntact(page);
    expect(issues).toEqual([]);
    await ctx.close();
  });

  test("404: 재요청까지 404 여도 H1·본문·FAQ 답변이 남고 화면이 비지 않는다", async ({ browser, baseURL, viewport, isMobile: mobile, hasTouch }) => {
    const { ctx, page, issues, rscUrls } = await open({ browser, baseURL, viewport, isMobile: mobile, hasTouch }, (r) =>
      r.fulfill({ status: 404, contentType: "text/html; charset=utf-8", body: "<!DOCTYPE html><title>404</title><h1>Not Found</h1>" }),
    );
    await settledWithoutHydration(page, rscUrls);
    await staticContentIntact(page);
    expect(issues).toEqual([]);
    await ctx.close();
  });

  test("첫 요청만 실패(일시 장애): 1회 재요청으로 받아 정상 하이드레이션 — view_procedure·동의 저장 동작", async ({ browser, baseURL, viewport, isMobile: mobile, hasTouch }) => {
    const { ctx, page, issues, rscUrls } = await open({ browser, baseURL, viewport, isMobile: mobile, hasTouch }, (r, nth) =>
      nth === 1 ? r.abort() : r.continue(),
    );
    await expect.poll(() => ofType(page, "view_procedure")).toEqual([
      { event: "view_procedure", procedure_id: "double-eyelid", procedure_name: "쌍꺼풀 수술", category: "eye" },
    ]);
    expect(rscUrls).toHaveLength(2);
    await page.getByTestId("consent-save").click();
    await expect(page.getByTestId("consent-banner")).toBeHidden();
    await staticContentIntact(page);
    expect(issues).toEqual([]);
    await ctx.close();
  });
});

test.describe("P-03 레이아웃 (QUALITY 3절)", () => {
  test("가로 스크롤 없음(시술 10개), 본문 표는 표 안에서만 스크롤", async ({ page }) => {
    for (const p of content.procedures) {
      await page.goto(PATH(p.slug));
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, p.slug).toBeLessThanOrEqual(0);
    }
  });

  test("모바일 터치 타깃 44px 이상(첫 방문·동의 후·FAQ 열림)", async ({ page }, info) => {
    test.skip(!isMobile(info.project.name), "모바일 기준");
    await page.goto(PATH(eyelid.slug));
    const first = await visibleTargets(page);
    for (const area of ["breadcrumb", "procedure-toc", "procedure-faq", "procedure-related", "procedure-sources", "consent-banner"]) {
      expect(first.some((t) => t.label.startsWith(`[${area}]`)), `${area} 의 요소를 찾지 못함`).toBe(true);
    }
    expect(tooSmall(first), "첫 방문").toEqual([]);
    await page.getByTestId("consent-save").click();
    await page.getByTestId("procedure-faq").locator("summary").first().click();
    expect(tooSmall(await visibleTargets(page)), "동의 후·FAQ 열림").toEqual([]);
  });

  test("1280: 콘텐츠 1120px, 목차는 오른쪽 열에서 따라 내려온다", async ({ page }, info) => {
    test.skip(isMobile(info.project.name), "데스크톱 기준");
    await page.goto(PATH(eyelid.slug));
    await page.getByTestId("consent-save").click();
    const article = await page.locator("article").boundingBox();
    expect(article!.width).toBe(1120);
    const toc = page.getByTestId("procedure-toc");
    const body = await page.getByTestId("procedure-body").boundingBox();
    const tocBox = await toc.boundingBox();
    expect(tocBox!.x).toBeGreaterThan(body!.x + body!.width);
    await page.locator("#faq").scrollIntoViewIfNeeded();
    const after = await toc.boundingBox();
    expect(after!.y).toBeGreaterThanOrEqual(0);
    expect(after!.y).toBeLessThan(200);
  });

  test("웹폰트 교체(swap) CLS 0.05 이하 — P-03 (폭 360~1280 스윕)", async ({ browser, baseURL }, info) => {
    test.skip(info.project.name !== "desktop-1280", "폭 스윕은 한 프로젝트에서만 실행");
    const report: string[] = [];
    for (const viewport of [
      { width: 360, height: 780 },
      { width: 375, height: 812 },
      { width: 390, height: 844 },
      { width: 412, height: 823 },
      { width: 430, height: 932 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
      { width: 1280, height: 800 },
    ]) {
      const ctx = await browser.newContext({ viewport });
      const page = await ctx.newPage();
      await page.addInitScript(() => {
        const w = window as unknown as { __cls: number };
        w.__cls = 0;
        new PerformanceObserver((list) => {
          for (const e of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
            if (!e.hadRecentInput) w.__cls += e.value;
          }
        }).observe({ type: "layout-shift", buffered: true });
      });
      await page.goto(`${baseURL}${PATH(encodeURIComponent(eyelid.slug))}`);
      await expect
        .poll(() =>
          page.evaluate(async () => {
            await document.fonts.ready;
            return [...document.fonts].some((f) => f.family.replace(/["']/g, "") === "Pretendard Variable" && f.status === "loaded");
          }),
        )
        .toBe(true);
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
      await ctx.close();
      report.push(`${viewport.width}px ${cls.toFixed(3)}`);
      expect(cls, report.join(", ")).toBeLessThanOrEqual(0.05);
    }
    console.log(`[font-swap P-03] ${report.join(" | ")}`);
  });

  test("모든 내부 링크가 200", async ({ page, request }) => {
    await page.goto(PATH(eyelid.slug));
    const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => (a as HTMLAnchorElement).href).filter((h) => h.startsWith(location.origin)));
    expect(hrefs.length).toBeGreaterThan(5);
    for (const href of new Set(hrefs.map((h) => h.split("#")[0]!))) {
      expect((await request.get(href)).status(), href).toBe(200);
    }
  });
});

test.describe("동의 배너 접기 — 낮은 화면(T-100b 리뷰 권고)", () => {
  for (const viewport of [
    { width: 320, height: 568, max: 0.4 },
    { width: 375, height: 667, max: 0.35 },
    { width: 667, height: 375, max: 0.5 },
  ]) {
    test(`${viewport.width}×${viewport.height}: 토글을 접어 화면의 ${viewport.max * 100}% 이하, 1탭 거부·펼치기`, async ({ browser, baseURL }, info) => {
      test.skip(info.project.name !== "mobile-375", "뷰포트를 직접 지정하는 검사 — 한 프로젝트에서만");
      const ctx = await browser.newContext({ viewport, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
      const page = await ctx.newPage();
      await page.goto(`${baseURL}${PATH(encodeURIComponent(eyelid.slug))}`);
      const banner = page.getByTestId("consent-banner");
      await expect(banner).toBeVisible();
      await expect(banner.locator("[role=switch]")).toHaveCount(2);
      await expect(banner.locator("[role=switch]").first()).toBeHidden();
      const disclosure = page.getByTestId("consent-disclosure");
      await expect(disclosure).toBeVisible();
      const box = await banner.boundingBox();
      expect(box!.height / viewport.height, `배너 높이 ${box!.height}px`).toBeLessThanOrEqual(viewport.max);
      expect(tooSmall(await visibleTargets(page))).toEqual([]);
      await expect(page.getByTestId("consent-save")).toHaveAccessibleName("동의 안 함");

      await disclosure.click();
      await expect(disclosure).toHaveAttribute("aria-expanded", "true");
      await expect(banner.getByRole("switch", { name: "방문 통계" })).toBeVisible();
      await expect(page.getByTestId("consent-save")).toHaveAccessibleName("선택 저장");
      await disclosure.click();
      await page.getByTestId("consent-save").click();
      await expect(banner).toBeHidden();
      const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("rs_consent") ?? "null"));
      expect(stored).toMatchObject({ analytics: false, ads: false });
      await ctx.close();
    });
  }

  test("세로가 충분한 화면(375×812)은 토글을 펼쳐 둔다", async ({ page }, info) => {
    test.skip(!isMobile(info.project.name), "모바일 기준");
    await page.goto(PATH(eyelid.slug));
    await expect(page.getByTestId("consent-banner").getByRole("switch", { name: "방문 통계" })).toBeVisible();
    await expect(page.getByTestId("consent-disclosure")).toBeHidden();
    await expect(page.getByTestId("consent-save")).toHaveAccessibleName("선택 저장");
  });
});
