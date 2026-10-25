import type { MetadataRoute } from "next";
import { withBasePath } from "@/lib/env.public";
import { absoluteUrl } from "@/lib/seo";

// 정적 export: 빌드 시 robots.txt 파일로 생성된다(서버 실행 없음).
export const dynamic = "force-static";

/**
 * screen-spec 6절: /admin, /consult/done, /my 차단. AI 답변 엔진(GPTBot·ClaudeBot·PerplexityBot 등) 허용 — AEO.
 * 경로는 basePath 를 포함한다. 주의: GitHub Pages 프로젝트 경로(/realsurgery/)에서는 크롤러가 도메인 루트 robots.txt 만 읽는다
 * → 커스텀 도메인 연결 전까지는 sitemap.xml 을 Search Console·네이버 서치어드바이저에 직접 제출한다.
 */
export default function robots(): MetadataRoute.Robots {
  const disallow = ["/admin/", "/consult/done/", "/my/"].map(withBasePath);
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: ["GPTBot", "OAI-SearchBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "Yeti"], allow: "/", disallow },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
