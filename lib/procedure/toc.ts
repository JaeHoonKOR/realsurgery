/**
 * P-03 목차 — 본문 H2(질문형) + 화면 고정 섹션(가격 비교·FAQ·출처).
 * 본문 H2 는 검색 질문 그대로라 길다("쌍꺼풀 수술 비용은 얼마인가요?") → 목차에서는 4절 본문 섹션 이름으로 짧게 보여 준다.
 * 화면 섹션 id 는 본문 제목 id 와 겹치지 않게 parseProcedureMarkdown 에 예약 id 로 넘긴다.
 */
import type { MarkdownSection, SectionKind } from "./markdown";

/** 화면이 직접 만드는 섹션의 앵커 id */
export const PAGE_SECTION_IDS = {
  summary: "summary",
  highlights: "highlights",
  prices: "prices",
  faq: "faq",
  sources: "sources",
  similar: "similar",
} as const;

export const RESERVED_IDS: string[] = Object.values(PAGE_SECTION_IDS);

export type TocItem = { id: string; label: string };

/** 4절 P-03 본문 섹션: "누가 받나", "비용은 얼마", "회복은 며칠", "부작용·주의", "비슷한 시술 비교" */
const KIND_LABEL: Record<Exclude<SectionKind, "other">, string> = {
  who: "누가 받나요",
  cost: "비용은 얼마인가요",
  recovery: "회복은 며칠 걸리나요",
  risks: "부작용과 주의할 점",
  compare: "비슷한 시술과 비교",
};

export function buildToc(
  sections: readonly Pick<MarkdownSection, "id" | "title" | "kind">[],
  extra: { prices: boolean; faq: boolean; sources: boolean },
): TocItem[] {
  const usedKinds = new Set<SectionKind>();
  const items: TocItem[] = sections.map((s) => {
    const short = s.kind === "other" || usedKinds.has(s.kind) ? null : KIND_LABEL[s.kind];
    usedKinds.add(s.kind);
    return { id: s.id, label: short ?? s.title };
  });
  if (extra.prices) items.push({ id: PAGE_SECTION_IDS.prices, label: "병원별 공개 가격" });
  if (extra.faq) items.push({ id: PAGE_SECTION_IDS.faq, label: "자주 묻는 질문" });
  if (extra.sources) items.push({ id: PAGE_SECTION_IDS.sources, label: "참고한 자료" });
  return items;
}
