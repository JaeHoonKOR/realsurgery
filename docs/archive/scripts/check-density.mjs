// 375×667 스크롤 구간별 비텍스트 요소(img, svg, canvas, video, [data-visual]) 수를 센다. 최소 2 미만 구간이 있으면 실패.
// 사용: node scripts/check-density.mjs <url> [minPerViewport=2]
import { chromium } from "playwright";
const url = process.argv[2]; const min = Number(process.argv[3] ?? 2);
if (!url) { console.error("usage: node scripts/check-density.mjs <url>"); process.exit(1); }
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 375, height: 667 } });
await p.goto(url, { waitUntil: "networkidle" }); await p.waitForTimeout(500);
const r = await p.evaluate(min => {
  const H = document.documentElement.scrollHeight, vh = 667, els = [...document.querySelectorAll("img,svg,canvas,video,[data-visual]")].filter(e => { const b = e.getBoundingClientRect(); return b.width >= 24 && b.height >= 24; });
  const tops = els.map(e => e.getBoundingClientRect().top + window.scrollY); const out = [];
  for (let y = 0; y < H; y += vh) { const n = tops.filter(t => t >= y && t < y + vh).length; out.push({ from: y, to: Math.min(y + vh, H), n, ok: n >= min }); }
  return out;
}, min);
await b.close();
r.forEach(s => console.log(`${s.ok ? "ok  " : "FAIL"} ${s.from}-${s.to}px: ${s.n}`));
const bad = r.filter(s => !s.ok).length; console.log(bad ? `FAIL ${bad} 구간` : "OK"); process.exit(bad ? 1 : 0);
