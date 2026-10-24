import type { NextConfig } from "next";

// GitHub Pages 하위 경로 배포(/realsurgery). 커스텀 도메인 연결 시 NEXT_PUBLIC_BASE_PATH를 비우면 루트 배포.
function normalizeBasePath(raw: string | undefined): string {
  const trimmed = (raw ?? "").trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  reactStrictMode: true,
  // 상위 폴더(사용자 홈)의 다른 lockfile 을 워크스페이스 루트로 오인하지 않도록 저장소 루트 고정
  outputFileTracingRoot: process.cwd(),
  // 정적 export는 이미지 최적화 서버가 없다. 원본을 WebP/AVIF로 미리 변환해 둔다(docs/IMAGES.md).
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
