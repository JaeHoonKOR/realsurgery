/**
 * AI 생성 에셋 목록(docs/design/asset-plan.md 10절) — public/images/gen/ 에 확정돼 들어간 id.
 * 목록 원본은 lib/gen-assets.json 이고 scripts/finalize-images.mjs 가 다시 쓴다(손으로 고치지 않는다).
 * 정적 JSON import 라 서버·클라이언트 컴포넌트 어디서나 판정할 수 있다(빌드 시 번들에 들어감 → 파일이 추가되면 다시 빌드).
 * 에셋이 없으면 각 자리는 현재 디자인(3D 이모지·텍스트 카드)을 그대로 보여 준다.
 */
import registry from "./gen-assets.json";

/** public/ 기준 생성 에셋 폴더 */
export const GEN_DIR = "/images/gen";

/** JSON 값(배열)에서 문자열 id 만 모은다 — 잘못된 항목은 무시 */
export function createAssetSet(ids: unknown): ReadonlySet<string> {
  if (!Array.isArray(ids)) return new Set();
  return new Set(ids.filter((x): x is string => typeof x === "string" && x.length > 0));
}

const ASSETS = createAssetSet(registry);

/** 확정 에셋이 public/images/gen/<id>.webp 로 들어와 있는지 */
export function hasAsset(id: string): boolean {
  return ASSETS.has(id);
}

/** 생성 에셋이 하나라도 쓰이는지(푸터의 AI 생성 고지) */
export function hasAnyAsset(): boolean {
  return ASSETS.size > 0;
}

/** 고정 크기 원본 1장(아이콘 256px·히어로 컷아웃 384px) — basePath 미포함 */
export function genAssetPath(id: string): string {
  return `${GEN_DIR}/${id}.webp`;
}

/**
 * 반응형 이미지 src — 확장자 없는 기본 경로(basePath 미포함).
 * next/image 커스텀 로더(lib/image-loader.ts)가 요청 폭에 맞춰 -640·-1024·원본 .webp 로 바꾼다.
 */
export function genImageBase(id: string): string {
  return `${GEN_DIR}/${id}`;
}

/** 시술 이미지 id(prompts.json proc-<시술 id>) — P-03 히어로·시술 카드 썸네일 */
export function procedureImageId(procedureId: string): string {
  return `proc-${procedureId}`;
}

/** 병원 예시 사진 id(prompts.json clinic-<병원 id>) — 병원 카드 커버·P-05 헤더 */
export function clinicImageId(clinicId: string): string {
  return `clinic-${clinicId}`;
}
