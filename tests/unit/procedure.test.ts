// P-03 계산 로직 — 요약 박스·JSON-LD·가격 표·관련 시술·목차·각주·스크롤 깊이 (screen-spec 4절 P-03, 5절, 6절)
import { describe, expect, it } from "vitest";
import { checkTripleHtml } from "../../scripts/check-triple.mjs";
import { extractJsonLd, validateJsonLdHtml } from "../../scripts/validate-jsonld.mjs";
import { loadContent, type Clinic, type Procedure } from "@/lib/content";
import { formatDate, formatDuration, formatPriceRange, formatRecovery, formatWon, procedureTitle } from "@/lib/format.mjs";
import {
  UNKNOWN,
  authorById,
  clinicPriceRows,
  decodeSlug,
  findProcedureBySlug,
  followupText,
  howPerformedText,
  jsonLdString,
  procedureJsonLd,
  procedureUrl,
  relatedProcedures,
  summaryCells,
  tocItems,
} from "@/lib/procedure";
import { rehypeGuide, splitCitations, type HastNode } from "@/lib/rehype-guide";
import { newlyReached, scrollPercent } from "@/lib/scroll-depth";

const content = loadContent();
const eyelid = content.procedures.find((p) => p.id === "double-eyelid")!;

describe("lib/format — 요약 박스 표기", () => {
  it.each([
    [500000, "50만"],
    [12000000, "1,200만"],
    [30000, "3만"],
    [12500, "12,500"],
    [9000, "9,000"],
  ])("formatWon(%d) = %s", (n, s) => expect(formatWon(n)).toBe(s));

  it("가격 범위: 양쪽·같은 값·한쪽만·없음", () => {
    expect(formatPriceRange(500000, 2500000)).toBe("50만~250만 원");
    expect(formatPriceRange(500000, 500000)).toBe("50만 원");
    expect(formatPriceRange(500000, null)).toBe("50만 원부터");
    expect(formatPriceRange(null, 2500000)).toBe("최대 250만 원");
    expect(formatPriceRange(null, null)).toBeNull();
    expect(formatWon(Number.NaN)).toBe("");
  });

  it("소요시간·회복기간·날짜·title", () => {
    expect([40, 60, 90, 150].map(formatDuration)).toEqual(["약 40분", "약 1시간", "약 1시간 30분", "약 2시간 30분"]);
    expect([0, 3, 7, 10, 14, 28].map(formatRecovery)).toEqual(["당일 복귀", "약 3일", "약 7일", "약 10일", "약 2주", "약 4주"]);
    expect(formatDuration(null)).toBeNull();
    expect(formatRecovery(null)).toBeNull();
    expect(formatDate("2026-10-24")).toBe("2026.10.24");
    expect(formatDate(null)).toBe("");
    expect(procedureTitle("쌍꺼풀 수술", "2026-10-24")).toBe("쌍꺼풀 수술 가격·회복기간·부작용 총정리 (2026)");
    expect(procedureTitle("x", null)).toBe("x 가격·회복기간·부작용 총정리");
  });
});

