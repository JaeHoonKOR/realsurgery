import Link from "next/link";
import { isPathBuilt } from "@/lib/built-routes";
import { ROUTES } from "@/lib/routes";
import { SITE } from "@/lib/site";
import { Logo } from "./Logo";

/**
 * 공통 푸터 (screen-spec 3절): 사업자 정보, 이용약관, 개인정보처리방침, 의료 정보 면책 문구, 운영 시간.
 * variant="minimal" = 광고 랜딩(P-12)용 — 링크 없이 정보·면책만(4절 P-12 "GNB·푸터 링크 제거").
 */
export function SiteFooter({ variant = "full" }: { variant?: "full" | "minimal" }) {
  const links =
    variant === "full"
      ? [
          { label: "이용약관", href: ROUTES.terms },
          { label: "개인정보처리방침", href: ROUTES.privacy },
        ].filter((l) => isPathBuilt(l.href))
      : [];
  const biz = SITE.business;

  return (
    <footer data-testid="site-footer" className="bg-canvas-soft">
      <div className="mx-auto max-w-content px-5 py-12 md:px-10">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="max-w-text">
            <Logo />
            <p className="mt-2 text-sm text-ink-muted">{SITE.description}</p>
            <dl data-testid="footer-info" className="mt-5 grid gap-2 text-sm">
              <div className="flex flex-col sm:flex-row sm:gap-4">
                <dt className="shrink-0 font-semibold text-ink-muted sm:w-28">상담 연락 시간</dt>
                <dd className="text-ink-muted">{SITE.hours}</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-4">
                <dt className="shrink-0 font-semibold text-ink-muted sm:w-28">사업자 정보</dt>
                {biz ? (
                  <dd className="text-ink-muted">
                    {biz.company} · 대표 {biz.representative} · 사업자등록번호 {biz.registrationNo}
                    <br />
                    {biz.address} · {biz.email}
                  </dd>
                ) : (
                  <dd className="text-ink-muted">사업자 등록 절차를 마친 뒤 이곳에 게시합니다.</dd>
                )}
              </div>
            </dl>
          </div>

          {links.length > 0 && (
            <nav aria-label="약관 및 정책" data-testid="footer-links">
              <ul className="-mx-2 flex gap-2">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className={`inline-flex h-11 items-center px-2 text-sm text-ink hover:underline ${
                        l.href === ROUTES.privacy ? "font-bold" : ""
                      }`}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>

        <p data-testid="medical-disclaimer" className="mt-8 rounded-md bg-canvas px-4 py-3 text-sm text-ink-muted">
          {SITE.disclaimer}
        </p>
        <p className="mt-4 text-sm text-ink-muted">{SITE.copyright}</p>
      </div>
    </footer>
  );
}
