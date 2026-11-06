// 에셋 스크립트 공통 도구 (gen-image·brand-logo·og)
// - 색은 styles/tokens.css(단일 소스)에서 읽는다 → 토큰이 바뀌면 다시 생성만 하면 된다.
// - 글자는 Pretendard(OTF)를 opentype.js 로 윤곽선(path)으로 바꾼다 → <img>로 띄운 SVG도 폰트 설치와 관계없이 같은 모양.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const TOKENS_FILE = path.join(ROOT, "styles", "tokens.css");
export const FONT_DIR = path.join(ROOT, "node_modules", "pretendard", "dist", "public", "static");

/** "--color-ink-muted" → "inkMuted" */
function camel(name) {
  return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * tokens.css 의 `--color-<이름>: #hex;` 를 읽어 { canvas, surface, line, ink, inkMuted, brand, accent, accentStrong } 로 돌려준다.
 * @param {string} [css] tokens.css 내용(테스트용). 생략하면 파일을 읽는다.
 * @returns {Record<string, string>}
 */
export function readTokenColors(css = fs.readFileSync(TOKENS_FILE, "utf8")) {
  const colors = {};
  for (const m of css.matchAll(/--color-([a-z][a-z0-9-]*)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
    colors[camel(m[1])] = m[2].toLowerCase();
  }
  for (const need of ["canvas", "surface", "line", "ink", "inkMuted", "brand", "accent", "accentStrong"]) {
    if (!colors[need]) throw new Error(`[brand-kit] tokens.css 에 --color-${need.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)} 가 없습니다.`);
  }
  return colors;
}

const WEIGHT_FILE = { regular: "Pretendard-Regular.otf", semibold: "Pretendard-SemiBold.otf", bold: "Pretendard-Bold.otf" };
const fontCache = new Map();

/** @param {"regular"|"semibold"|"bold"} weight */
export function fontFile(weight = "bold") {
  const file = WEIGHT_FILE[weight];
  if (!file) throw new Error(`[brand-kit] 알 수 없는 굵기: ${weight}`);
  return path.join(FONT_DIR, file);
}

/** @param {"regular"|"semibold"|"bold"} weight */
export function loadFont(weight = "bold") {
  if (!fontCache.has(weight)) {
    const buf = fs.readFileSync(fontFile(weight));
    fontCache.set(weight, opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)));
  }
  return fontCache.get(weight);
}

/**
 * 글자를 SVG path 로 바꾼다.
 * @param {string} text
 * @param {{ size: number, x?: number, y?: number, weight?: "regular"|"semibold"|"bold", anchor?: "start"|"middle"|"end", letterSpacing?: number }} o
 *   y 는 글자 기준선(baseline). letterSpacing 은 글자 크기 대비 비율(-0.02 = -2%).
 * @returns {{ d: string, width: number, bbox: { x1: number, y1: number, x2: number, y2: number } }}
 */
export function textToPath(text, { size, x = 0, y = 0, weight = "bold", anchor = "start", letterSpacing = 0 }) {
  const font = loadFont(weight);
  const glyphs = font.stringToGlyphs(text);
  const scale = size / font.unitsPerEm;
  const track = letterSpacing * size;
  const advances = glyphs.map((g) => (g.advanceWidth ?? 0) * scale);
  const width = advances.reduce((a, b) => a + b, 0) + track * Math.max(0, glyphs.length - 1);
  let cursor = anchor === "middle" ? x - width / 2 : anchor === "end" ? x - width : x;
  const parts = [];
  const box = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity };
  glyphs.forEach((g, i) => {
    const p = g.getPath(cursor, y, size);
    const d = p.toPathData(2);
    if (d) {
      parts.push(d);
      const b = p.getBoundingBox();
      box.x1 = Math.min(box.x1, b.x1);
      box.y1 = Math.min(box.y1, b.y1);
      box.x2 = Math.max(box.x2, b.x2);
      box.y2 = Math.max(box.y2, b.y2);
    }
    cursor += advances[i] + track;
  });
  if (!parts.length) return { d: "", width, bbox: { x1: x, y1: y, x2: x, y2: y } };
  return { d: parts.join(""), width, bbox: box };
}

export function escapeXml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]);
}

/** 파일 쓰기(폴더 생성 + utf8 + 끝 줄바꿈) */
export function writeText(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content.endsWith("\n") ? content : `${content}\n`, "utf8");
}

/** 한국 시간 기준 오늘 날짜 YYYY-MM-DD (일일 생성 한도·매니페스트 날짜) */
export function todayKst(now = new Date()) {
  return now.toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}
