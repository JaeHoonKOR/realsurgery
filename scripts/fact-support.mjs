// 요약 박스 수치(소요시간·회복기간·마취 방식)가 같은 페이지의 본문 문장·FAQ 답변에 근거가 있는지 (리뷰 T-103 r2 반려 1)
// - 요약 박스 값은 MedicalProcedure JSON-LD(howPerformed·followup)로도 나가므로, 본문·FAQ·출처와 어긋나면 안 된다.
// - 근거로 인정하는 글: 본문 문단·목록 항목(p·li)과 FAQ 답변. 표는 요약(다른 시술 박스 값을 옮겨 적은 비교 표 등)이라 제외하고,
//   "요약 박스" 를 가리키는 문장도 자기 참조라 제외한다(호출하는 쪽이 units 를 만들 때).
// - 근거 판정은 절(쉼표·문장 끝으로 나눈 조각) 단위: 그 절에 맥락어가 있고 같은 값(범위면 양 끝 중 하나)이 있어야 한다.
//   FAQ 질문이 "회복"·"시간" 을 물으면 그 답변 전체가 해당 맥락이다.
// - 출처로 확인하지 못한 칸은 프런트매터 unverified_facts 로 "출처 검증 전" 을 화면에 표시하고 이 검사에서 뺀다(check-triple).
// 사용: scripts/check-triple.mjs   회귀 테스트: tests/unit/fact-support.test.ts
const DUR_UNIT = { 분: 1, 시간: 60 };
const DAY_UNIT = { 일: 1, 주일: 7, 주: 7, 개월: 30, 달: 30 };

// "1~2시간", "30분에서 1시간", "1시간 30분", "40분"
const DUR_RE = /(\d+)\s*(시간|분)?\s*(?:~|에서)\s*(\d+)\s*(시간|분)|(\d+)\s*시간\s*(\d+)\s*분|(\d+)\s*(시간|분)/g;
// 시점·간격·기한을 뜻하는 뒷말(소요시간이 아님): "30분 전", "3시간 간격", "48시간 동안 금식", "36시간까지"
const DUR_NOT_LENGTH = /^\s*(?:가량|정도|내외|안팎)?\s*(?:동안|간격|마다|전|후|뒤|이후|째|내지|까지)/;
// "7~10일", "1~2주", "1주일", "3주 말", "일주일", "하루", "한 달"
const DAY_RE = /(\d+)\s*(주일|일|주|개월|달)?\s*~\s*(\d+)\s*(주일|일|주|개월|달)|(\d+)\s*(주일|일|주|개월|달)|(일주일|하루|한\s?달)/g;
const DAY_WORD = { 일주일: 7, 하루: 1, 한달: 30, "한 달": 30 };
// 날짜 시점("3~4일째")은 기간이 아니다
const DAY_NOT_LENGTH = /^\s*째/;

const DURATION_CONTEXT = /소요|수술|시술|걸리|걸린|걸립/;
const RECOVERY_CONTEXT = /일상|생활|복귀|사회|회복|외출|정상/;
const SAME_DAY = /당일|즉시|바로/;

/** 마취 방식 종류 — 요약 박스 문자열의 각 종류가 근거 절에 있어야 한다 */
export const ANESTHESIA_KINDS = [
  { kind: "국소", re: /국소/ },
  { kind: "수면", re: /수면/ },
  { kind: "전신", re: /전신/ },
  { kind: "진정", re: /진정/ },
  { kind: "연고", re: /연고|크림/ },
];
const ANESTHESIA_CONTEXT = /마취|진정제/;

/** 글 → 분 단위 값 목록(범위는 양 끝). lengthOnly 면 시점·간격 표현은 뺀다. */
export function durationValues(text, { lengthOnly = true } = {}) {
  const out = [];
  for (const m of String(text).matchAll(DUR_RE)) {
    if (lengthOnly && DUR_NOT_LENGTH.test(text.slice(m.index + m[0].length))) continue;
    if (m[3]) {
      const hi = DUR_UNIT[m[4]];
      out.push(Number(m[1]) * (m[2] ? DUR_UNIT[m[2]] : hi), Number(m[3]) * hi);
    } else if (m[6]) out.push(Number(m[5]) * 60 + Number(m[6]));
    else out.push(Number(m[7]) * DUR_UNIT[m[8]]);
  }
  return out;
}

