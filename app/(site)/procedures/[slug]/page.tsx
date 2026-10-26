import type { Metadata } from "next";
import { withShareDefaults } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, ChevronRight, Info } from "lucide-react";
import { BottomBar } from "@/components/common/BottomBar";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ConsultCta } from "@/components/common/ConsultCta";
import { CardRail } from "@/components/procedure/CardRail";
import { FaqList } from "@/components/procedure/FaqList";
import { HighlightCards } from "@/components/procedure/HighlightCards";
import { PriceComparison } from "@/components/procedure/PriceComparison";
import { ProcedureCard } from "@/components/procedure/ProcedureCard";
import { ProcedureSummary } from "@/components/procedure/ProcedureSummary";
import { ProcedureToc } from "@/components/procedure/ProcedureToc";
import { ProcedureTracker } from "@/components/procedure/ProcedureTracker";
import { ProseHtml } from "@/components/procedure/ProseHtml";
import { ProseMore } from "@/components/procedure/ProseMore";
import { RecoveryTimeline } from "@/components/procedure/RecoveryTimeline";
import { RelatedPosts } from "@/components/procedure/RelatedPosts";
import { SourceList } from "@/components/procedure/SourceList";
import { Icon3D } from "@/components/ui/Icon3D";
import { isPathBuilt } from "@/lib/built-routes";
import { loadContent } from "@/lib/content";
import { siteUrl } from "@/lib/env.public";
import { formatPriceRange } from "@/lib/format";
import { procedureDescription, procedureTitle } from "@/lib/procedure/facts";
import { josa } from "@/lib/procedure/josa";
import { jsonLdString, procedureJsonLd } from "@/lib/procedure/jsonld";
import { parseProcedureMarkdown } from "@/lib/procedure/markdown";
import { decodeSlug, staticSlugParams } from "@/lib/procedure/params";
import { postsLinkingTo } from "@/lib/procedure/posts";
import { comparePrices } from "@/lib/procedure/prices";
import { similarProcedures } from "@/lib/procedure/related";
import { sectionView } from "@/lib/procedure/sections";
import { PAGE_SECTION_IDS, RESERVED_IDS, buildToc } from "@/lib/procedure/toc";
import { ROUTES } from "@/lib/routes";
import { SITE } from "@/lib/site";
import { container, cx } from "@/lib/ui";

// P-03 시술 상세 가이드 (screen-spec 4절 P-03, 6절 SEO/AEO). 정적 export — 시술 10개를 빌드 시 모두 만든다.

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return staticSlugParams(loadContent().procedures.map((p) => p.slug));
}

function findProcedure(rawSlug: string) {
  const content = loadContent();
  const slug = decodeSlug(rawSlug);
  const procedure = content.procedures.find((p) => p.slug === slug);
  return procedure ? { content, procedure } : null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const found = findProcedure((await params).slug);
  if (!found) return {};
  const { procedure: p, content } = found;
  const category = content.categories.find((c) => c.id === p.category_id);
  const title = procedureTitle(p);
  const description = procedureDescription(p);
  return {
    title,
    description,
    alternates: { canonical: "./" },
    ...withShareDefaults({
      type: "article",
      url: "./",
      title,
      description,
      modifiedTime: p.updated_at,
      ...(category ? { section: category.name } : {}),
    }),
  };
}

