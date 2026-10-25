import { TrackedLink } from "@/components/common/TrackedLink";
import { Illustration } from "@/components/ui/Illustration";
import { postCover, readingMinutes } from "@/lib/blog";
import type { Post } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { postPath } from "@/lib/routes";

/** 칼럼 카드 — 표지·제목·요약·날짜. select_post 이벤트(screen-spec 4절 P-01 최신 칼럼, P-10) */
export function PostCard({ post, headingLevel = "h3" }: { post: Post; headingLevel?: "h2" | "h3" }) {
  const cover = postCover(post.id);
  const Heading = headingLevel;
  return (
    <TrackedLink
      href={postPath(post.slug)}
      event="select_post"
      params={{ post_id: post.id }}
      className="group flex h-full flex-col overflow-hidden rounded-lg bg-surface transition-shadow hover:shadow-lg"
    >
      <Illustration
        id={cover.image}
        aspect="16:9"
        fallback={cover.fallback}
        alt=""
        sizes="(min-width: 1024px) 352px, (min-width: 640px) 50vw, 100vw"
      />
      <div className="flex flex-1 flex-col p-6">
        <Heading className="text-h3 font-bold tracking-tight text-ink group-hover:underline">{post.title}</Heading>
        <p className="mt-2 line-clamp-2 text-ink-muted">{post.summary}</p>
        <p className="mt-auto pt-5 text-sm text-ink-subtle tabular-nums">
          {formatDate(post.published_at)}, {readingMinutes(post.content_mdx)}분 분량
        </p>
      </div>
    </TrackedLink>
  );
}
