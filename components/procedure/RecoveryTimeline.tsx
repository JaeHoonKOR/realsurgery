import type { ProcedureExtras } from "@/lib/content";

/**
 * 회복 타임라인 — 시간 순서가 있는 단계라 세로 스테퍼로 보여 준다(extras.timeline). 본문 "회복은 며칠" 섹션 직답 바로 아래.
 * 같은 내용의 본문 시기별 표는 이 타임라인이 있으면 빼므로(lib/procedure/sections) 시기·상태·생활 가이드를 모두 여기서 읽는다.
 * 모바일은 "시기 + 상태"를 한 줄로, 데스크톱은 시기를 왼쪽 열(w-20)로 둔다.
 */
export function RecoveryTimeline({ name, timeline }: { name: string; timeline: ProcedureExtras["timeline"] }) {
  if (timeline.length === 0) return null;
  const last = timeline.length - 1;
  return (
    <div data-testid="recovery-timeline" className="rounded-xl bg-canvas p-4 md:p-7">
      <h3 className="text-h3 font-bold tracking-tight text-ink">{name} 회복 일정 한눈에 보기</h3>
      <ol className="mt-5 md:mt-6">
        {timeline.map((step, i) => (
          <li key={`${step.day}-${step.label}`} className="relative flex gap-4 pb-4 last:pb-0 md:gap-5 md:pb-6">
            {i < last && <span aria-hidden="true" className="absolute top-5 bottom-0 left-2.5 w-0.5 -translate-x-1/2 bg-line-strong" />}
            <span aria-hidden="true" className="relative mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-surface ring-2 ring-brand">
              <span className={i === 0 ? "size-2 rounded-full bg-brand" : "size-2 rounded-full bg-line-strong"} />
            </span>
            {/* 줄바꿈 flex: 시기·상태가 첫 줄, 설명은 basis-full 로 다음 줄. 데스크톱은 설명을 시기 열(w-20 + gap-6 = pl-26)만큼 들인다 */}
            <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 md:gap-x-6">
              <p className="shrink-0 font-bold text-ink tabular-nums md:w-20">{step.day}</p>
              <p className="min-w-0 flex-1 font-semibold text-ink">{step.label}</p>
              <p className="mt-0.5 basis-full text-sm text-ink-muted md:pl-26 md:text-base">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
