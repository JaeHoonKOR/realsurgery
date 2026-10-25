/**
 * 시술 본문 Markdown(content_mdx) → HTML (빌드 시 서버에서만 실행, 클라이언트 번들에 들어가지 않는다).
 *
 * - H2 단위로 섹션을 나눈다. H2 = 검색 질문형 제목(6절 AEO), 바로 아래 첫 문단 = 직답(lead)으로 따로 돌려준다.
 * - 모든 제목에 앵커 id 를 붙인다(목차·딥링크용). 한글 그대로 쓰고 문장부호만 뺀다.
 * - 가격 범위 "50만~150만" 의 물결표가 GFM 취소선(~text~)으로 바뀌지 않도록 취소선 문법을 끈다.
 * - 표는 가로 스크롤 래퍼(role=region, 키보드 포커스 가능)로 감싸고, 각 행 첫 칸을 행 제목(th scope=row)으로 만든다.
 * - 원시 HTML 은 그대로 내보내지 않는다: 주석(<!-- MD-REVIEW --> 등)은 지우고 나머지는 이스케이프한다.
 */
import { Marked, type Token, type Tokens } from "marked";
import { withBasePath } from "@/lib/env.public";

/** 숫자가 든 이 글자 수 이하의 표 칸(가격 범위·기간)은 한 줄로(is-compact) */
export const COMPACT_CELL = 16;

export type SectionKind = "who" | "cost" | "recovery" | "risks" | "compare" | "other";

export type MarkdownSection = {
  id: string;
  /** H2 제목(문장형 질문) — 일반 텍스트 */
  title: string;
  kind: SectionKind;
  /** 제목 바로 아래 첫 문단(직답) HTML. 첫 블록이 문단이 아니면 빈 문자열 */
  leadHtml: string;
  /** 나머지 본문 HTML */
  bodyHtml: string;
};

export type ProcedureMarkdown = {
  /** 첫 H2 앞의 도입부 HTML(없으면 빈 문자열) */
  introHtml: string;
  sections: MarkdownSection[];
};

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** 제목 텍스트 → 앵커 id. 한글·영문·숫자는 남기고 문장부호는 빼며 공백·가운뎃점·빗금은 하이픈으로. */
export function headingId(text: string): string {
  const id = text
    .normalize("NFC")
    .toLowerCase()
    .replace(/[·/|,.]/g, " ")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-");
  return id || "section";
}

/** 같은 문서 안에서 겹치지 않는 id 를 만든다. 두 번째부터 -2, -3 … reserved 는 화면이 이미 쓰는 id. */
export function createIdFactory(reserved: Iterable<string> = []): (text: string) => string {
  const used = new Set<string>(reserved);
  return (text: string) => {
    const base = headingId(text);
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    return id;
  };
}

