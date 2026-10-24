// 시술 가이드 MDX (content/procedures/<id>.mdx) — 파싱·린트. 템플릿·규칙 문서: docs/content/procedure-mdx.md
// - build-data.mjs 가 MDX 를 procedures·procedure_faqs 행으로 바꾸고(content_mdx = 파일 전체), validateTables 에서 이 린트를 돌린다.
// - scripts/lint-medical.mjs 는 같은 린트를 파일 단위로 돌리는 CLI(content lane VERIFY 용).
// 회귀 테스트: tests/unit/procedure-mdx.test.ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { formatPriceRange, formatWon, procedureTitle } from "../lib/format.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const PROCEDURES_DIR = path.join(ROOT, "content", "procedures");

/** 본문 H2 5개 고정(4절 P-03 본문 섹션). id 는 앵커(#guide-who …)·목차에 쓴다. */
export const SECTIONS = [
  { id: "who", label: "누가 받나", re: /누가/ },
  { id: "cost", label: "비용은 얼마", re: /비용|가격/ },
  { id: "recovery", label: "회복은 며칠", re: /회복/ },
  { id: "risks", label: "부작용·주의", re: /부작용|주의/ },
  { id: "compare", label: "비슷한 시술 비교", re: /비교|차이|다른가|비슷한/ },
];

/** schema.org MedicalProcedure.procedureType (6절 JSON-LD) */
export const PROCEDURE_TYPES = {
  surgical: "https://schema.org/SurgicalProcedure",
  noninvasive: "https://schema.org/NoninvasiveProcedure",
  percutaneous: "https://schema.org/PercutaneousProcedure",
};

const REQUIRED = [
  "name",
  "slug",
  "category",
  "summary",
  "description",
  "price_low",
  "price_high",
  "duration_min",
  "recovery_days",
  "anesthesia",
  "procedure_type",
  "body_location",
  "preparation",
  "author",
  "updated_at",
  "sources",
  "faqs",
];
const OPTIONAL = ["price_note", "medical_reviewer", "unverified_facts"];

/** 요약 박스 칸 — unverified_facts 에 넣을 수 있는 값(출처로 확인 못 한 칸은 화면·JSON-LD 에 "출처 검증 전") */
export const FACT_KEYS = ["price", "duration", "recovery", "anesthesia"];
const FACT_FIELDS = { price: ["price_low", "price_high"], duration: ["duration_min"], recovery: ["recovery_days"], anesthesia: ["anesthesia"] };
const KNOWN = new Set([...REQUIRED, ...OPTIONAL]);

export const SITE_NAME = "리얼성형"; // lib/site.ts SITE.name 과 같아야 한다(title 길이 계산용)
export const TITLE_MAX = 60;
export const DESCRIPTION_RANGE = [120, 150];
export const FAQ_RANGE = [5, 8];
export const MIN_SOURCES = 3;

