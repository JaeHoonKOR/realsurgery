import { MapPin } from "lucide-react";
import { TrackedLink } from "@/components/common/TrackedLink";
import { Emoji3D } from "@/components/ui/Emoji3D";
import { PriceBar } from "@/components/ui/PriceBar";
import { isPathBuilt } from "@/lib/built-routes";
import type { Procedure } from "@/lib/content";
import { formatDate, formatPriceRange } from "@/lib/format";
import type { PriceComparison as Comparison } from "@/lib/procedure/prices";
import { PAGE_SECTION_IDS } from "@/lib/procedure/toc";
import { clinicPath } from "@/lib/routes";
import { chip, cx } from "@/lib/ui";

type Props = { procedure: Procedure; comparison: Comparison };

/**
 * 병원별 공개 가격 비교 (4절 P-03 "가격 비교 표": 병원별 최저~최고가 5곳, 병원명 클릭 → P-05 select_clinic from=procedure).
 * 모든 막대는 같은 눈금(이 시술 전체 공개가 범위) 위에 놓는다 — 숫자를 읽기 전에 위치로 비교.
 * "예시 데이터" 표기: 일부 병원만 예시면 해당 행마다, 전부 예시면 제목 옆에 한 번(행마다 같은 칩이 반복돼 줄이 늘지 않게).
 */
export function PriceComparison({ procedure: p, comparison }: Props) {
  const { rows, total, scaleMin, scaleMax } = comparison;
  const hasDemo = rows.some((r) => r.clinic.is_demo);
  const allDemo = rows.length > 0 && rows.every((r) => r.clinic.is_demo);
  return (
    <section id={PAGE_SECTION_IDS.prices} aria-labelledby="prices-title" data-testid="price-comparison" className="scroll-mt-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 id="prices-title" className="text-h2 font-bold tracking-tight text-ink">
          병원별 공개 가격 비교
        </h2>
        {total > 0 && allDemo && (
          <span data-testid="price-demo-label" className={cx(chip.base, chip.outline, "h-7 px-2.5 text-xs")}>
            예시 데이터
          </span>
        )}
      </div>
      {total > 0 ? (
        <>
          <p className="mt-2 text-ink-muted">
            병원 {total}곳이 공개한 {p.name} 가격을 같은 눈금 위에 놓았습니다.
            {total > rows.length && ` 최저가가 낮은 ${rows.length}곳을 보여 드립니다.`} 순서는 공개 최저가 기준이며 광고와
            무관합니다.
          </p>
          <ol className="mt-6 space-y-2 rounded-xl bg-canvas p-2 md:p-3" aria-label={`${p.name} 병원별 공개 가격`}>
            {rows.map(({ clinic, offer }, i) => {
              const range = formatPriceRange(offer.price_low, offer.price_high);
              const href = clinicPath(clinic.slug);
              const linked = isPathBuilt(href);
              const inner = (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-bold text-ink">{clinic.name}</span>
                        {clinic.is_demo && !allDemo && (
                          <span className={cx(chip.base, chip.outline, "h-6 px-2 text-xs")}>예시 데이터</span>
                        )}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-sm text-ink-muted">
                        <MapPin aria-hidden="true" className="size-4 shrink-0" />
                        {clinic.region}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-bold text-ink tabular-nums">
                        {range}
                        {offer.price_note && <span className="ml-1 text-xs font-medium text-ink-subtle">{offer.price_note}</span>}
                      </p>
                      <p className="mt-1 text-xs text-ink-subtle tabular-nums">
                        <time dateTime={offer.price_updated_at}>{formatDate(offer.price_updated_at)}</time> 기준
                      </p>
                    </div>
                  </div>
                  <PriceBar
                    className="mt-3 md:mt-4"
                    scaleMin={scaleMin}
                    scaleMax={scaleMax}
                    low={offer.price_low}
                    high={offer.price_high}
                    showScale={i === 0}
                    label={`${clinic.name} ${range}`}
                  />
                </>
              );
              const rowClass = "block rounded-lg bg-surface px-4 py-3.5 md:px-6 md:py-5";
              return (
                <li key={clinic.id} data-testid="price-row">
                  {linked ? (
                    <TrackedLink
                      href={href}
                      event="select_clinic"
                      params={{ clinic_id: clinic.id, from: "procedure" }}
                      className={cx(rowClass, "transition-shadow hover:shadow-lg")}
                    >
                      {inner}
                    </TrackedLink>
                  ) : (
                    <div className={rowClass}>{inner}</div>
                  )}
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-sm text-ink-subtle">
            병원이 공개한 가격을 옮긴 것으로, 실제 비용은 진찰과 상담 후 정해집니다.
            {hasDemo && " 예시 데이터는 제휴 전 화면 구성을 보여 드리기 위한 가상의 병원입니다."}
          </p>
        </>
      ) : (
        <div data-testid="price-empty" className="mt-6 flex flex-col items-start gap-4 rounded-xl bg-canvas-soft p-6 md:flex-row md:items-center md:p-8">
          <Emoji3D name="hospital" size={48} />
          <div>
            <p className="font-bold text-ink">아직 병원 공개 가격을 모으지 못했습니다</p>
            <p className="mt-1 text-ink-muted">
              전체 공개 가격대는 {formatPriceRange(p.price_low, p.price_high)}입니다. 병원 정보가 확인되는 대로 이곳에 비교해
              드립니다.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
