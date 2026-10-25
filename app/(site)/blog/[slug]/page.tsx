import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Info } from "lucide-react";
import { PostCard } from "@/components/blog/PostCard";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ConsultCta } from "@/components/common/ConsultCta";
import { ProcedureCard } from "@/components/procedure/ProcedureCard";
import { ProseHtml } from "@/components/procedure/ProseHtml";
import { Illustration } from "@/components/ui/Illustration";
import { linkedProcedures, postCover, postJsonLd, readingMinutes, sortPosts } from "@/lib/blog";
import { loadContent } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { parseProcedureMarkdown } from "@/lib/procedure/markdown";
import { decodeSlug, staticSlugParams } from "@/lib/procedure/params";
import { clinicCountByProcedure } from "@/lib/procedure/prices";
import { ROUTES, postPath } from "@/lib/routes";
import { jsonLdString } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { container, cx, section } from "@/lib/ui";

// P-10 칼럼 상세 (screen-spec 2절·6절 Article). 정적 export — 칼럼마다 빌드 시 생성.

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return staticSlugParams(loadContent().posts.map((p) => p.slug));
}

function findPost(rawSlug: string) {
  const content = loadContent();
  const slug = decodeSlug(rawSlug);
  const post = content.posts.find((p) => p.slug === slug);
  return post ? { content, post } : null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const found = findPost((await params).slug);
  if (!found) return {};
  const { post } = found;
  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: "./" },
    openGraph: {
      type: "article",
      locale: "ko_KR",
      siteName: SITE.name,
      url: "./",
      title: post.title,
      description: post.summary,
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
    },
    twitter: { card: "summary", title: post.title, description: post.summary },
  };
}

export default async function PostPage({ params }: Params) {
  const found = findPost((await params).slug);
  if (!found) notFound();
  const { content, post } = found;
  const author = content.authors.find((a) => a.id === post.author_id) ?? content.authors[0];
  const body = post.content_mdx ? parseProcedureMarkdown(post.content_mdx) : null;
  const related = linkedProcedures(post.content_mdx, content.procedures).slice(0, 3);
  const others = sortPosts(content.posts).filter((p) => p.id !== post.id).slice(0, 2);
  const categoryById = new Map(content.categories.map((c) => [c.id, c]));
  const clinicCounts = clinicCountByProcedure(content.clinics);
  const cover = postCover(post.id);
  const jsonLd = jsonLdString(postJsonLd({ post, author, path: postPath(post.slug) }));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <div className={cx(container, "pt-4 md:pt-6")}>
        <Breadcrumb items={[{ name: "홈", href: ROUTES.home }, { name: "칼럼", href: ROUTES.blog }, { name: post.title }]} />
      </div>

      <article aria-labelledby="post-title" data-testid="post-article" className="pb-16 md:pb-24">
        <header className="mx-auto max-w-text px-5 pt-6 md:px-0 md:pt-10">
          <h1 id="post-title" className="text-h1 font-bold tracking-tighter text-ink">
            {post.title}
          </h1>
          <p className="mt-4 text-sm text-ink-subtle tabular-nums">
            {author?.name ?? `${SITE.name} 편집팀`}, {formatDate(post.published_at)} 발행
            {post.updated_at !== post.published_at && `, ${formatDate(post.updated_at)} 수정`}, {readingMinutes(post.content_mdx)}분 분량
          </p>
        </header>

        <div className="mx-auto mt-8 max-w-text px-5 md:px-0">
          <Illustration
            id={cover.image}
            aspect="16:9"
            fallback={cover.fallback}
            alt=""
            sizes="(min-width: 768px) 680px, 100vw"
            priority
            className="rounded-lg"
          />
        </div>

        <div className="mx-auto mt-10 max-w-text px-5 md:px-0">
          {body ? (
            <>
              {body.introHtml && <ProseHtml html={body.introHtml} variant="lead" />}
              {body.sections.map((s) => (
                <section key={s.id} aria-labelledby={s.id} className="mt-12">
                  <h2 id={s.id} className="scroll-mt-24 text-h2 font-bold tracking-tight text-ink">
                    {s.title}
                  </h2>
                  <ProseHtml html={s.leadHtml} className="mt-4" />
                  <ProseHtml html={s.bodyHtml} className="mt-4" />
                </section>
              ))}
            </>
          ) : (
            <p className="text-lg text-ink-muted">{post.summary}</p>
          )}

          {related.length > 0 && (
            <section aria-labelledby="post-related" data-testid="post-related" className="mt-14">
              <h2 id="post-related" className="text-h3 font-bold tracking-tight text-ink">
                이 글에 나온 시술 가이드
              </h2>
              <ul className="mt-4 grid gap-3 rounded-xl bg-canvas p-3 sm:grid-cols-2 md:p-4">
                {related.map((p) => (
                  <li key={p.id}>
                    <ProcedureCard
                      procedure={p}
                      category={categoryById.get(p.category_id)}
                      clinicCount={clinicCounts.get(p.id)}
                      fromPage="blog"
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="mt-12 flex gap-3 rounded-lg bg-canvas-soft p-5 text-sm text-ink-muted">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ink-subtle" />
            <span>{SITE.disclaimer}. 가격·회복기간은 개인차가 있으며 최종 내용은 진찰 후 의료진이 안내합니다.</span>
          </p>
        </div>
      </article>

      {others.length > 0 && (
        <section aria-labelledby="post-more" className={cx("bg-canvas", section)}>
          <div className={container}>
            <h2 id="post-more" className="text-h2 font-bold tracking-tight text-ink">
              다른 칼럼
            </h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {others.map((p) => (
                <li key={p.id}>
                  <PostCard post={p} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <div className={cx(container, section)}>
        <ConsultCta location="bottom" />
      </div>
    </>
  );
}
