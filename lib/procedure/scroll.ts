/**
 * scroll_depth (5절: 25/50/75/100%) — 브라우저 없이 검증할 수 있게 계산만 분리.
 */

export const SCROLL_THRESHOLDS = [25, 50, 75, 100] as const;
export type ScrollThreshold = (typeof SCROLL_THRESHOLDS)[number];

/** 문서 기준 스크롤 비율(0~100). 화면 아래 끝이 문서 끝에서 2px 안이면 100으로 본다(소수점 오차). */
export function scrollPercent(scrollY: number, viewportHeight: number, documentHeight: number): number {
  if (documentHeight <= 0) return 100;
  const bottom = scrollY + viewportHeight;
  if (bottom >= documentHeight - 2) return 100;
  return Math.max(0, Math.min(100, (bottom / documentHeight) * 100));
}

/** 이번에 새로 넘은 기준값(이미 보낸 값은 제외, 작은 값부터) */
export function newThresholds(percent: number, sent: ReadonlySet<number>): ScrollThreshold[] {
  return SCROLL_THRESHOLDS.filter((t) => percent >= t && !sent.has(t));
}
