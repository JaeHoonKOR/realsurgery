/**
 * 헤더 검색 자동완성 (screen-spec 3절: "검색은 시술명 자동완성(최대 5개)")
 * 순수 함수 — 클라이언트·서버 어디서나 쓴다.
 */

export const MAX_SUGGESTIONS = 5;

export type Suggestible = { name: string; category?: string };

/** 비교용 정규화: 유니코드 NFC, 공백 제거, 소문자 */
export function normalizeQuery(text: string): string {
  return text.normalize("NFC").replace(/\s+/g, "").toLowerCase();
}

/**
 * 시술명에 검색어가 들어 있는 항목을 최대 limit 개 돌려준다.
 * 순위: 시술명이 검색어로 시작 → 시술명 중간 일치 → 부위(카테고리)명 일치. 같은 순위는 짧은 이름 먼저.
 */
export function suggest<T extends Suggestible>(query: string, items: readonly T[], limit: number = MAX_SUGGESTIONS): T[] {
  const q = normalizeQuery(query);
  if (!q || limit <= 0) return [];
  const ranked: { item: T; rank: number; index: number }[] = [];
  items.forEach((item, index) => {
    const name = normalizeQuery(item.name);
    const at = name.indexOf(q);
    let rank = -1;
    if (at === 0) rank = 0;
    else if (at > 0) rank = 1;
    else if (item.category && normalizeQuery(item.category).includes(q)) rank = 2;
    if (rank >= 0) ranked.push({ item, rank, index });
  });
  ranked.sort((a, b) => a.rank - b.rank || a.item.name.length - b.item.name.length || a.index - b.index);
  return ranked.slice(0, limit).map((r) => r.item);
}