describe("lib/procedure", () => {
  it("요약 박스 4칸 + 가격 단위 보충, 값이 없으면 안내 문구(경계값)", () => {
    expect(summaryCells(eyelid).map((c) => [c.label, c.value])).toEqual([
      ["가격 범위", "50만~250만 원"],
      ["소요시간", "약 1시간"],
      ["회복기간", "약 7일"],
      ["마취 방식", "국소 마취 (수면 마취 병행 가능)"],
    ]);
    const toning = content.procedures.find((p) => p.id === "laser-toning")!;
    expect(summaryCells(toning)[0]).toMatchObject({ value: "3만~15만 원", note: "1회 기준" });
    expect(summaryCells(toning)[2]!.value).toBe("당일 복귀");
    const empty = summaryCells({ price_low: null, price_high: null, price_note: null, duration_min: null, recovery_days: null, anesthesia: " " });
    expect(empty.map((c) => c.value)).toEqual([UNKNOWN.price, UNKNOWN.other, UNKNOWN.other, UNKNOWN.other]);
  });

  it("slug 찾기: 한글·퍼센트 인코딩·잘못된 인코딩", () => {
    expect(findProcedureBySlug(content, "쌍꺼풀-수술")?.id).toBe("double-eyelid");
    expect(findProcedureBySlug(content, encodeURIComponent("쌍꺼풀-수술"))?.id).toBe("double-eyelid");
    expect(findProcedureBySlug(content, "없는-시술")).toBeUndefined();
    expect(decodeSlug("%E0%A4%A")).toBe("%E0%A4%A");
  });

  it("JSON-LD: MedicalWebPage + MedicalProcedure + FAQPage, 요약 박스와 같은 값, 평점 없음", () => {
    const cells = summaryCells(eyelid);
    const ld = procedureJsonLd({
      procedure: eyelid,
      author: authorById(content.authors, "editorial"),
      siteName: "리얼성형",
      base: "https://a.kr/realsurgery/",
    });
    const [page, faq] = ld["@graph"] as Record<string, unknown>[];
    const proc = page!.mainEntity as Record<string, unknown>;
    expect(ld["@graph"]).toHaveLength(2);
    expect(page).toMatchObject({ "@type": "MedicalWebPage", url: procedureUrl("https://a.kr/realsurgery", eyelid.slug), dateModified: "2026-10-25" });
    expect(page!.url).toBe("https://a.kr/realsurgery/procedures/%EC%8C%8D%EA%BA%BC%ED%92%80-%EC%88%98%EC%88%A0/");
    expect(page).not.toHaveProperty("reviewedBy");
    expect(proc).toMatchObject({
      "@type": "MedicalProcedure",
      name: "쌍꺼풀 수술",
      description: eyelid.summary,
      procedureType: "https://schema.org/SurgicalProcedure",
      bodyLocation: "윗눈꺼풀",
      howPerformed: howPerformedText(cells),
      followup: followupText(cells),
    });
    expect(howPerformedText(cells)).toBe("마취 방식: 국소 마취 (수면 마취 병행 가능) · 소요시간: 약 1시간");
    expect((faq!.mainEntity as unknown[]).length).toBe(eyelid.faqs.length);
    expect(JSON.stringify(ld)).not.toMatch(/AggregateRating|aggregateRating|review/i);

    const reviewed = procedureJsonLd({
      procedure: { ...eyelid, guide: null },
      author: undefined,
      reviewer: { id: "dr", name: "자문의", role: "성형외과 전문의" },
      siteName: "리얼성형",
      base: "https://a.kr",
    });
    expect((reviewed["@graph"] as Record<string, unknown>[])[0]).toMatchObject({ reviewedBy: { "@type": "Person", name: "자문의" } });
    expect(jsonLdString({ a: "</script>" })).toBe('{"a":"\\u003c/script>"}');
  });

  it("가격 비교 표: 최저가 낮은 순·가격 미정은 뒤·최대 5곳·갱신일", () => {
    const base = content.clinics[0]!;
    const mk = (id: string, low: number | null, high: number | null): Clinic => ({
      ...base,
      id,
      name: `${id}성형외과`,
      slug: id,
      procedures: [{ procedure_id: "p", price_low: low, price_high: high, price_note: null, duration_min: null, price_updated_at: "2026-10-01" }],
    });
    const clinics = [mk("a", null, null), mk("b", 900000, 1000000), mk("c", 500000, 900000), mk("d", 500000, 800000), mk("e", 1, 2), mk("f", 3, 4)];
    const rows = clinicPriceRows(clinics, "p");
    expect(rows.map((r) => r.clinic.id)).toEqual(["e", "f", "d", "c", "b"]);
    expect(rows[2]).toMatchObject({ price: "50만~80만 원", updated: "2026.10.01" });
    expect(clinicPriceRows([mk("a", null, null)], "p")[0]!.price).toBe("병원 문의");
    expect(clinicPriceRows(content.clinics, "double-eyelid").map((r) => r.clinic.name)).toEqual(["새솔결의원", "단하늘성형외과"]);
    expect(clinicPriceRows(content.clinics, "nope")).toEqual([]);
  });

  it("관련 시술 4개: 같은 부위 먼저(조회수 순), 자기 자신 제외", () => {
    const related = relatedProcedures(content.procedures, eyelid);
    expect(related).toHaveLength(4);
    expect(related.map((p) => p.category_id).slice(0, 3)).toEqual(["eye", "eye", "eye"]);
    expect(related.map((p) => p.id)).not.toContain("double-eyelid");
    expect(related[0]!.id).toBe("ptosis-correction"); // 눈 카테고리 조회수 1위
    expect(related[3]!.id).toBe("rhinoplasty"); // 다른 부위 조회수 1위
  });

  it("목차: 본문 H2 5개 + 가격 비교 + FAQ", () => {
    const toc = tocItems(eyelid, { prices: true, faq: true });
    expect(toc.map((t) => t.href)).toEqual(["#guide-who", "#guide-cost", "#guide-recovery", "#guide-risks", "#guide-compare", "#prices", "#faq"]);
    expect(tocItems({ ...eyelid, guide: null } as Procedure, { prices: false, faq: false })).toEqual([]);
    expect(authorById(content.authors, null)).toBeUndefined();
  });
});

