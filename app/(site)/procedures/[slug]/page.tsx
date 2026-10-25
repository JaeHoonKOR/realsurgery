import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown, ChevronRight, Info } from "lucide-react";
import { BottomBar } from "@/components/common/BottomBar";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ConsultCta } from "@/components/common/ConsultCta";
import { FaqList } from "@/components/procedure/FaqList";
import { HighlightCards } from "@/components/procedure/HighlightCards";
import { PriceComparison } from "@/components/procedure/PriceComparison";
import { ProcedureCard } from "@/components/procedure/ProcedureCard";
import { ProcedureSummary } from "@/components/procedure/ProcedureSummary";
import { ProcedureToc } from "@/components/procedure/ProcedureToc";
import { ProcedureTracker } from "@/components/procedure/ProcedureTracker";
import { ProseHtml } from "@/components/procedure/ProseHtml";
import { RecoveryTimeline } from "@/components/procedure/RecoveryTimeline";
import { SourceList } from "@/components/procedure/SourceList";
import { Emoji3D } from "@/components/ui/Emoji3D";
import { isPathBuilt } from "@/lib/built-routes";
import { loadContent } from "@/lib/content";
import { siteUrl } from "@/lib/env.public";
import { formatPriceRange } from "@/lib/format";
import { procedureDescription, procedureTitle } from "@/lib/procedure/facts";
import { josa } from "@/lib/procedure/josa";
import { jsonLdString, procedureJsonLd } from "@/lib/procedure/jsonld";
import { parseProcedureMarkdown } from "@/lib/procedure/markdown";
import { decodeSlug, staticSlugParams } from "@/lib/procedure/params";
import { clinicCountByProcedure, comparePrices } from "@/lib/procedure/prices";
import { similarProcedures } from "@/lib/procedure/related";
import { PAGE_SECTION_IDS, RESERVED_IDS, buildToc } from "@/lib/procedure/toc";
import { ROUTES } from "@/lib/routes";
import { SITE } from "@/lib/site";
import { btn, container, cx, section } from "@/lib/ui";

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
    openGraph: {
      type: "article",
      locale: "ko_KR",
      siteName: SITE.name,
      url: "./",
      title,
      description,
      modifiedTime: p.updated_at,
      ...(category ? { section: category.name } : {}),
    },
    twitter: { card: "summary", title, description },
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
  const similar = similarProcedures(p, content.procedures);
  const clinicCounts = clinicCountByProcedure(content.clinics);
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

      <div className={cx(container, "pt-6 pb-10 md:pt-8 md:pb-14")}>
        <ProcedureSummary procedure={p} category={category} author={author} />
      </div>

      <div className={cx(container, "pb-16 md:pb-24")}>
        <div className="lg:flex lg:items-start lg:gap-16">
          <aside aria-label="목차와 요약" className="lg:sticky lg:top-24 lg:order-last lg:w-64 lg:shrink-0">
            <ProcedureToc items={toc} />
            <div className="mt-8 hidden rounded-lg bg-canvas p-5 lg:block" data-testid="side-price">
              <p className="text-sm text-ink-muted">병원 공개 가격</p>
              <p className="mt-1 text-h3 font-bold tracking-tight text-ink tabular-nums">{range}</p>
              {p.price_note && <p className="text-sm text-ink-muted">{p.price_note}</p>}
              <a href={`#${PAGE_SECTION_IDS.prices}`} className={cx(btn.outline, btn.sm, "mt-4 w-full")}>
                {comparison.total > 0 ? `병원 ${comparison.total}곳 가격 비교` : "가격 안내 보기"}
              </a>
            </div>
          </aside>

          <article aria-labelledby="procedure-title" data-testid="procedure-body" className="mt-10 min-w-0 lg:mt-0 lg:flex-1">
            {p.extras && <HighlightCards extras={p.extras} />}

            {body ? (
              <>
                {body.introHtml && <ProseHtml html={body.introHtml} className="mt-12" />}
                {sections.map((s) => (
                  <section key={s.id} aria-labelledby={s.id} data-kind={s.kind} className="mt-14 first:mt-0 md:mt-16">
                    <h2 id={s.id} className="scroll-mt-6 text-h2 font-bold tracking-tight text-ink">
                      {s.title}
                    </h2>
                    <ProseHtml html={s.leadHtml} variant="lead" className="mt-4" />
                    {s.kind === "recovery" && p.extras && p.extras.timeline.length > 0 && (
                      <div className="mt-6">
                        <RecoveryTimeline name={p.name} timeline={p.extras.timeline} />
                      </div>
                    )}
                    <ProseHtml html={s.bodyHtml} className="mt-5" />
                    {s.kind === "cost" && comparison.total > 0 && (
                      <a
                        href={`#${PAGE_SECTION_IDS.prices}`}
                        className="mt-6 flex min-h-14 items-center justify-between gap-3 rounded-lg bg-brand-weak px-5 py-3 font-semibold text-brand-ink transition-colors hover:bg-line"
                      >
                        병원 {comparison.total}곳 공개 가격 비교하기
                        <ChevronDown aria-hidden="true" className="size-5 shrink-0" />
                      </a>
                    )}
                  </section>
                ))}
              </>
            ) : (
              <div data-testid="body-pending" className="mt-10 first:mt-0 flex flex-col items-start gap-4 rounded-xl bg-canvas-soft p-6 md:flex-row md:items-center md:p-8">
                <Emoji3D name="memo" size={48} />
                <div>
                  <p className="font-bold text-ink">자세한 가이드를 정리하고 있습니다</p>
                  <p className="mt-1 text-ink-muted">
                    요약과 병원별 공개 가격, 자주 묻는 질문을 먼저 확인해 보세요. 본문은 출처 확인을 마치는 대로 올립니다.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-16 md:mt-20">
              <PriceComparison procedure={p} comparison={comparison} />
            </div>

            {hasConsult && (
              <div className="mt-10">
                <ConsultCta
                  location="mid"
                  procedureId={p.id}
                  title="이 시술 상담 가이드 받기"
                  benefit={`${p.name} 가격대와 회복 일정, 상담 때 물어볼 질문을 정리해 영업일 기준 1일 안에 연락드립니다.`}
                />
              </div>
            )}

            {faqs.length > 0 && (
              <section id={PAGE_SECTION_IDS.faq} aria-labelledby="faq-title" data-testid="procedure-faq" className="mt-16 scroll-mt-6 md:mt-20">
                <h2 id="faq-title" className="text-h2 font-bold tracking-tight text-ink">
                  자주 묻는 질문
                </h2>
                <p className="mt-2 text-ink-muted">{josa(p.name, "을/를")} 알아볼 때 많이 찾는 질문입니다.</p>
                <div className="mt-6">
                  <FaqList procedureId={p.id} items={faqs} />
                </div>
              </section>
            )}

            <div className="mt-16 md:mt-20">
              <SourceList sources={p.sources} updatedAt={p.updated_at} authorName={authorName} />
            </div>

            <p data-testid="procedure-disclaimer" className="mt-10 flex gap-3 rounded-lg bg-canvas-soft p-5 text-sm text-ink-muted">
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

      {similar.length > 0 && (
        <section id={PAGE_SECTION_IDS.similar} aria-labelledby="similar-title" data-testid="similar-procedures" className={cx("bg-canvas", section)}>
          <div className={container}>
            {/* 공통 SectionHeading 의 "전체 보기" 링크는 ink-subtle 이라 회색 밴드 위 대비가 4.5:1 미만 → 여기서는 직접 그린다 */}
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 id="similar-title" className="text-h2 font-bold tracking-tight text-ink">
                  비슷한 시술도 비교해 보세요
                </h2>
                <p className="mt-2 text-ink-muted">가격대와 회복기간을 나란히 놓고 보면 상담 때 질문이 분명해집니다.</p>
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
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((s) => (
                <li key={s.id}>
                  <ProcedureCard
                    procedure={s}
                    category={categoryById.get(s.category_id)}
                    clinicCount={clinicCounts.get(s.id)}
                    fromPage="procedure"
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {hasConsult && (
        <div className={cx(container, "py-14 md:py-20")}>
          <ConsultCta
            location="bottom"
            procedureId={p.id}
            title={`${p.name} 상담, 무엇부터 물어볼지 정리해 드립니다`}
            benefit="시술·지역·희망 시기만 남기면 영업일 기준 1일 안에 연락드립니다. 상담 신청은 무료입니다."
          />
        </div>
      )}

      <BottomBar page="procedure" procedureId={p.id} />
    </>
  );
}
