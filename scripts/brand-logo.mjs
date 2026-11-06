// 워드마크 로고 3안 × 3변형 (docs/design/IMAGES.md "로고: 워드마크 SVG, 3안 → 사람 선택, 단색·흑백 변형 포함")
// - a: 점 강조형 — 워드마크 + 코랄 반짝임
// - b: 심볼 결합형 — 틸 라운드 사각 심볼(접힘 선 + 점) + 워드마크
// - c: 곡선 밑줄형 — "리얼"(틸)·"성형"(잉크) + 코랄 곡선 밑줄
// 변형: color(기본) · mono(잉크 단색) · inverse(흰색 단색, 어두운 배경용)
// 글자는 Pretendard Bold 윤곽선(path) → 폰트 설치와 무관하게 같은 모양. 색은 styles/tokens.css 에서 읽는다.
// 사용: node scripts/brand-logo.mjs  → public/brand/logo-<a|b|c>[-mono|-inverse].svg
// 헤더 적용은 T-100c(사람이 1안 선택 후).
import path from "node:path";
import { ROOT, readTokenColors, textToPath, writeText } from "./brand-kit.mjs";

export const BRAND_DIR = path.join(ROOT, "public", "brand");
export const OPTIONS = ["a", "b", "c"];
export const VARIANTS = ["color", "mono", "inverse"];
export const WORDMARK = "리얼성형";

const SIZE = 56;
const BASELINE = 60;
const PAD = 4;

function paletteFor(variant, c) {
  if (variant === "mono") return { brand: c.ink, ink: c.ink, accent: c.ink, cut: null };
  if (variant === "inverse") return { brand: c.surface, ink: c.surface, accent: c.surface, cut: null };
  return { brand: c.brand, ink: c.ink, accent: c.accent, cut: c.surface };
}

function sparkle(cx, cy, r, fill) {
  const k = r * 0.28;
  return `<path d="M${cx} ${cy - r}Q${cx + k} ${cy - k} ${cx + r} ${cy}Q${cx + k} ${cy + k} ${cx} ${cy + r}Q${cx - k} ${cy + k} ${cx - r} ${cy}Q${cx - k} ${cy - k} ${cx} ${cy - r}Z" fill="${fill}"/>`;
}

const r1 = (n) => Math.round(n * 10) / 10;

function wrap(option, variant, w, h, body) {
  const label = `${WORDMARK} 로고`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${r1(w)}" height="${r1(h)}" viewBox="0 0 ${r1(w)} ${r1(h)}" role="img" aria-label="${label}" data-logo="${option}-${variant}"><title>${label}</title>${body}</svg>`;
}

/**
 * @param {"a"|"b"|"c"} option
 * @param {"color"|"mono"|"inverse"} variant
 * @param {Record<string,string>} [c] tokens.css 색
 */
export function logoSvg(option, variant = "color", c = readTokenColors()) {
  const p = paletteFor(variant, c);
  if (option === "a") {
    const t = textToPath(WORDMARK, { size: SIZE, x: PAD, y: BASELINE, letterSpacing: -0.02 });
    const sx = t.bbox.x2 + 12;
    const sy = t.bbox.y1 + 6;
    const w = sx + 12 + PAD;
    const h = t.bbox.y2 + PAD;
    const body = `<path d="${t.d}" fill="${p.brand}" transform="translate(0 ${r1(-t.bbox.y1 + PAD + 6)})"/>${sparkle(r1(sx), r1(sy - t.bbox.y1 + PAD + 6), 11, p.accent)}`;
    return wrap(option, variant, w, h - t.bbox.y1 + PAD + 6, body);
  }
  if (option === "b") {
    const mark = 60;
    const t = textToPath(WORDMARK, { size: SIZE - 4, x: PAD + mark + 16, y: 0, letterSpacing: -0.02 });
    const textH = t.bbox.y2 - t.bbox.y1;
    const h = mark + PAD * 2;
    const dy = PAD + (mark - textH) / 2 - t.bbox.y1;
    const w = t.bbox.x2 + PAD;
    const arc = `M${PAD + 14} ${PAD + 28}Q${PAD + 30} ${PAD + 46} ${PAD + 46} ${PAD + 28}`;
    const dot = { cx: PAD + 44, cy: PAD + 16, r: 5 };
    let symbol;
    if (p.cut) {
      symbol =
        `<rect x="${PAD}" y="${PAD}" width="${mark}" height="${mark}" rx="18" fill="${p.brand}"/>` +
        `<path d="${arc}" stroke="${p.cut}" stroke-width="6" stroke-linecap="round" fill="none"/>` +
        `<circle cx="${dot.cx}" cy="${dot.cy}" r="${dot.r}" fill="${p.accent}"/>`;
    } else {
      // 단색: 심볼 안 선·점을 잘라낸 모양(mask) → 한 가지 색만 쓴다
      const id = `cut-${variant}`;
      symbol =
        `<mask id="${id}"><rect x="${PAD}" y="${PAD}" width="${mark}" height="${mark}" rx="18" fill="#fff"/>` +
        `<path d="${arc}" stroke="#000" stroke-width="6" stroke-linecap="round" fill="none"/>` +
        `<circle cx="${dot.cx}" cy="${dot.cy}" r="${dot.r}" fill="#000"/></mask>` +
        `<rect x="${PAD}" y="${PAD}" width="${mark}" height="${mark}" rx="18" fill="${p.brand}" mask="url(#${id})"/>`;
    }
    return wrap(option, variant, w, h, `${symbol}<path d="${t.d}" fill="${p.ink}" transform="translate(0 ${r1(dy)})"/>`);
  }
  if (option === "c") {
    const a = textToPath("리얼", { size: SIZE, x: PAD, y: BASELINE, letterSpacing: -0.02 });
    const b = textToPath("성형", { size: SIZE, x: a.bbox.x2 + 4, y: BASELINE, letterSpacing: -0.02 });
    const top = Math.min(a.bbox.y1, b.bbox.y1);
    const dy = -top + PAD;
    const x1 = PAD + 2;
    const x2 = b.bbox.x2 - 2;
    const yBase = Math.max(a.bbox.y2, b.bbox.y2) + dy + 8;
    const curve = `M${r1(x1)} ${r1(yBase)}Q${r1((x1 + x2) / 2)} ${r1(yBase + 14)} ${r1(x2)} ${r1(yBase)}`;
    const w = b.bbox.x2 + PAD;
    const h = yBase + 14 + PAD;
    return wrap(
      option,
      variant,
      w,
      h,
      `<g transform="translate(0 ${r1(dy)})"><path d="${a.d}" fill="${p.brand}"/><path d="${b.d}" fill="${p.ink}"/></g>` +
        `<path d="${curve}" stroke="${p.accent}" stroke-width="5" stroke-linecap="round" fill="none"/>`,
    );
  }
  throw new Error(`[brand-logo] 알 수 없는 안: ${option}`);
}

export function logoFileName(option, variant) {
  return `logo-${option}${variant === "color" ? "" : `-${variant}`}.svg`;
}

export function writeLogos(outDir = BRAND_DIR, colors = readTokenColors()) {
  const files = [];
  for (const o of OPTIONS) {
    for (const v of VARIANTS) {
      const f = path.join(outDir, logoFileName(o, v));
      writeText(f, logoSvg(o, v, colors));
      files.push(f);
    }
  }
  return files;
}

if (path.basename(process.argv[1] ?? "") === "brand-logo.mjs") {
  const files = writeLogos();
  console.log(`[brand-logo] ${files.length}개 → ${path.relative(ROOT, BRAND_DIR)}`);
}
