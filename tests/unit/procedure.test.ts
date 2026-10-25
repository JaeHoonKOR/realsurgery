// P-02·P-03 순수 함수 단위 검증 — 본문 Markdown 변환·목차·요약 값·JSON-LD·가격 비교·스크롤 깊이
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { buildData } from "../../scripts/build-data.mjs";
import type { Clinic, Content, Procedure } from "@/lib/content";
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
} from "@/lib/procedure/markdown";
import { decodeSlug, staticSlugParams } from "@/lib/procedure/params";
import { clinicCountByProcedure, comparePrices } from "@/lib/procedure/prices";
import { similarProcedures } from "@/lib/procedure/related";
import { SCROLL_THRESHOLDS, newThresholds, scrollPercent } from "@/lib/procedure/scroll";
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
