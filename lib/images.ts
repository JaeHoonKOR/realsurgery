/**
 * 시술 일러스트·화면 이미지 자리 조회 (scripts/gen-image.mjs 가 쓰는 public/images/manifest.json 이 단일 소스).
 * - 생성 이미지(WebP 1200×800 + 600×400)가 있으면 그것을, 없으면 브랜드 기하 SVG 플레이스홀더를 돌려준다 → 자리가 비지 않는다.
 * - src 에는 basePath 가 붙어 있다(next/image 는 문자열 src 에 basePath 를 붙이지 않는다).
 */
import manifestJson from "@/public/images/manifest.json";
import { withBasePath } from "./env.public";

export type ImageKind = "generated" | "placeholder";

export type ManifestProcedure = {
  slug: string;
  kind: string;
  file: string;
  fileSm: string;
  width: number;
  height: number;
  alt: string;
  prompt: string | null;
  date: string;
  model: string | null;
  placeholder: string;
};
export type ManifestSlot = { slot: string; file: string; width: number; height: number; alt: string };
export type ImageManifest = { procedures: ManifestProcedure[]; slots: ManifestSlot[] };

export const SLOT_NAMES = ["home-hero", "lp-hero", "clinic-cover", "map", "post-cover", "consult-done", "empty"] as const;
export type SlotName = (typeof SLOT_NAMES)[number];

export type ProcedureImage = {
  slug: string;
  kind: ImageKind;
  /** 히어로 1200×800 */
  src: string;
  /** 카드 썸네일 600×400 (플레이스홀더는 같은 SVG) */
  srcSm: string;
  width: number;
  height: number;
  alt: string;
};
export type SlotImage = { slot: SlotName; src: string; width: number; height: number; alt: string };

const MANIFEST = manifestJson as ImageManifest;

/** 알 수 없는 시술 ID 일 때 쓰는 추상 패턴(칼럼 커버와 같은 그림) */
const FALLBACK_SLOT: SlotName = "post-cover";

export function getSlotImage(slot: SlotName, manifest: ImageManifest = MANIFEST): SlotImage {
  const s = manifest.slots.find((x) => x.slot === slot);
  if (!s) throw new Error(`이미지 매니페스트에 ${slot} 자리가 없습니다. pnpm assets:images 를 실행하세요.`);
  return { slot, src: withBasePath(s.file), width: s.width, height: s.height, alt: s.alt };
}

export function getProcedureImage(id: string, manifest: ImageManifest = MANIFEST): ProcedureImage {
  const e = manifest.procedures.find((x) => x.slug === id);
  if (!e) {
    const s = getSlotImage(FALLBACK_SLOT, manifest);
    return { slug: id, kind: "placeholder", src: s.src, srcSm: s.src, width: s.width, height: s.height, alt: "시술 정보를 나타내는 추상 패턴 일러스트" };
  }
  return {
    slug: e.slug,
    kind: e.kind === "generated" ? "generated" : "placeholder",
    src: withBasePath(e.file),
    srcSm: withBasePath(e.fileSm),
    width: e.width,
    height: e.height,
    alt: e.alt,
  };
}
