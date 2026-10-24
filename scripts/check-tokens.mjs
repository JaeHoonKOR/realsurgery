// 디자인 토큰 가드 (docs/QUALITY.md 3절 "토큰 외 임의 값 금지")
// - styles/tokens.css 밖의 hex 색상 리터럴 금지
// - Tailwind 임의 값 클래스(p-[13px], bg-[#fff], max-w-[1120px] …) 금지
// - TSX·MDX 인라인 style 의 숫자·길이 값(style={{ padding: 13 }}, "13px") 금지 — 0·var(--토큰)만 허용
// 회귀 테스트: tests/unit/check-tokens.test.ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIRS = ["app", "components", "styles"];
const EXT = new Set([".ts", ".tsx", ".css", ".mdx"]);

const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const ARBITRARY = /(?:^|[\s"'`{])(?:[a-z]+:)*-?[a-z][a-z0-9-]*-\[[^\]\s]+\]/g;
// URL 앵커 예외: `#` 이 href·id·to 값 안에 있을 때만.
//   href="#main"  href='/a#top'  href={"#main"}  href={`#main`}  xlink:href="#icon"
//   객체 리터럴(링크 목록 등): href: "#main"  (to: 는 그라디언트 { from, to } 색과 겹치므로 제외하지 않는다)
// 그 밖(color: "#fff", fill="#ffffff", '#abc', bg-[#fff] …)은 전부 위반이다.
const ANCHOR_CONTEXT = /(?:\b(?:href|id|to)\s*=\s*\{?\s*|\bhref\s*:\s*)["'`][^"'`\s]*$/;
// 인라인 style 객체. style={{ … }} 가 여러 줄에 걸쳐도 잡는다.
const STYLE_BLOCK = /\bstyle\s*=\s*\{\{([\s\S]*?)\}\}/g;
const STYLE_VALUE = /(?:[A-Za-z_$][\w$-]*|"[^"]*"|'[^']*')\s*:\s*(-?(?:\d+\.?\d*|\.\d+)(?![\w.])|"[^"]*"|'[^']*'|`[^`]*`)/g;
const LENGTH = /(?:^|[^\w-])-?(?:\d+\.?\d*|\.\d+)(?:px|rem|em)\b/;

function lineOf(text, index) {
  let n = 1;
  for (let i = 0; i < index; i++) if (text.charCodeAt(i) === 10) n++;
  return n;
}

/**
 * 소스 텍스트 1개를 검사해 위반 목록을 돌려준다(파일 I/O 없음).
 * @param {string} text 파일 내용
 * @param {string} file 파일 경로(확장자로 TSX·MDX 전용 규칙을 켠다)
 * @returns {{ line: number, rule: "hex" | "arbitrary" | "inline-style", value: string }[]}
 */
export function scanSource(text, file) {
  const jsx = /\.(tsx|mdx)$/.test(file);
  const out = [];
  text.split(/\r?\n/).forEach((line, i) => {
    for (const m of line.matchAll(HEX)) {
      if (line[m.index - 1] === "&") continue; // HTML 엔티티 &#123;
      if (ANCHOR_CONTEXT.test(line.slice(0, m.index))) continue;
      out.push({ line: i + 1, rule: "hex", value: m[0] });
    }
    if (jsx) {
      for (const m of line.matchAll(ARBITRARY)) {
        out.push({ line: i + 1, rule: "arbitrary", value: m[0].trim().replace(/^["'`{]/, "") });
      }
    }
  });
  if (jsx) {
    for (const block of text.matchAll(STYLE_BLOCK)) {
      const bodyStart = block.index + block[0].indexOf("{{") + 2;
      for (const v of block[1].matchAll(STYLE_VALUE)) {
        const raw = v[1];
        const quoted = /^["'`]/.test(raw);
        const bad = quoted ? LENGTH.test(raw.slice(1, -1)) : Number(raw) !== 0;
        if (!bad) continue;
        const at = bodyStart + v.index + v[0].lastIndexOf(raw);
        out.push({ line: lineOf(text, at), rule: "inline-style", value: v[0].trim() });
      }
    }
  }
  return out.sort((a, b) => a.line - b.line);
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (EXT.has(path.extname(e.name))) out.push(p);
  }
  return out;
}

const LABEL = { hex: "토큰 밖 색상", arbitrary: "임의 값 클래스", "inline-style": "인라인 style 값" };

/** 저장소(root)의 app·components·styles 를 검사해 "파일:줄 규칙 값" 문자열 목록을 돌려준다. */
export function checkTokens(root = ROOT) {
  const tokenFile = path.join(root, "styles", "tokens.css");
  const violations = [];
  for (const file of DIRS.flatMap((d) => walk(path.join(root, d)))) {
    if (file === tokenFile) continue;
    const rel = path.relative(root, file);
    for (const v of scanSource(fs.readFileSync(file, "utf8"), file)) {
      violations.push(`${rel}:${v.line} ${LABEL[v.rule]} ${v.value}`);
    }
  }
  return violations;
}

if (path.basename(process.argv[1] ?? "") === "check-tokens.mjs") {
  const violations = checkTokens();
  if (violations.length) {
    console.error(`[check-tokens] 위반 ${violations.length}건\n${violations.join("\n")}`);
    process.exit(1);
  }
  console.log("[check-tokens] OK — 토큰 외 색상·임의 값 클래스·인라인 style 값 0건");
}
