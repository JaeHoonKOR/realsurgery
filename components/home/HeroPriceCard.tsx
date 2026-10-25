import { Emoji3D, categoryEmoji } from "@/components/ui/Emoji3D";
import { PriceBar } from "@/components/ui/PriceBar";
import type { Category, Clinic, Procedure } from "@/lib/content";
import { formatDate, formatDuration, formatPriceRange, formatRecovery } from "@/lib/format";
import { chip, cx } from "@/lib/ui";

type Props = {
  procedure: Procedure;
  category: Category | undefined;
  clinics: Clinic[];
};

/**
 * 메인 히어로 오른쪽 — 실제 시술 1개의 "병원별 공개가 비교"를 그대로 보여 주는 카드.
 * 서비스가 무엇을 하는지(같은 눈금 위 가격 비교)를 설명 대신 실물로 보여 준다.
 */
export function HeroPriceCard({ procedure, category, clinics }: Props) {
  const rows = clinics
    .map((c) => ({ clinic: c, offer: c.procedures.find((p) => p.procedure_id === procedure.id) }))
    .filter((r): r is { clinic: Clinic; offer: NonNullable<typeof r.offer> } => r.offer != null)
    .slice(0, 4);
  const scaleMin = procedure.price_low ?? 0;
  const scaleMax = procedure.price_high ?? scaleMin;

  return (
    <div data-testid="hero-price-card" className="relative rounded-xl bg-surface p-6 shadow-lg md:p-8">
      <div className="flex items-center gap-4">
        <span className="flex size-16 items-center justify-center rounded-lg bg-canvas">
          <Emoji3D name={categoryEmoji(procedure.category_id)} size={48} priority />
        </span>
        <div>
          {category && <span className={cx(chip.base, chip.brand, "h-7 text-xs")}>{category.name}</span>}
          <p className="mt-1 text-h3 font-bold tracking-tight text-ink">{procedure.name}</p>
        </div>
      </div>

      <p className="mt-6 text-sm font-semibold text-ink-subtle">병원 공개 가격</p>
      <p className="mt-1 text-h1 font-bold tracking-tighter text-ink tabular-nums">
        {formatPriceRange(procedure.price_low, procedure.price_high)}
      </p>

      {rows.length > 0 && (
        <ul className="mt-6 space-y-4" aria-label="병원별 공개 가격">
          {rows.map(({ clinic, offer }) => (
            <li key={clinic.id}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-semibold text-ink">{clinic.name}</span>
                <span className="shrink-0 text-ink-muted tabular-nums">{formatPriceRange(offer.price_low, offer.price_high)}</span>
              </div>
              <PriceBar
                className="mt-2"
                scaleMin={scaleMin}
                scaleMax={scaleMax}
                low={offer.price_low}
                high={offer.price_high}
                label={`${clinic.name} ${formatPriceRange(offer.price_low, offer.price_high)}`}
              />
            </li>
          ))}
        </ul>
      )}

      <dl className="mt-7 grid grid-cols-3 gap-2 text-center">
        {[
          { term: "소요시간", value: formatDuration(procedure.duration_min) },
          { term: "회복기간", value: formatRecovery(procedure.recovery_days) },
          { term: "마취", value: (procedure.anesthesia ?? "상담 후 안내").replace(/\s*\(.*\)$/, "") },
        ].map((f) => (
          <div key={f.term} className="rounded-md bg-canvas px-2 py-3">
            <dt className="text-xs text-ink-muted">{f.term}</dt>
            <dd className="mt-0.5 text-sm font-bold text-ink">{f.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs text-ink-subtle">{formatDate(procedure.updated_at)} 기준, 출처 {procedure.sources.length}곳</p>
    </div>
  );
}
