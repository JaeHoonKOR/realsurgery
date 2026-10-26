// AI 이미지 후보 컨택트 시트 (docs/design/asset-plan.md 9절 3~5) — asset-maker 가 후보를 Read 로 한꺼번에 검수할 때 쓴다.
// 사용: node scripts/contact-sheet.mjs [--dir .gen-candidates] [--out .gen-candidates/sheets] [--ids a,b]
// - 후보 <dir>/<id>-v<n>.webp 를 실제 얹힐 표면색 위에 놓는다: 아이콘·컷아웃(흰 배경 생성)은 #F2F4F6 위 multiply(+ 48px 축소본),
//   스틸·장면·공간은 16:10 표시 크롭.
// - 배경 검사 수치를 함께 적는다: 아이콘·컷아웃 = 네 모서리 평균 ≥ 253, 스틸 = 모서리가 #F2F4F6 ±4 (asset-plan 9절 "배경").
// 출력: <out>/sheet-<n>.png (4열×3행) + 표준 출력에 후보별 판정 표. 비용 없음(로컬 sharp).
// 회귀 테스트: tests/unit/contact-sheet.test.ts (순수 함수)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = path.join(ROOT, "content", "images", "prompts.json");
const SURFACE = { r: 242, g: 244, b: 246 }; // #F2F4F6

/** "ic-eye-v2.webp" → { id: "ic-eye", variant: "v2" } (후보 이름 규칙이 아니면 null) */
export function parseCandidateName(name) {
  const m = /^([a-z0-9]+(?:-[a-z0-9]+)*)-(v[1-9]\d*)\.webp$/.exec(String(name));
  return m ? { id: m[1], variant: m[2] } : null;
}

/** 흰 배경으로 생성해 multiply 로 얹는 에셋인지(아이콘·컷아웃) */
export function isCutout(item) {
  return item?.family === "icon" || (item?.family === "object" && String(item?.background ?? "").toUpperCase() === "#FFFFFF");
}

/**
 * 배경 판정. corners = 네 모서리 평균 [{r,g,b}] (0~255)
 * @returns {{ ok: boolean | null, note: string }} ok=null 은 검사 대상 아님(공간 사진·장면)
 */
export function backgroundVerdict(item, corners) {
  if (!corners?.length) return { ok: null, note: "모서리 없음" };
  const lum = corners.map((c) => (c.r + c.g + c.b) / 3);
  if (isCutout(item)) {
    const min = Math.min(...lum);
    return { ok: min >= 253, note: `모서리 최소 ${min.toFixed(1)} (기준 ≥253)` };
  }
  if (item?.family === "still") {
    const dev = Math.max(...corners.map((c) => Math.max(Math.abs(c.r - SURFACE.r), Math.abs(c.g - SURFACE.g), Math.abs(c.b - SURFACE.b))));
    return { ok: dev <= 4, note: `#F2F4F6 과 최대 차 ${dev.toFixed(1)} (기준 ≤4)` };
  }
  return { ok: null, note: "사진·장면 — 눈으로 판정" };
}

