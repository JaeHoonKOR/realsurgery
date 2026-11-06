// 의료광고 금지 표현 검사 (docs/legal/MEDICAL-AD.md 3절, 원본 규칙 docs/archive/specs/95-legal-ops.md 3-1).
// 화면에 보일 수 있는 문자열만 본다: app·components·lib·content 의 코드(주석 제외)와 data/seed JSON 의 문자열 값.
// 판정 단위는 문장(마침표·물음표·느낌표·줄바꿈으로 자른 구간). 허용 문맥에 걸리면 통과.
// 사용: node scripts/lint-medical.mjs            저장소 전체 검사, 위반 있으면 exit 1 (pnpm lint 에 포함)
//       node scripts/lint-medical.mjs --hook     PostToolUse hook: 방금 쓴 파일만 검사, 위반 있으면 exit 2
// 회귀 테스트: tests/unit/lint-medical.test.ts
import fs from "node:fs";
import path from "node:path";

export const DIRS = ["app", "components", "lib", "content", "data/seed"];
export const EXT = [".tsx", ".ts", ".mdx", ".md", ".json"];

/** [코드, 이름, 금지 정규식, 허용 문맥(문장 전체에 대해) 또는 null, 추가 조건] */
export const RULES = [
  ["B01", "효과 보장", /보장|완치|완벽|(?<!불)확실|책임\s*집도|100\s*%/i, /(개인정보|권리|보호|품질|보안)\s*\S*\s*보장/, (s, m) => !/100\s*%/.test(m) || /효과|만족|성공|안전|보장/.test(s)],
  ["B02", "부작용·통증 부정", /부작용\s*(이\s*)?(없|0|제로)|흉터\s*(가\s*)?(없|걱정\s*없|제로)|통증\s*(이\s*)?없|무통|안전한\s*시술|무사고/i, null],
  ["B03", "최상급·순위", /최고|최초|유일|\d\s*위(?!치|험|생)|No\.?\s*1\b|넘버\s*원|명품|기적|평생|전문\s*병원|특화/i, /성형외과\s*전문의/],
  ["B04", "회복 단정", /즉시\s*회복|바로\s*회복|당일\s*복귀|다음\s*날\s*(바로\s*)?출근|\d+\s*일(이)?면\s*(회복|완치|일상)/i, /\[출처|\[\^|<sup/],
  ["B05", "전후 사진·비교", /전후\s*(사진|비교)|비포\s*(&|앤)?\s*애프터|before\s*[/&]?\s*(and\s*)?after|B&A/i, /전후\s*(주의사항|준비|관리|체크리스트)/],
  ["B06", "치료경험담·평점", /(리얼|실제|솔직)\s*후기|체험담|후기\s*\d|평점|별점|만족도\s*\d|환자들이\s*말하는|받아\s*본\s*사람|해\s*보니|만족했다는/i, null],
  ["B07", "비교·비방", /타\s*병원보다|다른\s*병원(은|보다)|보다\s*(저렴|싸|안전)|싼\s*병원/i, null],
  ["B08", "할인·유인", /반값|최저가|\d+\s*%\s*할인|할인가|이벤트\s*가|선착순|무료\s*(시술|체험)|1\s*\+\s*1|(동반|친구)\s*할인|상담만\s*해도/i, null],
  ["B09", "인증·추천·유명인", /연예인|셀럽|인플루언서|(추천|인증)\s*병원|수상|(의사|전문의)가\s*말하는|원장(님)?\s*(추천|인터뷰)|의사\s*인터뷰/i, /출처/],
  ["B10", "외모 열등·성형 조장", /못생|콤플렉스\s*탈출|여신|꿀벅지|도자기\s*피부|(처진|작은|낮은)\s*\S+\s*때문에/i, null],
  ["B13", "가격 표기", /평균|최저|최소|중앙값|대표\s*가격|부터/i, null, (s) => /\d\s*(만\s*)?원/.test(s)],
];

/** 코드 파일에서 주석을 지운다(줄 수는 유지). URL 의 // 는 지우지 않는다. */
export function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, (m) => m.replace(/[^\n]/g, " "));
}

