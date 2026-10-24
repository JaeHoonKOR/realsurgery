// JSON-LD 검사 (screen-spec 6절, pipelines/03-content VERIFY "JSON-LD 유효성") — out/ 의 모든 HTML
// - <script type="application/ld+json"> 이 JSON 으로 파싱되고 @context 가 https://schema.org
// - 타입별 필수 속성(BreadcrumbList·MedicalWebPage·MedicalProcedure·FAQPage·Organization)
// - AggregateRating·Review·평점 속성 금지(의료광고 심의·YMYL)
// - 시술 상세(procedures/<slug>/)는 MedicalWebPage + MedicalProcedure + FAQPage + BreadcrumbList 4종 필수
// 사용: node scripts/validate-jsonld.mjs   (pnpm build 마지막 단계에서 자동 실행)   회귀 테스트: tests/unit/check-pages.test.ts
import fs from "node:fs";
import path from "node:path";
import { OUT_DIR } from "./serve-out.mjs";

const PROCEDURE_TYPES = new Set([
  "https://schema.org/SurgicalProcedure",
  "https://schema.org/NoninvasiveProcedure",
  "https://schema.org/PercutaneousProcedure",
]);
const BANNED = /"@type"\s*:\s*"(?:AggregateRating|Review|Rating)"|"(?:aggregateRating|review|reviews|ratingValue|reviewRating)"\s*:/;

/** HTML 문자열 → JSON-LD 블록 배열(파싱 실패는 { error }) */
export function extractJsonLd(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => {
    try {
      return { data: JSON.parse(m[1]), raw: m[1] };
    } catch (err) {
      return { error: err.message, raw: m[1] };
    }
  });
}

/** 블록들 → @type 이 있는 모든 노드(@graph 펼침 + 속성 안에 중첩된 노드까지. Question·Answer·ListItem 같은 하위 항목은 제외) */
export function jsonLdNodes(blocks) {
  const out = [];
  const SKIP = new Set(["Question", "Answer", "ListItem"]);
  const visit = (v) => {
    if (Array.isArray(v)) v.forEach(visit);
    else if (v && typeof v === "object") {
      if (typeof v["@type"] === "string" && !SKIP.has(v["@type"])) out.push(v);
      for (const [k, child] of Object.entries(v)) if (k !== "@context") visit(child);
    }
  };
  for (const b of blocks) if (b.data) visit(Array.isArray(b.data["@graph"]) ? b.data["@graph"] : b.data);
  return out;
}

const nonEmpty = (v) => typeof v === "string" && v.trim().length > 0;
const isUrl = (v) => typeof v === "string" && /^https?:\/\/\S+$/.test(v);

function checkNode(node, bad) {
  const type = node["@type"];
  const at = `${type}`;
  switch (type) {
    case "BreadcrumbList":
      if (!Array.isArray(node.itemListElement) || node.itemListElement.length === 0) bad(`${at}: itemListElement 없음`);
      else
        node.itemListElement.forEach((it, i) => {
          if (it["@type"] !== "ListItem" || it.position !== i + 1 || !nonEmpty(it.name)) bad(`${at}: ${i + 1}번째 ListItem 형식 오류`);
          if (it.item !== undefined && !isUrl(it.item)) bad(`${at}: item URL 오류 (${it.item})`);
        });
      break;
    case "MedicalWebPage":
      for (const k of ["name", "dateModified"]) if (!nonEmpty(node[k])) bad(`${at}: ${k} 없음`);
      if (!isUrl(node.url)) bad(`${at}: url 오류`);
      if (!node.about && !node.mainEntity) bad(`${at}: about·mainEntity 없음`);
      if (!/^\d{4}-\d{2}-\d{2}/.test(node.dateModified ?? "")) bad(`${at}: dateModified 날짜 형식`);
      break;
    case "MedicalProcedure":
      for (const k of ["name", "description", "bodyLocation", "howPerformed", "preparation", "followup"]) if (!nonEmpty(node[k])) bad(`${at}: ${k} 없음`);
      if (!PROCEDURE_TYPES.has(node.procedureType)) bad(`${at}: procedureType 은 schema.org Surgical/Noninvasive/PercutaneousProcedure`);
      break;
    case "FAQPage":
      if (!Array.isArray(node.mainEntity) || node.mainEntity.length === 0) bad(`${at}: mainEntity 없음`);
      else
        node.mainEntity.forEach((q, i) => {
          if (q["@type"] !== "Question" || !nonEmpty(q.name) || q.acceptedAnswer?.["@type"] !== "Answer" || !nonEmpty(q.acceptedAnswer?.text)) {
            bad(`${at}: ${i + 1}번째 Question 형식 오류`);
          }
        });
      break;
    case "Organization":
      if (!nonEmpty(node.name)) bad(`${at}: name 없음`);
      break;
    default:
      if (!nonEmpty(type)) bad("@type 없음");
  }
}

/**
 * HTML 1개 검사. procedurePage=true 면 P-03 필수 4종을 요구한다.
 * @returns {string[]} 문제 목록
 */
export function validateJsonLdHtml(html, { procedurePage = false } = {}) {
  const problems = [];
  const bad = (m) => problems.push(m);
  const blocks = extractJsonLd(html);
  for (const b of blocks) {
    if (b.error) {
      bad(`JSON 파싱 실패: ${b.error}`);
      continue;
    }
    if (b.data["@context"] !== "https://schema.org") bad(`@context 는 https://schema.org (${b.data["@context"]})`);
    if (BANNED.test(b.raw)) bad("AggregateRating·Review·평점 속성 금지");
  }
  const nodes = jsonLdNodes(blocks);
  for (const n of nodes) checkNode(n, bad);
  if (procedurePage) {
    const types = new Set(nodes.map((n) => n["@type"]));
    for (const t of ["MedicalWebPage", "MedicalProcedure", "FAQPage", "BreadcrumbList"]) if (!types.has(t)) bad(`시술 상세에 ${t} 없음`);
  }
  return problems;
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

/** out/ 의 시술 상세 HTML 경로 목록 */
export function procedurePages(outDir = OUT_DIR) {
  const dir = path.join(outDir, "procedures");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => path.join(dir, e.name, "index.html"))
    .filter((f) => fs.existsSync(f));
}

if (path.basename(process.argv[1] ?? "") === "validate-jsonld.mjs") {
  const procedureSet = new Set(procedurePages());
  const problems = [];
  let blocks = 0;
  for (const file of walk(OUT_DIR)) {
    const html = fs.readFileSync(file, "utf8");
    blocks += extractJsonLd(html).length;
    for (const p of validateJsonLdHtml(html, { procedurePage: procedureSet.has(file) })) problems.push(`${path.relative(OUT_DIR, file)}: ${p}`);
  }
  if (problems.length) {
    console.error(`[validate-jsonld] 문제 ${problems.length}건\n${problems.join("\n")}`);
    process.exit(1);
  }
  console.log(`[validate-jsonld] OK — JSON-LD ${blocks}블록, 시술 상세 ${procedureSet.size}쪽 필수 4종, AggregateRating 0`);
}
