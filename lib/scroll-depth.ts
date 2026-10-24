/**
 * scroll_depth 이벤트(5절: 25/50/75/100%) 계산 — 브라우저 의존 없는 순수 함수.
 * 사용: components/procedure/ScrollDepthTracker.tsx
 */
export const SCROLL_THRESHOLDS = [25, 50, 75, 100] as const;
export type ScrollThreshold = (typeof SCROLL_THRESHOLDS)[number];

/** 지금까지 본 문서 비율(0~100). 화면 아래 끝이 문서 끝에서 2px 안이면 100. */
export function scrollPercent(scrollTop: number, viewportHeight: number, documentHeight: number): number {
  if (documentHeight <= 0) return 100;
  const seen = scrollTop + viewportHeight;
  if (documentHeight - seen <= 2) return 100;
  return Math.max(0, Math.min(100, (seen / documentHeight) * 100));
}

/** 이번에 새로 넘은 구간(이미 보낸 구간 제외, 작은 값부터) */
export function newlyReached(percent: number, sent: ReadonlySet<number>): ScrollThreshold[] {
  return SCROLL_THRESHOLDS.filter((t) => percent >= t && !sent.has(t));
}
