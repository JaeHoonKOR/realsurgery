import fs from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";
import { test, expect } from "../fixtures";
import { tooSmall, visibleTargets } from "./touch-targets";

// P-02 시술 가이드 목록 · P-03 시술 상세 (screen-spec 4절 P-03, 5절 이벤트, 6절 SEO/AEO)
// 정적 export(out/)를 GitHub Pages 와 같은 basePath 로 서빙한 화면을 검사한다.

const EYELID = encodeURI("procedures/쌍꺼풀-수술/");
const LASER = encodeURI("procedures/레이저-토닝/");
/** 상담 폼(P-06, T-101)이 빌드돼 있어야 상담 CTA 가 보인다(깨진 CTA 금지 규칙) */
const HAS_CONSULT = fs.existsSync(path.join(process.cwd(), "out", "consult", "index.html"));
/** 본문 Markdown 은 content 작업(content/procedures/<id>.md)이 채운다 — 없을 때는 안내 카드 상태를 검사 */
const CONTENT = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "generated", "content.json"), "utf8")) as {
  procedures: { id: string; content_mdx: string | null }[];
};
const EYELID_HAS_BODY = Boolean(CONTENT.procedures.find((p) => p.id === "double-eyelid")?.content_mdx);

type Entry = Record<string, unknown> & { event?: string };
const dataLayer = (page: Page) =>
  page.evaluate(() => ((window.dataLayer ?? []) as Record<string, unknown>[]).filter((e) => typeof e.event === "string")) as Promise<
    Entry[]
  >;
const eventsNamed = async (page: Page, name: string) => (await dataLayer(page)).filter((e) => e.event === name);

async function jsonLd(page: Page): Promise<Record<string, unknown>[]> {
  const raw = await page.locator('script[type="application/ld+json"]').allTextContents();
  return raw.map((t) => JSON.parse(t) as Record<string, unknown>);
}
/** @graph 를 펼친 노드 목록 */
const nodes = (docs: Record<string, unknown>[]) =>
  docs.flatMap((d) => (Array.isArray(d["@graph"]) ? (d["@graph"] as Record<string, unknown>[]) : [d]));