/** 인라인 Markdown 표기(**굵게**, `코드`, [링크](url))를 걷어낸 일반 텍스트 */
export function plainText(markdown: string): string {
  return markdown
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const KIND_RULES: [SectionKind, RegExp][] = [
  ["compare", /비슷한|비교|차이|다른가요/],
  ["recovery", /회복|붓기|다운타임/],
  ["risks", /부작용|주의|위험/],
  ["cost", /비용|가격|얼마/],
  ["who", /어떤 사람|누가|대상|받나요/],
];

/** H2 제목으로 섹션 종류를 판정한다(3절 본문 섹션 "누가 받나·비용·회복·부작용·비슷한 시술") */
export function sectionKind(title: string): SectionKind {
  return KIND_RULES.find(([, re]) => re.test(title))?.[0] ?? "other";
}

export function stripHtmlComments(markdown: string): string {
  return markdown.replace(/<!--[\s\S]*?-->/g, "");
}

function createMarked(nextId: (text: string) => string): Marked {
  const marked = new Marked({ gfm: true, breaks: false });
  marked.use({
    tokenizer: {
      // 취소선 끄기: "50만~150만 … 100만~250만" 이 <del> 로 바뀌지 않게(undefined = 이 문법 없음)
      del() {
        return undefined;
      },
    },
    renderer: {
      heading(token: Tokens.Heading) {
        const level = Math.min(Math.max(token.depth, 2), 4);
        const id = nextId(plainText(token.text));
        return `<h${level} id="${escapeHtml(id)}">${this.parser.parseInline(token.tokens)}</h${level}>\n`;
      },
      table(token: Tokens.Table) {
        // 짧은 값(가격 범위·기간)은 줄바꿈하지 않는다 — "약 50만~/250만 원"처럼 숫자 중간이 끊기지 않게. 넘치면 표가 가로 스크롤된다.
        const cls = (c: Tokens.TableCell) => {
          const text = plainText(c.text);
          const compact = /\d/.test(text) && text.length <= COMPACT_CELL;
          const names = [c.align ? `is-${c.align}` : "", compact ? "is-compact" : ""].filter(Boolean);
          return names.length ? ` class="${names.join(" ")}"` : "";
        };
        // 모바일에서는 행마다 카드로 쌓는다(styles/prose.css) — 칸마다 열 제목(data-label)을 붙이고,
        // display 를 바꿔도 표로 읽히도록 ARIA 역할을 명시한다.
        const headers = token.header.map((c) => plainText(c.text));
        const head = token.header
          .map((c) => `<th scope="col" role="columnheader"${cls(c)}>${this.parser.parseInline(c.tokens)}</th>`)
          .join("");
        const rows = token.rows
          .map((row) => {
            const cells = row
              .map((c, i) =>
                i === 0
                  ? `<th scope="row" role="rowheader"${cls(c)}>${this.parser.parseInline(c.tokens)}</th>`
                  : `<td role="cell" data-label="${escapeHtml(headers[i] ?? "")}"${cls(c)}>${this.parser.parseInline(c.tokens)}</td>`,
              )
              .join("");
            return `<tr role="row">${cells}</tr>`;
          })
          .join("");
        const label = `${headers.join(", ")} 표`;
        return (
          `<div class="prose-table" role="region" aria-label="${escapeHtml(label)}" tabindex="0">` +
          `<table role="table"><thead role="rowgroup"><tr role="row">${head}</tr></thead>` +
          `<tbody role="rowgroup">${rows}</tbody></table></div>\n`
        );
      },
      link(token: Tokens.Link) {
        const text = this.parser.parseInline(token.tokens);
        const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
        if (/^https?:\/\//i.test(token.href)) {
          return `<a href="${escapeHtml(token.href)}"${title} target="_blank" rel="noopener noreferrer">${text}</a>`;
        }
        // 내부 경로는 배포 하위 경로(basePath)를 붙인다. 그 밖(#앵커·mailto:)은 그대로.
        const href = token.href.startsWith("/") ? withBasePath(token.href) : token.href;
        return `<a href="${escapeHtml(href)}"${title}>${text}</a>`;
      },
      image(token: Tokens.Image) {
        // 본문 이미지는 next/image 규칙(WebP·크기 지정)을 지킬 수 없어 대체 텍스트만 남긴다(전후 사진 금지 규칙과도 일치).
        return escapeHtml(token.text);
      },
      html(token: Tokens.HTML | Tokens.Tag) {
        return escapeHtml(token.text);
      },
    },
  });
  return marked;
}

/** 시술 본문 Markdown 을 섹션별 HTML 로 바꾼다. reservedIds = 화면 섹션이 쓰는 id(본문 제목과 겹치지 않게). */
export function parseProcedureMarkdown(markdown: string, { reservedIds = [] as string[] } = {}): ProcedureMarkdown {
  const nextId = createIdFactory(reservedIds);
  const marked = createMarked(nextId);
  const tokens = marked.lexer(stripHtmlComments(markdown));
  const render = (list: Token[]) => (list.length ? (marked.parser(list) as string).trim() : "");

  const intro: Token[] = [];
  const groups: { heading: Tokens.Heading; tokens: Token[] }[] = [];
  for (const token of tokens) {
    if (token.type === "heading" && (token as Tokens.Heading).depth <= 2) {
      groups.push({ heading: token as Tokens.Heading, tokens: [] });
    } else {
      (groups.at(-1)?.tokens ?? intro).push(token);
    }
  }

  const introHtml = render(intro);
  const sections = groups.map(({ heading, tokens: body }) => {
    const title = plainText(heading.text);
    const id = nextId(title);
    const first = body.findIndex((t) => t.type !== "space");
    const hasLead = first >= 0 && body[first]?.type === "paragraph";
    const lead = hasLead ? body.slice(first, first + 1) : [];
    const rest = hasLead ? body.slice(first + 1) : body;
    return { id, title, kind: sectionKind(title), leadHtml: render(lead), bodyHtml: render(rest) };
  });
  return { introHtml, sections };
}