/** JSON 에서 문자열 값만 꺼내 [줄번호, 문자열] 목록으로. 키는 검사하지 않는다. 파싱 실패면 줄 단위로 본다. */
function jsonStrings(text) {
  const lines = text.split("\n");
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return lines.map((l, i) => [i + 1, l]);
  }
  const values = [];
  const visit = (v) => {
    if (typeof v === "string") values.push(v);
    else if (Array.isArray(v)) v.forEach(visit);
    else if (v && typeof v === "object") Object.values(v).forEach(visit);
  };
  visit(data);
  return values.map((v) => {
    const needle = JSON.stringify(v);
    const i = lines.findIndex((l) => l.includes(needle) && !new RegExp(`${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:`).test(l));
    return [i >= 0 ? i + 1 : 1, v];
  });
}

/** 텍스트 1줄을 문장으로 자른다. */
const sentences = (line) => line.split(/(?<=[.!?。])\s+|[|]/).filter((s) => s.trim());

/**
 * @param {string} text 파일 내용
 * @param {string} file 파일 경로(확장자로 방식 결정)
 * @returns {{ line: number, code: string, name: string, word: string, sentence: string }[]}
 */
export function scanText(text, file) {
  const units = file.endsWith(".json")
    ? jsonStrings(text)
    : stripComments(text)
        .split("\n")
        .map((l, i) => [i + 1, l]);
  const found = [];
  for (const [line, raw] of units) {
    if (!/[가-힣]|before|B&A|No\.?\s*1/i.test(raw)) continue;
    for (const s of sentences(raw)) {
      for (const [code, name, re, allow, extra] of RULES) {
        const m = s.match(re);
        if (!m) continue;
        if (allow && allow.test(s)) continue;
        if (extra && !extra(s, m[0])) continue;
        found.push({ line, code, name, word: m[0], sentence: s.trim().slice(0, 80) });
      }
    }
  }
  return found;
}

export function inScope(rel) {
  const p = rel.replace(/\\/g, "/");
  return DIRS.some((d) => p === d || p.startsWith(`${d}/`)) && EXT.includes(path.extname(p));
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

/** 저장소 전체 검사. 위반 줄 목록(문자열)을 돌려준다. */
export function lintRepo(root = process.cwd()) {
  const lines = [];
  for (const d of DIRS) {
    for (const abs of walk(path.join(root, d))) {
      const rel = path.relative(root, abs).replace(/\\/g, "/");
      for (const v of scanText(fs.readFileSync(abs, "utf8"), rel))
        lines.push(`${rel}:${v.line}: ${v.code} ${v.name} "${v.word}" → ${v.sentence}`);
    }
  }
  return lines;
}

function hook() {
  let input;
  try {
    input = JSON.parse(fs.readFileSync(0, "utf8"));
  } catch {
    process.exit(0);
  }
  // C:\rs 는 한글 경로를 가리키는 정션이라, 프로젝트 경로와 파일 경로의 표기가 다를 수 있다 → 실제 경로로 맞춘다
  const real = (p) => fs.realpathSync.native(p);
  const root = real(process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd());
  const file = String(input?.tool_input?.file_path ?? "");
  if (!file || !fs.existsSync(file)) process.exit(0);
  const abs = real(file);
  const rel = path.relative(root, abs).replace(/\\/g, "/");
  if (!inScope(rel)) process.exit(0);
  const found = scanText(fs.readFileSync(abs, "utf8"), rel);
  if (!found.length) process.exit(0);
  process.stderr.write(
    `의료광고 금지 표현 ${found.length}건 — docs/legal/MEDICAL-AD.md 3절대로 고치세요.\n` +
      found.map((v) => `${rel}:${v.line}: ${v.code} ${v.name} "${v.word}" → ${v.sentence}`).join("\n") +
      "\n",
  );
  process.exit(2);
}

if (path.basename(process.argv[1] ?? "") === "lint-medical.mjs") {
  if (process.argv.includes("--hook")) hook();
  else {
    const lines = lintRepo();
    if (lines.length) {
      console.error(`[lint-medical] 의료광고 금지 표현 ${lines.length}건 (docs/legal/MEDICAL-AD.md 3절)\n${lines.join("\n")}`);
      process.exit(1);
    }
    console.log("[lint-medical] OK — 의료광고 금지 표현 0건");
  }
}