async function cornerMeans(sharp, file) {
  const img = sharp(file);
  const { width = 0, height = 0 } = await img.metadata();
  const s = Math.max(4, Math.round(Math.min(width, height) * 0.02));
  const out = [];
  for (const [left, top] of [
    [0, 0],
    [width - s, 0],
    [0, height - s],
    [width - s, height - s],
  ]) {
    const { data, info } = await sharp(file).extract({ left, top, width: s, height: s }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    let r = 0;
    let g = 0;
    let b = 0;
    const n = info.width * info.height;
    for (let i = 0; i < data.length; i += info.channels) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }
    out.push({ r: r / n, g: g / n, b: b / n });
  }
  return out;
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function tile(sharp, file, item, label, verdict) {
  const W = 300;
  const H = 220;
  const LABEL = 44;
  const layers = [];
  if (isCutout(item)) {
    const big = await sharp(file).resize(190, 190, { fit: "contain", background: "#ffffff" }).toBuffer();
    const small = await sharp(file).resize(48, 48, { fit: "contain", background: "#ffffff" }).toBuffer();
    layers.push({ input: big, left: 20, top: 15, blend: "multiply" }, { input: small, left: 232, top: 152, blend: "multiply" });
  } else {
    const crop = await sharp(file).resize(W, H, { fit: "cover", position: "centre" }).toBuffer();
    layers.push({ input: crop, left: 0, top: 0 });
  }
  const color = verdict.ok === false ? "#F04452" : "#333D4B";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${LABEL}"><rect width="100%" height="100%" fill="#ffffff"/><text x="6" y="18" font-size="14" font-family="Arial, sans-serif" fill="#191F28">${esc(label)}</text><text x="6" y="36" font-size="12" font-family="Arial, sans-serif" fill="${color}">${esc(verdict.note)}</text></svg>`;
  layers.push({ input: Buffer.from(svg), left: 0, top: H });
  return sharp({ create: { width: W, height: H + LABEL, channels: 3, background: SURFACE } })
    .composite(layers)
    .png()
    .toBuffer();
}

async function main(argv) {
  const opt = (name, fallback) => {
    const i = argv.indexOf(`--${name}`);
    return i > -1 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : fallback;
  };
  const dir = path.resolve(ROOT, opt("dir", ".gen-candidates"));
  const out = path.resolve(ROOT, opt("out", path.join(path.relative(ROOT, dir), "sheets")));
  const only = opt("ids", null)?.split(",").map((s) => s.trim()).filter(Boolean);
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const byId = new Map(manifest.images.map((i) => [i.id, i]));
  const sharp = (await import("sharp")).default;
  if (!fs.existsSync(dir)) throw new Error(`후보 폴더가 없습니다: ${dir}`);
  const files = fs
    .readdirSync(dir)
    .map((name) => ({ name, parsed: parseCandidateName(name) }))
    .filter((f) => f.parsed && byId.has(f.parsed.id) && (!only || only.includes(f.parsed.id)))
    .sort((a, b) => (a.name < b.name ? -1 : 1));
  if (files.length === 0) throw new Error("검수할 후보(<id>-v<n>.webp)가 없습니다.");
  fs.mkdirSync(out, { recursive: true });
  const rows = [];
  const tiles = [];
  for (const f of files) {
    const item = byId.get(f.parsed.id);
    const file = path.join(dir, f.name);
    const meta = await sharp(file).metadata();
    const verdict = backgroundVerdict(item, await cornerMeans(sharp, file));
    rows.push(`${f.name}\t${item.family}\t${meta.width}x${meta.height}\t${verdict.ok === null ? "-" : verdict.ok ? "OK" : "반려 후보"}\t${verdict.note}`);
    tiles.push(await tile(sharp, file, item, `${f.parsed.id} ${f.parsed.variant} · ${item.family}`, verdict));
  }
  const COLS = 4;
  const PER = 12;
  const GAP = 12;
  for (let s = 0; s * PER < tiles.length; s++) {
    const part = tiles.slice(s * PER, s * PER + PER);
    const rowsN = Math.ceil(part.length / COLS);
    const sheet = path.join(out, `sheet-${s + 1}.png`);
    await sharp({ create: { width: GAP + COLS * (300 + GAP), height: GAP + rowsN * (264 + GAP), channels: 3, background: "#D1D6DB" } })
      .composite(part.map((input, k) => ({ input, left: GAP + (k % COLS) * (300 + GAP), top: GAP + Math.floor(k / COLS) * (264 + GAP) })))
      .png()
      .toFile(sheet);
    console.log(`[contact-sheet] ${path.relative(ROOT, sheet)}`);
  }
  console.log(`파일\tfamily\t크기\t배경\t수치\n${rows.join("\n")}`);
}

if (path.basename(process.argv[1] ?? "") === "contact-sheet.mjs") {
  main(process.argv.slice(2)).catch((err) => {
    console.error(`[contact-sheet] ${err.message}`);
    process.exit(1);
  });
}
