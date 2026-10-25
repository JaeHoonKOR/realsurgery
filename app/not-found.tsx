import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/common/SiteFooter";
import { SiteHeader } from "@/components/common/SiteHeader";
import { SkipLink } from "@/components/common/SkipLink";
import { Emoji3D } from "@/components/ui/Emoji3D";
import { isPathBuilt } from "@/lib/built-routes";
import { ROUTES } from "@/lib/routes";
import { btn, cx } from "@/lib/ui";

// 404 — 정적 export 시 out/404.html 로 생성되며 GitHub Pages 가 없는 경로에 이 화면을 보여 준다.
export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  const links = [
    { label: "시술 가이드", href: ROUTES.procedures },
    { label: "병원 찾기", href: ROUTES.clinics },
    { label: "칼럼", href: ROUTES.blog },
  ].filter((l) => isPathBuilt(l.href));
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex flex-1 items-center focus:outline-none">
        <div className="mx-auto w-full max-w-form px-5 py-20 text-center md:py-28">
          <Emoji3D name="search" size={80} className="mx-auto" />
          <h1 className="mt-6 text-h1 font-bold tracking-tighter text-ink">페이지를 찾을 수 없습니다</h1>
          <p className="mt-3 text-lg text-ink-muted">
            주소가 바뀌었거나 삭제된 페이지입니다. 아래에서 찾으시는 정보를 다시 골라 주세요.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href={ROUTES.home} className={cx(btn.primary, btn.md)}>
              홈으로 가기
            </Link>
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={cx(btn.neutral, btn.md)}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
