import Link from "next/link";
import { isPathBuilt } from "@/lib/built-routes";
import { getSearchItems } from "@/lib/content";
import { GNB, ROUTES, consultPath, procedurePath } from "@/lib/routes";
import { SITE } from "@/lib/site";
import { HeaderSearch } from "./HeaderSearch";
import { TrackedLink } from "./TrackedLink";

/**
 * 공통 헤더 (screen-spec 3절): 로고, GNB(시술 가이드·병원 찾기·가격 비교·칼럼), 검색창, CTA.
 * "스크롤 시 축소 고정": 상단 바(로고·CTA)는 sticky 로 고정되고, 모바일 2번째 줄(검색·GNB)은 스크롤과 함께 사라진다.
 * 레이아웃 높이를 바꾸지 않으므로 CLS 가 생기지 않는다(JS 없음).
 * 아직 만들지 않은 화면으로 가는 링크는 노출하지 않는다(lib/built-routes.ts).
 */
export function SiteHeader() {
  const nav = GNB.filter((item) => isPathBuilt(item.href));
  const searchItems = getSearchItems().filter((item) => isPathBuilt(procedurePath(item.slug)));
  const showCta = isPathBuilt(ROUTES.consult);
  const hasSubRow = searchItems.length > 0 || nav.length > 0;

  return (
    <>
      <header data-testid="site-header" className="site-header sticky top-0 z-(--z-header) border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-content items-center gap-6 px-5 md:h-16 md:px-10">
          <Link
            href={ROUTES.home}
            data-testid="site-logo"
            className="inline-flex h-11 shrink-0 items-center text-h3 font-bold tracking-tight text-brand"
          >
            {SITE.name}
          </Link>

          {nav.length > 0 && (
            <nav aria-label="주요 메뉴" className="hidden md:block" data-testid="gnb-desktop">
              <ul className="flex items-center gap-1">
                {nav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="inline-flex h-11 items-center rounded-sm px-3 text-sm font-semibold text-ink-muted hover:bg-canvas hover:text-ink"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <div className="ml-auto flex items-center gap-3">
            {searchItems.length > 0 && (
              <div className="hidden w-72 md:block">
                <HeaderSearch items={searchItems} testId="header-search-desktop" />
              </div>
            )}
            {showCta && (
              <TrackedLink
                href={consultPath()}
                event="click_cta"
                params={{ location: "header" }}
                data-testid="header-cta"
                className="inline-flex h-11 shrink-0 items-center rounded-sm bg-accent-strong px-4 text-sm font-semibold text-surface hover:opacity-90"
              >
                무료 상담 예약
              </TrackedLink>
            )}
          </div>
        </div>
      </header>

      {hasSubRow && (
        <div data-testid="site-header-sub" className="border-b border-line bg-surface md:hidden">
          <div className="px-5 pt-3">
            {searchItems.length > 0 && <HeaderSearch items={searchItems} testId="header-search-mobile" />}
            {nav.length > 0 && (
              <nav aria-label="주요 메뉴" data-testid="gnb-mobile">
                <ul className="-mx-3 flex items-center">
                  {nav.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="inline-flex h-11 items-center px-3 text-sm font-semibold text-ink-muted hover:text-ink"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>
        </div>
      )}
    </>
  );
}
