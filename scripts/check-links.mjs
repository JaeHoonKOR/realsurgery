// out/ 정적 산출물 검사: (1) 내부 href가 존재하는 파일을 가리키는가 (2) 카드([data-card])가 <a href> 안에 있는가
// 사용: node scripts/check-links.mjs [outDir=out] [basePath=/realsurgery]
import fs from "node:fs"; import path from "node:path";
const out = process.argv[2] || "out"; const base = (process.argv[3] ?? process.env.NEXT_PUBLIC_BASE_PATH ?? "/realsurgery").replace(/\/$/, "");
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".html") ? [path.join(d, e.name)] : []);
const files = walk(out); let bad = 0;
const exists = href => {
  let p = href.split(/[?#]/)[0]; if (base && p.startsWith(base)) p = p.slice(base.length); if (!p.startsWith("/")) return true;
  p = decodeURIComponent(p);
  return [path.join(out, p), path.join(out, p, "index.html"), path.join(out, p + ".html"), path.join(out, p.replace(/\/$/, "") + ".html")].some(f => fs.existsSync(f));
};
for (const f of files) {
  const html = fs.readFileSync(f, "utf8"); const rel = path.relative(out, f);
  for (const m of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) { const h = m[1]; if (/^(https?:|mailto:|tel:|#|javascript:)/.test(h)) continue; if (!exists(h)) { bad++; console.log(`${rel}: 깨진 링크 ${h}`); } }
  const cards = (html.match(/data-card\b/g) || []).length;
  const linkedCards = (html.match(/<a\b[^>]*>(?:(?!<\/a>)[\s\S])*?data-card\b/g) || []).length;
  if (cards > linkedCards) { bad += cards - linkedCards; console.log(`${rel}: 링크 없는 카드 ${cards - linkedCards}/${cards}`); }
  const imgs = (html.match(/<img\b/g) || []).length + (html.match(/<svg\b/g) || []).length;
  if (/<main\b/.test(html) && imgs < 2) { bad++; console.log(`${rel}: 이미지·SVG ${imgs}개 (최소 2)`); }
}
console.log(bad ? `FAIL ${bad}건` : `OK ${files.length} pages`); process.exit(bad ? 1 : 0);
