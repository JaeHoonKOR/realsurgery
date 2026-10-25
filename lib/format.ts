/**
 * 화면 표기 포맷 — 가격·기간. 모든 화면이 같은 표기를 쓰도록 한 곳에 둔다.
 * 가격: 50만 / 1,200만 / 3만 5천 → "50만~250만 원". 값이 없으면 "상담 후 안내".
 */

const nf = new Intl.NumberFormat("ko-KR");

/** 원 단위 금액 → "50만", "1,200만", "3만 5천", "9천" */
export function formatManwon(won: number): string {
  if (won >= 10000) {
    const man = Math.floor(won / 10000);
    const rest = Math.round((won % 10000) / 1000);
    return rest > 0 && man < 100 ? `${nf.format(man)}만 ${rest}천` : `${nf.format(man)}만`;
  }
  if (won >= 1000) return `${Math.round(won / 1000)}천`;
  return nf.format(won);
}

/** 가격 범위 → "50만~250만 원" / "50만 원부터" / "상담 후 안내" */
export function formatPriceRange(low: number | null, high: number | null): string {
  if (low == null && high == null) return "상담 후 안내";
  if (low != null && high != null) {
    return low === high ? `${formatManwon(low)} 원` : `${formatManwon(low)}~${formatManwon(high)} 원`;
  }
  if (low != null) return `${formatManwon(low)} 원부터`;
  return `최대 ${formatManwon(high as number)} 원`;
}

/** 원 단위 전체 표기 → "500,000원" (JSON-LD·표 보조용) */
export function formatWon(won: number): string {
  return `${nf.format(won)}원`;
}

/** 회복기간(일) → "당일 일상 가능" / "약 7일" / "약 4주" */
export function formatRecovery(days: number | null): string {
  if (days == null) return "개인차 있음";
  if (days === 0) return "당일 일상 가능";
  if (days >= 28 && days % 7 === 0) return `약 ${days / 7}주`;
  return `약 ${days}일`;
}

/** 소요시간(분) → "약 30분" / "약 1시간" / "약 1시간 30분" */
export function formatDuration(min: number | null): string {
  if (min == null) return "상담 후 안내";
  if (min < 60) return `약 ${min}분`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `약 ${h}시간 ${m}분` : `약 ${h}시간`;
}

/** ISO 날짜 → "2026.10.24" */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${y}.${m}.${d}`;
}

/** 값이 눈금(min~max) 위 몇 % 지점인지 (0~100, 범위 밖은 잘라냄) */
export function percentOnScale(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}
