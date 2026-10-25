import { ChevronRight } from "lucide-react";
import { TrackedLink } from "@/components/common/TrackedLink";
import { Icon3D, categoryIcon } from "@/components/ui/Icon3D";
import { PriceBar } from "@/components/ui/PriceBar";
import { isPathBuilt } from "@/lib/built-routes";
import { procedureScale } from "@/lib/clinic/view";
import type { Category, ClinicProcedure, Procedure } from "@/lib/content";
import { formatDate, formatDuration, formatPriceRange, formatRecovery } from "@/lib/format";
import { procedurePath } from "@/lib/routes";
import { chip, cx } from "@/lib/ui";

type Row = { offer: ClinicProcedure; procedure: Procedure; category: Category | undefined };

type Props = {
  clinicName: string;
  rows: Row[];
  /** 모든 행의 갱신일이 같으면 섹션 머리에만 표시하고, 다르면 행마다 표시한다 */
  sharedUpdate: string | null;
};

/**
 * P-05 시술 가격표 — 시술마다 이 병원 공개가 + "시술 전체 공개가" 눈금 위 위치(PriceBar).
 * 같은 눈금이라 병원끼리·시술끼리 숫자를 읽기 전에 위치로 비교된다.
 */
export function ClinicPriceList({ clinicName, rows, sharedUpdate }: Props) {
  return (
    <div className="rounded-lg bg-surface px-5 md:px-8">
      <div
        aria-hidden="true"
        className="hidden grid-cols-12 gap-8 border-b border-line py-4 text-sm font-semibold text-ink-subtle md:grid"
      >
        <span className="col-span-4">시술</span>
        <span className="col-span-3">이 병원 공개 가격</span>
        <span className="col-span-5">시술 전체 공개 가격 대비</span>
      </div>
      <ul data-testid="clinic-prices" className="divide-y divide-line">
        {rows.map(({ offer, procedure, category }) => {
          const href = procedurePath(procedure.slug);
          const linked = isPathBuilt(href);
          const scale = procedureScale(procedure, { low: offer.price_low, high: offer.price_high });
          const price = formatPriceRange(offer.price_low, offer.price_high);
          const note = offer.price_note ?? procedure.price_note;
          return (
            <li key={offer.procedure_id} data-procedure={procedure.id} className="py-6 md:grid md:grid-cols-12 md:items-center md:gap-8">
              <div className="flex items-start gap-4 md:col-span-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-canvas">
                  <Icon3D name={categoryIcon(procedure.category_id)} size={32} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className="text-lg font-bold tracking-tight text-ink">
                      {linked ? (
                        <TrackedLink
                          href={href}
                          event="select_procedure"
                          params={{ procedure_id: procedure.id, from_page: "clinic" }}
                          className="-my-2 inline-flex min-h-11 items-center gap-0.5 hover:text-brand-strong"
                        >
                          {procedure.name}
                          <ChevronRight aria-hidden="true" className="size-4 text-ink-faint" />
                        </TrackedLink>
                      ) : (
                        procedure.name
                      )}
                    </h3>
                    {category && <span className={cx(chip.base, chip.neutral, "h-6 px-2 text-xs")}>{category.name}</span>}
                  </div>
                  <dl className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm">
                    <div className="flex gap-1.5">
                      <dt className="text-ink-subtle">소요</dt>
                      <dd className="font-semibold text-ink-muted">{formatDuration(offer.duration_min ?? procedure.duration_min)}</dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt className="text-ink-subtle">회복</dt>
                      <dd className="font-semibold text-ink-muted">{formatRecovery(procedure.recovery_days)}</dd>
                    </div>
                    {!sharedUpdate && (
                      <div className="flex gap-1.5">
                        <dt className="text-ink-subtle">갱신</dt>
                        <dd className="font-semibold text-ink-muted tabular-nums">{formatDate(offer.price_updated_at)}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              <p className="mt-4 md:col-span-3 md:mt-0">
                <span className="text-h3 font-bold tracking-tight text-ink tabular-nums">{price}</span>
                {note && <span className="ml-1.5 text-sm font-medium text-ink-subtle">{note}</span>}
              </p>

              <div className="mt-3 md:col-span-5 md:mt-0">
                <PriceBar
                  scaleMin={scale.min}
                  scaleMax={scale.max}
                  low={offer.price_low}
                  high={offer.price_high}
                  showScale
                  label={`${clinicName} ${procedure.name} ${price}, 전체 공개 가격 ${formatPriceRange(scale.min, scale.max)} 중`}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