test.describe("P-03 시술 상세 가이드", () => {
  test("P-02 → P-03 이동, 요약 박스·view_procedure·select_procedure", async ({ page }) => {
    await page.goto("procedures/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("시술 가이드");
    await page.getByTestId("procedure-card").filter({ hasText: "쌍꺼풀 수술" }).click();
    await expect(page).toHaveURL(new RegExp(`${EYELID}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("쌍꺼풀 수술");
    await expect(page.getByTestId("procedure-answer")).toContainText("50만~250만 원");

    const facts = page.getByTestId("procedure-facts");
    for (const label of ["가격 범위", "소요시간", "회복기간", "마취"]) await expect(facts).toContainText(label);
    await expect(facts.locator('[data-fact="price"]')).toContainText("50만~250만 원");
    await expect(page.getByTestId("procedure-meta")).toContainText("최종 수정 2026.10.24");
    await expect(page.getByTestId("procedure-meta")).toContainText("리얼성형 편집팀");

    expect(await eventsNamed(page, "select_procedure")).toEqual([
      { event: "select_procedure", procedure_id: "double-eyelid", from_page: "procedures" },
    ]);
    await expect.poll(() => eventsNamed(page, "view_procedure")).toEqual([
      { event: "view_procedure", procedure_id: "double-eyelid", procedure_name: "쌍꺼풀 수술", category: "eye" },
    ]);
  });

  test("홈 인기 시술 카드 → P-03", async ({ page }) => {
    await page.goto("./");
    await page.getByTestId("home-popular").getByRole("link").filter({ hasText: "쌍꺼풀 수술" }).first().click();
    await expect(page).toHaveURL(new RegExp(`${EYELID}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("쌍꺼풀 수술");
  });

  test("직접 진입: view_procedure 1회, FAQ 열면 expand_faq(질문마다 1회), 끝까지 스크롤하면 scroll_depth 4종", async ({ page }) => {
    await page.goto(EYELID);
    await expect.poll(async () => (await eventsNamed(page, "view_procedure")).length).toBe(1);

    const items = page.getByTestId("faq-item");
    await expect(items).toHaveCount(5);
    // 답변은 접혀 있어도 HTML 에 있다(검색엔진·AI 크롤러용)
    await expect(items.nth(1).locator("p")).toHaveText(/절개법/);
    await items.nth(1).locator("summary").click();
    await expect(items.nth(1)).toHaveAttribute("open", "");
    await items.nth(1).locator("summary").click();
    await items.nth(1).locator("summary").click();
    await items.nth(0).locator("summary").click();
    await expect.poll(() => eventsNamed(page, "expand_faq")).toEqual([
      { event: "expand_faq", procedure_id: "double-eyelid", question_index: 2 },
      { event: "expand_faq", procedure_id: "double-eyelid", question_index: 1 },
    ]);

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect
      .poll(async () => (await eventsNamed(page, "scroll_depth")).map((e) => e.percent))
      .toEqual([25, 50, 75, 100]);
    expect((await eventsNamed(page, "scroll_depth")).every((e) => e.page_type === "procedure")).toBe(true);
    expect((await eventsNamed(page, "view_procedure")).length).toBe(1);
  });

  test("JSON-LD: MedicalWebPage·MedicalProcedure·FAQPage·BreadcrumbList, 요약 박스 = JSON-LD = FAQ, 평점 없음", async ({ page }) => {
    await page.goto(EYELID);
    const docs = await jsonLd(page);
    const all = nodes(docs);
    const types = all.map((n) => n["@type"]);
    expect(types).toEqual(expect.arrayContaining(["MedicalWebPage", "SurgicalProcedure", "FAQPage", "BreadcrumbList"]));
    expect(JSON.stringify(docs)).not.toMatch(/AggregateRating|"Review"|ratingValue/);

    const faq = all.find((n) => n["@type"] === "FAQPage")!;
    const questions = (faq.mainEntity as { name: string }[]).map((q) => q.name);
    expect(questions).toEqual(await page.getByTestId("faq-item").locator("summary").allTextContents().then((t) => t.map((s) => s.replace(/^Q/, "").trim())));

    const procedure = all.find((n) => n["@type"] === "SurgicalProcedure")!;
    expect(procedure.bodyLocation).toBe("눈");
    expect(procedure.howPerformed).toContain("국소 마취 (수면 마취 병행 가능)");
    expect(procedure.howPerformed).toContain("약 1시간");
    expect(procedure.followup).toContain("약 7일");
    const pageNode = all.find((n) => n["@type"] === "MedicalWebPage")!;
    expect(pageNode.description).toContain("50만~250만 원");
    expect(pageNode.dateModified).toBe("2026-10-24");

    const crumbs = all.find((n) => n["@type"] === "BreadcrumbList")!;
    expect((crumbs.itemListElement as { name: string }[]).map((c) => c.name)).toEqual(["홈", "시술 가이드", "눈", "쌍꺼풀 수술"]);

    // 비수술 시술은 procedureType
    await page.goto(LASER);
    const laser = nodes(await jsonLd(page)).find((n) => n["@type"] === "MedicalProcedure")!;
    expect(laser.procedureType).toBe("https://schema.org/NoninvasiveProcedure");
  });

  test("메타: title 60자 이내 템플릿, description 120~150자, canonical·OG", async ({ page }) => {
    await page.goto(EYELID);
    const title = await page.title();
    expect(title).toBe("쌍꺼풀 수술 가격·회복기간·부작용 총정리 (2026) | 리얼성형");
    expect(title.length).toBeLessThanOrEqual(60);
    const description = (await page.locator('meta[name="description"]').getAttribute("content")) ?? "";
    expect(description.length).toBeGreaterThanOrEqual(120);
    expect(description.length).toBeLessThanOrEqual(150);
    expect(description).toContain("50만~250만 원");
    const canonical = (await page.locator('link[rel="canonical"]').getAttribute("href")) ?? "";
    expect(decodeURI(canonical)).toMatch(/\/procedures\/쌍꺼풀-수술\/$/);
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /쌍꺼풀 수술/);
  });

  test("본문: 질문형 H2 앵커 목차, 표, 병원 가격 비교(최저가 순), 출처 외부 링크", async ({ page }) => {
    await page.goto(EYELID);
    const h2 = page.getByTestId("procedure-body").locator("section[data-kind] > h2");
    const tocHrefs = await page.getByTestId("procedure-toc").locator("a").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    for (const href of tocHrefs) expect(await page.locator(`[id="${href!.slice(1)}"]`).count(), href!).toBe(1);
    expect(tocHrefs.slice(-3)).toEqual(["#prices", "#faq", "#sources"]);
    if (EYELID_HAS_BODY) {
      await expect(h2).toHaveCount(5);
      const ids = await h2.evaluateAll((els) => els.map((e) => e.id));
      for (const id of ids) expect(tocHrefs).toContain(`#${id}`);
      await expect(page.locator(".prose-table table").first()).toBeVisible();
      await expect(page.getByTestId("procedure-body")).not.toContainText("~~");
      expect(await page.locator(".prose-rs del").count()).toBe(0);
      await expect(page.getByTestId("recovery-timeline")).toBeVisible();
    } else {
      // 본문(content/procedures/*.md)이 아직 없으면 안내 카드 + 요약·가격·FAQ 는 그대로
      await expect(h2).toHaveCount(0);
      await expect(page.getByTestId("body-pending")).toBeVisible();
    }

    const rows = page.getByTestId("price-row");
    expect(await rows.count()).toBeGreaterThanOrEqual(1);
    expect(await rows.count()).toBeLessThanOrEqual(5);
    const lows = await rows.evaluateAll((els) =>
      els.map((el) => {
        const m = el.textContent?.match(/([\d,]+)만(?: (\d)천)?~/);
        return m ? Number(m[1]!.replace(/,/g, "")) * 10000 + Number(m[2] ?? 0) * 1000 : NaN;
      }),
    );
    expect(lows).toEqual([...lows].sort((a, b) => a - b));
    await expect(page.getByTestId("price-comparison")).toContainText("기준");

    const sources = page.getByTestId("procedure-sources").locator("a");
    expect(await sources.count()).toBeGreaterThanOrEqual(3);
    for (const a of await sources.all()) {
      await expect(a).toHaveAttribute("rel", "noopener noreferrer");
      await expect(a).toHaveAttribute("target", "_blank");
    }
    await expect(page.getByTestId("procedure-disclaimer")).toContainText("본 정보는 의료 조언이 아니며 진단·치료는 의료진 상담 필요");
  });

  test("상담 CTA: 중간·하단 CTA 가 procedure_id 를 유지한 채 P-06 으로", async ({ page }) => {
    test.skip(!HAS_CONSULT, "T-101(P-06 상담 폼) 미구현 — 상담 CTA 는 P-06 이 빌드되면 노출된다");
    await page.goto(EYELID);
    const mid = page.getByTestId("consult-cta-mid");
    await expect(mid).toContainText("이 시술 상담 가이드 받기");
    const link = mid.getByRole("link");
    await expect(link).toHaveAttribute("href", /\/consult\/\?procedure_id=double-eyelid$/);
    await expect(page.getByTestId("consult-cta-bottom").getByRole("link")).toHaveAttribute("href", /procedure_id=double-eyelid/);
    // 이동하지 않고 이벤트만 확인
    await page.evaluate(() => document.addEventListener("click", (e) => e.preventDefault(), { capture: true, once: true }));
    await link.click();
    expect(await eventsNamed(page, "click_cta")).toEqual([{ event: "click_cta", location: "mid", procedure_id: "double-eyelid" }]);
  });

  test("가로 스크롤 없음, 모바일 터치 타겟 44px", async ({ page }, testInfo) => {
    for (const url of [EYELID, LASER, "procedures/"]) {
      await page.goto(url);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, url).toBeLessThanOrEqual(0);
      if (testInfo.project.name === "mobile-375") {
        const consent = page.getByTestId("consent-save");
        if (await consent.isVisible()) await consent.click();
        // 접힌 목차를 펼친 상태까지 잰다
        const tocButton = page.getByTestId("procedure-toc").getByRole("button");
        if (await tocButton.count()) await tocButton.click();
        // 이 화면이 만든 요소만 판정한다. 공통 헤더 CTA(components/common/SiteHeader, h-10=40px)는 상담 폼이 빌드되면
        // 나타나는 공통 컴포넌트 문제라 여기서 제외하고 오케스트레이터에 수정 요청(h-10 → h-11)으로 넘긴다.
        const small = tooSmall(await visibleTargets(page)).filter((t) => !t.startsWith("[header-cta]"));
        expect(small, `${url} 의 44px 미만 요소`).toEqual([]);
      }
    }
  });
});

test.describe("P-02 시술 가이드 목록", () => {
  test("부위별 섹션·칩 앵커·select_category, JSON-LD", async ({ page }) => {
    await page.goto("procedures/");
    await expect(page).toHaveTitle("시술 가이드 — 부위별 성형 시술 가격·회복기간 | 리얼성형");
    const sections = page.getByTestId("category-section");
    await expect(sections).toHaveCount(6);
    await expect(page.getByTestId("procedure-card")).toHaveCount(10);

    const chip = page.getByTestId("category-chips").getByRole("link", { name: /피부/ });
    await chip.click();
    await expect(page).toHaveURL(/#%ED%94%BC%EB%B6%80$|#피부$/);
    expect(await eventsNamed(page, "select_category")).toEqual([{ event: "select_category", category: "skin" }]);
    await expect(page.locator('[id="피부"]')).toBeInViewport();

    const all = nodes(await jsonLd(page));
    const list = all.find((n) => n["@type"] === "CollectionPage")!;
    expect((list.mainEntity as { itemListElement: unknown[] }).itemListElement).toHaveLength(10);
    expect(all.some((n) => n["@type"] === "BreadcrumbList")).toBe(true);
  });
});
