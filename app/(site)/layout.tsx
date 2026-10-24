import { SiteFooter } from "@/components/common/SiteFooter";
import { SiteHeader } from "@/components/common/SiteHeader";
import { SkipLink } from "@/components/common/SkipLink";

// 일반 화면 공통 틀: 헤더 · 본문 · 푸터 (screen-spec 3절). 광고 랜딩(P-12)은 이 그룹 밖에서 GNB·푸터 링크 없이 만든다.
export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
