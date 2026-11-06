/**
 * 가격 막대 차트(components/charts/PriceRangeChart) 눈금·표기.
 * 가격은 원 단위 정수로 받고 "만 원"으로 보여 준다. null 은 "가격 미정"(QUALITY 2절 경계값).
 */

export type PriceRange = { min: number | null; max: number | null };

/** 700000 → "70만", 15000 → "1.5만", 40000 → "4만", 125000000 → "1억 2,500만" */
export function formatManwon(won: number): string {
  const man = won / 10_000;
  // 만 단위로 먼저 반올림한 뒤 억/만을 나눈다(반올림 올림이 억 자리로 넘어가야 "1억 10,000만" 같은 표기가 안 생긴다)
  const rounded = man >= 10 ? Math.round(man) : Math.round(man * 10) / 10;
  if (rounded >= 10_000) {
    const eok = Math.floor(rounded / 10_000);
    const rest = rounded % 10_000;
    return rest ? `${eok}억 ${rest.toLocaleString("ko-KR")}만` : `${eok}억`;
  }
  return `${rounded.toLocaleString("ko-KR")}만`;
}

/** 범위 문구: "70만~220만 원", 한쪽만 있으면 "70만 원부터"/"220만 원까지", 둘 다 없으면 "가격 미정" */
export function formatRange({ min, max }: PriceRange): string {
  if (min == null && max == null) return "가격 미정";
  if (min != null && max != null) return min === max ? `${formatManwon(min)} 원` : `${formatManwon(min)}~${formatManwon(max)} 원`;
  if (min != null) return `${formatManwon(min)} 원부터`;
  return `${formatManwon(max as number)} 원까지`;
}

/** 0 부터 시작하는 보기 좋은 눈금(1·2·2.5·5 × 10^n 간격, 4칸 내외) */
export function niceTicks(maxValue: number, target = 4): number[] {
  if (!(maxValue > 0)) return [0];
  const raw = maxValue / target;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? 10 * pow;
  const ticks: number[] = [];
  for (let v = 0; v < maxValue + step * 0.999; v += step) ticks.push(Math.round(v));
  return ticks;
}

/** 항목들의 최댓값(null 제외) */
export function maxOf(items: readonly PriceRange[]): number {
  let m = 0;
  for (const it of items) {
    for (const v of [it.min, it.max]) if (v != null && v > m) m = v;
  }
  return m;
}
