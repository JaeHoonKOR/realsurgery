// scripts/finalize-images.mjs — 고른 후보 반영·반응형 변형·레지스트리(lib/gen-assets.json) 재생성
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterEach, describe, expect, it } from "vitest";
import {
  GEN_DIR,
  REGISTRY,
  VARIANT_WIDTHS,
  baseIdsFromFiles,
  finalize,
  isFixedSize,
  parseSelection,
  planFinalize,
  qualityFor,
  registryFromFiles,
  serializeRegistry,
  syncRegistry,
  type Manifest,
} from "../../scripts/finalize-images.mjs";
import { VARIANT_WIDTHS as LOADER_WIDTHS } from "@/lib/image-loader";

const manifest: Manifest = {
  images: [
    { id: "ic-eye", family: "icon" },
    { id: "hero-obj-a", family: "object" },
    { id: "proc-double-eyelid", family: "still" },
    { id: "clinic-danhaneul", family: "space" },
    { id: "clinic-danhaneul-room", family: "space" },
    { id: "flow-compare", family: "object" },
  ],
};
const real = JSON.parse(fs.readFileSync(path.resolve("content/images/prompts.json"), "utf8")) as Manifest;

const tmpDirs: string[] = [];
function tmp(): string {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "rs-finalize-"));
  tmpDirs.push(d);
  return d;
}
afterEach(() => {
  for (const d of tmpDirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
});

describe("finalize-images: 규칙", () => {
  it("고정 크기 = 아이콘·히어로 컷아웃(gen-images.mjs 정사각 판정과 같음), 품질 = 공간 80·그 밖 78", () => {
    expect(isFixedSize({ id: "ic-eye", family: "icon" })).toBe(true);
    expect(isFixedSize({ id: "brand-mark-3d", family: "icon" })).toBe(true);
    expect(isFixedSize({ id: "hero-obj-b", family: "object" })).toBe(true);
    expect(isFixedSize({ id: "flow-compare", family: "object" })).toBe(false);
    expect(isFixedSize({ id: "proc-rhinoplasty", family: "still" })).toBe(false);
    expect(qualityFor({ family: "space" })).toBe(80);
    expect(qualityFor({ family: "still" })).toBe(78);
  });

  it("변형 폭은 커스텀 로더와 같은 값", () => {
    expect([...VARIANT_WIDTHS].sort((a, b) => a - b)).toEqual([...LOADER_WIDTHS]);
  });

  it("기본 경로는 저장소 public/images/gen·lib/gen-assets.json", () => {
    expect(path.relative(process.cwd(), GEN_DIR)).toBe(path.join("public", "images", "gen"));
    expect(path.relative(process.cwd(), REGISTRY)).toBe(path.join("lib", "gen-assets.json"));
  });

  it("parseSelection: id·후보 형식 검증, id 순 정렬", () => {
    const sel = parseSelection({ "proc-double-eyelid": "v2", "ic-eye": "v1" }, manifest);
    expect(sel.map((s) => `${s.id}:${s.variant}`)).toEqual(["ic-eye:v1", "proc-double-eyelid:v2"]);
    expect(sel[1]!.item.family).toBe("still");
    expect(() => parseSelection({ "ic-nose": "v1" }, manifest)).toThrow("prompts.json 에 없는 id: ic-nose");
    expect(() => parseSelection({ "ic-eye": "2" }, manifest)).toThrow('"v1"·"v2" 형식');
    expect(() => parseSelection({ "ic-eye": "v0" }, manifest)).toThrow('"v1"·"v2" 형식');
    expect(() => parseSelection({ "ic-eye": 1 }, manifest)).toThrow('"v1"·"v2" 형식');
    expect(() => parseSelection(["ic-eye"], manifest)).toThrow("객체여야");
    expect(() => parseSelection(null, manifest)).toThrow("객체여야");
    expect(() => parseSelection({}, manifest)).toThrow("고른 후보가 없습니다");
  });

  it("planFinalize: 아이콘은 원본 1장, 그 밖은 -1024·-640 변형", () => {
    const ops = planFinalize(parseSelection({ "ic-eye": "v2", "clinic-danhaneul": "v1" }, manifest), "/c", "/g");
    expect(ops).toEqual([
      {
        id: "clinic-danhaneul",
        src: path.join("/c", "clinic-danhaneul-v1.webp"),
        dest: path.join("/g", "clinic-danhaneul.webp"),
        quality: 80,
        variants: [
          { width: 1024, dest: path.join("/g", "clinic-danhaneul-1024.webp") },
          { width: 640, dest: path.join("/g", "clinic-danhaneul-640.webp") },
        ],
      },
      { id: "ic-eye", src: path.join("/c", "ic-eye-v2.webp"), dest: path.join("/g", "ic-eye.webp"), quality: 78, variants: [] },
    ]);
  });

  it("baseIdsFromFiles: 원본이 있는 기본 id 만, 변형·다른 확장자·이상한 이름 제외", () => {
    expect(
      baseIdsFromFiles([
        "proc-double-eyelid.webp",
        "proc-double-eyelid-1024.webp",
        "proc-double-eyelid-640.webp",
        "clinic-danhaneul-room.webp",
        "ic-eye.webp",
        "flow-compare-640.webp", // 원본 없음
        "notes.txt",
        "Bad Name.webp",
        ".DS_Store",
      ]),
    ).toEqual(["clinic-danhaneul-room", "ic-eye", "proc-double-eyelid"]);
  });

  it("registryFromFiles: 변형이 빠진 에셋·매니페스트에 없는 파일은 목록에서 뺀다(깨진 srcset 방지)", () => {
    const r = registryFromFiles(
      ["ic-eye.webp", "hero-obj-a.webp", "proc-double-eyelid.webp", "proc-double-eyelid-1024.webp", "flow-compare.webp", "flow-compare-1024.webp", "flow-compare-640.webp", "mystery.webp"],
      manifest,
    );
    expect(r.ids).toEqual(["flow-compare", "hero-obj-a", "ic-eye"]);
    expect(r.incomplete).toEqual(["proc-double-eyelid (없음: proc-double-eyelid-640.webp)"]);
    expect(r.unknown).toEqual(["mystery"]);
  });

  it("serializeRegistry: 커밋용 형식(빈 목록 [])", () => {
    expect(serializeRegistry([])).toBe("[]\n");
    expect(serializeRegistry(["a", "b"])).toBe('[\n  "a",\n  "b"\n]\n');
  });

  it("실제 prompts.json 의 모든 id 가 레지스트리 id 규칙을 지킨다", () => {
    expect(baseIdsFromFiles(real.images.map((i) => `${i.id}.webp`))).toEqual(real.images.map((i) => i.id).sort());
  });
});

describe("finalize-images: 파일 반영(sharp)", () => {
  async function candidate(dir: string, name: string, width: number, height: number) {
    await sharp({ create: { width, height, channels: 3, background: { r: 242, g: 244, b: 246 } } })
      .webp({ quality: 80 })
      .toFile(path.join(dir, name));
  }

  it("고른 후보를 복사하고 변형을 만든 뒤 레지스트리를 다시 쓴다", async () => {
    const cand = tmp();
    const gen = path.join(tmp(), "gen");
    const registryPath = path.join(tmp(), "gen-assets.json");
    await candidate(cand, "ic-eye-v1.webp", 256, 256);
    await candidate(cand, "ic-eye-v2.webp", 256, 256);
    await candidate(cand, "proc-double-eyelid-v2.webp", 1600, 1200);
    await candidate(cand, "clinic-danhaneul-v1.webp", 800, 450); // 1024 보다 작은 원본: 확대하지 않는다

    const result = await finalize({
      candidatesDir: cand,
      selection: { "ic-eye": "v2", "proc-double-eyelid": "v2", "clinic-danhaneul": "v1" },
      manifest,
      sharp,
      genDir: gen,
      registryPath,
    });

    expect(fs.readdirSync(gen).sort()).toEqual([
      "clinic-danhaneul-1024.webp",
      "clinic-danhaneul-640.webp",
      "clinic-danhaneul.webp",
      "ic-eye.webp",
      "proc-double-eyelid-1024.webp",
      "proc-double-eyelid-640.webp",
      "proc-double-eyelid.webp",
    ]);
    expect(fs.readFileSync(path.join(gen, "ic-eye.webp"))).toEqual(fs.readFileSync(path.join(cand, "ic-eye-v2.webp")));
    expect((await sharp(path.join(gen, "proc-double-eyelid-640.webp")).metadata()).width).toBe(640);
    expect((await sharp(path.join(gen, "proc-double-eyelid-1024.webp")).metadata()).height).toBe(768);
    expect((await sharp(path.join(gen, "clinic-danhaneul-1024.webp")).metadata()).width).toBe(800);
    expect((await sharp(path.join(gen, "clinic-danhaneul-640.webp")).metadata()).format).toBe("webp");

    expect(result.ids).toEqual(["clinic-danhaneul", "ic-eye", "proc-double-eyelid"]);
    expect(fs.readFileSync(registryPath, "utf8")).toBe(serializeRegistry(result.ids));
  });

  it("후보 파일이 없으면 아무것도 쓰지 않고 실패", async () => {
    const gen = path.join(tmp(), "gen");
    await expect(
      finalize({ candidatesDir: tmp(), selection: { "ic-eye": "v1" }, manifest, sharp, genDir: gen, registryPath: path.join(gen, "r.json") }),
    ).rejects.toThrow("후보 파일이 없습니다: ic-eye-v1.webp");
    expect(fs.existsSync(gen)).toBe(false);
  });

  it("--sync: 폴더가 비었거나 없으면 [] 로 되돌린다", () => {
    const registryPath = path.join(tmp(), "gen-assets.json");
    expect(syncRegistry({ manifest, genDir: path.join(tmp(), "none"), registryPath }).ids).toEqual([]);
    expect(fs.readFileSync(registryPath, "utf8")).toBe("[]\n");
  });
});
