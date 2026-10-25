/**
 * P-03 "관련 칼럼" — 본문 Markdown 이 이 시술 가이드(/procedures/<slug>/)를 링크한 칼럼(4절 "관련 시술·칼럼", 6절 내부 링크).
 * 링크는 한글 그대로든 퍼센트 인코딩이든, 끝 슬래시·#앵커·?쿼리·절대 URL·basePath 가 붙어도 같은 시술로 본다.
 */
import type { Post, Procedure } from "@/lib/content";

/** 인라인 링크 [text](url "title") 와 참조 정의 [id]: url 의 주소 */
const LINK_TARGETS = /\]\(\s*<?([^)\s>]+)>?(?:\s+["'(][^)]*)?\)|^\s{0,3}\[[^\]]+\]:\s*<?(\S+?)>?(?:\s|$)/gm;
const PROCEDURE_PATH = /(?:^|\/)procedures\/([^/?#]+)\/?(?:[?#].*)?$/;

function decode(value: string): string {
  try {
    return decodeURIComponent(value).normalize("NFC");
  } catch {
    return value.normalize("NFC");
  }
}

/** Markdown 이 링크한 시술 slug 목록(등장 순서, 중복 제거) */
export function linkedProcedureSlugs(markdown: string | null): string[] {
  if (!markdown) return [];
  const out: string[] = [];
  for (const m of markdown.matchAll(LINK_TARGETS)) {
    const target = m[1] ?? m[2] ?? "";
    const slug = PROCEDURE_PATH.exec(target)?.[1];
    if (!slug) continue;
    const decoded = decode(slug);
    if (!out.includes(decoded)) out.push(decoded);
  }
  return out;
}

/** 이 시술을 링크한 칼럼 — 최신 발행순, 최대 limit 개 */
export function postsLinkingTo(procedure: Pick<Procedure, "slug">, posts: readonly Post[], limit = 3): Post[] {
  const slug = procedure.slug.normalize("NFC");
  return posts
    .filter((post) => linkedProcedureSlugs(post.content_mdx).includes(slug))
    .sort((a, b) => b.published_at.localeCompare(a.published_at) || b.updated_at.localeCompare(a.updated_at))
    .slice(0, limit);
}