const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CITE_RE = /\[(\d{1,2})\](?![(:])/g;

/** "---\n yaml \n---\n body" 분리. 형식이 틀리면 null. */
export function splitFrontmatter(source) {
  const text = source.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  return m ? { yaml: m[1], body: m[2] } : null;
}

/**
 * MDX 원문 → { frontmatter, body, sections, problems }.
 * sections = 본문 H2 [{ id, title }] (SECTIONS 순서로 id 부여), problems = 형식 문제(파일 단위 린트).
 */
export function parseProcedureMdx(source) {
  const problems = [];
  const parts = splitFrontmatter(source);
  if (!parts) return { frontmatter: null, body: "", sections: [], problems: ["프런트매터(--- … ---)가 파일 맨 앞에 없음"] };
  let frontmatter = null;
  try {
    frontmatter = parseYaml(parts.yaml, { schema: "core" });
  } catch (err) {
    problems.push(`프런트매터 YAML 오류: ${err.message.split("\n")[0]}`);
  }
  if (!frontmatter || typeof frontmatter !== "object" || Array.isArray(frontmatter)) {
    if (!problems.length) problems.push("프런트매터가 객체가 아님");
    return { frontmatter: null, body: parts.body, sections: [], problems };
  }
  const sections = [];
  for (const line of parts.body.split("\n")) {
    const h2 = line.match(/^##\s+(.+?)\s*$/);
    if (h2 && !line.startsWith("###")) sections.push({ id: SECTIONS[sections.length]?.id ?? `extra-${sections.length + 1}`, title: h2[1] });
  }
  return { frontmatter, body: parts.body, sections, problems };
}

/** 기관 첫 화면(경로·쿼리 없음)은 각주 문장을 확인할 수 없는 출처다(리뷰 T-103 r1 반려 3) */
const isSiteRoot = (url) => {
  try {
    const u = new URL(url);
    return u.pathname.replace(/\/+$/, "") === "" && !u.search;
  } catch {
    return false;
  }
};
const isInt = (v) => Number.isInteger(v) && v >= 0;
const isIntOrNull = (v) => v === null || isInt(v);
const nonEmpty = (v) => typeof v === "string" && v.trim().length > 0;
const firstSentence = (p) => (p.split(/(?<=[.?!])\s+/)[0] ?? "").trim();

/** 프런트매터 스키마 검사 */
function lintFrontmatter(fm, bad) {
  for (const k of Object.keys(fm)) if (!KNOWN.has(k)) bad(`알 수 없는 프런트매터 키 "${k}" (허용: ${[...KNOWN].join(", ")})`);
  for (const k of REQUIRED) if (!(k in fm)) bad(`프런트매터 "${k}" 없음`);

  for (const k of ["name", "summary", "description", "anesthesia", "body_location", "preparation", "author"]) {
    if (k in fm && !nonEmpty(fm[k])) bad(`${k} 는 비어 있지 않은 문자열`);
  }
  if ("slug" in fm && !(typeof fm.slug === "string" && /^[0-9a-z가-힣]+(?:-[0-9a-z가-힣]+)*$/.test(fm.slug))) bad(`slug 형식 오류 (${fm.slug}) — 한글·소문자·숫자·하이픈`);
  if ("category" in fm && !(typeof fm.category === "string" && ID_RE.test(fm.category))) bad(`category 는 카테고리 id (예: eye)`);
  for (const k of ["price_low", "price_high", "duration_min", "recovery_days"]) {
    if (k in fm && !isIntOrNull(fm[k])) bad(`${k} 는 0 이상 정수 또는 null`);
  }
  if (isInt(fm.price_low) && isInt(fm.price_high) && fm.price_low > fm.price_high) bad("price_low > price_high");
  if ("price_note" in fm && fm.price_note !== null && !nonEmpty(fm.price_note)) bad("price_note 는 문자열 또는 null");
  if ("procedure_type" in fm && !(fm.procedure_type in PROCEDURE_TYPES)) bad(`procedure_type 은 ${Object.keys(PROCEDURE_TYPES).join(" | ")}`);
  if ("medical_reviewer" in fm && fm.medical_reviewer !== null && !nonEmpty(fm.medical_reviewer)) bad("medical_reviewer 는 저자 id 또는 null");
  if ("updated_at" in fm && !(typeof fm.updated_at === "string" && DATE_RE.test(fm.updated_at) && !Number.isNaN(Date.parse(fm.updated_at)))) {
    bad(`updated_at 은 "YYYY-MM-DD" 문자열 (따옴표로 감싸기)`);
  }
  if ("unverified_facts" in fm) {
    const u = fm.unverified_facts;
    if (!Array.isArray(u) || u.some((k) => !FACT_KEYS.includes(k)) || new Set(u).size !== u.length) {
      bad(`unverified_facts 는 ${FACT_KEYS.join(" | ")} 중복 없는 배열`);
    } else {
      for (const k of u) {
        if (FACT_FIELDS[k].every((f) => fm[f] === null || fm[f] === undefined)) bad(`unverified_facts "${k}" — 값이 없는 칸(null)은 넣지 않는다`);
      }
    }
  }

  if (nonEmpty(fm.name) && typeof fm.updated_at === "string") {
    const title = `${procedureTitle(fm.name, fm.updated_at)} | ${SITE_NAME}`;
    if (title.length > TITLE_MAX) bad(`title ${title.length}자 > ${TITLE_MAX}자 (${title})`);
  }
  if (nonEmpty(fm.description)) {
    const n = fm.description.trim().length;
    if (n < DESCRIPTION_RANGE[0] || n > DESCRIPTION_RANGE[1]) bad(`description ${n}자 — ${DESCRIPTION_RANGE[0]}~${DESCRIPTION_RANGE[1]}자`);
  }
  if (nonEmpty(fm.summary)) {
    const sentences = fm.summary.trim().split(/(?<=[.?!])\s+/).filter(Boolean).length;
    if (sentences < 2 || sentences > 3) bad(`summary(직답)는 2~3문장 (지금 ${sentences}문장)`);
  }

  // 요약 박스 가격 = summary = 가격 FAQ (3중 일치)
  const range = formatPriceRange(fm.price_low, fm.price_high);
  if (range && nonEmpty(fm.summary) && !fm.summary.includes(range)) bad(`summary 에 가격 범위 "${range}" 가 그대로 없음(요약 박스와 같은 표기)`);

  if (!Array.isArray(fm.sources)) {
    if ("sources" in fm) bad("sources 는 배열");
  } else {
    if (fm.sources.length < MIN_SOURCES) bad(`출처(sources) ${MIN_SOURCES}개 이상 (지금 ${fm.sources.length}개)`);
    const urls = new Set();
    fm.sources.forEach((s, i) => {
      if (!s || !nonEmpty(s.title)) bad(`sources[${i}].title 없음`);
      if (!s || typeof s.url !== "string" || !/^https:\/\/[^\s]+$/.test(s.url)) bad(`sources[${i}].url 은 https (${s?.url})`);
      else if (urls.has(s.url)) bad(`sources[${i}].url 중복`);
      else if (isSiteRoot(s.url)) bad(`sources[${i}].url 이 사이트 첫 화면(${s.url}) — 각주 문장의 내용이 적힌 구체 페이지 URL 로`);
      else urls.add(s.url);
    });
  }

  if (!Array.isArray(fm.faqs)) {
    if ("faqs" in fm) bad("faqs 는 배열");
  } else {
    if (fm.faqs.length < FAQ_RANGE[0] || fm.faqs.length > FAQ_RANGE[1]) bad(`faqs ${FAQ_RANGE[0]}~${FAQ_RANGE[1]}개 (지금 ${fm.faqs.length}개)`);
    fm.faqs.forEach((f, i) => {
      if (!f || !nonEmpty(f.question) || !nonEmpty(f.answer)) bad(`faqs[${i}] question·answer 필수`);
      else if (!/[?？]$/.test(f.question.trim())) bad(`faqs[${i}].question 은 실제 검색 질문 형태(물음표로 끝남)`);
    });
    if (isInt(fm.price_low) && isInt(fm.price_high)) {
      const priceFaq = fm.faqs.find((f) => f && /가격|비용/.test(f.question ?? ""));
      if (!priceFaq) bad("가격(비용)을 묻는 FAQ 가 없음");
      else {
        for (const v of [formatWon(fm.price_low), formatWon(fm.price_high)]) {
          if (!String(priceFaq.answer).includes(v)) bad(`가격 FAQ 답변에 "${v}" 가 없음(요약 박스 가격과 같은 표기)`);
        }
      }
    }
  }
}

/** 본문 규칙 검사(AEO: H2 5개 고정·질문형·바로 아래 직답 문단·출처 각주) */
function lintBody(body, fm, sections, bad) {
  const lines = body.split("\n");
  const sourceCount = Array.isArray(fm.sources) ? fm.sources.length : 0;

  if (/^#\s/m.test(body)) bad("본문에 H1(# ) 금지 — H1 은 시술명으로 화면이 만든다");
  if (/^\s*(?:import|export)\s/m.test(body)) bad("본문에 import·export 금지(순수 마크다운 + 표만)");
  if (/<[A-Za-z/!]/.test(body)) bad("본문에 HTML·JSX 태그 금지(주석은 {/* MD-REVIEW: … */})");
  if (/[{}]/.test(body.replace(/\{\/\*[\s\S]*?\*\/\}/g, ""))) bad("본문에 { } 금지(MDX 표현식). 검토 메모만 {/* MD-REVIEW: … */}");
  if (/\[\^/.test(body)) bad("각주는 [^1] 대신 [1] (frontmatter sources 의 순번)");
  if (/!\[/.test(body)) bad("본문 이미지 금지(docs/IMAGES.md — 이미지는 화면이 붙인다)");
  if (/\]\(/.test(body) || /https?:\/\//.test(body.replace(/\{\/\*[\s\S]*?\*\/\}/g, ""))) {
    bad("본문 링크·URL 금지 — 출처는 frontmatter sources, 내부 링크는 화면의 관련 시술·가격 표가 만든다");
  }
  if (/^```/m.test(body)) bad("코드 블록 금지");

  if (sections.length !== SECTIONS.length) bad(`본문 H2 는 ${SECTIONS.length}개 고정 (지금 ${sections.length}개: ${sections.map((s) => s.title).join(" / ")})`);
  sections.slice(0, SECTIONS.length).forEach((s, i) => {
    const rule = SECTIONS[i];
    if (!rule.re.test(s.title)) bad(`H2 ${i + 1}번째는 "${rule.label}" 질문이어야 함 (지금 "${s.title}")`);
    if (!/[?？]$/.test(s.title)) bad(`H2 "${s.title}" 는 검색 질문 형태(물음표로 끝남)`);
  });

  // 섹션별: 바로 아래 직답 문단, 출처 각주 1개 이상
  const starts = [];
  lines.forEach((line, i) => {
    if (/^##\s/.test(line) && !line.startsWith("###")) starts.push(i);
  });
  const cited = new Set();
  starts.forEach((start, si) => {
    const end = starts[si + 1] ?? lines.length;
    const chunk = lines.slice(start + 1, end);
    const title = lines[start].replace(/^##\s+/, "");
    const firstIdx = chunk.findIndex((l) => l.trim() !== "");
    const first = firstIdx > -1 ? chunk[firstIdx].trim() : "";
    if (!first || /^(?:[|#>*-]|\d+\.\s|\{\/\*)/.test(first)) bad(`"${title}" 바로 아래는 직답 문단이어야 함(표·목록·제목 전에)`);
    else {
      const paragraph = [];
      for (const l of chunk.slice(firstIdx)) {
        if (!l.trim()) break;
        paragraph.push(l.trim());
      }
      const sentence = firstSentence(paragraph.join(" ").replace(CITE_RE, ""));
      if (sentence.length < 20 || sentence.length > 100) bad(`"${title}" 직답 첫 문장 ${sentence.length}자 — 20~100자(권장 40~60자)`);
    }
    const refs = [...chunk.join("\n").matchAll(CITE_RE)].map((m) => Number(m[1]));
    if (refs.length === 0) bad(`"${title}" 에 출처 각주 [n] 이 없음`);
    for (const n of refs) {
      if (n < 1 || n > sourceCount) bad(`"${title}" 의 [${n}] — sources 는 ${sourceCount}개`);
      cited.add(n);
    }
  });
  for (let n = 1; n <= sourceCount; n++) if (!cited.has(n)) bad(`sources[${n - 1}] 이 본문에서 [${n}] 로 인용되지 않음`);

  // 검증 전 칸이 있으면 무엇을 확인해야 하는지 본문 검토 메모로 남긴다(content lane 이 출처를 찾으면 메모와 unverified_facts 를 지운다)
  const boxUnverified = (Array.isArray(fm.unverified_facts) ? fm.unverified_facts : []).filter((k) => k !== "price");
  if (boxUnverified.length && !/\{\/\*\s*MD-REVIEW:[^*]*요약 박스[\s\S]*?\*\/\}/.test(body)) {
    bad(`unverified_facts(${boxUnverified.join(", ")}) 가 있으면 본문에 {/* MD-REVIEW: 요약 박스 … */} 메모로 확인할 값을 적는다`);
  }
}

/** MDX 원문 1개를 린트한다. 빈 배열 = 통과. (참조 무결성·DB 행 일치는 build-data validateTables 가 본다) */
export function lintProcedureMdx(source) {
  const { frontmatter, body, sections, problems } = parseProcedureMdx(source);
  const out = [...problems];
  if (!frontmatter) return out;
  const bad = (m) => out.push(m);
  lintFrontmatter(frontmatter, bad);
  lintBody(body, frontmatter, sections, bad);
  return out;
}

/** MDX 가 실제로 컴파일되는지(문법 오류) — 비동기. 오류 메시지 또는 null. */
export async function compileError(body) {
  const [{ compile }, { default: remarkGfm }] = await Promise.all([import("@mdx-js/mdx"), import("remark-gfm")]);
  try {
    await compile(body, { remarkPlugins: [remarkGfm] });
    return null;
  } catch (err) {
    return String(err.message ?? err).split("\n")[0];
  }
}

/** content/procedures/*.mdx 목록(밑줄로 시작하는 템플릿 제외) → [{ id, file, source }] */
export function readProcedureDocs(dir = PROCEDURES_DIR) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx") && !f.startsWith("_"))
    .sort()
    .map((f) => ({ id: f.slice(0, -4), file: path.join(dir, f), source: fs.readFileSync(path.join(dir, f), "utf8") }));
}

/** 파일 이름 규칙: content/procedures/<시술 id>.mdx (ASCII — CLAUDE.md 한글 파일명 금지) */
export function lintDocId(id) {
  return ID_RE.test(id) ? [] : [`파일 이름 "${id}.mdx" — 시술 id(ASCII 소문자·숫자·하이픈)로`];
}

/** MDX → DB 행(8절: procedures 1행 + procedure_faqs n행). content_mdx 는 파일 전체(프런트매터 포함). */
export function docToRows(doc, viewCount = 0) {
  const { frontmatter: fm } = parseProcedureMdx(doc.source);
  if (!fm) return null;
  const procedure = {
    id: doc.id,
    category_id: fm.category ?? null,
    name: fm.name ?? null,
    slug: fm.slug ?? null,
    summary: fm.summary ?? null,
    price_low: fm.price_low ?? null,
    price_high: fm.price_high ?? null,
    price_note: fm.price_note ?? null,
    duration_min: fm.duration_min ?? null,
    recovery_days: fm.recovery_days ?? null,
    anesthesia: fm.anesthesia ?? null,
    content_mdx: doc.source.replace(/^﻿/, "").replace(/\r\n?/g, "\n"),
    sources: Array.isArray(fm.sources) ? fm.sources.map((s) => ({ title: s?.title ?? "", url: s?.url ?? "" })) : [],
    updated_at: fm.updated_at ?? null,
    view_count: viewCount,
  };
  const faqs = (Array.isArray(fm.faqs) ? fm.faqs : []).map((f, i) => ({
    id: `${doc.id}-${i + 1}`,
    procedure_id: doc.id,
    question: f?.question ?? "",
    answer: f?.answer ?? "",
    order: i + 1,
  }));
  return { procedure, faqs };
}

/** DB 행(procedures 1행 + 그 시술의 FAQ 행)이 content_mdx 프런트매터와 같은지 — Supabase 모드에서 DB·MDX 어긋남을 잡는다 */
export function rowMismatches(row, faqRows) {
  const { frontmatter: fm } = parseProcedureMdx(row.content_mdx ?? "");
  if (!fm) return [];
  const out = [];
  const pairs = [
    ["category_id", fm.category],
    ["name", fm.name],
    ["slug", fm.slug],
    ["summary", fm.summary],
    ["price_low", fm.price_low],
    ["price_high", fm.price_high],
    ["price_note", fm.price_note ?? null],
    ["duration_min", fm.duration_min],
    ["recovery_days", fm.recovery_days],
    ["anesthesia", fm.anesthesia],
    ["updated_at", fm.updated_at],
  ];
  for (const [col, v] of pairs) if ((row[col] ?? null) !== (v ?? null)) out.push(`${col} 가 MDX 프런트매터와 다름 (${row[col]} ≠ ${v})`);
  if (JSON.stringify(row.sources ?? []) !== JSON.stringify((fm.sources ?? []).map((s) => ({ title: s?.title, url: s?.url })))) {
    out.push("sources 가 MDX 프런트매터와 다름");
  }
  const faqs = [...faqRows].sort((a, b) => a.order - b.order).map((f) => [f.question, f.answer]);
  const fmFaqs = (fm.faqs ?? []).map((f) => [f?.question, f?.answer]);
  if (JSON.stringify(faqs) !== JSON.stringify(fmFaqs)) out.push("procedure_faqs 가 MDX 프런트매터 faqs 와 다름");
  return out;
}

/** 화면용 가이드 필드(assemble 이 시술에 붙인다) */
export function guideOf(contentMdx) {
  const { frontmatter: fm, body, sections } = parseProcedureMdx(contentMdx ?? "");
  if (!fm) return null;
  return {
    description: fm.description ?? "",
    procedure_type: fm.procedure_type ?? "surgical",
    body_location: fm.body_location ?? "",
    preparation: fm.preparation ?? "",
    author_id: fm.author ?? null,
    medical_reviewer_id: fm.medical_reviewer ?? null,
    unverified_facts: Array.isArray(fm.unverified_facts) ? fm.unverified_facts.filter((k) => FACT_KEYS.includes(k)) : [],
    body,
    sections: sections.slice(0, SECTIONS.length),
  };
}
