/**
 * 화면 경로 (screen-spec 2절 사이트맵). 모든 내부 링크는 여기서 만든다.
 * 끝 슬래시 포함(next.config trailingSlash: true). 링크를 노출할지(화면이 빌드됐는지)는 lib/built-routes.ts.
 */

export const ROUTES = {
  home: "/",
  /** P-02 시술 카테고리 목록 (P1) */
  procedures: "/procedures/",
  /** P-04 병원 목록·비교 (P1) */
  clinics: "/clinics/",
  /** P-08 가격 비교 (P1) — 스펙은 /prices/{procedure} 만 정의, 목록 경로는 SPEC-GAP */
  prices: "/prices/",
  /** P-10 칼럼 (P1) — 스펙은 /blog/{slug} 만 정의, 목록 경로는 SPEC-GAP */
  blog: "/blog/",
  /** P-06 무료 상담 예약 폼 (P0, T-101) */
  consult: "/consult/",
  /** C-01 (P0, T-108) */
  terms: "/terms/",
  privacy: "/privacy/",
} as const;

/** P-03 시술 상세 — slug 는 한글 허용(2절 URL 규칙) */
export const procedurePath = (slug: string): string => `/procedures/${slug}/`;
/** P-05 병원 상세 */
export const clinicPath = (slug: string): string => `/clinics/${slug}/`;
/** P-10 칼럼 상세 */
export const postPath = (slug: string): string => `/blog/${slug}/`;

/** P-06 상담 폼 경로. procedure_id·clinic_id 는 쿼리로 선입력(4절 P-06 1단계). */
export function consultPath(query: { procedure_id?: string; clinic_id?: string } = {}): string {
  const params = new URLSearchParams();
  if (query.procedure_id) params.set("procedure_id", query.procedure_id);
  if (query.clinic_id) params.set("clinic_id", query.clinic_id);
  const qs = params.toString();
  return qs ? `${ROUTES.consult}?${qs}` : ROUTES.consult;
}

/** 헤더 GNB (3절: 시술 가이드·병원 찾기·가격 비교·칼럼) */
export const GNB = [
  { label: "시술 가이드", href: ROUTES.procedures },
  { label: "병원 찾기", href: ROUTES.clinics },
  { label: "가격 비교", href: ROUTES.prices },
  { label: "칼럼", href: ROUTES.blog },
] as const;
