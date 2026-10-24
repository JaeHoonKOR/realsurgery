import type { Metadata } from "next";
import "./globals.css";
import { siteUrl, withBasePath } from "@/lib/env.public";

const SITE_NAME = "리얼성형";
const DEFAULT_TITLE = "리얼성형 — 성형 시술 가격·회복기간 비교";
const DEFAULT_DESCRIPTION =
  "쌍꺼풀·코·안면윤곽 등 성형 시술의 가격 범위, 소요시간, 회복기간, 마취 방식과 부작용을 학회·논문 출처와 함께 한 화면에 정리합니다. 병원 공개 정보를 비교하고 시술 상담 전 꼭 확인할 내용을 미리 꼼꼼히 살펴보세요.";

// Pretendard Variable 동적 서브셋 (scripts/copy-fonts.mjs 가 public/fonts/pretendard/ 로 복사)
const FONT_CSS = withBasePath("/fonts/pretendard/pretendardvariable-dynamic-subset.css");

// 웹폰트 CSS를 첫 콘텐츠 페인트(FCP) 직후에 붙인다 → 폰트 청크가 LCP 경로에 들어가지 않는다.
// 그 전에는 styles/fonts.css 의 메트릭 맞춘 시스템 폰트로 그린다. paint 타이밍 미지원 브라우저는 load 후.
const FONT_LOADER = `(function(h){var d=0;function a(){if(d)return;d=1;var l=document.createElement("link");l.rel="stylesheet";l.href=h;document.head.appendChild(l)}var P=window.PerformanceObserver;if(P&&P.supportedEntryTypes&&P.supportedEntryTypes.indexOf("paint")>-1){new P(function(e,o){if(e.getEntriesByName("first-contentful-paint").length){o.disconnect();setTimeout(a,0)}}).observe({type:"paint",buffered:true})}else{addEventListener("load",function(){setTimeout(a,0)})}})(${JSON.stringify(FONT_CSS)});`;

export const metadata: Metadata = {
  // metadataBase 에 basePath(/realsurgery)가 포함된 사이트 URL을 넣는다 → canonical·OG가 배포 경로로 생성된다.
  metadataBase: new URL(`${siteUrl()}/`),
  title: { default: DEFAULT_TITLE, template: `%s | ${SITE_NAME}` },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: { card: "summary", title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION },
  formatDetection: { telephone: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <script dangerouslySetInnerHTML={{ __html: FONT_LOADER }} />
        <noscript>
          <link rel="stylesheet" href={FONT_CSS} />
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}
