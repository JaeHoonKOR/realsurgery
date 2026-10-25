/**
 * P-03 본문 섹션을 화면에 어떻게 펼칠지 정한다(빌드 시 서버에서만).
 *
 * - 질문형 H2 + 바로 아래 직답 문단(leadHtml)은 언제나 그대로 보인다(6절 AEO). 이 모듈은 그 아래 본문만 다룬다.
 * - "회복은 며칠" 섹션에 회복 타임라인(extras.timeline)이 있으면 본문의 첫 표(같은 내용의 시기별 표)를 빼고,
 *   타임라인을 요점으로 삼아 남은 설명 문단을 접는다. 타임라인이 없으면 표·본문을 모두 그대로 둔다.
 * - "누가 받나"·"비용"·"부작용·주의"·"비슷한 시술 비교"는 첫 표나 목록(요점)만 바로 보여 주고 나머지 설명은
 *   네이티브 <details> "자세히 보기"로 접는다. 접힌 내용도 HTML 에 그대로 있어 검색엔진·AI 크롤러가 읽는다.
 */
import type { MarkdownBlock, MarkdownSection, SectionKind } from "./markdown";

/** 요점(첫 표·목록)만 펼치고 보조 설명을 접는 섹션 */
export const COLLAPSIBLE_KINDS: ReadonlySet<SectionKind> = new Set<SectionKind>(["who", "cost", "risks", "compare"]);

/** 접을 내용이 이 글자 수(공백 제외)보다 짧으면 접지 않는다 — 한 줄짜리를 "자세히 보기" 뒤에 숨기지 않게 */
export const MORE_MIN_CHARS = 60;

export type SectionView = {
  /** 직답 아래 바로 보이는 본문 HTML */
  mainHtml: string;
  /** "자세히 보기" 안에 접어 둘 본문 HTML(없으면 빈 문자열) */
  moreHtml: string;
  /** 회복 타임라인과 겹쳐 뺀 표가 있는지 */
  droppedTable: boolean;
};

const join = (blocks: readonly MarkdownBlock[]) => blocks.map((b) => b.html).join("\n");

/** 접을 내용이 충분히 길 때만 접는다(아니면 null → 전부 펼침) */
function collapse(main: readonly MarkdownBlock[], more: readonly MarkdownBlock[], droppedTable: boolean): SectionView | null {
  const moreHtml = join(more);
  if (more.length === 0 || textLength(moreHtml) < MORE_MIN_CHARS) return null;
  return { mainHtml: join(main), moreHtml, droppedTable };
}

/** HTML 의 글자 수(태그·공백 제외, 엔티티는 1글자) */
export function textLength(html: string): number {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&(?:[a-z]+|#\d+);/gi, "x")
    .replace(/\s+/g, "").length;
}

export function sectionView(
  section: Pick<MarkdownSection, "kind" | "blocks">,
  { timeline }: { timeline: boolean },
): SectionView {
  let blocks = section.blocks;
  let droppedTable = false;
  if (section.kind === "recovery" && timeline) {
    const table = blocks.findIndex((b) => b.type === "table");
    if (table >= 0) {
      blocks = blocks.filter((_, i) => i !== table);
      droppedTable = true;
    }
    // 타임라인이 요점 — 남은 설명(개인차·경과 진료 안내 등)은 접는다
    const view = collapse([], blocks, droppedTable);
    if (view) return view;
  } else if (COLLAPSIBLE_KINDS.has(section.kind)) {
    const key = blocks.findIndex((b) => b.type === "table" || b.type === "list");
    const view = collapse(
      key >= 0 ? [blocks[key]!] : [],
      blocks.filter((_, i) => i !== key),
      droppedTable,
    );
    if (view) return view;
  }
  return { mainHtml: join(blocks), moreHtml: "", droppedTable };
}
