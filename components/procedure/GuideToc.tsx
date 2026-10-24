import type { TocItem } from "@/lib/procedure";

/**
 * 목차 (4절 P-03: H2 앵커 목록). 모바일은 요약 박스 아래, 1024px 이상은 오른쪽에 따라 내려오는 열.
 * 스크롤 추적은 scroll_depth 이벤트(ScrollDepthTracker)로 한다.
 */
export function GuideToc({ items }: { items: TocItem[] }) {
  return (
    <nav aria-labelledby="toc-title" data-testid="procedure-toc" className="rounded-lg border border-line bg-surface p-5">
      <p id="toc-title" className="text-sm font-bold text-ink">
        목차
      </p>
      <ol className="mt-2">
        {items.map((item, i) => (
          <li key={item.href}>
            {/* 터치 영역 44px 이상(QUALITY 3절) */}
            <a
              href={item.href}
              className="-mx-2 flex min-h-11 items-center gap-3 rounded-sm px-2 py-2 text-sm text-ink-muted hover:bg-canvas hover:text-ink"
            >
              <span aria-hidden="true" className="w-4 shrink-0 text-right font-semibold text-brand">
                {i + 1}
              </span>
              <span>{item.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
