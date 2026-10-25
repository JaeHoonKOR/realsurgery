import type { Metadata } from "next";
import { withShareDefaults } from "@/lib/seo";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ConsultCta } from "@/components/common/ConsultCta";
import { ClinicExplorer } from "@/components/clinic/ClinicExplorer";
import { Emoji3D } from "@/components/ui/Emoji3D";
import { PriceBar } from "@/components/ui/PriceBar";
import { isPathBuilt } from "@/lib/built-routes";
import { weekSummary } from "@/lib/clinic/hours";
import type { ClinicCardData, ProcedureOption } from "@/lib/clinic/types";
import { latestUpdate, regionKey, regionOptions } from "@/lib/clinic/view";
import { loadContent } from "@/lib/content";
import { formatManwon, formatPriceRange } from "@/lib/format";
import { ROUTES, clinicPath } from "@/lib/routes";
import { container, cx } from "@/lib/ui";

// P-04 병원 목록·비교 (screen-spec 2절: 지역·시술 필터, 최대 3곳 비교)

const TITLE = "병원 찾기 — 지역·시술별 공개 가격 비교";
const DESCRIPTION =
  "서울 강남·서초, 경기 분당 등 지역과 쌍꺼풀·코 성형·안면윤곽 같은 시술로 병원을 골라 공개 가격과 진료 시간을 같은 기준으로 비교하세요. 최대 3곳을 담아 시술별 가격 범위를 나란히 볼 수 있습니다.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: ROUTES.clinics },
  ...withShareDefaults({ title: TITLE, description: DESCRIPTION, url: ROUTES.clinics }),
};

