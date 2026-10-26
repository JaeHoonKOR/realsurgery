// 생성 에셋 레지스트리(lib/gen-assets) · 반응형 로더(lib/image-loader) — docs/design/asset-plan.md 10절
import { describe, expect, it } from "vitest";
import registry from "@/lib/gen-assets.json";
import {
  GEN_DIR,
  clinicImageId,
  createAssetSet,
  genAssetPath,
  genImageBase,
  hasAnyAsset,
  hasAsset,
  procedureImageId,
} from "@/lib/gen-assets";
import genImageLoader, { MAX_WIDTH, VARIANT_WIDTHS, variantSuffix } from "@/lib/image-loader";

describe("gen-assets 레지스트리", () => {
  it("저장소에 커밋된 목록은 문자열 id 의 정렬 배열이다(finalize-images.mjs 형식)", () => {
    expect(Array.isArray(registry)).toBe(true);
    const ids = registry as unknown[];
    expect(ids.every((x) => typeof x === "string")).toBe(true);
    expect([...(ids as string[])].sort()).toEqual(ids);
  });

  it("hasAsset·hasAnyAsset 은 레지스트리를 그대로 따른다", () => {
    const ids = registry as string[];
    expect(hasAnyAsset()).toBe(ids.length > 0);
    expect(hasAsset("ic-eye")).toBe(ids.includes("ic-eye"));
    expect(hasAsset("없는-id")).toBe(false);
  });

  it("createAssetSet: 배열이 아니거나 문자열이 아닌 항목은 무시", () => {
    expect([...createAssetSet(["ic-eye", "", 3, null, "proc-x", "ic-eye"])]).toEqual(["ic-eye", "proc-x"]);
    expect(createAssetSet({ a: 1 }).size).toBe(0);
    expect(createAssetSet(undefined).size).toBe(0);
  });

  it("경로·id 규칙", () => {
    expect(GEN_DIR).toBe("/images/gen");
    expect(genAssetPath("ic-eye")).toBe("/images/gen/ic-eye.webp");
    expect(genImageBase("proc-rhinoplasty")).toBe("/images/gen/proc-rhinoplasty");
    expect(procedureImageId("double-eyelid")).toBe("proc-double-eyelid");
    expect(clinicImageId("danhaneul")).toBe("clinic-danhaneul");
  });
});

describe("image-loader (next.config.ts images.loaderFile)", () => {
  it("요청 폭 → 미리 만든 변형 파일", () => {
    expect(VARIANT_WIDTHS).toEqual([640, 1024]);
    expect(MAX_WIDTH).toBe(1600);
    expect(variantSuffix(320)).toBe("-640");
    expect(variantSuffix(640)).toBe("-640");
    expect(variantSuffix(641)).toBe("-1024");
    expect(variantSuffix(1024)).toBe("-1024");
    expect(variantSuffix(1600)).toBe("");
    expect(variantSuffix(3840)).toBe("");
  });

  it("생성 이미지 기본 경로(확장자 없음)에만 접미사·확장자를 붙인다 — basePath 포함", () => {
    expect(genImageLoader({ src: "/images/gen/proc-double-eyelid", width: 640 })).toBe("/images/gen/proc-double-eyelid-640.webp");
    expect(genImageLoader({ src: "/realsurgery/images/gen/clinic-danhaneul", width: 1024, quality: 75 })).toBe(
      "/realsurgery/images/gen/clinic-danhaneul-1024.webp",
    );
    expect(genImageLoader({ src: "/realsurgery/images/gen/flow-compare", width: 1600 })).toBe("/realsurgery/images/gen/flow-compare.webp");
  });

  it("원본 폭 요청도 src 와 다른 문자열(→ next/image 'loader 가 width 를 안 씀' 경고 없음)", () => {
    const src = "/images/gen/post-reading-quotes";
    expect(genImageLoader({ src, width: 1600 })).not.toBe(src);
  });

  it("그 밖의 정적 파일은 그대로(고정 크기 아이콘은 unoptimized)", () => {
    for (const src of ["/images/emoji/eye.webp", "/images/gen/ic-eye.webp", "/og/default.png", "https://example.com/a"]) {
      expect(genImageLoader({ src, width: 640 })).toBe(src);
    }
  });
});
