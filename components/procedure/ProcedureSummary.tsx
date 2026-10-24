import { CalendarClock, Clock, HeartPulse, Wallet } from "lucide-react";
import { UNVERIFIED_LABEL, type SummaryCell } from "@/lib/procedure";

const ICON = { price: Wallet, duration: Clock, recovery: CalendarClock, anesthesia: HeartPulse } as const;

/**
 * 상단 요약 박스 (4절 P-03: 시술명 H1, 직답 요약, 가격 범위·소요시간·회복기간·마취 방식 4칸)
 * 4칸 값은 lib/procedure summaryCells — JSON-LD(howPerformed·followup·description)와 같은 문자열.
 * 출처로 확인 못 한 칸(프런트매터 unverified_facts)은 값 아래 "출처 검증 전"(JSON-LD 에도 같은 단서, scripts/check-triple.mjs 검사).
 * AEO: 첫 문단 = 직답 2~3문장(summary).
 */
export function ProcedureSummary({
  name,
  category,
  summary,
  cells,
  updatedLabel,
  updatedIso,
  authorName,
}: {
  name: string;
  category: string | undefined;
  summary: string;
  cells: SummaryCell[];
  updatedLabel: string;
  updatedIso: string;
  authorName: string | undefined;
}) {
  return (
    <header data-testid="procedure-summary" className="mt-4">
      {category && <p className="text-sm font-semibold text-brand">{category} 시술 가이드</p>}
      <h1 className="mt-2 text-h1 font-bold text-ink">{name}</h1>
      <p className="mt-3 text-sm text-ink-muted">
        최종 수정일 <time dateTime={updatedIso}>{updatedLabel}</time>
        {authorName && <> · 작성 {authorName}</>}
      </p>
      <div className="mt-6 rounded-lg border border-line bg-surface p-5 shadow-sm md:p-8">
        <p data-testid="procedure-answer" className="max-w-text text-ink">
          {summary}
        </p>
        <dl data-testid="procedure-facts" className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {cells.map((c) => {
            const Icon = ICON[c.key];
            return (
              <div
                key={c.key}
                data-fact={c.key}
                {...(c.unverified ? { "data-fact-unverified": "" } : {})}
                className="rounded-sm bg-canvas px-4 py-3"
              >
                <dt className="flex items-center gap-1 text-sm text-ink-muted">
                  <Icon aria-hidden="true" className="size-4 text-brand" />
                  {c.label}
                </dt>
                <dd className="mt-1 font-bold text-ink">
                  <span data-fact-value="">{c.value}</span>
                  {c.note && <span className="mt-1 block text-sm font-normal text-ink-muted">{c.note}</span>}
                  {c.unverified && <span className="mt-1 block text-sm font-normal text-ink-muted">{UNVERIFIED_LABEL}</span>}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </header>
  );
}
