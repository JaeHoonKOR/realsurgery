import { describe, expect, it } from "vitest";
import { linkedProcedures, postCover, postJsonLd, readingMinutes, sortPosts } from "@/lib/blog";
import type { Post, Procedure } from "@/lib/content";

const post = (id: string, published: string, updated = published): Post => ({
  id,
  slug: id,
  title: `제목 ${id}`,
  summary: "요약",
  content_mdx: null,
  author_id: "editorial",
  published_at: published,
  updated_at: updated,
});
const proc = (id: string, slug: string) => ({ id, slug }) as Procedure;

describe("blog helpers", () => {
  it("최신 발행순으로 정렬", () => {
    expect(sortPosts([post("a", "2026-10-01"), post("b", "2026-10-20"), post("c", "2026-10-20", "2026-10-22")]).map((p) => p.id)).toEqual([
      "c",
      "b",
      "a",
    ]);
  });
  it("읽는 시간 — 최소 1분, 약 500자/분", () => {
    expect(readingMinutes(null)).toBe(1);
    expect(readingMinutes("가".repeat(1500))).toBe(3);
  });
  it("본문 링크에서 시술을 순서대로·중복 없이 찾는다(인코딩 slug 포함)", () => {
    const list = [proc("a", "쌍꺼풀-수술"), proc("b", "코-성형")];
    const md = "[코](/procedures/코-성형/) 그리고 [쌍](/procedures/%EC%8C%8D%EA%BA%BC%ED%92%80-%EC%88%98%EC%88%A0/) 다시 [코](/procedures/코-성형/) [없음](/procedures/x/)";
    expect(linkedProcedures(md, list).map((p) => p.id)).toEqual(["b", "a"]);
    expect(linkedProcedures(null, list)).toEqual([]);
  });
  it("표지 매핑과 기본값", () => {
    expect(postCover("reading-surgery-quotes").image).toBe("post-reading-quotes");
    expect(postCover("new-post")).toEqual({ image: "post-new-post", fallback: "ic-source" });
  });
  it("Article JSON-LD", () => {
    const ld = postJsonLd({ post: post("a", "2026-10-01", "2026-10-02"), author: undefined, path: "/blog/a/" }) as {
      "@graph": Record<string, unknown>[];
    };
    const article = ld["@graph"][0]!;
    expect(article["@type"]).toBe("Article");
    expect(article.datePublished).toBe("2026-10-01");
    expect(article.dateModified).toBe("2026-10-02");
    expect(JSON.stringify(ld)).not.toMatch(/AggregateRating|Review/);
  });
});
