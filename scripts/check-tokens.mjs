// 디자인 토큰 가드 (docs/QUALITY.md 3절 "토큰 외 임의 값 금지")
// - styles/tokens.css 밖의 hex 색상 리터럴 금지
// - Tailwind 임의 값 클래스(p-[13px], bg-[#fff], max-w-[1120px] …) 금지
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIRS = ["app", "components", "styles"];
const EXT = new Set([".ts", ".tsx", ".css", ".mdx"]);
const TOKEN_FILE = path.join(ROOT, "styles", "tokens.css");

const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const ARBITRARY = /(?:^|[\s"'`{])(?:[a-z]+:)*-?[a-z][a-z0-9-]*-\[[^\]\s]+\]/g;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (EXT.has(path.extname(e.name))) out.push(p);
  }
  return out;
}

const violations = [];
for (const file of DIRS.flatMap((d) => walk(path.join(ROOT, d)))) {
  if (file === TOKEN_FILE) continue;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, i) => {
    const where = `${path.relative(ROOT, file)}:${i + 1}`;
    // HTML 엔티티(&#123;)·URL 앵커(href="#main")는 제외
    for (const m of line.matchAll(HEX)) {
      const before = line[m.index - 1];
      if (before === "&" || /["'(]$/.test(line.slice(0, m.index)) && /^#[a-z][a-z-]*$/i.test(m[0])) continue;
      violations.push(`${where} 토큰 밖 색상 ${m[0]}`);
    }
    if (/\.(tsx|mdx)$/.test(file)) {
      for (const m of line.matchAll(ARBITRARY)) violations.push(`${where} 임의 값 클래스 ${m[0].trim().replace(/^["'`{]/, "")}`);
    }
  });
}

if (violations.length) {
  console.error(`[check-tokens] 위반 ${violations.length}건\n${violations.join("\n")}`);
  process.exit(1);
}
console.log("[check-tokens] OK — 토큰 외 색상·임의 값 클래스 0건");
