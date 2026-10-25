/**
 * 사이트 공통 SEO 헬퍼 — 절대 URL·JSON-LD (screen-spec 6절).
 * 정적 export 이므로 모든 값은 빌드 시 확정된다. 한글 slug 는 퍼센트 인코딩해 sitemap·canonical·JSON-LD 를 통일한다.
 */
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