describe("lib/rehype-guide — H2 앵커·출처 각주", () => {
  it("[n] 을 sup 으로 감싸고(줄바꿈 방지 결합자 포함) 나머지 글자는 그대로", () => {
    const nodes = splitCitations("수술입니다.[1] 다음 문장.[2]");
    expect(nodes.map((n) => (n.type === "text" ? n.value : `<${n.tagName}:${n.children?.[0]?.value}>`))).toEqual([
      "수술입니다.",
      "<sup:\u2060[1]>",
      " 다음 문장.",
      "<sup:\u2060[2]>",
    ]);
    expect(splitCitations("각주 없음")).toEqual([{ type: "text", value: "각주 없음" }]);
    expect(splitCitations("")).toEqual([{ type: "text", value: "" }]);
  });

  it("H2 에 순서대로 id, 나뉜 text 노드도 합쳐서 각주를 찾고, code 안은 건드리지 않는다", () => {
    const tree: HastNode = {
      type: "root",
      children: [
        { type: "element", tagName: "h2", properties: {}, children: [{ type: "text", value: "첫 질문?" }] },
        { type: "element", tagName: "p", children: [{ type: "text", value: "답입니다.[" }, { type: "text", value: "1]" }] },
        { type: "element", tagName: "code", children: [{ type: "text", value: "[2]" }] },
        { type: "element", tagName: "h2", children: [{ type: "text", value: "둘째?" }] },
        { type: "element", tagName: "h2", children: [] },
      ],
    };
    rehypeGuide({ ids: ["guide-who", "guide-cost"] })(tree);
    const [h1, p, code, h2, h3] = tree.children!;
    expect(h1!.properties?.id).toBe("guide-who");
    expect(h2!.properties?.id).toBe("guide-cost");
    expect(h3!.properties?.id).toBe("guide-section-3");
    expect(p!.children!.map((c) => c.tagName ?? c.value)).toEqual(["답입니다.", "sup"]);
    expect(code!.children).toEqual([{ type: "text", value: "[2]" }]);
  });
});

