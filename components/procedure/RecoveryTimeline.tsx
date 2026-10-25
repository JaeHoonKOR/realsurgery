import type { ProcedureExtras } from "@/lib/content";

/**
 * 회복 타임라인 — 시간 순서가 있는 단계라 세로 스테퍼로 보여 준다(extras.timeline). 본문 "회복은 며칠" 섹션 직답 바로 아래.
 */
export function RecoveryTimeline({ name, timeline }: { name: string; timeline: ProcedureExtras["timeline"] }) {
  if (timeline.length === 0) return null;
  const last = timeline.length - 1;
  return (
    <div data-testid="recovery-timeline" className="rounded-xl bg-canvas p-5 md:p-7">
      <h3 className="text-h3 font-bold tracking-tight text-ink">{name} 회복 일정 한눈에 보기</h3>
      <ol className="mt-6">
        {timeline.map((step, i) => (
          <li key={`${step.day}-${step.label}`} className="relative flex gap-4 pb-6 last:pb-0 md:gap-5">
            {i < last && <span aria-hidden="true" className="absolute top-5 bottom-0 left-2.5 w-0.5 -translate-x-1/2 bg-line-strong" />}
            <span aria-hidden="true" className="relative mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-surface ring-2 ring-brand">
              <span className={i === 0 ? "size-2 rounded-full bg-brand" : "size-2 rounded-full bg-line-strong"} />
            </span>
            <div className="min-w-0 flex-1 md:flex md:gap-6">
              <p className="shrink-0 font-bold text-ink tabular-nums md:w-20">{step.day}</p>
              <div className="min-w-0">
                <p className="font-semibold text-ink">{step.label}</p>
                <p className="mt-0.5 text-ink-muted">{step.detail}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