export default async function ProcedurePage({ params }: Params) {
  const found = findProcedure((await params).slug);
  if (!found) notFound();
  const { content, procedure: p } = found;
  const category = content.categories.find((c) => c.id === p.category_id);
  const categoryById = new Map(content.categories.map((c) => [c.id, c]));
  const author = content.authors.find((a) => a.id === "editorial") ?? content.authors[0];
  const authorName = author?.name ?? `${SITE.name} 편집팀`;

  const body = p.content_mdx ? parseProcedureMarkdown(p.content_mdx, { reservedIds: RESERVED_IDS }) : null;
  const sections = body?.sections ?? [];
  const comparison = comparePrices(p, content.clinics);
  const faqs = [...p.faqs].sort((a, b) => a.order - b.order);
  const toc = buildToc(sections, { prices: true, faq: faqs.length > 0, sources: p.sources.length > 0 });
  const tocLabel = new Map(toc.map((t) => [t.id, t.label]));
  const timeline = p.extras?.timeline ?? [];
  // 타임라인은 첫 "회복" 섹션 한 곳에만(직답 바로 아래). 그 섹션의 같은 내용 표는 sectionView 가 뺀다.
  const timelineSectionId = timeline.length > 0 ? sections.find((s) => s.kind === "recovery")?.id : undefined;
  const similar = similarProcedures(p, content.procedures);
  const posts = postsLinkingTo(p, content.posts);
  const hasConsult = isPathBuilt(ROUTES.consult);
  const range = formatPriceRange(p.price_low, p.price_high);
  const jsonLd = jsonLdString(procedureJsonLd({ procedure: p, category, author, base: siteUrl() }));

  return (
    <>
      <ProcedureTracker procedureId={p.id} procedureName={p.name} category={category?.id ?? p.category_id} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <div className={cx(container, "pt-4 md:pt-6")}>
        <Breadcrumb
          items={[
            { name: "홈", href: ROUTES.home },
            { name: "시술 가이드", href: ROUTES.procedures },
            ...(category ? [{ name: category.name, href: `${ROUTES.procedures}#${category.slug}` }] : []),
            { name: p.name },
          ]}
        />
      </div>

      <div className={cx(container, "pt-6 pb-8 md:pt-8 md:pb-14")}>
        <ProcedureSummary procedure={p} category={category} author={author} />
      </div>

      <div className={cx(container, "pb-16 md:pb-24")}>
        <div className="lg:flex lg:items-start lg:gap-16">
          <aside aria-label="목차와 요약" className="lg:sticky lg:top-24 lg:order-last lg:w-64 lg:shrink-0">
            <ProcedureToc items={toc} />
            {/* 데스크톱 고정 사이드: 가격 범위 한 줄 + 병원별 비교로 이동(모바일은 요약 박스 가격 칸·본문 이동 링크) */}
            <a
              href={`#${PAGE_SECTION_IDS.prices}`}
              data-testid="side-price"
              className="mt-6 hidden min-h-14 items-center justify-between gap-3 rounded-md bg-canvas px-4 py-3 transition-colors hover:bg-line lg:flex"
            >
              <span className="min-w-0">
                <span className="block text-sm text-ink-muted">
                  {comparison.total > 0 ? `병원 ${comparison.total}곳 공개 가격` : "병원 공개 가격"}
                </span>
                <span className="block font-bold text-ink tabular-nums">
                  {range}
                  {p.price_note && <span className="ml-1 text-sm font-medium text-ink-muted">{p.price_note}</span>}
                </span>
              </span>
              <ArrowDown aria-hidden="true" className="size-4 shrink-0 text-ink-muted" />
            </a>
          </aside>

          <article aria-labelledby="procedure-title" data-testid="procedure-body" className="mt-8 min-w-0 lg:mt-0 lg:flex-1">
            {p.extras && <HighlightCards extras={p.extras} />}

            {body ? (
              <>
                {body.introHtml && <ProseHtml html={body.introHtml} className="mt-12" />}
                {sections.map((s) => {
                  const hasTimeline = s.id === timelineSectionId;
                  const view = sectionView(s, { timeline: hasTimeline });
                  return (
                    <section key={s.id} aria-labelledby={s.id} data-kind={s.kind} className="mt-10 first:mt-0 md:mt-16">
                      {/* AEO: 질문형 H2 바로 다음은 언제나 직답 문단 */}
                      <h2 id={s.id} className="scroll-mt-6 text-h2 font-bold tracking-tight text-ink">
                        {s.title}
                      </h2>
                      <ProseHtml html={s.leadHtml} variant="lead" className="mt-4" />
                      {hasTimeline && (
                        <div className="mt-6">
                          <RecoveryTimeline name={p.name} timeline={timeline} />
                        </div>
                      )}
                      <ProseHtml html={view.mainHtml} className="mt-5" />
                      <ProseMore html={view.moreHtml} topic={tocLabel.get(s.id) ?? s.title} />
                      {/* 모바일은 목차가 접혀 있고 사이드 가격 카드가 없다 → 비용 섹션 끝에 병원별 비교로 가는 링크 1개(데스크톱은 사이드 카드) */}
                      {s.kind === "cost" && comparison.total > 0 && (
                        <a
                          href={`#${PAGE_SECTION_IDS.prices}`}
                          data-testid="cost-prices-link"
                          className="mt-4 inline-flex min-h-11 items-center gap-1.5 font-semibold text-brand-strong hover:text-brand-ink lg:hidden"
                        >
                          병원 {comparison.total}곳 공개 가격 비교 보기
                          <ArrowDown aria-hidden="true" className="size-4 shrink-0" />
                        </a>
                      )}
                    </section>
                  );
                })}
              </>
            ) : (
              <div data-testid="body-pending" className="mt-10 first:mt-0 flex flex-col items-start gap-4 rounded-xl bg-canvas-soft p-6 md:flex-row md:items-center md:p-8">
                <Icon3D name="ic-memo" size={48} />
                <div>
                  <p className="font-bold text-ink">자세한 가이드를 정리하고 있습니다</p>
                  <p className="mt-1 text-ink-muted">
                    요약과 병원별 공개 가격, 자주 묻는 질문을 먼저 확인해 보세요. 본문은 출처 확인을 마치는 대로 올립니다.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-14 md:mt-20">
              <PriceComparison procedure={p} comparison={comparison} />
            </div>

            {hasConsult && (
              <div className="mt-8 md:mt-10">
                <ConsultCta
                  location="mid"
                  procedureId={p.id}
                  title={`${p.name} 상담 신청`}
                  benefit="가격대·회복 일정·상담 때 물어볼 질문을 정리해 드립니다. 신청 비용은 들지 않습니다."
                />
              </div>
            )}

            {faqs.length > 0 && (
              <section id={PAGE_SECTION_IDS.faq} aria-labelledby="faq-title" data-testid="procedure-faq" className="mt-14 scroll-mt-6 md:mt-20">
                <h2 id="faq-title" className="text-h2 font-bold tracking-tight text-ink">
                  자주 묻는 질문
                </h2>
                <p className="mt-2 text-ink-muted">{josa(p.name, "을/를")} 알아볼 때 많이 찾는 질문입니다.</p>
                <div className="mt-6">
                  <FaqList procedureId={p.id} items={faqs} />
                </div>
              </section>
            )}

            <div className="mt-14 md:mt-20">
              <SourceList sources={p.sources} updatedAt={p.updated_at} authorName={authorName} />
            </div>

            <p data-testid="procedure-disclaimer" className="mt-8 flex gap-3 rounded-lg bg-canvas-soft p-5 text-sm text-ink-muted">
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ink-subtle" />
              <span>
                <strong className="font-semibold text-ink">{SITE.disclaimer}</strong>
                <br />
                가격·회복기간·부작용은 개인차가 있으며 최종 내용은 진찰 후 의료진이 안내합니다.
              </span>
            </p>
          </article>
        </div>
      </div>

      {(similar.length > 0 || posts.length > 0) && (
        <div className="bg-canvas py-12 md:py-20">
          <div className={cx(container, "space-y-12 md:space-y-20")}>
            {similar.length > 0 && (
              <section id={PAGE_SECTION_IDS.similar} aria-labelledby="similar-title" data-testid="similar-procedures" className="scroll-mt-6">
                {/* 공통 SectionHeading 의 "전체 보기" 링크는 ink-subtle 이라 회색 밴드 위 대비가 4.5:1 미만 → 여기서는 직접 그린다 */}
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 id="similar-title" className="text-h2 font-bold tracking-tight text-ink">
                      비슷한 시술도 비교해 보세요
                    </h2>
                    <p className="mt-2 text-ink-muted">가격대와 회복기간을 나란히 놓고 보세요.</p>
                  </div>
                  {isPathBuilt(ROUTES.procedures) && (
                    <Link
                      href={ROUTES.procedures}
                      className="hidden h-11 shrink-0 items-center gap-0.5 text-sm font-semibold text-ink-muted hover:text-ink sm:inline-flex"
                    >
                      시술 가이드 전체
                      <ChevronRight aria-hidden="true" className="size-4" />
                    </Link>
                  )}
                </div>
                {/* 좁은 가로 카드에서 제목 줄이 두 줄로 밀리지 않게 병원 수는 빼고(가격·회복·소요만), 부위 아이콘 타일도 생략(시술 이미지가 있으면 썸네일) */}
                <CardRail label={`${josa(p.name, "과/와")} 비슷한 시술`} className="mt-6 md:mt-8">
                  {similar.map((s) => (
                    <ProcedureCard
                      key={s.id}
                      procedure={s}
                      category={categoryById.get(s.category_id)}
                      fromPage="procedure"
                      showEmoji={false}
                    />
                  ))}
                </CardRail>
              </section>
            )}
            <RelatedPosts procedureName={p.name} posts={posts} />
          </div>
        </div>
      )}

      {/* 상담 CTA 블록은 본문 중간(location=mid) 1회 — 하단에서는 모바일 하단 고정 바·헤더 CTA 가 같은 역할을 한다 */}
      <BottomBar page="procedure" procedureId={p.id} />
    </>
  );
}
