import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BottomBar } from "@/components/common/BottomBar";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ConsultCta } from "@/components/common/ConsultCta";
import { AffiliateItems } from "@/components/procedure/AffiliateItems";
import { ClinicPriceTable } from "@/components/procedure/ClinicPriceTable";
import { FaqAccordion } from "@/components/procedure/FaqAccordion";
import { GuideBody } from "@/components/procedure/GuideBody";
import { GuideMeta } from "@/components/procedure/GuideMeta";
import { GuideToc } from "@/components/procedure/GuideToc";
import { ProcedureSummary } from "@/components/procedure/ProcedureSummary";
import { ScrollDepthTracker, ViewProcedureTracker } from "@/components/procedure/ProcedureTrackers";
import { RelatedProcedures } from "@/components/procedure/RelatedProcedures";
import { loadContent } from "@/lib/content";
import { siteUrl } from "@/lib/env.public";
import { formatDate } from "@/lib/format.mjs";
import {
  ANCHORS,
  authorById,
  clinicPriceRows,
  findProcedureBySlug,
  jsonLdString,
  procedureJsonLd,
  procedureTitle,
  relatedProcedures,
  summaryCells,
  tocItems,
} from "@/lib/procedure";
import { ROUTES, procedurePath } from "@/lib/routes";
import { SITE } from "@/lib/site";

/*
 * P-03 시술 상세 가이드 (/procedures/{slug}) — screen-spec 4절 P-03, 6절 SEO/AEO.
 * 정적 export: 시술 전체 slug 를 빌드 때 생성(generateStaticParams), 그 밖의 slug 는 404.
 * 본문은 content/procedures/<id>.mdx (docs/content/procedure-mdx.md).
 */

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  const params = loadContent().procedures.map((p) => ({ slug: p.slug }));
  // next dev(미리보기)는 한글 세그먼트를 퍼센트 인코딩된 채로 generateStaticParams 와 비교한다(Next 15 dev + output: export).
  // 개발 서버에서만 인코딩된 값도 함께 돌려준다. 정적 빌드(production)는 한글 slug 그대로 → out/procedures/<한글>/index.html.
  if (process.env.NODE_ENV === "development") return [...params, ...params.map((p) => ({ slug: encodeURIComponent(p.slug) }))];
  return params;
}

function getProcedure(slug: string) {
  const content = loadContent();
  const procedure = findProcedureBySlug(content, slug);
  return procedure?.guide ? { content, procedure, guide: procedure.guide } : null;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const found = getProcedure((await params).slug);
  if (!found) return {};
  const { procedure: p, guide } = found;
  const title = procedureTitle(p.name, p.updated_at);
  const path = procedurePath(p.slug);
  return {
    title,
    description: guide.description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      locale: "ko_KR",
      siteName: SITE.name,
      title,
      description: guide.description,
      url: path,
      modifiedTime: p.updated_at,
    },
    twitter: { card: "summary", title, description: guide.description },
  };
}

export default async function ProcedurePage({ params }: { params: Promise<Params> }) {
  const found = getProcedure((await params).slug);
  if (!found) notFound();
  const { content, procedure: p, guide } = found;

  const category = content.categories.find((c) => c.id === p.category_id);
  const author = authorById(content.authors, guide.author_id);
  const reviewer = authorById(content.authors, guide.medical_reviewer_id);
  const cells = summaryCells(p);
  const priceRows = clinicPriceRows(content.clinics, p.id);
  const toc = tocItems(p, { prices: true, faq: p.faqs.length > 0 });
  const related = relatedProcedures(content.procedures, p);
  const categoryName = (id: string) => content.categories.find((c) => c.id === id)?.name;
  const updatedLabel = formatDate(p.updated_at);
  const jsonLd = procedureJsonLd({ procedure: p, author, reviewer, siteName: SITE.name, base: siteUrl() });

  return (
    <article className="mx-auto max-w-content px-5 pt-4 pb-16 md:px-10 md:pt-6 md:pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />
      <ViewProcedureTracker procedure_id={p.id} procedure_name={p.name} category={p.category_id} />
      <ScrollDepthTracker pageType="procedure" />

      <Breadcrumb
        items={[
          { name: "홈", href: ROUTES.home },
          { name: "시술 가이드", href: ROUTES.procedures },
          ...(category ? [{ name: category.name }] : []),
          { name: p.name, href: procedurePath(p.slug) },
        ]}
      />

      <ProcedureSummary
        name={p.name}
        category={category?.name}
        summary={p.summary}
        cells={cells}
        updatedLabel={updatedLabel}
        updatedIso={p.updated_at}
        authorName={author?.name}
      />

      <div className="mt-8 lg:grid lg:grid-cols-12 lg:gap-x-12">
        {/* 목차: DOM 은 본문 앞(모바일 순서), 1024px 이상은 오른쪽 열에 고정 */}
        <aside className="lg:col-span-4 lg:col-start-9 lg:row-start-1">
          <div className="lg:sticky lg:top-24">
            <GuideToc items={toc} />
          </div>
        </aside>

        <div className="mt-10 lg:col-span-8 lg:row-start-1 lg:mt-0">
          <GuideBody body={guide.body} sectionIds={guide.sections.map((s) => s.id)} />

          <ClinicPriceTable id={ANCHORS.prices} title={`${p.name} 병원별 가격 비교`} rows={priceRows} />

          <div className="mt-12">
            <ConsultCta
              location="mid"
              procedureId={p.id}
              title="이 시술 상담 가능한 병원 보기"
              benefit="원하는 지역과 시기를 남기면 상담 가능한 병원 정보를 안내해 드립니다."
            />
          </div>

          {p.faqs.length > 0 && (
            <section aria-labelledby={ANCHORS.faq} data-testid="procedure-faq" className="mt-14">
              <h2 id={ANCHORS.faq} className="text-h2 font-bold text-ink">
                자주 묻는 질문
              </h2>
              <div className="mt-5">
                <FaqAccordion procedureId={p.id} faqs={p.faqs.map(({ question, answer }) => ({ question, answer }))} />
              </div>
            </section>
          )}

          <AffiliateItems procedureId={p.id} items={p.affiliate_items} />

          <GuideMeta author={author} reviewer={reviewer} updatedLabel={updatedLabel} updatedIso={p.updated_at} sources={p.sources} />
        </div>
      </div>

      <RelatedProcedures items={related} categoryName={categoryName} />

      <div className="mt-12">
        <ConsultCta location="bottom" procedureId={p.id} />
      </div>

      <BottomBar page="procedure" procedureId={p.id} />
    </article>
  );
}
