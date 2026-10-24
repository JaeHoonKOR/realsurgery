/**
 * 시술 가이드 MDX 본문용 rehype 플러그인 (docs/content/procedure-mdx.md)
 * 1) 본문 H2 에 순서대로 앵커 id 부여(guide-who, guide-cost …) → 목차·스크롤 이동
 * 2) 출처 각주 표기 "[1]" 을 <sup data-cite="1">[1]</sup> 로 감싼다(링크가 아니라 터치 타깃 44px 규칙과 충돌하지 않음).
 *    번호는 frontmatter sources 순번 = 페이지 하단 "출처" 목록 번호.
 * hast 타입 패키지를 직접 의존하지 않도록 필요한 모양만 정의한다.
 */
export type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

const CITE = /\[(\d{1,2})\]/g;
const SKIP = new Set(["code", "pre", "script", "style"]);

/** "…합니다.[1] 다음" → [text, sup, text] */
export function splitCitations(value: string): HastNode[] {
  const out: HastNode[] = [];
  let last = 0;
  for (const m of value.matchAll(CITE)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ type: "text", value: value.slice(last, at) });
    out.push({
      type: "element",
      tagName: "sup",
      properties: { dataCite: m[1] },
      // U+2060(단어 결합자): 줄바꿈이 문장 끝과 [n] 사이에서 일어나 각주만 다음 줄로 넘어가지 않게 한다
      children: [{ type: "text", value: `⁠[${m[1]}]` }],
    });
    last = at + m[0].length;
  }
  if (last < value.length) out.push({ type: "text", value: value.slice(last) });
  return out.length ? out : [{ type: "text", value }];
}

/** 이웃한 text 노드를 합친다("[", "1", "]" 처럼 나뉘어 들어와도 각주를 찾도록) */
function mergeText(children: HastNode[]): HastNode[] {
  const out: HastNode[] = [];
  for (const c of children) {
    const prev = out[out.length - 1];
    if (c.type === "text" && prev?.type === "text") prev.value = (prev.value ?? "") + (c.value ?? "");
    else out.push(c.type === "text" ? { ...c } : c);
  }
  return out;
}

export function rehypeGuide(options: { ids: readonly string[] }) {
  return (tree: HastNode) => {
    let h2 = 0;
    const walk = (node: HastNode) => {
      if (!node.children) return;
      const next: HastNode[] = [];
      for (const child of mergeText(node.children)) {
        if (child.type === "text") {
          next.push(...splitCitations(child.value ?? ""));
          continue;
        }
        if (child.type === "element") {
          if (child.tagName === "h2") {
            child.properties = { ...child.properties, id: options.ids[h2] ?? `guide-section-${h2 + 1}` };
            h2++;
          }
          if (!SKIP.has(child.tagName ?? "")) walk(child);
        }
        next.push(child);
      }
      node.children = next;
    };
    walk(tree);
  };
}
