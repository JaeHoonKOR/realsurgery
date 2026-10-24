// P-03 계산 로직 — 요약 박스·JSON-LD·가격 표·관련 시술·목차·각주·스크롤 깊이 (screen-spec 4절 P-03, 5절, 6절)
import { describe, expect, it } from "vitest";
import { checkTripleHtml } from "../../scripts/check-triple.mjs";
import { extractJsonLd, validateJsonLdHtml } from "../../scripts/validate-jsonld.mjs";
import { loadContent, type Clinic, type Guide, type Procedure } from "@/lib/content";
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
      ["마취 방식", "국소 마취 (필요하면 진정제 병행)"],
    ]);
    expect(summaryCells(eyelid).filter((c) => c.unverified).map((c) => c.key)).toEqual(["price"]);
    const toning = content.procedures.find((p) => p.id === "laser-toning")!;
    expect(summaryCells(toning)[0]).toMatchObject({ value: "3만~15만 원", note: "1회 기준", unverified: true });
    expect(summaryCells(toning)[2]).toMatchObject({ value: "당일 복귀", unverified: true });
    expect(summaryCells(toning)[1]).not.toHaveProperty("unverified");
    const empty = summaryCells({ price_low: null, price_high: null, price_note: null, duration_min: null, recovery_days: null, anesthesia: " " });
    expect(empty.map((c) => c.value)).toEqual([UNKNOWN.price, UNKNOWN.other, UNKNOWN.other, UNKNOWN.other]);
    // 값이 없는 칸은 unverified_facts 에 있어도 "검증 전" 을 붙이지 않는다("진료 후 안내" 는 값이 아니다)
    const emptyUnverified = summaryCells({
      price_low: null,
      price_high: null,
      price_note: null,
      duration_min: null,
      recovery_days: 3,
      anesthesia: null,
      guide: { unverified_facts: ["price", "duration", "recovery", "anesthesia"] },
    });
    expect(emptyUnverified.map((c) => c.unverified ?? false)).toEqual([false, false, true, false]);
    expect(followupText(emptyUnverified)).toBe("회복기간: 약 3일 [출처 검증 전]");
  });

  it("r2 반려 사례: 요약 박스 값이 같은 페이지 본문·출처 값으로 바뀌었다(사각턱·광대·눈매교정)", () => {
    const cellsOf = (id: string) => Object.fromEntries(summaryCells(content.procedures.find((p) => p.id === id)!).map((c) => [c.key, c.value]));
    expect(cellsOf("square-jaw-reduction")).toMatchObject({ duration: "약 1시간", recovery: "약 10일", anesthesia: "전신 마취" });
    expect(cellsOf("zygoma-reduction")).toMatchObject({ duration: "약 4시간", recovery: "약 2주" });
    expect(cellsOf("ptosis-correction")).toMatchObject({ duration: "약 2시간", recovery: "약 2주", anesthesia: "국소 마취 (경우에 따라 전신 마취)" });
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
    expect(howPerformedText(cells)).toBe("마취 방식: 국소 마취 (필요하면 진정제 병행) · 소요시간: 약 1시간");
    const thread = content.procedures.find((p) => p.id === "thread-lift")!;
    expect(howPerformedText(summaryCells(thread))).toBe("마취 방식: 국소 마취 (수면 마취 선택) [출처 검증 전] · 소요시간: 약 40분 [출처 검증 전]");
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
  // 실제 쌍꺼풀 본문의 회복 섹션 문단(각주는 화면처럼 단어 결합자 + [n])
  const BODY = [
    "보통 수술 후 3~4일째 봉합실을 제거하고, 1주일 정도면 정상생활로 돌아갈 수 있습니다.⁠[1]",
    "수술은 일반적으로 국소 마취로 하고 필요에 따라 진정제를 사용합니다.⁠[1] 수술 시간은 방법에 따라 다르지만 대개 1시간 정도 걸립니다.⁠[2]",
  ];
  type PageOpts = {
    ld?: unknown;
    h1?: string;
    answer?: string;
    recovery?: string;
    faqAnswer?: string;
    body?: string[] | null;
    table?: string;
    hideUnverifiedLabel?: boolean;
    cells?: typeof cells;
  };
  const page = (o: PageOpts = {}) => `<!doctype html><html><body>
    <script type="application/ld+json">${jsonLdString(crumbs)}</script>
    <script type="application/ld+json">${jsonLdString(o.ld ?? ld)}</script>
    <h1>${o.h1 ?? eyelid.name}</h1>
    <p data-testid="procedure-answer">${o.answer ?? eyelid.summary}</p>
    <dl>${(o.cells ?? cells)
      .map(
        (c) =>
          `<div data-fact="${c.key}"${c.unverified ? " data-fact-unverified" : ""}><dt>${c.label}</dt><dd><span data-fact-value="">${
            c.key === "recovery" && o.recovery ? o.recovery : c.value
          }</span>${c.unverified && !o.hideUnverifiedLabel ? "<span>출처 검증 전</span>" : ""}</dd></div>`,
      )
      .join("")}</dl>
    ${o.body === null ? "" : `<div data-testid="procedure-body">${(o.body ?? BODY).map((t) => `<p>${t}</p>`).join("")}${o.table ?? ""}</div>`}
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

  it("요약 박스 수치 = 본문·FAQ 근거 (r2 반려 1): 근거 문장이 없으면 칸마다 잡고, 표·자기 참조 문장은 근거로 치지 않는다", () => {
    // 본문에서 마취·소요시간 문장을 빼면(회복기간은 FAQ "회복기간" 답변에 1주일이 있어 통과)
    const noBody = checkTripleHtml(page({ body: [BODY[0]!] })).join("\n");
    expect(noBody).toMatch(/소요시간 "약 1시간" 의 근거 문장이 본문·FAQ 에 없음/);
    expect(noBody).toMatch(/마취 방식 "국소 마취 \(필요하면 진정제 병행\)" 의 "국소" 근거/);
    expect(noBody).not.toMatch(/회복기간/);
    // 같은 값이 표에만 있거나 "요약 박스" 를 가리키는 문장에만 있으면 근거가 아니다
    const tableOnly = page({
      body: [BODY[0]!, "표의 소요시간은 요약 박스와 같은 값입니다. 수술은 국소 마취로 하고 진정제를 쓰며 1시간 정도 걸립니다."],
      table: "<table><tbody><tr><td>수술 시간</td><td>약 1시간</td></tr><tr><td>마취</td><td>국소 마취, 진정제</td></tr></tbody></table>",
    });
    expect(checkTripleHtml(tableOnly).join("\n")).toMatch(/소요시간 "약 1시간"/);
    // 본문이 없으면 대조할 수 없다는 문제
    expect(checkTripleHtml(page({ body: null })).join("\n")).toMatch(/본문\(procedure-body\) 없음/);
  });

  it("검증 전 칸(unverified_facts): 화면 표시가 없으면 실패, JSON-LD 단서가 다르면 실패", () => {
    expect(checkTripleHtml(page({ hideUnverifiedLabel: true })).join("\n")).toMatch(/"price" 칸이 검증 전인데 화면에 "출처 검증 전" 표시가 없음/);
    // 회복기간 "약 9일" 은 본문·FAQ 어디에도 없다 → 검증된 값처럼 두면 실패
    const ldOf = (procedure: Procedure) => procedureJsonLd({ procedure, author: undefined, siteName: "리얼성형", base: "https://a.kr" });
    const asVerified = { ...eyelid, recovery_days: 9 };
    expect(checkTripleHtml(page({ cells: summaryCells(asVerified), ld: ldOf(asVerified) })).join("\n")).toMatch(/회복기간 "약 9일" 의 근거 문장이 본문·FAQ 에 없음/);
    // 같은 값을 unverified_facts 로 "출처 검증 전" 표시하면 본문 대조에서 빠지고, 화면·JSON-LD 단서가 맞으면 통과
    const asUnverified = { ...asVerified, guide: { ...eyelid.guide!, unverified_facts: ["price", "recovery"] as Guide["unverified_facts"] } };
    expect(followupText(summaryCells(asUnverified))).toBe("회복기간: 약 9일 [출처 검증 전]");
    expect(checkTripleHtml(page({ cells: summaryCells(asUnverified), ld: ldOf(asUnverified) }))).toEqual([]);
    // 화면은 검증 전인데 JSON-LD 에 단서가 없으면(값만 사실처럼) 실패
    expect(checkTripleHtml(page({ cells: summaryCells(asUnverified), ld: ldOf(asVerified) })).join("\n")).toMatch(
      /followup "회복기간: 약 9일" ≠ 요약 박스 "회복기간: 약 9일 \[출처 검증 전\]"/,
    );
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
