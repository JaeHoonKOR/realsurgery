// P-02·P-03 순수 함수 단위 검증 — 본문 Markdown 변환·목차·요약 값·JSON-LD·가격 비교·스크롤 깊이
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { buildData } from "../../scripts/build-data.mjs";
import type { Clinic, Content, Post, Procedure } from "@/lib/content";
import { loadContent } from "@/lib/content";
import {
  DESCRIPTION_MAX,
  DESCRIPTION_MIN,
  priceText,
  procedureClass,
  procedureDescription,
  procedureFacts,
  procedureTitle,
  splitParenthetical,
} from "@/lib/procedure/facts";
import { hasBatchim, josa } from "@/lib/procedure/josa";
import { absoluteUrl, jsonLdString, procedureJsonLd, procedureListJsonLd } from "@/lib/procedure/jsonld";
import { PROCEDURES_TITLE, groupByCategory, proceduresDescription } from "@/lib/procedure/list";
import {
  createIdFactory,
  escapeHtml,
  headingId,
  parseProcedureMarkdown,
  plainText,
  sectionKind,
  stripHtmlComments,
  WIDE_TABLE_COLUMNS,
} from "@/lib/procedure/markdown";
import { decodeSlug, staticSlugParams } from "@/lib/procedure/params";
import { linkedProcedureSlugs, postsLinkingTo } from "@/lib/procedure/posts";
import { clinicCountByProcedure, comparePrices } from "@/lib/procedure/prices";
import { similarProcedures } from "@/lib/procedure/related";
import { SCROLL_THRESHOLDS, newThresholds, scrollPercent } from "@/lib/procedure/scroll";
import { COLLAPSIBLE_KINDS, MORE_MIN_CHARS, sectionView, textLength } from "@/lib/procedure/sections";
import { RESERVED_IDS, buildToc } from "@/lib/procedure/toc";

let dir = "";
let content: Content;

beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "procedure-"));
  const file = path.join(dir, "content.json");
  await buildData({ env: {}, outFile: file, log: () => {} });
  content = loadContent(file);
});
afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

const proc = (id: string): Procedure => {
  const p = content.procedures.find((x) => x.id === id);
  if (!p) throw new Error(`시술 없음: ${id}`);
  return p;
};

/** 테스트용 시술(필수 필드만 채움) */
function makeProcedure(over: Partial<Procedure> = {}): Procedure {
  return {
    id: "sample-proc",
    category_id: "eye",
    name: "쌍꺼풀 수술",
    slug: "쌍꺼풀-수술",
    summary: "쌍꺼풀 수술은 접히는 선을 만드는 수술입니다. 비용은 대략 50만~250만 원입니다.",
    price_low: 500000,
    price_high: 2500000,
    price_note: null,
    duration_min: 60,
    recovery_days: 7,
    anesthesia: "국소 마취 (수면 마취 병행 가능)",
    content_mdx: null,
    sources: [{ title: "대한성형외과학회", url: "https://www.plasticsurgery.or.kr/" }],
    updated_at: "2026-10-24",
    view_count: 100,
    faqs: [
      { id: "f2", question: "회복기간은?", answer: "약 7일입니다.", order: 2 },
      { id: "f1", question: "가격은?", answer: "50만~250만 원입니다.", order: 1 },
    ],
    extras: null,
    ...over,
  };
}

function makeClinic(id: string, offers: Clinic["procedures"], over: Partial<Clinic> = {}): Clinic {
  return {
    id,
    name: `${id}의원`,
    slug: id,
    region: "서울 강남구",
    address: "",
    lat: null,
    lng: null,
    phone: null,
    kakao_url: null,
    hours: [],
    description: null,
    specialties: [],
    is_premium: false,
    is_partner: false,
    is_demo: true,
    ad_review_no: null,
    procedures: offers,
    ...over,
  };
}

const offer = (procedure_id: string, low: number | null, high: number | null, date = "2026-10-01") => ({
  procedure_id,
  price_low: low,
  price_high: high,
  price_note: null,
  duration_min: null,
  price_updated_at: date,
});

const MD = `<!-- MD-REVIEW: 의료 자문 확인 -->
도입 문단입니다.

## 쌍꺼풀 수술은 어떤 사람이 받나요?

쌍꺼풀 수술은 **접히는 선**이 없는 사람이 받습니다.

- 첫째 항목
- 둘째 항목

### 매몰법과 절개법

세부 설명입니다. [학회](https://www.plasticsurgery.or.kr/) · [내부](/procedures/) · [앵커](#faq)

## 쌍꺼풀 수술 비용은 얼마인가요?

매몰법은 50만~150만 원, 절개법은 100만~250만 원 선입니다.

| 방식 | 가격 범위 | 비고 |
| --- | :---: | ---: |
| 매몰법 | 약 50만~150만 원 | 실로 고정하는 방식이며 고정 방법에 따라 차이 |
| 절개법 | 약 100만~250만 원 | 지방·근육 정리 범위 |

<script>alert(1)</script>

## 쌍꺼풀 수술 회복은 며칠 걸리나요?

| 시기 | 상태 |
| --- | --- |
| 당일 | 붓기 |

## 쌍꺼풀 수술 부작용과 주의할 점은?

![전후 사진](/x.png)

## 쌍꺼풀 수술과 비슷한 시술은 어떻게 다른가요?

비교 문단.

## 자주 묻는 질문
`;

