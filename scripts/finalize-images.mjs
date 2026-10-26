// 확정 이미지 반영 (docs/design/asset-plan.md 9·10절) — 고른 후보만 public/images/gen/ 에 넣고 lib/gen-assets.json 을 다시 쓴다.
// 사용: node scripts/finalize-images.mjs <candidatesDir> <selection.json>
//         selection.json = { "<id>": "v1" | "v2" | … } — 후보 <candidatesDir>/<id>-v<n>.webp (scripts/gen-images.mjs 출력)
//       node scripts/finalize-images.mjs --sync   (복사 없이 public/images/gen 을 훑어 lib/gen-assets.json 만 다시 쓴다)
// - 아이콘(family icon)·히어로 컷아웃(hero-obj-*)은 고정 크기 원본 1장(256·384px)만 쓴다.
// - 그 밖(장면·스틸·공간)은 원본(폭 ≤1600)과 반응형 변형 <id>-1024.webp·<id>-640.webp 를 만든다(lib/image-loader.ts 가 고른다).
// - lib/gen-assets.json = 원본과 필요한 변형이 모두 있는 기본 id 정렬 배열. 변형이 빠진 id 는 넣지 않고 실패로 알린다.
// 회귀 테스트: tests/unit/finalize-images.test.ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const GEN_DIR = path.join(ROOT, "public", "images", "gen");
export const REGISTRY = path.join(ROOT, "lib", "gen-assets.json");
export const MANIFEST = path.join(ROOT, "content", "images", "prompts.json");
/** 반응형 변형 폭(큰 것부터) — lib/image-loader.ts VARIANT_WIDTHS 와 같은 값 */
export const VARIANT_WIDTHS = [1024, 640];

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VARIANT_SUFFIX = new RegExp(`-(?:${VARIANT_WIDTHS.join("|")})$`);

/** 고정 크기(변형 없음) 에셋인지 — gen-images.mjs postProcess 의 정사각 판정과 같은 규칙 */
export function isFixedSize(item) {
  return item.family === "icon" || item.id.startsWith("hero-obj");
}

/** WebP 품질 — 공간 사진 q80, 그 밖 q78 (asset-plan 10절 후처리) */
export function qualityFor(item) {
  return item.family === "space" ? 80 : 78;
}

/**
 * selection.json 내용 검증 → [{ id, variant, item }] (id 순).
 * @param {unknown} raw
 * @param {{ images: { id: string, family: string }[] }} manifest
 */
export function parseSelection(raw, manifest) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error('selection.json 은 { "<id>": "v1" } 형태의 객체여야 합니다.');
  }
  const byId = new Map(manifest.images.map((i) => [i.id, i]));
  const out = [];
  for (const [id, variant] of Object.entries(raw)) {
    const item = byId.get(id);
    if (!item) throw new Error(`prompts.json 에 없는 id: ${id}`);
    if (typeof variant !== "string" || !/^v[1-9]\d*$/.test(variant)) {
      throw new Error(`${id}: 후보는 "v1"·"v2" 형식이어야 합니다 (받은 값: ${JSON.stringify(variant)})`);
    }
    out.push({ id, variant, item });
  }
  if (out.length === 0) throw new Error("selection.json 에 고른 후보가 없습니다.");
  return out.sort((a, b) => (a.id < b.id ? -1 : 1));
}

/** 복사·변형 계획(파일 I/O 없음) */
export function planFinalize(selection, candidatesDir, genDir = GEN_DIR) {
  return selection.map(({ id, variant, item }) => ({
    id,
    src: path.join(candidatesDir, `${id}-${variant}.webp`),
    dest: path.join(genDir, `${id}.webp`),
    quality: qualityFor(item),
    variants: isFixedSize(item) ? [] : VARIANT_WIDTHS.map((width) => ({ width, dest: path.join(genDir, `${id}-${width}.webp`) })),
  }));
}

/** 파일 이름 목록 → 기본 id(원본 <id>.webp 가 있는 것, 변형 -1024·-640 제외) 정렬 배열 */
export function baseIdsFromFiles(names) {
  const ids = new Set();
  for (const name of names) {
    if (!name.endsWith(".webp")) continue;
    const base = name.slice(0, -".webp".length);
    if (ID.test(base) && !VARIANT_SUFFIX.test(base)) ids.add(base);
  }
  return [...ids].sort();
}

