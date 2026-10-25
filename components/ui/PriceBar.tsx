import type { CSSProperties } from "react";
import { formatManwon, percentOnScale } from "@/lib/format";
import { cx } from "@/lib/ui";

type Props = {
  /** 눈금 양 끝(원) — 같은 시술의 전체 공개 가격 범위 */
  scaleMin: number;
  scaleMax: number;
  /** 이 막대가 나타내는 범위(원) */
  low: number | null;
  high: number | null;
  /** 눈금 양 끝 숫자를 아래에 표시 */
  showScale?: boolean;
  /** 강조(선택된 병원 등) */
  emphasis?: boolean;
  /** 스크린리더용 설명 */
  label: string;
  className?: string;
};

/**
 * 가격 범위 바 — 리얼성형의 시그니처 시각 요소.
 * 같은 눈금(시술 전체 공개가 범위) 위에 병원·방식별 범위를 막대로 올려, 숫자를 읽기 전에 위치로 비교하게 한다.
 * 위치값은 CSS 변수(--lo·--w)로 넘긴다(인라인 길이 값 금지 규칙).
 */
export function PriceBar({ scaleMin, scaleMax, low, high, showScale, emphasis, label, className }: Props) {
  const lo = low ?? high;
  const hi = high ?? low;
  const hasRange = lo != null && hi != null;
  const left = hasRange ? percentOnScale(lo, scaleMin, scaleMax) : 0;
  const right = hasRange ? percentOnScale(hi, scaleMin, scaleMax) : 0;
  // 최소 폭 2%: 단일 가격도 점처럼 보이게
  const width = Math.max(2, right - left);
  const vars = { "--lo": `${Math.min(left, 98)}%`, "--w": `${width}%` } as CSSProperties;

  return (
    <div className={className}>
      <div role="img" aria-label={label} className="relative h-2.5 rounded-full bg-canvas" style={vars}>
        {hasRange && (
          <span
            className={cx(
              "absolute inset-y-0 left-(--lo) w-(--w) rounded-full",
              emphasis ? "bg-brand-strong" : "bg-brand",
            )}
          />
        )}
      </div>
      {showScale && (
        <div className="mt-2 flex justify-between text-xs text-ink-subtle tabular-nums" aria-hidden="true">
          <span>{formatManwon(scaleMin)}</span>
          <span>{formatManwon(scaleMax)}</span>
        </div>
      )}
    </div>
  );
}
