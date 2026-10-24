// 시술 수치 표기 — 요약 박스·JSON-LD·FAQ 검사·MDX 린트가 같은 문자열을 쓰도록 한 곳에 둔다
// (screen-spec 4절 P-03 "요약 박스 = FAQPage·MedicalProcedure JSON-LD와 동일 값").
// Node 스크립트(scripts/*.mjs)와 앱(TS, lib/format.d.mts 타입)이 함께 import 한다. 회귀 테스트: tests/unit/format.test.ts

/** 원 단위 금액 → "50만", "1,200만", "12,500" (만 원 단위로 떨어질 때만 "만") */
export function formatWon(n) {
  if (!Number.isFinite(n)) return "";
  if (n >= 10000 && n % 10000 === 0) return `${(n / 10000).toLocaleString("ko-KR")}만`;
  return n.toLocaleString("ko-KR");
}

/** 가격 범위 → "50만~250만 원". 값이 하나도 없으면 null(화면은 "병원 상담 후 안내"). */
export function formatPriceRange(low, high) {
  const hasLow = Number.isFinite(low);
  const hasHigh = Number.isFinite(high);
  if (!hasLow && !hasHigh) return null;
  if (hasLow && hasHigh) return low === high ? `${formatWon(low)} 원` : `${formatWon(low)}~${formatWon(high)} 원`;
  return hasLow ? `${formatWon(low)} 원부터` : `최대 ${formatWon(high)} 원`;
}

/** 소요시간(분) → "약 40분", "약 1시간", "약 2시간 30분" */
export function formatDuration(min) {
  if (!Number.isFinite(min)) return null;
  if (min < 60) return `약 ${min}분`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `약 ${h}시간 ${m}분` : `약 ${h}시간`;
}

/** 회복기간(일) → "당일 복귀", "약 7일", "약 2주"(2주 이상이고 주 단위로 떨어질 때) */
export function formatRecovery(days) {
  if (!Number.isFinite(days)) return null;
  if (days === 0) return "당일 복귀";
  if (days >= 14 && days % 7 === 0) return `약 ${days / 7}주`;
  return `약 ${days}일`;
}

/**
 * P-03 title (6절): "{시술명} 가격·회복기간·부작용 총정리 (2026)". 레이아웃 템플릿이 " | 리얼성형" 을 붙인다.
 * 연도는 최종 수정일(updated_at)의 연도.
 */
export function procedureTitle(name, updatedAt) {
  const year = typeof updatedAt === "string" ? updatedAt.slice(0, 4) : "";
  return `${name} 가격·회복기간·부작용 총정리${year ? ` (${year})` : ""}`;
}

/** 날짜 "2026-10-24" → "2026.10.24" */
export function formatDate(iso) {
  return typeof iso === "string" ? iso.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$1.$2.$3") : "";
}