/**
 * 레지스트리에 넣을 id 와 문제 목록. 매니페스트에 없는 id, 반응형 변형이 빠진 id 는 넣지 않는다(깨진 srcset 방지).
 * @returns {{ ids: string[], incomplete: string[], unknown: string[] }}
 */
export function registryFromFiles(names, manifest) {
  const files = new Set(names);
  const byId = new Map(manifest.images.map((i) => [i.id, i]));
  const ids = [];
  const incomplete = [];
  const unknown = [];
  for (const id of baseIdsFromFiles(names)) {
    const item = byId.get(id);
    if (!item) {
      unknown.push(id);
      continue;
    }
    const missing = isFixedSize(item) ? [] : VARIANT_WIDTHS.map((w) => `${id}-${w}.webp`).filter((f) => !files.has(f));
    if (missing.length) incomplete.push(`${id} (없음: ${missing.join(", ")})`);
    else ids.push(id);
  }
  return { ids, incomplete, unknown };
}

/** lib/gen-assets.json 직렬화 — 두 칸 들여쓰기 + 끝 줄바꿈(빈 목록은 "[]") */
export function serializeRegistry(ids) {
  return `${JSON.stringify(ids, null, 2)}\n`;
}

/** genDir 을 훑어 레지스트리 파일을 다시 쓴다 */
export function syncRegistry({ manifest, genDir = GEN_DIR, registryPath = REGISTRY }) {
  const names = fs.existsSync(genDir) ? fs.readdirSync(genDir) : [];
  const result = registryFromFiles(names, manifest);
  fs.writeFileSync(registryPath, serializeRegistry(result.ids), "utf8");
  return result;
}

/**
 * 고른 후보 반영: 원본 복사 + 변형 생성 + 레지스트리 갱신.
 * @param {{ candidatesDir: string, selection: unknown, manifest: object, sharp: Function, genDir?: string, registryPath?: string }} opts
 */
export async function finalize({ candidatesDir, selection, manifest, sharp, genDir = GEN_DIR, registryPath = REGISTRY }) {
  const ops = planFinalize(parseSelection(selection, manifest), candidatesDir, genDir);
  const missing = ops.filter((op) => !fs.existsSync(op.src)).map((op) => path.basename(op.src));
  if (missing.length) throw new Error(`후보 파일이 없습니다: ${missing.join(", ")}`);
  fs.mkdirSync(genDir, { recursive: true });
  for (const op of ops) {
    fs.copyFileSync(op.src, op.dest);
    for (const v of op.variants) {
      await sharp(op.src).resize({ width: v.width, withoutEnlargement: true }).webp({ quality: op.quality }).toFile(v.dest);
    }
  }
  return { ops, ...syncRegistry({ manifest, genDir, registryPath }) };
}

async function main(argv) {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  let result;
  if (argv[0] === "--sync") {
    result = syncRegistry({ manifest });
  } else {
    const [candidatesDir, selectionPath] = argv;
    if (!candidatesDir || !selectionPath) {
      throw new Error("사용법: node scripts/finalize-images.mjs <candidatesDir> <selection.json> | --sync");
    }
    const selection = JSON.parse(fs.readFileSync(path.resolve(selectionPath), "utf8"));
    const sharp = (await import("sharp")).default;
    result = await finalize({ candidatesDir: path.resolve(candidatesDir), selection, manifest, sharp });
    for (const op of result.ops) {
      const extra = op.variants.length ? ` + ${op.variants.map((v) => `${v.width}w`).join("·")}` : "";
      console.log(`  ✓ ${op.id}.webp${extra}`);
    }
  }
  console.log(`[finalize-images] lib/gen-assets.json — ${result.ids.length}개`);
  if (result.unknown.length) console.warn(`[finalize-images] prompts.json 에 없는 파일(목록 제외): ${result.unknown.join(", ")}`);
  if (result.incomplete.length) {
    console.error(`[finalize-images] 반응형 변형이 빠진 에셋(목록 제외): ${result.incomplete.join("; ")}`);
    process.exitCode = 1;
  }
}

if (path.basename(process.argv[1] ?? "") === "finalize-images.mjs") {
  main(process.argv.slice(2)).catch((err) => {
    console.error(`[finalize-images] ${err.message}`);
    process.exit(1);
  });
}
