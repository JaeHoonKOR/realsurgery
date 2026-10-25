import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PostCard } from "@/components/blog/PostCard";
import { isPathBuilt } from "@/lib/built-routes";
import type { Post } from "@/lib/content";
import { josa } from "@/lib/procedure/josa";
import { ROUTES } from "@/lib/routes";
import { CardRail } from "./CardRail";

/**
 * P-03 관련 칼럼 (4절 "관련 시술·칼럼", 6절 시술↔칼럼 상호 링크) — 본문이 이 시술 가이드를 링크한 칼럼만.
 * 카드 클릭 → P-10, select_post 이벤트는 PostCard 가 낸다. 칼럼이 없으면 그리지 않는다.
 */
export function RelatedPosts({ procedureName, posts }: { procedureName: string; posts: readonly Post[] }) {
  if (posts.length === 0) return null;
  return (
    <section aria-labelledby="related-posts-title" data-testid="related-posts">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="related-posts-title" className="text-h2 font-bold tracking-tight text-ink">
            관련 칼럼
          </h2>
          <p className="mt-2 text-ink-muted">{josa(procedureName, "을/를")} 다룬 칼럼입니다.</p>
        </div>
        {isPathBuilt(ROUTES.blog) && (
          <Link
            href={ROUTES.blog}
            className="hidden h-11 shrink-0 items-center gap-0.5 text-sm font-semibold text-ink-muted hover:text-ink sm:inline-flex"
          >
            칼럼 전체
            <ChevronRight aria-hidden="true" className="size-4" />
          </Link>
        )}
      </div>
      <CardRail label={`${procedureName} 관련 칼럼`} className="mt-6 md:mt-8">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </CardRail>
    </section>
  );
}
