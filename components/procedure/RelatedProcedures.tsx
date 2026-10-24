import { TrackedLink } from "@/components/common/TrackedLink";
import { isPathBuilt } from "@/lib/built-routes";
import type { Procedure } from "@/lib/content";
import { formatPriceRange, formatRecovery } from "@/lib/format.mjs";
import { procedurePath } from "@/lib/routes";

/**
 * 관련 시술·칼럼 카드 (4절 P-03: 카드 4개, 내부 링크, select_procedure)
 * 칼럼(P-10)은 아직 화면이 없고 시술과의 연결 데이터도 없어 시술 카드로 채운다(로그 SPEC-GAP).
 * 카드 스타일은 .related-card (app/globals.css) — 반복 요소의 class 문자열을 줄인다.
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
        {cards.map((p) => (
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
                <strong>{formatPriceRange(p.price_low, p.price_high) ?? "병원 상담 후 안내"}</strong>
                <small>회복 {formatRecovery(p.recovery_days) ?? "진료 후 안내"}</small>
              </span>
            </TrackedLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
