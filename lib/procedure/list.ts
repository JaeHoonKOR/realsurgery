/**
 * P-02 시술 카테고리 목록 — 부위별 묶음과 메타 문구.
 */
import type { Category, Procedure } from "@/lib/content";
import { formatPriceRange } from "@/lib/format";

export type CategoryGroup = {
  category: Category;
  procedures: Procedure[];
  /** 부위 전체 공개 가격대(시술 최저가~최고가). 가격이 하나도 없으면 null */
  priceRange: string | null;
};

/** 부위 순서(order)대로, 부위 안에서는 조회수 순 */
export function groupByCategory(categories: readonly Category[], procedures: readonly Procedure[]): CategoryGroup[] {
  return [...categories]
    .sort((a, b) => a.order - b.order)
    .map((category) => {
      const items = procedures.filter((p) => p.category_id === category.id).sort((a, b) => b.view_count - a.view_count);
      const lows = items.map((p) => p.price_low).filter((v): v is number => v != null);
      const highs = items.map((p) => p.price_high).filter((v): v is number => v != null);
      const priceRange =
        lows.length || highs.length
          ? formatPriceRange(lows.length ? Math.min(...lows) : null, highs.length ? Math.max(...highs) : null)
          : null;
      return { category, procedures: items, priceRange };
    });
}

export const PROCEDURES_TITLE = "시술 가이드 — 부위별 성형 시술 가격·회복기간";

/** 메타 description(120~150자) — 부위 이름과 시술 수를 넣는다 */
export function proceduresDescription(categories: readonly Pick<Category, "name" | "order">[], count: number): string {
  const names = [...categories].sort((a, b) => a.order - b.order).map((c) => c.name).join("·");
  return `${names} 부위별 성형 시술 ${count}개의 가격 범위, 소요시간, 회복기간, 마취 방식을 병원 공개 가격과 학회·의료기관 자료로 정리했습니다. 궁금한 시술의 부작용과 자주 묻는 질문까지 미리 확인하세요.`;
}