describe("lib/procedure/markdown — 본문 변환", () => {
  it("물결표 가격 범위가 취소선(<del>)이 되지 않는다", () => {
    const { sections } = parseProcedureMarkdown("## 비용\n\n매몰법 50만~150만 원, 절개법 100만~250만 원입니다.\n");
    const html = sections[0]!.leadHtml;
    expect(html).not.toContain("<del>");
    expect(html).toContain("50만~150만 원, 절개법 100만~250만 원");
    const inline = parseProcedureMarkdown("50만~150만 … 100만~250만 그리고 ~~두 개~~ 물결").introHtml;
    expect(inline).not.toContain("<del>");
    expect(inline).toContain("50만~150만 … 100만~250만");
  });

  it("H2 단위로 섹션을 나누고 첫 문단을 직답(lead)으로 분리한다", () => {
    const { introHtml, sections } = parseProcedureMarkdown(MD, { reservedIds: RESERVED_IDS });
    expect(introHtml).toBe("<p>도입 문단입니다.</p>");
    expect(sections.map((s) => s.kind)).toEqual(["who", "cost", "recovery", "risks", "compare", "other"]);
    const who = sections[0]!;
    expect(who.title).toBe("쌍꺼풀 수술은 어떤 사람이 받나요?");
    expect(who.id).toBe("쌍꺼풀-수술은-어떤-사람이-받나요");
    expect(who.leadHtml).toBe("<p>쌍꺼풀 수술은 <strong>접히는 선</strong>이 없는 사람이 받습니다.</p>");
    expect(who.bodyHtml).toContain("<ul>");
    expect(who.bodyHtml).toContain('<h3 id="매몰법과-절개법">매몰법과 절개법</h3>');
    // 표로 시작하는 섹션은 직답이 없다
    expect(sections[2]!.leadHtml).toBe("");
    expect(sections[2]!.bodyHtml).toContain('<table role="table">');
    // 제목만 있는 섹션
    expect(sections[5]!.bodyHtml).toBe("");
    // 화면 예약 id(faq 등)와 겹치지 않는다
    expect(sections[5]!.id).toBe("자주-묻는-질문");
  });

  it("링크: 외부는 새 창 + noopener, 내부는 basePath, 앵커는 그대로", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/realsurgery");
    try {
      const html = parseProcedureMarkdown(MD).sections[0]!.bodyHtml;
      expect(html).toContain('<a href="https://www.plasticsurgery.or.kr/" target="_blank" rel="noopener noreferrer">학회</a>');
      expect(html).toContain('<a href="/realsurgery/procedures/">내부</a>');
      expect(html).toContain('<a href="#faq">앵커</a>');
      const titled = parseProcedureMarkdown('[a](https://x.org "t") [b](/y/ "u")').introHtml;
      expect(titled).toContain('title="t"');
      expect(titled).toContain('href="/realsurgery/y/" title="u"');
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("표: 가로 스크롤 래퍼(region) + 행 제목(th scope=row) + 정렬·짧은 숫자 칸 표시", () => {
    const cost = parseProcedureMarkdown(MD).sections[1]!.bodyHtml;
    expect(cost).toContain('<div class="prose-table" role="region" aria-label="방식, 가격 범위, 비고 표" tabindex="0">');
    expect(cost).toContain('<table role="table"><thead role="rowgroup"><tr role="row"><th scope="col" role="columnheader">방식</th>');
    expect(cost).toContain('<th scope="col" role="columnheader" class="is-center">가격 범위</th>');
    expect(cost).toContain('<tr role="row"><th scope="row" role="rowheader">매몰법</th>');
    // 모바일 카드용 열 제목(data-label) + 짧은 숫자 칸은 한 줄
    expect(cost).toContain('<td role="cell" data-label="가격 범위" class="is-center is-compact">약 50만~150만 원</td>');
    // 긴 설명 칸은 줄바꿈 허용
    expect(cost).toContain('<td role="cell" data-label="비고" class="is-right">실로 고정하는 방식이며 고정 방법에 따라 차이</td>');
  });

  it("원시 HTML 은 이스케이프하고 주석은 지우며, 이미지는 대체 텍스트만 남긴다", () => {
    const { introHtml, sections } = parseProcedureMarkdown(MD);
    expect(introHtml).not.toContain("MD-REVIEW");
    expect(sections[1]!.bodyHtml).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(sections[1]!.bodyHtml).not.toContain("<script>");
    expect(sections[3]!.leadHtml).toBe("<p>전후 사진</p>");
    expect(stripHtmlComments("a<!-- x\ny -->b")).toBe("ab");
  });

  it("헤딩 id·종류 판정·일반 텍스트", () => {
    expect(headingId("비용은 얼마인가요?")).toBe("비용은-얼마인가요");
    expect(headingId("가격·회복기간 / 부작용")).toBe("가격-회복기간-부작용");
    expect(headingId("!!!")).toBe("section");
    const next = createIdFactory(["faq"]);
    expect(next("FAQ")).toBe("faq-2");
    expect(next("같은 제목")).toBe("같은-제목");
    expect(next("같은 제목")).toBe("같은-제목-2");
    expect(plainText("**굵게** `코드` [링크](https://x)")).toBe("굵게 코드 링크");
    expect(sectionKind("앞트임 부작용과 주의할 점은?")).toBe("risks");
    expect(sectionKind("레이저 토닝과 비슷한 시술은 어떻게 다른가요?")).toBe("compare");
    expect(sectionKind("붓기는 언제 빠지나요?")).toBe("recovery");
    expect(sectionKind("시술 과정")).toBe("other");
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
  });

  it("본문 블록: 빈 줄을 뺀 최상위 블록마다 종류·HTML, 합치면 bodyHtml 과 같은 내용", () => {
    const { sections } = parseProcedureMarkdown(MD, { reservedIds: RESERVED_IDS });
    const [who, cost, recovery] = sections as [(typeof sections)[0], (typeof sections)[0], (typeof sections)[0]];
    expect(who.blocks.map((b) => b.type)).toEqual(["list", "heading", "paragraph"]);
    expect(cost.blocks.map((b) => b.type)).toEqual(["table", "other"]);
    expect(recovery.blocks.map((b) => b.type)).toEqual(["table"]);
    for (const s of sections) {
      const squash = (h: string) => h.replace(/\s+/g, "");
      expect(squash(s.blocks.map((b) => b.html).join("")), s.title).toBe(squash(s.bodyHtml));
    }
    // 같은 제목 토큰을 두 번 렌더링해도(본문 전체 + 블록) id 가 -2 로 밀리지 않는다
    expect(who.blocks[1]!.html).toBe('<h3 id="매몰법과-절개법">매몰법과 절개법</h3>');
    expect(who.bodyHtml).toContain('<h3 id="매몰법과-절개법">');
    expect(who.bodyHtml).not.toContain("매몰법과-절개법-2");
    // 원시 HTML 은 블록에서도 이스케이프
    expect(cost.blocks[1]!.html).toContain("&lt;script&gt;");
  });

  it(`열이 ${WIDE_TABLE_COLUMNS}개 이상인 비교표는 is-wide(모바일에서도 표 모양), 그 미만은 그대로`, () => {
    const wide = parseProcedureMarkdown("## 비교\n\n| 구분 | A | B | C |\n| --- | --- | --- | --- |\n| 가격 | 1 | 2 | 3 |\n");
    expect(wide.sections[0]!.bodyHtml).toContain('<div class="prose-table is-wide" role="region" aria-label="구분, A, B, C 표" tabindex="0">');
    const narrow = parseProcedureMarkdown(MD).sections[1]!.bodyHtml;
    expect(narrow).toContain('<div class="prose-table" role="region"');
    expect(narrow).not.toContain("is-wide");
  });

  it("H2 가 없으면 섹션 없이 도입부만", () => {
    expect(parseProcedureMarkdown("문단만 있습니다.")).toEqual({ introHtml: "<p>문단만 있습니다.</p>", sections: [] });
    expect(parseProcedureMarkdown("")).toEqual({ introHtml: "", sections: [] });
  });
});

describe("lib/procedure/toc — 목차", () => {
  it("본문 섹션은 4절 이름으로 짧게, 화면 섹션을 뒤에 붙인다", () => {
    const { sections } = parseProcedureMarkdown(MD, { reservedIds: RESERVED_IDS });
    const toc = buildToc(sections, { prices: true, faq: true, sources: true });
    expect(toc.map((t) => t.label)).toEqual([
      "누가 받나요",
      "비용은 얼마인가요",
      "회복은 며칠 걸리나요",
      "부작용과 주의할 점",
      "비슷한 시술과 비교",
      "자주 묻는 질문",
      "병원별 공개 가격",
      "자주 묻는 질문",
      "참고한 자료",
    ]);
    expect(toc.slice(-3).map((t) => t.id)).toEqual(["prices", "faq", "sources"]);
    expect(new Set(toc.map((t) => t.id)).size).toBe(toc.length);
  });

  it("같은 종류가 두 번이면 두 번째는 원래 제목, 화면 섹션은 있을 때만", () => {
    const toc = buildToc(
      [
        { id: "a", title: "비용은 얼마인가요?", kind: "cost" },
        { id: "b", title: "추가 비용은 무엇인가요?", kind: "cost" },
      ],
      { prices: false, faq: false, sources: false },
    );
    expect(toc).toEqual([
      { id: "a", label: "비용은 얼마인가요" },
      { id: "b", label: "추가 비용은 무엇인가요?" },
    ]);
  });
});

describe("lib/procedure/params — 한글 slug", () => {
  it("인코딩된 params 를 되돌린다(잘못된 인코딩은 그대로)", () => {
    expect(decodeSlug("%EC%8C%8D%EA%BA%BC%ED%92%80-%EC%88%98%EC%88%A0")).toBe("쌍꺼풀-수술");
    expect(decodeSlug("쌍꺼풀-수술")).toBe("쌍꺼풀-수술");
    expect(decodeSlug("%E0%A4%A")).toBe("%E0%A4%A");
  });

  it("빌드는 원문 slug 만, 개발 서버는 인코딩 값도 함께", () => {
    expect(staticSlugParams(["쌍꺼풀-수술", "ascii"], "production")).toEqual([{ slug: "쌍꺼풀-수술" }, { slug: "ascii" }]);
    expect(staticSlugParams(["쌍꺼풀-수술", "ascii"], "development")).toEqual([
      { slug: "쌍꺼풀-수술" },
      { slug: "%EC%8C%8D%EA%BA%BC%ED%92%80-%EC%88%98%EC%88%A0" },
      { slug: "ascii" },
    ]);
  });
});

describe("lib/procedure/facts — 요약 박스·메타", () => {
  it("4칸: 가격·소요·회복·마취(괄호는 보조 줄)", () => {
    const facts = procedureFacts(makeProcedure());
    expect(facts.map((f) => [f.key, f.value, f.note])).toEqual([
      ["price", "50만~250만 원", null],
      ["duration", "약 1시간", null],
      ["recovery", "약 7일", null],
      ["anesthesia", "국소 마취", "수면 마취 병행 가능"],
    ]);
    expect(facts[3]!.text).toBe("국소 마취 (수면 마취 병행 가능)");
    const laser = procedureFacts(makeProcedure({ price_low: 30000, price_high: 150000, price_note: "1회 기준", anesthesia: null }));
    expect(laser[0]!.text).toBe("3만~15만 원 (1회 기준)");
    expect(laser[3]!.value).toBe("상담 후 안내");
    expect(priceText(makeProcedure({ price_low: null, price_high: null }))).toBe("상담 후 안내");
  });

  it("괄호 분리", () => {
    expect(splitParenthetical("전신 마취")).toEqual({ main: "전신 마취", note: null });
    expect(splitParenthetical("국소 마취 (수면 마취 선택)")).toEqual({ main: "국소 마취", note: "수면 마취 선택" });
    expect(splitParenthetical("(괄호만)")).toEqual({ main: "(괄호만)", note: null });
  });

  it("시술 분류: 레이저 = 비침습, 실·주사 = 경피, 나머지 = 수술", () => {
    expect(procedureClass({ name: "레이저 토닝", anesthesia: null })).toBe("noninvasive");
    expect(procedureClass({ name: "실리프팅", anesthesia: null })).toBe("percutaneous");
    expect(procedureClass({ name: "눈매교정", anesthesia: null })).toBe("surgical");
  });

  it("10개 시술 모두 title ≤ 60자(템플릿 포함), description 120~150자 + 가격 범위 포함", () => {
    for (const p of content.procedures) {
      const title = `${procedureTitle(p)} | 리얼성형`;
      expect(title.length, title).toBeLessThanOrEqual(60);
      expect(title).toContain(`${p.name} 가격·회복기간·부작용 총정리 (2026)`);
      const d = procedureDescription(p);
      expect(d.length, d).toBeGreaterThanOrEqual(DESCRIPTION_MIN);
      expect(d.length, d).toBeLessThanOrEqual(DESCRIPTION_MAX);
      expect(d.startsWith(p.summary.slice(0, 20))).toBe(true);
    }
  });

  it("description: 가격이 없는 요약엔 가격을 붙이고, 너무 길면 문장 단위로 줄인다", () => {
    const short = procedureDescription(makeProcedure({ summary: "짧은 요약입니다." }));
    expect(short).toContain("병원 공개 가격은 50만~250만 원입니다.");
    expect(short.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
    const long = procedureDescription(
      makeProcedure({ summary: `${"가".repeat(100)}입니다. 50만~250만 원입니다. ${"나".repeat(60)}입니다.` }),
    );
    expect(long.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
    expect(long).toContain("50만~250만 원입니다.");
    const huge = procedureDescription(makeProcedure({ summary: `50만~250만 원 ${"다".repeat(200)}` }));
    expect(huge.length).toBe(DESCRIPTION_MAX);
    expect(huge.endsWith("…")).toBe(true);
  });
});

describe("lib/procedure/jsonld — 구조화 데이터", () => {
  const base = "https://example.github.io/realsurgery";

  it("MedicalWebPage + SurgicalProcedure + FAQPage, 값이 요약 박스와 같다, 평점 없음", () => {
    const p = makeProcedure({
      extras: { tagline: "t", timeline: [{ day: "당일", label: "붓기 시작", detail: "d" }], good_for: [], cautions: [], similar: [] },
    });
    const data = procedureJsonLd({ procedure: p, category: content.categories[0], author: content.authors[0], base });
    const graph = data["@graph"] as Record<string, unknown>[];
    expect(graph.map((g) => g["@type"])).toEqual(["MedicalWebPage", "SurgicalProcedure", "FAQPage"]);
    const [page, procedure, faq] = graph as [Record<string, unknown>, Record<string, unknown>, Record<string, unknown>];
    const url = `${base}/procedures/%EC%8C%8D%EA%BA%BC%ED%92%80-%EC%88%98%EC%88%A0/`;
    expect(page.url).toBe(url);
    expect(page.name).toBe(procedureTitle(p));
    expect(page.description).toBe(procedureDescription(p));
    expect(page.dateModified).toBe("2026-10-24");
    expect(page.citation).toEqual([{ "@type": "CreativeWork", name: "대한성형외과학회", url: "https://www.plasticsurgery.or.kr/" }]);
    expect(procedure.bodyLocation).toBe("눈");
    expect(procedure).not.toHaveProperty("procedureType");
    expect(procedure.howPerformed).toBe("마취: 국소 마취 (수면 마취 병행 가능). 소요시간: 약 1시간.");
    expect(procedure.followup).toBe("회복기간: 약 7일. 회복 일정: 당일 붓기 시작.");
    const entities = faq.mainEntity as { name: string; acceptedAnswer: { text: string } }[];
    expect(entities.map((e) => e.name)).toEqual(["가격은?", "회복기간은?"]);
    expect(entities[0]!.acceptedAnswer.text).toBe("50만~250만 원입니다.");
    const json = jsonLdString(data);
    expect(json).not.toMatch(/AggregateRating|"Review"|ratingValue/);
  });

  it("비수술 시술은 MedicalProcedure + procedureType, FAQ·부위가 없으면 생략", () => {
    const p = makeProcedure({ name: "레이저 토닝", slug: "레이저-토닝", faqs: [], recovery_days: 0 });
    const data = procedureJsonLd({ procedure: p, category: undefined, author: undefined, base: `${base}/` });
    const graph = data["@graph"] as Record<string, unknown>[];
    expect(graph.map((g) => g["@type"])).toEqual(["MedicalWebPage", "MedicalProcedure"]);
    expect(graph[1]!.procedureType).toBe("https://schema.org/NoninvasiveProcedure");
    expect(graph[1]).not.toHaveProperty("bodyLocation");
    expect(graph[1]!.followup).toBe("회복기간: 당일 일상 가능.");
    expect((graph[0]!.author as { name: string }).name).toBe("리얼성형 편집팀");
    expect((graph[0]!.publisher as { url: string }).url).toBe(`${base}/`);
    const thread = procedureJsonLd({ procedure: makeProcedure({ name: "실리프팅" }), category: undefined, author: undefined, base });
    expect((thread["@graph"] as Record<string, unknown>[])[1]!.procedureType).toBe("https://schema.org/PercutaneousProcedure");
  });

  it("목록 CollectionPage + ItemList, </script> 조기 종료 방지", () => {
    const data = procedureListJsonLd({
      procedures: [{ name: "쌍꺼풀 수술", slug: "쌍꺼풀-수술" }],
      base,
      name: PROCEDURES_TITLE,
      description: "d",
      path: "/procedures/",
    });
    expect(data["@type"]).toBe("CollectionPage");
    expect(data.mainEntity.itemListElement[0]).toEqual({
      "@type": "ListItem",
      position: 1,
      name: "쌍꺼풀 수술",
      url: `${base}/procedures/%EC%8C%8D%EA%BA%BC%ED%92%80-%EC%88%98%EC%88%A0/`,
    });
    expect(jsonLdString({ a: "</script>" })).toBe('{"a":"\\u003c/script>"}');
    expect(absoluteUrl("https://x/", "/a b/")).toBe("https://x/a%20b/");
  });
});

describe("lib/procedure/prices — 병원별 공개 가격", () => {
  const p = makeProcedure({ id: "eyelid", price_low: 500000, price_high: 2500000 });
  const clinics = [
    makeClinic("c", [offer("eyelid", 700000, 2200000, "2026-10-01")]),
    makeClinic("a", [offer("eyelid", 550000, 1600000, "2026-10-08")]),
    makeClinic("b", [offer("eyelid", 550000, 1500000, "2026-09-01")]),
    makeClinic("d", [offer("other", 100, 200)]),
    makeClinic("e", [offer("eyelid", null, 3000000)]),
    makeClinic("f", [offer("eyelid", 450000, null)]),
  ];

  it("공개 최저가 순, 상위 limit 곳, 눈금은 병원 가격까지 포함", () => {
    const r = comparePrices(p, clinics, 4);
    expect(r.total).toBe(5);
    expect(r.rows.map((x) => x.clinic.id)).toEqual(["f", "b", "a", "c"]);
    expect(r.scaleMin).toBe(450000);
    expect(r.scaleMax).toBe(2500000);
    expect(r.latestUpdate).toBe("2026-10-08");
    const all = comparePrices(p, clinics);
    expect(all.rows.at(-1)!.clinic.id).toBe("e");
    expect(all.scaleMax).toBe(3000000);
  });

  it("공개한 병원이 없으면 빈 목록, 가격도 없으면 눈금 0", () => {
    const r = comparePrices(makeProcedure({ id: "none", price_low: null, price_high: null }), clinics);
    expect(r).toEqual({ rows: [], total: 0, scaleMin: 0, scaleMax: 0, latestUpdate: null });
    expect(comparePrices(p, clinics, -1).rows).toEqual([]);
  });

  it("시술별 병원 수", () => {
    const counts = clinicCountByProcedure(clinics);
    expect(counts.get("eyelid")).toBe(5);
    expect(counts.get("other")).toBe(1);
  });
});

describe("lib/procedure/related — 비슷한 시술", () => {
  it("extras.similar 먼저, 그다음 같은 부위, 그다음 조회수", () => {
    const eyelid = proc("double-eyelid");
    const withExtras = { ...eyelid, extras: { tagline: "", timeline: [], good_for: [], cautions: [], similar: ["rhinoplasty", "missing", "double-eyelid"] } };
    const picked = similarProcedures(withExtras, content.procedures, 3);
    expect(picked[0]!.id).toBe("rhinoplasty");
    expect(picked.slice(1).every((p) => p.category_id === "eye" && p.id !== "double-eyelid")).toBe(true);
    const fallback = similarProcedures({ ...eyelid, extras: null }, content.procedures, 3);
    expect(fallback.every((p) => p.category_id === "eye")).toBe(true);
    const breast = similarProcedures({ ...proc("breast-augmentation"), extras: null }, content.procedures, 3);
    expect(breast).toHaveLength(3);
    expect(breast.map((p) => p.id)).not.toContain("breast-augmentation");
  });
});

describe("lib/procedure/scroll — scroll_depth", () => {
  it("비율 계산(끝 2px 안은 100)", () => {
    expect(scrollPercent(0, 800, 3200)).toBe(25);
    expect(scrollPercent(1600, 800, 3200)).toBe(75);
    expect(scrollPercent(2399, 800, 3200)).toBe(100);
    expect(scrollPercent(0, 800, 0)).toBe(100);
    expect(scrollPercent(-50, 10, 3200)).toBe(0);
  });

  it("새로 넘은 기준값만 작은 순서로", () => {
    expect(SCROLL_THRESHOLDS).toEqual([25, 50, 75, 100]);
    expect(newThresholds(60, new Set())).toEqual([25, 50]);
    expect(newThresholds(100, new Set([25, 50]))).toEqual([75, 100]);
    expect(newThresholds(10, new Set())).toEqual([]);
  });
});

describe("lib/procedure/josa — 조사", () => {
  it("받침에 맞는 조사", () => {
    expect(hasBatchim("수술")).toBe(true);
    expect(hasBatchim("눈밑지방재배치")).toBe(false);
    expect(hasBatchim("ABC")).toBe(false);
    expect(josa("쌍꺼풀 수술", "을/를")).toBe("쌍꺼풀 수술을");
    expect(josa("눈밑지방재배치", "을/를")).toBe("눈밑지방재배치를");
    expect(josa("리얼성형 편집팀", "이/가")).toBe("리얼성형 편집팀이");
    expect(josa("코", "은/는")).toBe("코는");
    expect(josa("앞트임", "과/와")).toBe("앞트임과");
    expect(josa("마취 크림", "으로/로")).toBe("마취 크림으로");
    expect(josa("수술", "으로/로")).toBe("수술로");
    expect(josa("레이저", "으로/로")).toBe("레이저로");
  });
});

describe("lib/procedure/list — P-02 부위별 목록", () => {
  it("부위 순서대로, 부위 안은 조회수 순, 부위 가격대", () => {
    const groups = groupByCategory(content.categories, content.procedures);
    expect(groups.map((g) => g.category.id)).toEqual(["eye", "nose", "contour", "lifting", "skin", "breast"]);
    const eye = groups[0]!;
    const views = eye.procedures.map((p) => p.view_count);
    expect(views).toEqual([...views].sort((a, b) => b - a));
    expect(eye.priceRange).toBe("50만~350만 원");
    expect(groups.reduce((n, g) => n + g.procedures.length, 0)).toBe(10);
  });

  it("시술이 없거나 가격이 없는 부위", () => {
    const cats = [{ id: "x", name: "기타", slug: "기타", order: 1 }];
    expect(groupByCategory(cats, [])[0]).toEqual({ category: cats[0], procedures: [], priceRange: null });
    const onlyHigh = groupByCategory(cats, [makeProcedure({ category_id: "x", price_low: null, price_high: 900000 })]);
    expect(onlyHigh[0]!.priceRange).toBe("최대 90만 원");
  });

  it("description 120~150자", () => {
    const d = proceduresDescription(content.categories, content.procedures.length);
    expect(d.length, d).toBeGreaterThanOrEqual(120);
    expect(d.length, d).toBeLessThanOrEqual(150);
    expect(d.startsWith("눈·코·윤곽·리프팅·피부·가슴")).toBe(true);
  });
});

describe("lib/procedure/sections — 본문 접기·중복 표 생략", () => {
  const LONG = "가".repeat(MORE_MIN_CHARS);
  const block = (type: "paragraph" | "table" | "list" | "heading" | "other", text: string) => ({
    type,
    html: type === "table" ? `<div class="prose-table"><table><tr><td>${text}</td></tr></table></div>` : `<p>${text}</p>`,
  });

  it("회복 섹션 + 타임라인: 첫 표만 빼고(문단·목록은 남김) 남은 설명은 접는다", () => {
    const blocks = [block("table", "시기 표"), block("paragraph", `개인차 ${LONG}`), block("table", "두 번째 표")];
    const view = sectionView({ kind: "recovery", blocks }, { timeline: true });
    expect(view.droppedTable).toBe(true);
    expect(view.mainHtml).toBe("");
    expect(view.moreHtml).toContain("개인차");
    expect(view.moreHtml).toContain("두 번째 표");
    expect(view.moreHtml).not.toContain("시기 표");
  });

  it("회복 섹션인데 타임라인이 없으면 표를 포함해 전부 그대로 보인다", () => {
    const blocks = [block("table", "시기 표"), block("paragraph", `개인차 ${LONG}`)];
    expect(sectionView({ kind: "recovery", blocks }, { timeline: false })).toEqual({
      mainHtml: blocks.map((b) => b.html).join("\n"),
      moreHtml: "",
      droppedTable: false,
    });
  });

  it("타임라인 뒤 남은 설명이 짧으면 접지 않는다", () => {
    const view = sectionView({ kind: "recovery", blocks: [block("table", "표"), block("paragraph", "짧은 문장")] }, { timeline: true });
    expect(view).toEqual({ mainHtml: "<p>짧은 문장</p>", moreHtml: "", droppedTable: true });
  });

  it("누가 받나·비용·부작용·비교: 첫 표/목록만 펼치고 나머지는 원래 순서대로 접는다", () => {
    expect([...COLLAPSIBLE_KINDS].sort()).toEqual(["compare", "cost", "risks", "who"]);
    const blocks = [block("paragraph", `앞 문단 ${LONG}`), block("list", "요점 목록"), block("table", "뒤 표"), block("paragraph", "뒤 문단")];
    const view = sectionView({ kind: "who", blocks }, { timeline: false });
    expect(view.mainHtml).toBe("<p>요점 목록</p>");
    expect(view.moreHtml).toBe([blocks[0], blocks[2], blocks[3]].map((b) => b!.html).join("\n"));
    expect(view.droppedTable).toBe(false);
    // 회복 섹션이 아니면 타임라인 여부와 상관없이 표를 빼지 않는다
    const compare = sectionView({ kind: "compare", blocks: [block("table", "비교표"), block("paragraph", LONG)] }, { timeline: true });
    expect(compare.mainHtml).toContain("비교표");
    expect(compare.droppedTable).toBe(false);
  });

  it("표·목록이 없으면 직답 아래 전부 접고, 접을 내용이 짧으면 접지 않는다", () => {
    const onlyText = sectionView({ kind: "risks", blocks: [block("paragraph", LONG)] }, { timeline: false });
    expect(onlyText).toEqual({ mainHtml: "", moreHtml: `<p>${LONG}</p>`, droppedTable: false });
    const short = sectionView({ kind: "cost", blocks: [block("table", "표"), block("paragraph", "짧음")] }, { timeline: false });
    expect(short.moreHtml).toBe("");
    expect(short.mainHtml).toContain("짧음");
  });

  it("그 밖의 섹션은 건드리지 않는다", () => {
    const blocks = [block("paragraph", LONG), block("list", "목록")];
    expect(sectionView({ kind: "other", blocks }, { timeline: true }).moreHtml).toBe("");
    expect(sectionView({ kind: "other", blocks: [] }, { timeline: false })).toEqual({ mainHtml: "", moreHtml: "", droppedTable: false });
  });

  it("글자 수는 태그·공백을 빼고 엔티티는 1글자", () => {
    expect(textLength("<p>가 나 &amp; <strong>다</strong></p>")).toBe(4);
  });

  it("실제 본문(쌍꺼풀 수술): 회복 표는 빠지고 비교표·비용표·요점 목록은 보이며 나머지는 접힌다", () => {
    const p = proc("double-eyelid");
    const { sections } = parseProcedureMarkdown(p.content_mdx!, { reservedIds: RESERVED_IDS });
    const views = Object.fromEntries(sections.map((s) => [s.kind, sectionView(s, { timeline: s.kind === "recovery" })]));
    expect(views.recovery!.droppedTable).toBe(true);
    expect(`${views.recovery!.mainHtml}${views.recovery!.moreHtml}`).not.toContain("<table");
    expect(views.recovery!.moreHtml).toContain("붓기 정도와 기간은");
    expect(views.cost!.mainHtml).toContain("<table");
    expect(views.compare!.mainHtml).toContain("prose-table is-wide");
    expect(views.who!.mainHtml.startsWith("<ul>")).toBe(true);
    expect(views.risks!.mainHtml).toContain("좌우 비대칭");
    for (const kind of ["who", "cost", "risks", "compare"]) expect(views[kind]!.moreHtml, kind).not.toBe("");
  });
});

describe("lib/procedure/posts — 관련 칼럼", () => {
  const post = (id: string, content_mdx: string | null, published_at = "2026-10-01"): Post => ({
    id,
    slug: id,
    title: id,
    summary: "",
    content_mdx,
    author_id: null,
    published_at,
    updated_at: published_at,
  });

  it("링크 형태가 달라도 같은 시술로 본다(한글·퍼센트 인코딩·끝 슬래시·앵커·제목·절대 URL·참조 링크)", () => {
    const enc = encodeURIComponent("쌍꺼풀-수술");
    expect(linkedProcedureSlugs(`[a](/procedures/쌍꺼풀-수술/)`)).toEqual(["쌍꺼풀-수술"]);
    expect(linkedProcedureSlugs(`[a](/procedures/${enc}/)`)).toEqual(["쌍꺼풀-수술"]);
    expect(linkedProcedureSlugs(`[a](/procedures/${enc})`)).toEqual(["쌍꺼풀-수술"]);
    expect(linkedProcedureSlugs(`[a](/procedures/쌍꺼풀-수술/#faq "제목")`)).toEqual(["쌍꺼풀-수술"]);
    expect(linkedProcedureSlugs(`[a](https://x.github.io/realsurgery/procedures/${enc}/?utm_source=naver)`)).toEqual(["쌍꺼풀-수술"]);
    expect(linkedProcedureSlugs(`[a][ref]\n\n[ref]: /procedures/코-성형/`)).toEqual(["코-성형"]);
    // 목록·다른 경로·깨진 인코딩
    expect(linkedProcedureSlugs(`[a](/procedures/) [b](/clinics/x/) [c](/procedures/a/b/)`)).toEqual([]);
    expect(linkedProcedureSlugs(`[a](/procedures/%E0%A4%A/)`)).toEqual(["%E0%A4%A"]);
    expect(linkedProcedureSlugs(`[a](/procedures/x/) [b](/procedures/x/) [c](/procedures/y/)`)).toEqual(["x", "y"]);
    expect(linkedProcedureSlugs(null)).toEqual([]);
  });

  it("이 시술을 링크한 칼럼만 최신 발행순, 최대 limit 개", () => {
    const posts = [
      post("old", "[쌍꺼풀](/procedures/쌍꺼풀-수술/)", "2026-09-01"),
      post("other", "[코](/procedures/코-성형/)", "2026-10-20"),
      post("new", `[쌍꺼풀](/procedures/${encodeURIComponent("쌍꺼풀-수술")}/)`, "2026-10-10"),
      post("empty", null, "2026-10-25"),
      post("plain", "쌍꺼풀 수술 이야기(링크 없음)", "2026-10-24"),
    ];
    const eyelid = makeProcedure();
    expect(postsLinkingTo(eyelid, posts).map((p) => p.id)).toEqual(["new", "old"]);
    expect(postsLinkingTo(eyelid, posts, 1).map((p) => p.id)).toEqual(["new"]);
    expect(postsLinkingTo(makeProcedure({ slug: "레이저-토닝" }), posts)).toEqual([]);
  });

  it("실제 데이터: 쌍꺼풀 수술은 칼럼 2개, 레이저 토닝은 없음", () => {
    expect(postsLinkingTo(proc("double-eyelid"), content.posts).map((p) => p.id)).toEqual([
      "double-eyelid-consult-questions",
      "reading-surgery-quotes",
    ]);
    expect(postsLinkingTo(proc("laser-toning"), content.posts)).toEqual([]);
  });
});
