import type { NextConfig } from "next";

// GitHub Pages 하위 경로 배포(/realsurgery). 커스텀 도메인 연결 시 NEXT_PUBLIC_BASE_PATH를 비우면 루트 배포.
function normalizeBasePath(raw: string | undefined): string {
  const trimmed = (raw ?? "").trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

// 공통 컴포넌트 미리보기(scripts/preview.mjs → next dev, RS_PREVIEW=1)에서만 page.preview.tsx 를 라우트로 인식한다.
// 정적 export(pnpm build)에는 들어가지 않는다. 빌드 산출물과 섞이지 않게 distDir 도 분리.
const preview = process.env.RS_PREVIEW === "1";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  reactStrictMode: true,
  pageExtensions: preview ? ["preview.tsx", "tsx", "ts"] : ["tsx", "ts"],
  distDir: preview ? ".next-preview" : ".next",
  // 개발 서버 좌하단 표시기는 스크린샷·e2e 에 섞이므로 끈다
  devIndicators: false,
  // 상위 폴더(사용자 홈)의 다른 lockfile 을 워크스페이스 루트로 오인하지 않도록 저장소 루트 고정
  outputFileTracingRoot: process.cwd(),
  // 정적 export는 이미지 최적화 서버가 없다. 원본을 WebP/AVIF로 미리 변환해 둔다(docs/IMAGES.md).
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