export default function ClinicsPage() {
  const { clinics, procedures, categories } = loadContent();
  const catById = new Map(categories.map((c) => [c.id, c]));
  const catOrder = new Map(categories.map((c) => [c.id, c.order]));

  // 시술 선택지: 병원 1곳 이상이 공개한 시술만, 부위 순서 → 데이터 순서
  const offered = new Set(clinics.flatMap((c) => c.procedures.map((o) => o.procedure_id)));
  const procedureOptions: ProcedureOption[] = procedures
    .filter((p) => offered.has(p.id))
    .sort((a, b) => (catOrder.get(a.category_id) ?? 0) - (catOrder.get(b.category_id) ?? 0))
    .map((p) => ({
      id: p.id,
      name: p.name,
      category_id: p.category_id,
      category: catById.get(p.category_id)?.name ?? "",
      price_low: p.price_low,
      price_high: p.price_high,
      price_note: p.price_note,
    }));

  const cards: ClinicCardData[] = clinics.map((c) => {
    const href = clinicPath(c.slug);
    return {
      id: c.id,
      name: c.name,
      href: isPathBuilt(href) ? href : null,
      region: c.region,
      regionKey: regionKey(c.region),
      is_demo: c.is_demo,
      is_premium: c.is_premium,
      offers: c.procedures.map(({ procedure_id, price_low, price_high, price_note }) => ({
        procedure_id,
        price_low,
        price_high,
        price_note,
      })),
      week: weekSummary(c.hours),
      updated: latestUpdate(c.procedures),
    };
  });

  const regions = regionOptions(clinics.map((c) => c.region));

  // 안내 섹션 예시: 공개 병원이 가장 많은 시술 1개의 병원별 막대
  const sampleProc = [...procedures]
    .map((p) => ({ p, n: clinics.filter((c) => c.procedures.some((o) => o.procedure_id === p.id)).length }))
    .sort((a, b) => b.n - a.n || b.p.view_count - a.p.view_count)[0];
  const sample =
    sampleProc && sampleProc.n >= 2
      ? {
          name: sampleProc.p.name,
          min: sampleProc.p.price_low ?? 0,
          max: sampleProc.p.price_high ?? sampleProc.p.price_low ?? 0,
          rows: clinics
            .map((c) => ({ c, o: c.procedures.find((o) => o.procedure_id === sampleProc.p.id) }))
            .filter((x): x is { c: (typeof clinics)[number]; o: (typeof clinics)[number]["procedures"][number] } => x.o != null)
            .slice(0, 3)
            .map(({ c, o }) => ({ name: c.name, low: o.price_low, high: o.price_high })),
        }
      : null;
  const allDemo = clinics.every((c) => c.is_demo);

  return (
    <>
      <section aria-labelledby="clinics-title" className="bg-canvas">
        <div className={cx(container, "pt-4 pb-8 md:pt-6 md:pb-10")}>
          <Breadcrumb items={[{ name: "홈", href: ROUTES.home }, { name: "병원 찾기" }]} />
          <div className="mt-6 grid gap-6 md:mt-8 md:grid-cols-12 md:items-end md:gap-10">
            <div className="md:col-span-8">
              <h1 id="clinics-title" className="text-h1 font-bold tracking-tighter text-ink">
                병원 찾기
              </h1>
              <p className="mt-3 max-w-text text-lg text-ink-muted">
                공개된 가격과 진료 시간을 같은 기준으로 비교합니다. 마음에 드는 병원을 최대 3곳까지 담아 나란히 보세요.
              </p>
            </div>
            <dl className="hidden grid-cols-3 divide-x divide-line rounded-lg bg-surface py-4 md:col-span-4 md:grid">
              <div className="px-4">
                <dt className="text-xs text-ink-subtle">병원</dt>
                <dd className="mt-1 text-lg font-bold text-ink tabular-nums">{clinics.length}곳</dd>
              </div>
              <div className="px-4">
                <dt className="text-xs text-ink-subtle">지역</dt>
                <dd className="mt-1 text-lg font-bold text-ink tabular-nums">{regions.length}곳</dd>
              </div>
              <div className="px-4">
                <dt className="text-xs text-ink-subtle">시술</dt>
                <dd className="mt-1 text-lg font-bold text-ink tabular-nums">{procedureOptions.length}개</dd>
              </div>
            </dl>
          </div>
          {allDemo && (
            <p data-testid="clinics-demo-notice" className="mt-5 inline-flex items-center gap-2 rounded-sm bg-surface px-3 py-2 text-sm text-ink-muted">
              <Emoji3D name="memo" size={24} />
              지금 보이는 병원은 모두 제휴 전 예시 데이터입니다. 실제 병원 정보가 아닙니다.
            </p>
          )}

          <div className="mt-8">
            <h2 className="sr-only">병원 목록</h2>
            <ClinicExplorer clinics={cards} procedures={procedureOptions} regions={regions} />
          </div>
        </div>
      </section>

      <section aria-labelledby="clinics-principles" className={cx(container, "py-14 md:py-20")}>
        <h2 id="clinics-principles" className="text-h2 font-bold tracking-tight text-ink">
          병원 정보는 이렇게 정리합니다
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-12">
          <div className="flex flex-col rounded-lg bg-canvas p-6 md:col-span-7 md:p-8">
            <Emoji3D name="chart" size={48} />
            <h3 className="mt-5 text-h3 font-bold tracking-tight text-ink">같은 눈금 위에서 비교합니다</h3>
            <p className="mt-2 text-ink-muted">
              막대의 양 끝은 그 시술의 전체 공개 가격 범위입니다. 병원마다 따로 그리지 않고 같은 눈금에 올려, 숫자를 읽기
              전에 위치로 가격대를 가늠할 수 있습니다.
            </p>
            {sample && (
              <div className="mt-6 rounded-md bg-surface p-5" aria-label={`예: ${sample.name} 병원별 공개 가격`}>
                <p className="text-sm font-semibold text-ink-subtle">예: {sample.name}</p>
                <ul className="mt-3 space-y-3">
                  {sample.rows.map((r) => (
                    <li key={r.name}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="truncate font-semibold text-ink">{r.name}</span>
                        <span className="shrink-0 text-ink-muted tabular-nums">{formatPriceRange(r.low, r.high)}</span>
                      </div>
                      <PriceBar
                        className="mt-1.5"
                        scaleMin={sample.min}
                        scaleMax={sample.max}
                        low={r.low}
                        high={r.high}
                        label={`${r.name} ${formatPriceRange(r.low, r.high)}`}
                      />
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex justify-between text-xs text-ink-subtle tabular-nums" aria-hidden="true">
                  <span>{formatManwon(sample.min)}</span>
                  <span>{formatManwon(sample.max)}</span>
                </div>
              </div>
            )}
          </div>
          <div className="grid gap-4 md:col-span-5">
            <div className="rounded-lg bg-canvas p-6 md:p-8">
              <Emoji3D name="calendar" size={40} />
              <h3 className="mt-4 text-lg font-bold text-ink">갱신일을 함께 적습니다</h3>
              <p className="mt-1 text-ink-muted">가격은 병원이 공개한 값을 그대로 옮기고, 병원마다 마지막 갱신일을 표시합니다.</p>
            </div>
            <div className="rounded-lg bg-canvas p-6 md:p-8">
              <Emoji3D name="shield" size={40} />
              <h3 className="mt-4 text-lg font-bold text-ink">평점으로 줄 세우지 않습니다</h3>
              <p className="mt-1 text-ink-muted">후기·평점 순위는 쓰지 않습니다. 광고(프리미엄) 병원은 표시를 붙여 구분합니다.</p>
            </div>
          </div>
        </div>
      </section>

      {isPathBuilt(ROUTES.consult) && (
        <div className={cx(container, "pb-16 md:pb-24")}>
          <ConsultCta
            location="bottom"
            title="어느 병원이 맞을지 모르겠다면"
            benefit="시술·지역·희망 시기만 남기면 상담 가이드를 정리해 영업일 기준 1일 안에 연락드립니다."
          />
        </div>
      )}
    </>
  );
}
