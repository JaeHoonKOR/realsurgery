/**
 * 병원 비교 담기 (2절 P-04 "최대 3곳 비교") — 상태 전이를 순수 리듀서로 둔다.
 * 4번째를 담으려 하면 목록은 그대로 두고 blocked 로 어느 병원에서 막혔는지 알려 준다(그 카드 아래 안내 문구).
 * 필터로 목록에서 사라진 병원도 비교함에는 남는다(필터와 비교는 서로 독립).
 */

export const MAX_COMPARE = 3;
/** 비교 표를 열 수 있는 최소 병원 수 */
export const MIN_COMPARE = 2;

export type CompareState = {
  ids: string[];
  /** 한도 초과로 담지 못한 병원 id(안내 문구 표시용). 다른 동작을 하면 지워진다 */
  blocked: string | null;
};

export type CompareAction =
  | { type: "toggle"; id: string }
  | { type: "remove"; id: string }
  | { type: "clear" }
  | { type: "dismiss" };

export const INITIAL_COMPARE: CompareState = { ids: [], blocked: null };

export function compareReducer(state: CompareState, action: CompareAction): CompareState {
  switch (action.type) {
    case "toggle": {
      if (state.ids.includes(action.id)) return { ids: state.ids.filter((x) => x !== action.id), blocked: null };
      if (state.ids.length >= MAX_COMPARE) return { ...state, blocked: action.id };
      return { ids: [...state.ids, action.id], blocked: null };
    }
    case "remove":
      return { ids: state.ids.filter((x) => x !== action.id), blocked: null };
    case "clear":
      return INITIAL_COMPARE;
    case "dismiss":
      return state.blocked ? { ...state, blocked: null } : state;
  }
}

export function canCompare(state: CompareState): boolean {
  return state.ids.length >= MIN_COMPARE;
}

/**
 * 비교 표 한 행(시술)에서 시작가가 가장 낮은 병원 id. 두 곳 이상이 가격을 공개했을 때만 표시한다(혼자면 비교가 아님).
 * 동점이면 표시하지 않는다.
 */
export function lowestStart(cells: readonly { id: string; price_low: number | null }[]): string | null {
  const priced = cells.filter((c): c is { id: string; price_low: number } => c.price_low != null);
  if (priced.length < 2) return null;
  const min = Math.min(...priced.map((c) => c.price_low));
  const winners = priced.filter((c) => c.price_low === min);
  return winners.length === 1 ? winners[0]!.id : null;
}

/** 비교 표의 행: 선택한 병원 중 한 곳이라도 공개한 시술(시술 데이터 순서) */
export function compareRows<P extends { id: string }>(
  procedures: readonly P[],
  clinics: readonly { offers: readonly { procedure_id: string }[] }[],
): P[] {
  return procedures.filter((p) => clinics.some((c) => c.offers.some((o) => o.procedure_id === p.id)));
}