describe("lib/scroll-depth — scroll_depth 25/50/75/100", () => {
  it("본 비율과 새로 넘은 구간", () => {
    expect(scrollPercent(0, 800, 4000)).toBe(20);
    expect(scrollPercent(1200, 800, 4000)).toBe(50);
    expect(scrollPercent(3199, 800, 4000)).toBe(100);
    expect(scrollPercent(0, 800, 0)).toBe(100);
    expect(newlyReached(80, new Set())).toEqual([25, 50, 75]);
    expect(newlyReached(80, new Set([25, 50]))).toEqual([75]);
    expect(newlyReached(10, new Set())).toEqual([]);
  });
});

describe("scripts/validate-jsonld · check-triple — 요약 박스 = JSON-LD = FAQ", () => {
  const cells = summaryCells(eyelid);
  const ld = procedureJsonLd({ procedure: eyelid, author: undefined, siteName: "리얼성형", base: "https://a.kr" });
  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: "https://a.kr/" },
      { "@type": "ListItem", position: 2, name: eyelid.name },
    ],
  };
  const page = (o: { ld?: unknown; h1?: string; answer?: string; recovery?: string; faqAnswer?: string } = {}) => `<!doctype html><html><body>
    <script type="application/ld+json">${jsonLdString(crumbs)}</script>
    <script type="application/ld+json">${jsonLdString(o.ld ?? ld)}</script>
    <h1>${o.h1 ?? eyelid.name}</h1>
    <p data-testid="procedure-answer">${o.answer ?? eyelid.summary}</p>
    <dl>${cells
      .map((c) => `<div data-fact="${c.key}"><dt>${c.label}</dt><dd><span data-fact-value="">${c.key === "recovery" && o.recovery ? o.recovery : c.value}</span></dd></div>`)
      .join("")}</dl>
    <section data-testid="procedure-faq">${eyelid.faqs
      .map((f, i) => `<details><summary><span>${f.question}</span></summary><p>${i === 0 && o.faqAnswer ? o.faqAnswer : f.answer}</p></details>`)
      .join("")}</section></body></html>`;

  it("일치하는 페이지는 통과", () => {
    expect(validateJsonLdHtml(page(), { procedurePage: true })).toEqual([]);
    expect(checkTripleHtml(page())).toEqual([]);
  });

  it("어긋나면 잡는다: H1·직답·회복기간·FAQ 답변", () => {
    expect(checkTripleHtml(page({ h1: "다른 이름" })).join("\n")).toMatch(/H1/);
    expect(checkTripleHtml(page({ answer: "다른 요약" })).join("\n")).toMatch(/직답 요약/);
    expect(checkTripleHtml(page({ recovery: "약 9일" })).join("\n")).toMatch(/followup/);
    expect(checkTripleHtml(page({ faqAnswer: "다른 답" })).join("\n")).toMatch(/화면 FAQ/);
    expect(checkTripleHtml("<html></html>")).toEqual(["MedicalProcedure·FAQPage JSON-LD 없음"]);
  });

  it("JSON-LD: 평점 금지·필수 속성·시술 상세 4종·파싱 오류", () => {
    const withRating = { ...ld, "@graph": [...(ld["@graph"] as object[]), { "@type": "AggregateRating", ratingValue: 5 }] };
    expect(validateJsonLdHtml(page({ ld: withRating })).join("\n")).toMatch(/AggregateRating/);
    const graph = (ld["@graph"] as Record<string, unknown>[]).map((n) =>
      n["@type"] === "MedicalWebPage" ? { ...n, mainEntity: { ...(n.mainEntity as object), procedureType: "x", preparation: "" } } : n,
    );
    const problems = validateJsonLdHtml(page({ ld: { ...ld, "@graph": graph } })).join("\n");
    expect(problems).toMatch(/procedureType/);
    expect(problems).toMatch(/preparation 없음/);
    expect(validateJsonLdHtml("<html></html>", { procedurePage: true }).join("\n")).toMatch(/MedicalWebPage 없음/);
    expect(validateJsonLdHtml('<script type="application/ld+json">{bad</script>').join("\n")).toMatch(/JSON 파싱 실패/);
    expect(extractJsonLd(page())).toHaveLength(2);
  });
});
