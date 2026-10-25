// 빌드 산출물(out/) 정적 검사 (docs/QUALITY.md 1절 "이미지"·"링크")
// - 내부 링크·에셋(href/src)이 out/ 안의 실제 파일로 해석되는지 (깨진 내부 링크 0)
// - <img>: alt·width·height 필수, 래스터는 WebP/AVIF만
// - GA/Pixel 하드코딩 금지 (gtag( / fbq( / gtag.js / fbevents.js)
// - GitHub Pages용 .nojekyll 존재
import fs from "node:fs";
import path from "node:path";
import { OUT_DIR, detectBasePath } from "./serve-out.mjs";

const basePath = detectBasePath();
const problems = [];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function existsInOut(urlPath) {
  let rel;
  try {
    rel = decodeURIComponent(urlPath);
  } catch {
    return false;
  }
  const abs = path.join(OUT_DIR, rel);
  const candidates = rel.endsWith("/") ? [path.join(abs, "index.html")] : [abs, `${abs}.html`, path.join(abs, "index.html")];
  return candidates.some((c) => fs.existsSync(c) && fs.statSync(c).isFile());
}

const files = walk(OUT_DIR);
const htmlFiles = files.filter((f) => f.endsWith(".html"));

if (!fs.existsSync(path.join(OUT_DIR, ".nojekyll"))) problems.push("out/.nojekyll 없음 (GitHub Pages가 _next/ 를 무시함)");

for (const file of htmlFiles) {
  const rel = path.relative(OUT_DIR, file);
  const html = fs.readFileSync(file, "utf8");

  if (/gtag\(|fbq\(|googletagmanager\.com\/gtag\/js|connect\.facebook\.net\/[^"']*fbevents/.test(html)) {
    problems.push(`${rel}: GA/Pixel 하드코딩 감지`);
  }

  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const raw = m[1].replace(/&amp;/g, "&");
    if (/^(https?:|mailto:|tel:|data:|#|javascript:)/i.test(raw) || raw.startsWith("//")) continue;
    if (!raw.startsWith("/")) {
      problems.push(`${rel}: 상대 경로 링크 ${raw} (basePath 누락 위험)`);
      continue;
    }
    const pathname = raw.split(/[?#]/)[0];
    if (basePath && !(pathname === basePath || pathname.startsWith(`${basePath}/`))) {
      problems.push(`${rel}: basePath(${basePath}) 밖 내부 링크 ${raw}`);
      continue;
    }
    const inOut = basePath ? pathname.slice(basePath.length) || "/" : pathname;
    if (!existsInOut(inOut)) problems.push(`${rel}: 깨진 내부 링크 ${raw}`);
  }

  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0];
    const src = tag.match(/\ssrc="([^"]+)"/)?.[1] ?? "";
    if (!/\salt="/.test(tag)) problems.push(`${rel}: alt 없는 이미지 ${src}`);
    if (!/\swidth="\d+"/.test(tag) || !/\sheight="\d+"/.test(tag)) problems.push(`${rel}: width/height 없는 이미지 ${src}`);
    if (!/\.(webp|avif|svg)(\?|$)/i.test(src) && !src.startsWith("data:")) problems.push(`${rel}: WebP/AVIF/SVG 아닌 이미지 ${src}`);
  }
}

// 공유 미리보기 이미지(og:image·twitter:image)는 카카오톡·페이스북 호환을 위해 PNG 를 허용한다(<img> 로 쓰지 않음).
const SHARE_IMAGE = /(?:^|[\\/])(?:opengraph|twitter)-image(?:-[\w]+)?\.png$/i;
const rasterNotModern = files.filter(
  (f) => /\.(png|jpe?g|gif)$/i.test(f) && !f.includes(`${path.sep}_next${path.sep}`) && !SHARE_IMAGE.test(f),
);
for (const f of rasterNotModern) problems.push(`${path.relative(OUT_DIR, f)}: PNG/JPG/GIF 에셋 — WebP/AVIF로 변환 필요`);

if (problems.length) {
  console.error(`[check-out] 문제 ${problems.length}건\n${problems.join("\n")}`);
  process.exit(1);
}
console.log(`[check-out] OK — HTML ${htmlFiles.length}개, 깨진 내부 링크 0, 이미지 규칙 위반 0 (basePath "${basePath}")`);