/** 글 → 일 단위 값 목록(범위는 양 끝, 주 = 7일, 개월 = 30일). "당일 복귀" 는 0. */
export function dayValues(text) {
  const s = String(text);
  if (/^\s*당일 복귀\s*$/.test(s)) return [0];
  const out = [];
  for (const m of s.matchAll(DAY_RE)) {
    if (DAY_NOT_LENGTH.test(s.slice(m.index + m[0].length))) continue;
    if (m[3]) {
      const hi = DAY_UNIT[m[4]];
      out.push(Number(m[1]) * (m[2] ? DAY_UNIT[m[2]] : hi), Number(m[3]) * hi);
    } else if (m[5]) out.push(Number(m[5]) * DAY_UNIT[m[6]]);
    else out.push(DAY_WORD[m[7].replace(/\s/g, "")] ?? DAY_WORD[m[7]]);
  }
  return out;
}

/** 마취 방식 문자열 → 종류 목록(예: "국소 마취 (필요하면 진정제 병행)" → ["국소", "진정"]) */
export function anesthesiaKinds(text) {
  return ANESTHESIA_KINDS.filter((k) => k.re.test(String(text))).map((k) => k.kind);
}

/** 각주 [n](화면에서는 단어 결합자 + [n])를 지우고 절로 나눈다 */
export function clauses(text) {
  return String(text)
    .replace(/⁠?\[\d{1,2}\]/g, "")
    .split(/[,，;]\s*|(?<=[.?!])\s+/)
    .map((c) => c.trim())
    .filter(Boolean);
}

/**
 * 요약 박스 값 → 근거가 없는 칸의 문제 목록. 값이 null 이면(미표시·검증 전·"진료 후 안내") 검사하지 않는다.
 * @param {{ duration?: string | null, recovery?: string | null, anesthesia?: string | null }} facts 화면에 보이는 문자열("약 1시간", "약 10일", "전신 마취")
 * @param {{ text: string, ctx?: "duration" | "recovery" | null }[]} units 근거 후보(본문 p·li, FAQ 답변 — ctx 는 FAQ 질문의 맥락)
 */
export function unsupportedFacts(facts, units) {
  const problems = [];
  const parts = units.flatMap((u) => clauses(u.text).map((text) => ({ text, ctx: u.ctx ?? null })));

  if (facts.duration) {
    const [want] = durationValues(facts.duration, { lengthOnly: false });
    const ok =
      Number.isFinite(want) && parts.some((p) => (p.ctx === "duration" || DURATION_CONTEXT.test(p.text)) && durationValues(p.text).includes(want));
    if (!ok) problems.push(`요약 박스 소요시간 "${facts.duration}" 의 근거 문장이 본문·FAQ 에 없음(같은 값의 소요시간 문장, 또는 unverified_facts 로 "출처 검증 전" 표시)`);
  }
  if (facts.recovery) {
    const [want] = dayValues(facts.recovery);
    // 입원 기간("1~2일 입원", "하루 입원")은 일상 복귀까지의 회복기간이 아니다
    const inCtx = (p) => !/입원/.test(p.text) && (p.ctx === "recovery" || RECOVERY_CONTEXT.test(p.text));
    const ok =
      Number.isFinite(want) && parts.some((p) => inCtx(p) && (want === 0 ? SAME_DAY.test(p.text) : dayValues(p.text).includes(want)));
    if (!ok) problems.push(`요약 박스 회복기간 "${facts.recovery}" 의 근거 문장이 본문·FAQ 에 없음(같은 값의 일상 복귀·회복 문장, 또는 unverified_facts 로 "출처 검증 전" 표시)`);
  }
  if (facts.anesthesia) {
    const kinds = anesthesiaKinds(facts.anesthesia);
    if (!kinds.length) problems.push(`요약 박스 마취 방식 "${facts.anesthesia}" 의 종류(국소·수면·전신·진정·연고)를 알 수 없음`);
    for (const kind of kinds) {
      const re = ANESTHESIA_KINDS.find((k) => k.kind === kind).re;
      if (!parts.some((p) => ANESTHESIA_CONTEXT.test(p.text) && re.test(p.text))) {
        problems.push(`요약 박스 마취 방식 "${facts.anesthesia}" 의 "${kind}" 근거 문장이 본문·FAQ 에 없음(또는 unverified_facts 로 "출처 검증 전" 표시)`);
      }
    }
  }
  return problems;
}

/** FAQ 질문 → 답변의 맥락(회복기간·소요시간을 묻는 질문이면 답변 전체가 그 맥락) */
export function faqContext(question) {
  if (/회복|일상|복귀/.test(question)) return "recovery";
  if (/시간|얼마나 걸/.test(question) && !/회복/.test(question)) return "duration";
  return null;
}
