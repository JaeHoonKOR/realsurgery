import { TrackedLink } from "@/components/common/TrackedLink";
import { isPathBuilt } from "@/lib/built-routes";
import type { Procedure } from "@/lib/content";
import { UNVERIFIED_LABEL, summaryCells } from "@/lib/procedure";
import { procedurePath } from "@/lib/routes";

const CARD_LABEL = { price: "가격", recovery: "회복" } as const;

/**
 * 관련 시술·칼럼 카드 (4절 P-03: 카드 4개, 내부 링크, select_procedure)
 * 칼럼(P-10)은 아직 화면이 없고 시술과의 연결 데이터도 없어 시술 카드로 채운다(로그 SPEC-GAP).
 * 카드 스타일은 .related-card (app/globals.css) — 반복 요소의 class 문자열을 줄인다.
 * 가격·회복 값은 그 시술 요약 박스와 같은 값(summaryCells)이고, 출처 검증 전 칸은 카드에도 밝힌다(리뷰 T-103 r2 반려 1).
 */
export function RelatedProcedures({
  items,
  categoryName,
}: {
  items: Procedure[];
  categoryName: (id: string) => string | undefined;
}) {
  const cards = items.filter((p) => isPathBuilt(procedurePath(p.slug)));
  if (cards.length === 0) return null;
  return (
    <section aria-labelledby="related-title" data-testid="procedure-related" className="mt-16">
      <h2 id="related-title" className="text-h2 font-bold text-ink">
        함께 많이 보는 시술 가이드
      </h2>
      <ul className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((p) => {
          const cells = summaryCells(p);
          const price = cells.find((c) => c.key === "price")!;
          const recovery = cells.find((c) => c.key === "recovery")!;
          const unverified = [price, recovery].filter((c) => c.unverified).map((c) => CARD_LABEL[c.key as keyof typeof CARD_LABEL]);
          return (
          <li key={p.id}>
            <TrackedLink
              href={procedurePath(p.slug)}
              event="select_procedure"
              params={{ procedure_id: p.id, from_page: "procedure" }}
              className="related-card"
            >
              <small>{categoryName(p.category_id)}</small>
              <b>
                {p.name}
                <i aria-hidden="true">→</i>
              </b>
              <span>
                <strong>{price.value}</strong>
                <small>회복 {recovery.value}</small>
                {unverified.length > 0 && (
                  <small data-card-unverified="">
                    {UNVERIFIED_LABEL}: {unverified.join("·")}
                  </small>
                )}
              </span>
            </TrackedLink>
          </li>
          );
        })}
      </ul>
    </section>
  );
}
