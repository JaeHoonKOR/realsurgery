import type { Metadata } from "next";
import { withShareDefaults } from "@/lib/seo";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ConsultCta } from "@/components/common/ConsultCta";
import { CategoryChips } from "@/components/procedure/CategoryChips";
import { ProcedureCard } from "@/components/procedure/ProcedureCard";
import { Emoji3D, categoryEmoji } from "@/components/ui/Emoji3D";
import { isPathBuilt } from "@/lib/built-routes";
import { loadContent } from "@/lib/content";
import { siteUrl } from "@/lib/env.public";
import { jsonLdString, procedureListJsonLd } from "@/lib/procedure/jsonld";
import { PROCEDURES_TITLE, groupByCategory, proceduresDescription } from "@/lib/procedure/list";
import { clinicCountByProcedure } from "@/lib/procedure/prices";
import { ROUTES } from "@/lib/routes";
import { container, cx } from "@/lib/ui";

// P-02 시술 카테고리 목록 (screen-spec 2절: /procedures, 부위별 시술 탐색)

/** "2026-10-24" → "10월 24일" (좁은 통계 칸용) */
function shortDate(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split("-");
  return `${Number(m)}월 ${Number(d)}일`;
}

function description() {
  const { categories, procedures } = loadContent();
  return proceduresDescription(categories, procedures.length);
}

export function generateMetadata(): Metadata {
  const desc = description();
  return {
    title: PROCEDURES_TITLE,
    description: desc,
    alternates: { canonical: "./" },
    ...withShareDefaults({ url: "./", title: PROCEDURES_TITLE, description: desc }),
  };
}

export default function ProceduresPage() {
  const content = loadContent();
  const groups = groupByCategory(content.categories, content.procedures);
  const counts = clinicCountByProcedure(content.clinics);
  const latest = content.procedures.reduce((max, p) => (p.updated_at > max ? p.updated_at : max), "");
  const ordered = groups.flatMap((g) => g.procedures);
  const jsonLd = jsonLdString(
    procedureListJsonLd({ procedures: ordered, base: siteUrl(), name: PROCEDURES_TITLE, description: description(), path: ROUTES.procedures }),
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <div className={cx(container, "pt-4 md:pt-6")}>
        <Breadcrumb items={[{ name: "홈", href: ROUTES.home }, { name: "시술 가이드" }]} />
      </div>

      <section aria-labelledby="procedures-title" data-testid="procedures-intro" className={cx(container, "pt-6 pb-10 md:pt-8 md:pb-14")}>
        <div className="md:flex md:items-end md:justify-between md:gap-10">
          <div>
            <h1 id="procedures-title" className="text-h1 font-bold tracking-tighter text-ink md:text-display">
              시술 가이드
            </h1>
            <p className="mt-4 max-w-text text-lg text-ink-muted">
              부위별 시술 {content.procedures.length}개의 가격 범위와 소요시간, 회복기간을 같은 기준으로 정리했습니다. 가격은 병원
              공개가, 회복기간과 부작용은 학회·의료기관 자료를 근거로 합니다.
            </p>
          </div>
          <dl className="mt-8 grid shrink-0 grid-cols-3 gap-2 md:mt-0">
            {[
              { term: "시술 가이드", value: `${content.procedures.length}개` },
              { term: "공개 가격 병원", value: `${content.clinics.length}곳` },
              { term: "최종 수정", value: latest ? shortDate(latest) : "-" },
            ].map((s) => (
              <div key={s.term} className="rounded-lg bg-canvas px-3 py-3 md:min-w-32 md:px-4">
                <dt className="text-xs text-ink-muted">{s.term}</dt>
                <dd className="mt-0.5 text-base font-bold text-ink tabular-nums md:text-lg">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <CategoryChips
        items={groups.map((g) => ({
          id: g.category.id,
          slug: g.category.slug,
          name: g.category.name,
          count: g.procedures.length,
          emoji: categoryEmoji(g.category.id),
        }))}
      />

      <div className="bg-canvas py-12 md:py-16">
        <div className={cx(container, "space-y-14 md:space-y-20")}>
          {groups.map(({ category, procedures, priceRange }) => (
            <section
              key={category.id}
              id={category.slug}
              aria-labelledby={`category-${category.id}`}
              data-testid="category-section"
              className="scroll-mt-20 lg:grid lg:grid-cols-12 lg:gap-10"
            >
              <div className="flex items-center gap-4 lg:col-span-4 lg:flex-col lg:items-start lg:pt-2">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-surface lg:size-16">
                  <Emoji3D name={categoryEmoji(category.id)} size={40} />
                </span>
                <div>
                  <h2 id={`category-${category.id}`} className="text-h2 font-bold tracking-tight text-ink">
                    {category.name}
                  </h2>
                  <p className="text-sm text-ink-muted tabular-nums lg:mt-1 lg:text-base">
                    시술 {procedures.length}개
                    {priceRange && (
                      <>
                        <span className="lg:hidden">, </span>
                        <span className="lg:block">공개 가격 {priceRange}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              {procedures.length > 0 ? (
                <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:col-span-8 lg:mt-0">
                  {procedures.map((p) => (
                    <li key={p.id}>
                      <ProcedureCard procedure={p} clinicCount={counts.get(p.id)} fromPage="procedures" showEmoji={false} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-6 rounded-lg bg-surface p-6 text-ink-muted lg:col-span-8 lg:mt-0">
                  이 부위 가이드는 출처 확인을 마치는 대로 올립니다.
                </p>
              )}
            </section>
          ))}
        </div>
      </div>

      {isPathBuilt(ROUTES.consult) && (
        <div className={cx(container, "py-14 md:py-20")}>
          <ConsultCta
            location="bottom"
            title="어떤 시술이 맞을지 고민된다면"
            benefit="고민 부위와 희망 시기만 남기면 가격대와 회복 일정을 정리해 드립니다. 신청 비용은 들지 않습니다."
          />
        </div>
      )}
    </>
  );
}
