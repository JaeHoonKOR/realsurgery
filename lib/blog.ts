/**
 * P-10 칼럼 — 정렬·읽는 시간·관련 시술·JSON-LD (Node·빌드 전용 데이터 가공).
 */
import type { IconName } from "@/components/ui/Icon3D";
import type { Author, Post, Procedure } from "@/lib/content";
import { plainText } from "@/lib/procedure/markdown";
import { absoluteUrl } from "@/lib/seo";
import { SITE } from "@/lib/site";

/** 칼럼 표지 일러스트(content/images/prompts.json post-*)와 이미지가 없을 때의 3D 아이콘 */
export const POST_COVER: Record<string, { image: string; fallback: IconName }> = {
  "double-eyelid-consult-questions": { image: "post-consult-questions", fallback: "ic-memo" },
  "lower-fat-vs-lower-blepharoplasty": { image: "post-lower-eye-compare", fallback: "ic-eye" },
  "reading-surgery-quotes": { image: "post-reading-quotes", fallback: "ic-quote" },
};

export function postCover(id: string): { image: string; fallback: IconName } {
  return POST_COVER[id] ?? { image: `post-${id}`, fallback: "ic-source" };
}

/** 최신순(발행일 → 수정일) */
export function sortPosts(posts: readonly Post[]): Post[] {
  return [...posts].sort((a, b) => b.published_at.localeCompare(a.published_at) || b.updated_at.localeCompare(a.updated_at));
}

/** 한국어 기준 분당 약 500자 — 최소 1분 */
export function readingMinutes(markdown: string | null): number {
  if (!markdown) return 1;
  const chars = plainText(markdown).replace(/\s+/g, "").length;
  return Math.max(1, Math.round(chars / 500));
}

/** 본문이 링크한 시술(/procedures/<slug>/) — 등장 순서, 중복 제거 */
export function linkedProcedures(markdown: string | null, procedures: readonly Procedure[]): Procedure[] {
  if (!markdown) return [];
  const bySlug = new Map(procedures.map((p) => [p.slug, p]));
  const out: Procedure[] = [];
  for (const m of markdown.matchAll(/\]\(\/procedures\/([^/)]+)\/?\)/g)) {
    let slug = m[1] ?? "";
    try {
      slug = decodeURIComponent(slug).normalize("NFC");
    } catch {
      /* 그대로 비교 */
    }
    const p = bySlug.get(slug);
    if (p && !out.includes(p)) out.push(p);
  }
  return out;
}

/** Article (screen-spec 6절 P-10: headline, author, datePublished, dateModified). BreadcrumbList 는 Breadcrumb 컴포넌트가 낸다. */
export function postJsonLd({ post, author, path }: { post: Post; author: Author | undefined; path: string }) {
  const url = absoluteUrl(path);
  const home = absoluteUrl("/");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: post.title,
        description: post.summary,
        inLanguage: "ko-KR",
        url,
        mainEntityOfPage: url,
        datePublished: post.published_at,
        dateModified: post.updated_at,
        author: { "@type": "Organization", name: author?.name ?? `${SITE.name} 편집팀`, url: home },
        publisher: { "@id": `${home}#organization` },
      },
    ],
  };
}
