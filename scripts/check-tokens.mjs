// 디자인 토큰 가드 (docs/QUALITY.md 3절 "토큰 외 임의 값 금지")
// - styles/tokens.css 밖의 색 리터럴 금지: hex, 색 함수(rgb·hsl·hwb·lab·lch·oklab·oklch·color()), 이름 색(white·red …)
// - Tailwind 임의 값 클래스(p-[13px], bg-[#fff], max-w-[1120px] …)·토큰 밖 팔레트 색 클래스(text-white, bg-blue-500 …) 금지
// - TSX·MDX 인라인 style 의 숫자·길이 값(style={{ padding: 13 }}, zIndex: 10, "13px") 금지 — 0·var(--토큰)만 허용
// 검사 범위: app·components·lib·styles·content(MDX 콘텐츠) / 확장자 .ts .tsx .js .jsx .css .mdx
// 회귀 테스트: tests/unit/check-tokens.test.ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DIRS = ["app", "components", "lib", "styles", "content"];
export const EXT = [".ts", ".tsx", ".js", ".jsx", ".css", ".mdx"];

const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const ARBITRARY = /(?:^|[\s"'`{])(?:[a-z]+:)*-?[a-z][a-z0-9-]*-\[[^\]\s]+\]/g;
// URL 앵커 예외: `#` 이 href·id·to 값 안에 있을 때만.
//   href="#main"  href='/a#top'  href={"#main"}  href={`#main`}  xlink:href="#icon"
//   객체 리터럴(링크 목록 등): href: "#main"  (to: 는 그라디언트 { from, to } 색과 겹치므로 제외하지 않는다)
// 속성 이름 앞이 글자·하이픈이면 다른 속성이다(data-id, aria-…-id, data-href) → 예외 아님.
// 그 밖(color: "#fff", fill="#ffffff", '#abc', bg-[#fff] …)은 전부 위반이다.
const ANCHOR_CONTEXT = /(?:(?<![\w-])(?:href|id|to)\s*=\s*\{?\s*|(?<![\w-])href\s*:\s*)["'`][^"'`\s]*$/;

// 색 함수 리터럴. color() 는 색 공간 이름이 올 때만(일반 함수 호출 color(x) 오탐 방지).
const COLOR_FN =
  /(?<![\w$.-])(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(|(?<![\w$.-])color\(\s*(?:srgb|srgb-linear|display-p3|a98-rgb|prophoto-rgb|rec2020|xyz|xyz-d50|xyz-d65)\b/gi;

// CSS 이름 색 148개 (CSS Color Module Level 4). transparent·currentColor 는 색 값이 아닌 키워드라 허용.
const NAMED_COLORS = new Set(
  (
    "aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood " +
    "cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray " +
    "darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen " +
    "darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue " +
    "firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew " +
    "hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan " +
    "lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray " +
    "lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue " +
    "mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred " +
    "midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid " +
    "palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple " +
    "rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue " +
    "slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white " +
    "whitesmoke yellow yellowgreen"
  ).split(" "),
);
// CSS 선언 중 색을 받는 속성(사용자 정의 속성 --x 포함)
const CSS_COLOR_DECL =
  /(?<![\w-])(color|background(?:-color)?|border(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?(?:-color)?|outline(?:-color)?|fill|stroke|stop-color|flood-color|lighting-color|caret-color|accent-color|text-decoration(?:-color)?|column-rule(?:-color)?|box-shadow|text-shadow|--[\w-]+)\s*:\s*([^;{}]+)/g;
// JSX 색 속성과 JS 객체(style 등)의 색 속성 값
const JSX_COLOR_ATTR = /(?<![\w-])(fill|stroke|color|stopColor|floodColor|lightingColor)\s*=\s*\{?\s*(["'`])([^"'`]*)\2/g;
const JS_COLOR_PROP =
  /(?<![\w$-])(color|background|backgroundColor|border(?:Top|Right|Bottom|Left)?(?:Color)?|outline(?:Color)?|fill|stroke|stopColor|caretColor|accentColor|textDecorationColor|boxShadow|textShadow)\s*:\s*(["'`])([^"'`]*)\2/g;
// Tailwind 색 유틸리티 중 토큰이 아닌 팔레트 이름(tokens.css 가 --color-* 를 initial 로 지워 생성조차 안 되는 클래스)
const TW_PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black";
const TW_COLOR_CLASS = new RegExp(
  `(?<![\\w-])(?:[a-z0-9-]+:)*(?:bg|text|border(?:-[trblxyse])?|ring(?:-offset)?|outline|fill|stroke|decoration|divide|placeholder|caret|accent|from|via|to|shadow|inset-shadow|inset-ring)-(?:${TW_PALETTE})(?:-\\d{2,3})?(?:\\/\\d{1,3})?(?![\\w-])`,
  "g",
);

// 인라인 style 객체. style={{ … }} 가 여러 줄에 걸쳐도 잡는다.
const STYLE_BLOCK = /\bstyle\s*=\s*\{\{([\s\S]*?)\}\}/g;
const STYLE_VALUE = /(?:[A-Za-z_$][\w$-]*|"[^"]*"|'[^']*')\s*:\s*(-?(?:\d+\.?\d*|\.\d+)(?![\w.])|"[^"]*"|'[^']*'|`[^`]*`)/g;
const LENGTH = /(?:^|[^\w-])-?(?:\d+\.?\d*|\.\d+)(?:px|rem|em)\b/;

/** 값 문자열 안의 이름 색 단어(소문자)를 돌려준다. var(--…) 안의 이름은 토큰이므로 제외. */
function namedColorsIn(value) {
  const stripped = value.replace(/var\([^)]*\)/g, " ").replace(/url\([^)]*\)/g, " ");
  return (stripped.match(/[A-Za-z]+/g) ?? []).map((w) => w.toLowerCase()).filter((w) => NAMED_COLORS.has(w));
}

function lineOf(text, index) {
  let n = 1;
  for (let i = 0; i < index; i++) if (text.charCodeAt(i) === 10) n++;
  return n;
}

/**
 * 소스 텍스트 1개를 검사해 위반 목록을 돌려준다(파일 I/O 없음).
 * @param {string} text 파일 내용
 * @param {string} file 파일 경로(확장자로 CSS·TSX·MDX 전용 규칙을 켠다)
 * @returns {{ line: number, rule: "hex" | "color-fn" | "named-color" | "arbitrary" | "inline-style", value: string }[]}
 */
export function scanSource(text, file) {
  const css = /\.css$/.test(file);
  const jsx = /\.(tsx|jsx|mdx)$/.test(file);
  const out = [];
  text.split(/\r?\n/).forEach((line, i) => {
    const push = (rule, value) => out.push({ line: i + 1, rule, value });
    for (const m of line.matchAll(HEX)) {
      if (line[m.index - 1] === "&") continue; // HTML 엔티티 &#123;
      if (ANCHOR_CONTEXT.test(line.slice(0, m.index))) continue;
      push("hex", m[0]);
    }
    for (const m of line.matchAll(COLOR_FN)) push("color-fn", m[0].replace(/\s+/g, ""));
    if (css) {
      for (const m of line.matchAll(CSS_COLOR_DECL)) {
        for (const name of namedColorsIn(m[2])) push("named-color", `${m[1]}: ${name}`);
      }
    } else {
      for (const m of line.matchAll(JSX_COLOR_ATTR)) {
        for (const name of namedColorsIn(m[3])) push("named-color", `${m[1]}=${name}`);
      }
      for (const m of line.matchAll(JS_COLOR_PROP)) {
        for (const name of namedColorsIn(m[3])) push("named-color", `${m[1]}: ${name}`);
      }
    }
    if (jsx) {
      for (const m of line.matchAll(ARBITRARY)) push("arbitrary", m[0].trim().replace(/^["'`{]/, ""));
      for (const m of line.matchAll(TW_COLOR_CLASS)) push("named-color", m[0]);
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
    else if (EXT.includes(path.extname(e.name))) out.push(p);
  }
  return out;
}

const LABEL = {
  hex: "토큰 밖 색상",
  "color-fn": "토큰 밖 색 함수",
  "named-color": "토큰 밖 이름 색",
  arbitrary: "임의 값 클래스",
  "inline-style": "인라인 style 값",
};

/** 저장소(root)의 검사 대상 폴더를 훑어 "파일:줄 규칙 값" 문자열 목록을 돌려준다. */
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
  console.log(`[check-tokens] OK — ${DIRS.join("·")} 에서 토큰 외 색(hex·색 함수·이름 색)·임의 값 클래스·인라인 style 값 0건`);
}
