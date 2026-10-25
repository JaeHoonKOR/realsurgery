/**
 * P-06 상담 폼 선택지 (screen-spec 4절 P-06). DB(leads)에는 value(코드)를 저장하고 화면에는 label 을 보여 준다.
 * 관리자 화면(A-01)도 이 표로 코드 → 이름을 바꾼다.
 */

export const REGION_OPTIONS = [
  { value: "gangnam-seocho", label: "서울 강남·서초" },
  { value: "seoul-etc", label: "서울 기타" },
  { value: "gyeonggi-incheon", label: "경기·인천" },
  { value: "busan-gyeongnam", label: "부산·경남" },
  { value: "etc", label: "기타" },
] as const;

/** 희망 시기 (4절: 1개월 내·3개월 내·미정) */
export const TIMING_OPTIONS = [
  { value: "within_1m", label: "1개월 내", hint: "일정이 어느 정도 정해졌어요" },
  { value: "within_3m", label: "3개월 내", hint: "가격과 병원을 알아보는 중이에요" },
  { value: "undecided", label: "아직 미정", hint: "정보부터 받아 보고 싶어요" },
] as const;

export const CONTACT_TIME_OPTIONS = [
  { value: "morning", label: "오전" },
  { value: "afternoon", label: "오후" },
  { value: "evening", label: "저녁" },
  { value: "anytime", label: "언제든" },
] as const;

export type RegionValue = (typeof REGION_OPTIONS)[number]["value"];
export type TimingValue = (typeof TIMING_OPTIONS)[number]["value"];
export type ContactTimeValue = (typeof CONTACT_TIME_OPTIONS)[number]["value"];

export const NAME_MAX = 20;
export const MEMO_MAX = 500;

/**
 * 병원 지역("서울 강남구", "경기 성남시 분당구") → 희망 지역 선택지. 병원 상세에서 들어온 신청의 지역 선입력용.
 * 알 수 없으면 null(선입력하지 않음).
 */
export function regionFromAddress(region: string | null | undefined): RegionValue | null {
  const r = (region ?? "").replace(/\s+/g, " ").trim();
  if (!r) return null;
  if (/^서울(특별시)? (강남구|서초구)/.test(r)) return "gangnam-seocho";
  if (/^서울/.test(r)) return "seoul-etc";
  if (/^(경기|인천)/.test(r)) return "gyeonggi-incheon";
  if (/^(부산|경남|경상남도|울산|창원)/.test(r)) return "busan-gyeongnam";
  return "etc";
}

type Option = { readonly value: string; readonly label: string };

export function isOptionValue<T extends Option>(options: readonly T[], value: unknown): value is T["value"] {
  return typeof value === "string" && options.some((o) => o.value === value);
}

/** 코드 → 화면 이름 (모르는 코드는 그대로) */
export function optionLabel(options: readonly Option[], value: string | null | undefined): string {
  if (!value) return "";
  return options.find((o) => o.value === value)?.label ?? value;
}
