import { ExternalLink } from "lucide-react";
import { TrackedLink } from "@/components/common/TrackedLink";
import type { AffiliateItem } from "@/lib/content";

/**
 * 회복기 추천템 (4절 P-03: 제휴 상품 3개, 쿠팡파트너스 링크, 광고 표기, click_affiliate)
 * 상품이 없으면(파트너스 가입 전 — needs-key) 영역을 그리지 않는다.
 * 링크는 rel="sponsored" 로 광고 링크임을 검색엔진에 알린다.
 */
export function AffiliateItems({ procedureId, items }: { procedureId: string; items: AffiliateItem[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="affiliate-title" data-testid="procedure-affiliates" className="mt-14">
      <div className="flex items-center gap-3">
        <h2 id="affiliate-title" className="text-h2 font-bold text-ink">
          회복기 추천템
        </h2>
        <span className="rounded-sm border border-ink-muted px-2 text-sm font-semibold text-ink-muted">광고</span>
      </div>
      <p className="mt-2 max-w-text text-sm text-ink-muted">
        이 영역은 쿠팡 파트너스 활동의 일환으로, 구매가 이루어지면 리얼성형이 일정액의 수수료를 받습니다. 제품 선택은 의료진 안내를 우선하세요.
      </p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <li key={item.id}>
            <TrackedLink
              href={item.url}
              target="_blank"
              rel="sponsored noopener noreferrer"
              event="click_affiliate"
              params={{ item_id: item.id, procedure_id: procedureId }}
              className="flex h-full min-h-14 items-center justify-between gap-3 rounded-sm border border-line bg-surface px-4 py-3 font-semibold text-ink hover:border-brand"
            >
              <span>{item.name}</span>
              <ExternalLink aria-hidden="true" className="size-4 shrink-0 text-ink-muted" />
              <span className="sr-only">(쿠팡, 새 창)</span>
            </TrackedLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
