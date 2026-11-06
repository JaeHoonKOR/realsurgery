import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import manifestJson from "@/public/images/manifest.json";
import { type ImageManifest, type ManifestProcedure, SLOT_NAMES, getProcedureImage, getSlotImage } from "@/lib/images";

const REAL = manifestJson as ImageManifest;
const PUBLIC_DIR = path.join(process.cwd(), "public");
/** 장식용 배경 패턴이라 scripts/placeholders.mjs 에서 alt="" 로 둔 자리(스크린리더가 건너뛴다) */
const DECORATIVE_SLOTS = new Set(["clinic-cover"]);

const proc = (over: Partial<ManifestProcedure>): ManifestProcedure => ({
  slug: "rhinoplasty",
  kind: "generated",
  file: "/images/procedures/rhinoplasty.webp",
  fileSm: "/images/procedures/rhinoplasty-sm.webp",
  width: 1200,
  height: 800,
  alt: "코 윤곽선을 단순화한 기하 도형",
  prompt: "Flat vector illustration",
  date: "2026-10-25",
  model: "gemini",
  placeholder: "/images/placeholder/rhinoplasty.svg",
  ...over,
});

const FIXTURE: ImageManifest = {
  procedures: [
    proc({}),
    proc({ slug: "lifting", kind: "placeholder", file: "/images/placeholder/lifting.svg", fileSm: "/images/placeholder/lifting.svg" }),
    proc({ slug: "odd", kind: "pending-review", file: "/images/placeholder/odd.svg", fileSm: "/images/placeholder/odd.svg" }),
  ],
  slots: [
    { slot: "home-hero", file: "/images/slots/home-hero.svg", width: 1600, height: 900, alt: "홈 히어로 기하 패턴" },
    { slot: "post-cover", file: "images/slots/post-cover.svg", width: 1200, height: 630, alt: "칼럼 커버 추상 패턴" },
  ],
};

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/realsurgery");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("images: getSlotImage", () => {
  it("자리 정보를 basePath 를 붙여 돌려준다", () => {
    expect(getSlotImage("home-hero", FIXTURE)).toEqual({
      slot: "home-hero",
      src: "/realsurgery/images/slots/home-hero.svg",
      width: 1600,
      height: 900,
      alt: "홈 히어로 기하 패턴",
    });
  });

  it("앞 슬래시 없는 경로도 basePath 뒤에 / 로 잇는다", () => {
    expect(getSlotImage("post-cover", FIXTURE).src).toBe("/realsurgery/images/slots/post-cover.svg");
  });

  it("basePath 가 비어 있으면(로컬 루트 배포) 경로 그대로", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "");
    expect(getSlotImage("home-hero", FIXTURE).src).toBe("/images/slots/home-hero.svg");
  });

  it("매니페스트에 없는 자리는 생성 명령을 안내하며 실패한다", () => {
    expect(() => getSlotImage("map", FIXTURE)).toThrow(/map.*pnpm assets:images/);
  });
});

describe("images: getProcedureImage", () => {
  it("생성 이미지는 kind generated, 히어로·썸네일 경로를 따로 준다", () => {
    expect(getProcedureImage("rhinoplasty", FIXTURE)).toEqual({
      slug: "rhinoplasty",
      kind: "generated",
      src: "/realsurgery/images/procedures/rhinoplasty.webp",
      srcSm: "/realsurgery/images/procedures/rhinoplasty-sm.webp",
      width: 1200,
      height: 800,
      alt: "코 윤곽선을 단순화한 기하 도형",
    });
  });

  it("플레이스홀더 항목은 kind placeholder", () => {
    const img = getProcedureImage("lifting", FIXTURE);
    expect(img.kind).toBe("placeholder");
    expect(img.src).toBe("/realsurgery/images/placeholder/lifting.svg");
    expect(img.srcSm).toBe(img.src);
  });

  it("알 수 없는 kind 문자열은 generated 로 보지 않는다", () => {
    expect(getProcedureImage("odd", FIXTURE).kind).toBe("placeholder");
  });

  it("매니페스트에 없는 시술 ID 는 칼럼 커버 패턴으로 자리를 채운다", () => {
    expect(getProcedureImage("unknown-procedure", FIXTURE)).toEqual({
      slug: "unknown-procedure",
      kind: "placeholder",
      src: "/realsurgery/images/slots/post-cover.svg",
      srcSm: "/realsurgery/images/slots/post-cover.svg",
      width: 1200,
      height: 630,
      alt: "시술 정보를 나타내는 추상 패턴 일러스트",
    });
  });

  it("대체 자리(post-cover)까지 없으면 실패한다", () => {
    const noCover: ImageManifest = { procedures: [], slots: FIXTURE.slots.filter((s) => s.slot !== "post-cover") };
    expect(() => getProcedureImage("unknown-procedure", noCover)).toThrow(/post-cover/);
  });
});

describe("images: 실제 public/images/manifest.json 계약", () => {
  it.each(SLOT_NAMES.map((s) => [s]))("자리 %s 가 있고 파일이 존재한다(장식용 자리만 빈 alt)", (slot) => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "");
    const img = getSlotImage(slot);
    expect(typeof img.alt).toBe("string");
    if (DECORATIVE_SLOTS.has(slot)) expect(img.alt).toBe("");
    else expect(img.alt.trim()).not.toBe("");
    expect(img.width).toBeGreaterThan(0);
    expect(img.height).toBeGreaterThan(0);
    expect(fs.existsSync(path.join(PUBLIC_DIR, img.src))).toBe(true);
  });

  it("시술 항목은 slug 가 겹치지 않고, 3:2 비율·대체 텍스트·파일을 갖는다", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "");
    const slugs = REAL.procedures.map((p) => p.slug);
    expect(slugs.length).toBeGreaterThan(0);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      const img = getProcedureImage(slug);
      expect(img.slug).toBe(slug);
      expect(img.width * 2).toBe(img.height * 3);
      expect(img.alt.trim()).not.toBe("");
      expect(fs.existsSync(path.join(PUBLIC_DIR, img.src))).toBe(true);
      expect(fs.existsSync(path.join(PUBLIC_DIR, img.srcSm))).toBe(true);
    }
  });

  it("기본 매니페스트에서도 basePath 가 붙는다", () => {
    const first = REAL.procedures[0];
    if (!first) throw new Error("매니페스트에 시술 항목이 없습니다");
    expect(getProcedureImage(first.slug).src).toBe(`/realsurgery${first.file}`);
  });
});
