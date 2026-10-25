/**
 * 사이트 공통 SEO 헬퍼 — 절대 URL·JSON-LD (screen-spec 6절).
 * 정적 export 이므로 모든 값은 빌드 시 확정된다. 한글 slug 는 퍼센트 인코딩해 sitemap·canonical·JSON-LD 를 통일한다.
 */
import type { Metadata } from "next";
import { siteUrl } from "@/lib/env.public";
import { SITE } from "@/lib/site";

/** 사이트 내부 경로("/procedures/쌍꺼풀-수술/") → 인코딩된 절대 URL */
export function absoluteUrl(path: string): string {
  const encoded = path
    .split("/")
    .map((seg) => (seg ? encodeURIComponent(decodeURIComponent(seg)) : seg))
    .join("/");
  return `${siteUrl()}${encoded.startsWith("/") ? encoded : `/${encoded}`}`;
}

/** 전체 페이지 공통: Organization + WebSite */
export function siteJsonLd(): Record<string, unknown> {
  const url = absoluteUrl("/");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${url}#organization`,
        name: SITE.name,
        url,
        logo: absoluteUrl("/icon.svg"),
        description: SITE.description,
      },
      {
        "@type": "WebSite",
        "@id": `${url}#website`,
        name: SITE.name,
        url,
        inLanguage: "ko-KR",
        publisher: { "@id": `${url}#organization` },
      },
    ],
  };
}

/** <script type="application/ld+json"> 에 넣을 문자열 — </script> 조기 종료 방지 */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** 기본 공유 이미지(카카오톡·페이스북·X 미리보기) — design/og/og.html 을 렌더링한 1200×630 PNG */
export const SHARE_IMAGE = {
  path: "/og/default.png",
  width: 1200,
  height: 630,
  alt: `${SITE.name} — 시술 가격·회복기간을 병원 공개 가격과 학회 자료 기준으로 비교`,
} as const;

type OpenGraph = NonNullable<Metadata["openGraph"]>;

/**
 * 페이지 openGraph 에 공통값(사이트명·언어·기본 이미지)을 채운다.
 * Next 는 하위 페이지의 openGraph 가 상위 값을 통째로 덮어쓰므로 페이지마다 이 함수를 거친다.
 */
export function withShareDefaults(og: OpenGraph = {}): { openGraph: OpenGraph; twitter: NonNullable<Metadata["twitter"]> } {
  const image = { url: absoluteUrl(SHARE_IMAGE.path), width: SHARE_IMAGE.width, height: SHARE_IMAGE.height, alt: SHARE_IMAGE.alt };
  const openGraph = { type: "website", siteName: SITE.name, locale: "ko_KR", images: [image], ...og } as OpenGraph;
  const title = typeof og.title === "string" ? og.title : undefined;
  const description = typeof og.description === "string" ? og.description : undefined;
  return {
    openGraph,
    twitter: { card: "summary_large_image", images: [image.url], ...(title ? { title } : {}), ...(description ? { description } : {}) },
  };
}
