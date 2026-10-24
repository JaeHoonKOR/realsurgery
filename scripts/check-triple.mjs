// 요약 박스 = JSON-LD = FAQ 3중 일치 검사 (screen-spec 4절 P-03·6절 "P-03의 요약 박스 = JSON-LD = FAQ 3중 일치",
// pipelines/03-content VERIFY) — out/procedures/<slug>/index.html 전부
// 1) H1 = MedicalProcedure.name = 브레드크럼 마지막 단계
// 2) 직답 요약 = MedicalProcedure.description, 요약 박스 가격 범위 ⊂ description
// 3) 요약 박스 마취 방식·소요시간 = howPerformed, 회복기간 = followup
// 4) 화면 FAQ = FAQPage(질문·답변·순서), 가격 FAQ 답변에 요약 박스 최저·최고가 표기
// 5) 요약 박스 소요시간·회복기간·마취 방식 = 같은 페이지 본문 문장·FAQ 답변의 값 (리뷰 T-103 r2 반려 1 — scripts/fact-support.mjs)
//    출처로 확인 못 한 칸(data-fact-unverified)은 5) 에서 빼되, 화면에 "출처 검증 전" 이 보이고 JSON-LD 에도 같은 단서가 있어야 한다.
// 사용: node scripts/check-triple.mjs   (pnpm build 마지막 단계에서 자동 실행)
// 회귀 테스트: tests/unit/procedure.test.ts(3중 일치), tests/unit/fact-support.test.ts(본문·FAQ 대조, r2 반려 사례)
import fs from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";
import { faqContext, unsupportedFacts } from "./fact-support.mjs";
import { OUT_DIR } from "./serve-out.mjs";
import { extractJsonLd, jsonLdNodes, procedurePages } from "./validate-jsonld.mjs";

const text = (el) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const UNKNOWN_PRICE = "병원 상담 후 안내";
const UNKNOWN_OTHER = "진료 후 안내";
const UNVERIFIED = "출처 검증 전";

/** 시술 상세 HTML 1개 검사 → 문제 목록 */
export function checkTripleHtml(html) {
  const problems = [];
  const bad = (m) => problems.push(m);
  const doc = new JSDOM(html).window.document;
  const nodes = jsonLdNodes(extractJsonLd(html));
  const proc = nodes.find((n) => n["@type"] === "MedicalProcedure");
  const faqPage = nodes.find((n) => n["@type"] === "FAQPage");
  const crumbs = nodes.find((n) => n["@type"] === "BreadcrumbList");
  if (!proc || !faqPage) return ["MedicalProcedure·FAQPage JSON-LD 없음"];

  const h1 = text(doc.querySelector("h1"));
  if (h1 !== proc.name) bad(`H1 "${h1}" ≠ MedicalProcedure.name "${proc.name}"`);
  const lastCrumb = crumbs?.itemListElement?.at(-1)?.name;
  if (lastCrumb !== h1) bad(`브레드크럼 마지막 "${lastCrumb}" ≠ H1`);

  const answer = text(doc.querySelector('[data-testid="procedure-answer"]'));
  if (answer !== proc.description) bad("직답 요약 ≠ MedicalProcedure.description");

  const cellEl = (key) => doc.querySelector(`[data-fact="${key}"]`);
  const fact = (key) => text(cellEl(key)?.querySelector("[data-fact-value]"));
  const unverified = (key) => cellEl(key)?.hasAttribute("data-fact-unverified") ?? false;
  const price = fact("price");
  const duration = fact("duration");
  const recovery = fact("recovery");
  const anesthesia = fact("anesthesia");
  if (!price || !duration || !recovery || !anesthesia) bad("요약 박스 4칸(가격 범위·소요시간·회복기간·마취 방식) 중 빈 칸");
  if (price && price !== UNKNOWN_PRICE && !proc.description.includes(price)) bad(`요약 박스 가격 "${price}" 가 description 에 없음`);
  for (const key of ["price", "duration", "recovery", "anesthesia"]) {
    if (unverified(key) && !text(cellEl(key)).includes(UNVERIFIED)) bad(`요약 박스 "${key}" 칸이 검증 전인데 화면에 "${UNVERIFIED}" 표시가 없음`);
  }
  const ldValue = (key, v) => `${v}${unverified(key) ? ` [${UNVERIFIED}]` : ""}`;
  const how = `마취 방식: ${ldValue("anesthesia", anesthesia)} · 소요시간: ${ldValue("duration", duration)}`;
  if (proc.howPerformed !== how) bad(`howPerformed "${proc.howPerformed}" ≠ 요약 박스 "${how}"`);
  const followup = `회복기간: ${ldValue("recovery", recovery)}`;
  if (proc.followup !== followup) bad(`followup "${proc.followup}" ≠ 요약 박스 "${followup}"`);

  const items = [...doc.querySelectorAll('[data-testid="procedure-faq"] details')].map((d) => ({
    q: text(d.querySelector("summary")),
    a: text(d.querySelector("p")),
  }));

  // 5) 요약 박스 값의 근거: 본문 문단·목록(표·"요약 박스" 자기 참조 문장 제외) + FAQ 답변
  const body = doc.querySelector('[data-testid="procedure-body"]');
  if (!body) bad("본문(procedure-body) 없음 — 요약 박스 값을 대조할 수 없음");
  const units = [
    ...[...(body?.querySelectorAll("p, li") ?? [])]
      .filter((el) => !el.closest("table"))
      .map((el) => ({ text: text(el), ctx: null }))
      .filter((u) => !u.text.includes("요약 박스")),
    ...items.map((f) => ({ text: f.a, ctx: faqContext(f.q) })),
  ];
  const checked = (key, v) => (v && v !== UNKNOWN_OTHER && !unverified(key) ? v : null);
  for (const p of unsupportedFacts(
    { duration: checked("duration", duration), recovery: checked("recovery", recovery), anesthesia: checked("anesthesia", anesthesia) },
    units,
  )) {
    bad(p);
  }
  const ld = (faqPage.mainEntity ?? []).map((q) => ({ q: q.name, a: q.acceptedAnswer?.text }));
  if (JSON.stringify(items) !== JSON.stringify(ld)) bad(`화면 FAQ(${items.length}개) ≠ FAQPage(${ld.length}개) — 질문·답변·순서가 같아야 함`);

  const m = price.match(/^([\d,]+만?)~([\d,]+만?) 원$/);
  if (m) {
    const priceFaq = items.find((f) => /가격|비용/.test(f.q));
    if (!priceFaq) bad("가격 FAQ 없음");
    else for (const v of [m[1], m[2]]) if (!priceFaq.a.includes(v)) bad(`가격 FAQ 답변에 요약 박스 가격 "${v}" 없음`);
  }
  return problems;
}

if (path.basename(process.argv[1] ?? "") === "check-triple.mjs") {
  const pages = procedurePages();
  const problems = [];
  for (const file of pages) {
    for (const p of checkTripleHtml(fs.readFileSync(file, "utf8"))) problems.push(`${path.relative(OUT_DIR, file)}: ${p}`);
  }
  if (problems.length) {
    console.error(`[check-triple] 문제 ${problems.length}건\n${problems.join("\n")}`);
    process.exit(1);
  }
  console.log(`[check-triple] OK — 시술 상세 ${pages.length}쪽 요약 박스 = JSON-LD = FAQ, 요약 박스 수치 = 본문·FAQ 근거(검증 전 칸은 표시 확인)`);
}
