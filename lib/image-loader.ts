"use client";

/**
 * next/image 커스텀 로더(next.config.ts images.loaderFile) — 정적 export 에는 이미지 최적화 서버가 없어서
 * scripts/finalize-images.mjs 가 미리 만든 변형 파일로 srcset 을 만든다(docs/design/asset-plan.md 10절).
 *
 * - 생성 이미지 src 는 확장자 없는 기본 경로("<basePath>/images/gen/<id>")로 넘긴다.
 *   요청 폭 ≤640 → <id>-640.webp, ≤1024 → <id>-1024.webp, 그보다 크면 원본 <id>.webp(폭 ≤1600).
 *   (원본도 src 와 다른 문자열이 되므로 next/image 의 "loader 가 width 를 쓰지 않음" 경고가 나지 않는다.)
 * - 그 밖의 src(확장자가 있는 정적 파일)는 그대로 돌려준다 — 고정 크기 이미지(Icon3D·Emoji3D)는 unoptimized 로 쓴다.
 * next.config.ts 의 deviceSizes 를 [640, 1024, 1600] 으로 맞춰 srcset 폭 표기와 실제 파일 폭이 같다.
 */
export const VARIANT_WIDTHS = [640, 1024] as const;
export const MAX_WIDTH = 1600;

const GEN_BASE = /\/images\/gen\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** 요청 폭 → 파일 접미사("-640" | "-1024" | "") */
export function variantSuffix(width: number): string {
  for (const w of VARIANT_WIDTHS) if (width <= w) return `-${w}`;
  return "";
}

export default function genImageLoader({ src, width }: { src: string; width: number; quality?: number }): string {
  if (!GEN_BASE.test(src)) return src;
  return `${src}${variantSuffix(width)}.webp`;
}
