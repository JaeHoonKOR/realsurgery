import type { Ref } from "react";
import { cx } from "@/lib/ui";

export const STEPS = [
  { title: "관심 시술", heading: "어떤 상담이 필요하세요?" },
  { title: "연락처", heading: "연락받을 정보를 남겨 주세요" },
] as const;

/**
 * 2단계 진행 표시 — 막대 2칸 + 단계 이름. 현재 단계 제목(h2)은 단계가 바뀔 때 포커스를 받는다(headingRef).
 */
export function StepIndicator({ step, headingRef }: { step: 1 | 2; headingRef?: Ref<HTMLHeadingElement> }) {
  const current = STEPS[step - 1] as (typeof STEPS)[number];
  return (
    <div data-testid="consult-steps">
      <ol aria-label="신청 단계" className="grid grid-cols-2 gap-2">
        {STEPS.map((s, i) => {
          const n = (i + 1) as 1 | 2;
          const done = n < step;
          const active = n === step;
          return (
            <li key={s.title} aria-current={active ? "step" : undefined}>
              <span aria-hidden="true" className={cx("block h-1 rounded-full", done || active ? "bg-brand" : "bg-line")} />
              <span className={cx("mt-2 flex items-center gap-1.5 text-sm", active ? "font-bold text-ink" : "font-medium text-ink-subtle")}>
                <span className="tabular-nums">{n}</span>
                {s.title}
                {done && <span className="sr-only">(완료)</span>}
              </span>
            </li>
          );
        })}
      </ol>
      <h2 ref={headingRef} tabIndex={-1} className="mt-8 text-h2 font-bold tracking-tight text-ink focus:outline-none">
        <span className="sr-only">
          {step}단계 / 2단계,{" "}
        </span>
        {current.heading}
      </h2>
    </div>
  );
}
