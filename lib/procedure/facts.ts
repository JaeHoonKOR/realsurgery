/**
 * P-03 요약 박스 값 — 화면(4칸 타일)·메타 description·JSON-LD 가 모두 이 함수의 결과를 쓴다
 * (6절 "요약 박스 = JSON-LD = FAQ" 3중 일치). 표기는 lib/format.ts 를 따른다.
 */
import type { Procedure } from "@/lib/content";
import { formatDuration, formatPriceRange, formatRecovery } from "@/lib/format";

export type FactKey = "price" | "duration" | "recovery" | "anesthesia";

export type Fact = {
  key: FactKey;
  label: string;
  /** 타일 큰 글자 */
  value: string;
  /** 타일 보조 줄(가격 단위, 마취 괄호 안 설명 등) */
  note: string | null;
  /** value + note 를 한 문장으로(JSON-LD·스크린리더) */
  text: string;
};

/** "국소 마취 (수면 마취 병행 가능)" → { main: "국소 마취", note: "수면 마취 병행 가능" } */
export function splitParenthetical(text: string): { main: string; note: string | null } {
  const m = text.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
  if (!m || !m[1]) return { main: text.trim(), note: null };
  return { main: m[1].trim(), note: m[2]?.trim() || null };
}

export function priceText(p: Pick<Procedure, "price_low" | "price_high" | "price_note">): string {
  const range = formatPriceRange(p.price_low, p.price_high);
  return p.price_note ? `${range} (${p.price_note})` : range;
}

export function procedureFacts(p: Procedure): Fact[] {
  const range = formatPriceRange(p.price_low, p.price_high);
  const anesthesia = splitParenthetical(p.anesthesia ?? "상담 후 안내");
  const duration = formatDuration(p.duration_min);
  const recovery = formatRecovery(p.recovery_days);
  return [
    { key: "price", label: "가격 범위", value: range, note: p.price_note, text: priceText(p) },
    { key: "duration", label: "소요시간", value: duration, note: null, text: duration },
    { key: "recovery", label: "회복기간", value: recovery, note: null, text: recovery },
    {
      key: "anesthesia",
      label: "마취",
      value: anesthesia.main,
      note: anesthesia.note,
      text: p.anesthesia ?? "상담 후 안내",
    },
  ];
}

/** schema.org 시술 분류: 레이저·광 시술 = 비침습, 실·주사 = 경피, 그 밖 = 수술 */
export type ProcedureClass = "noninvasive" | "percutaneous" | "surgical";

const NONINVASIVE = /레이저|토닝|필링|고주파|초음파|IPL/i;
const PERCUTANEOUS = /실리프팅|리프팅 실|필러|보톡스|주사|부스터/;

export function procedureClass(p: Pick<Procedure, "name" | "anesthesia">): ProcedureClass {
  if (NONINVASIVE.test(p.name)) return "noninvasive";
  if (PERCUTANEOUS.test(p.name)) return "percutaneous";
  return "surgical";
}

/** 제목 템플릿(6절): "{시술명} 가격·회복기간·부작용 총정리 (2026)" — 레이아웃이 " | 리얼성형" 을 붙인다 */
export function procedureTitle(p: Pick<Procedure, "name" | "updated_at">): string {
  return `${p.name} 가격·회복기간·부작용 총정리 (${p.updated_at.slice(0, 4)})`;
}

export const DESCRIPTION_MIN = 120;
export const DESCRIPTION_MAX = 150;

/** 길이를 채우는 안내 문장 — 앞에서부터 들어가는 것만 이어 붙인다(서로 겹치지 않는 내용) */
const DESCRIPTION_TAILS = [
  " 회복 일정과 부작용, 병원별 공개 가격을 출처와 함께 정리했습니다.",
  " 상담 전에 확인할 질문도 함께 담았습니다.",
  " 최종 비용은 진찰 후 정해집니다.",
];

/**
 * 메타 description(6절: 직답 1문장 + 가격 범위, 120~150자).
 * 직답 요약(summary)에 가격 범위가 없으면 붙이고, 길이가 맞도록 안내 문장을 덧붙인다.
 */
export function procedureDescription(p: Procedure): string {
  const range = formatPriceRange(p.price_low, p.price_high);
  let base = p.summary.trim();
  if (!base.includes(range.replace(/ 원$/, ""))) base = `${base} 병원 공개 가격은 ${priceText(p)}입니다.`;
  if (base.length > DESCRIPTION_MAX) {
    // 문장 단위로 줄인다(마지막 문장부터)
    const sentences = base.match(/[^.!?。]+[.!?。]?/g) ?? [base];
    while (sentences.length > 1 && sentences.join("").length > DESCRIPTION_MAX) sentences.pop();
    base = sentences.join("").trim();
    if (base.length > DESCRIPTION_MAX) base = `${base.slice(0, DESCRIPTION_MAX - 1)}…`;
  }
  let out = base;
  for (const tail of DESCRIPTION_TAILS) {
    if (out.length >= DESCRIPTION_MIN) break;
    if ((out + tail).length <= DESCRIPTION_MAX) out += tail;
  }
  return out;
}
