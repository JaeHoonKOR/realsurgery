/**
 * P-06 상담 폼 값·검증 (screen-spec 4절 P-06, 1절 법적 고려).
 * 오류 문구 = 원인 + 해결 한 문장(QUALITY 5절). 화면과 Edge Function(submit-lead)이 같은 규칙을 쓴다.
 */
import { isLandline, isValidMobile, phoneDigits } from "./phone";
import {
  CONTACT_TIME_OPTIONS,
  MEMO_MAX,
  NAME_MAX,
  REGION_OPTIONS,
  TIMING_OPTIONS,
  isOptionValue,
  type ContactTimeValue,
  type RegionValue,
  type TimingValue,
} from "./options";

/** "아직 정하지 못했어요" — 시술 없이 상담 신청(leads.procedure_id = null) */
export const PROCEDURE_UNDECIDED = "undecided";

export type ConsultValues = {
  /** 시술 id · PROCEDURE_UNDECIDED · ""(미선택) */
  procedure_id: string;
  clinic_id: string | null;
  region: RegionValue | "";
  timing: TimingValue | "";
  name: string;
  /** 화면 표기(010-1234-5678) */
  phone: string;
  contact_time: ContactTimeValue | "";
  memo: string;
  /** [필수] 개인정보 수집·이용 */
  consent_privacy: boolean;
  /** [필수] 민감정보(관심 시술) 처리 — 개인정보 보호법 제23조 별도 동의 */
  consent_sensitive: boolean;
  /** [선택] 병원 연결을 위한 제3자 제공 — 제휴 병원이 없으므로 선택 */
  consent_3rd: boolean;
  /** [선택] 마케팅 정보 수신 */
  consent_marketing: boolean;
};

export type FieldName = keyof ConsultValues;
export type FieldErrors = Partial<Record<FieldName, string>>;

export const STEP1_FIELDS = ["procedure_id", "region", "timing"] as const satisfies readonly FieldName[];
export const STEP2_FIELDS = [
  "name",
  "phone",
  "contact_time",
  "memo",
  "consent_privacy",
  "consent_sensitive",
] as const satisfies readonly FieldName[];

export function emptyValues(prefill: { procedure_id?: string | null; clinic_id?: string | null } = {}): ConsultValues {
  return {
    procedure_id: prefill.procedure_id ?? "",
    clinic_id: prefill.clinic_id ?? null,
    region: "",
    timing: "",
    name: "",
    phone: "",
    contact_time: "",
    memo: "",
    consent_privacy: false,
    consent_sensitive: false,
    consent_3rd: false,
    consent_marketing: false,
  };
}

export const MESSAGES = {
  procedure: "관심 시술이 선택되지 않았으니 목록에서 하나를 골라 주세요.",
  region: "희망 지역이 선택되지 않았으니 가까운 지역을 골라 주세요.",
  timing: "희망 시기가 선택되지 않았으니 가장 가까운 항목을 골라 주세요.",
  nameEmpty: "이름이 비어 있으니 연락받으실 분의 이름을 입력해 주세요.",
  nameShort: "이름이 한 글자뿐이니 2자 이상 입력해 주세요.",
  nameLong: `이름이 ${NAME_MAX}자를 넘으니 줄여서 입력해 주세요.`,
  nameChars: "이름에 숫자나 기호가 있으니 한글 또는 영문으로만 입력해 주세요.",
  phoneEmpty: "휴대폰 번호가 비어 있으니 010으로 시작하는 번호를 입력해 주세요.",
  phoneLandline: "일반 전화번호로는 안내 문자를 받을 수 없으니 휴대폰 번호를 입력해 주세요.",
  phoneShort: "휴대폰 번호 자릿수가 모자라니 010-1234-5678 형식으로 끝까지 입력해 주세요.",
  phoneInvalid: "휴대폰 번호 형식이 맞지 않으니 010-1234-5678 형식으로 다시 입력해 주세요.",
  contactTime: "연락 가능 시간이 선택되지 않았으니 편한 시간대를 골라 주세요.",
  memoLong: `메모가 ${MEMO_MAX}자를 넘었으니 ${MEMO_MAX}자 이내로 줄여 주세요.`,
  consentPrivacy: "개인정보 수집·이용 동의가 빠져 있으니 내용을 확인하고 동의해 주세요.",
  consentSensitive: "민감정보(관심 시술) 처리 동의가 빠져 있으니 내용을 확인하고 동의해 주세요.",
} as const;

const NAME_CHARS = /^[가-힣ㄱ-ㅎㅏ-ㅣA-Za-z][가-힣ㄱ-ㅎㅏ-ㅣA-Za-z .·-]*$/;

export function validateName(raw: string): string | null {
  const name = raw.trim();
  if (!name) return MESSAGES.nameEmpty;
  if (!NAME_CHARS.test(name)) return MESSAGES.nameChars;
  if ([...name].length < 2) return MESSAGES.nameShort;
  if ([...name].length > NAME_MAX) return MESSAGES.nameLong;
  return null;
}

export function validatePhone(raw: string): string | null {
  const d = phoneDigits(raw);
  if (!d) return MESSAGES.phoneEmpty;
  if (isLandline(d)) return MESSAGES.phoneLandline;
  if (isValidMobile(d)) return null;
  if (/^01[016789]/.test(d) && d.length < 10) return MESSAGES.phoneShort;
  if (d === "010" || (d.startsWith("010") && d.length < 11)) return MESSAGES.phoneShort;
  return MESSAGES.phoneInvalid;
}

/** 1단계(관심 시술) 검증. procedureIds 가 있으면 목록 밖 id 도 오류 */
export function validateStep1(v: ConsultValues, procedureIds?: readonly string[]): FieldErrors {
  const e: FieldErrors = {};
  const knownProcedure =
    v.procedure_id === PROCEDURE_UNDECIDED || (v.procedure_id !== "" && (!procedureIds || procedureIds.includes(v.procedure_id)));
  if (!knownProcedure) e.procedure_id = MESSAGES.procedure;
  if (!isOptionValue(REGION_OPTIONS, v.region)) e.region = MESSAGES.region;
  if (!isOptionValue(TIMING_OPTIONS, v.timing)) e.timing = MESSAGES.timing;
  return e;
}

/** 2단계(연락처 + 동의) 검증 */
export function validateStep2(v: ConsultValues): FieldErrors {
  const e: FieldErrors = {};
  const name = validateName(v.name);
  if (name) e.name = name;
  const phone = validatePhone(v.phone);
  if (phone) e.phone = phone;
  if (!isOptionValue(CONTACT_TIME_OPTIONS, v.contact_time)) e.contact_time = MESSAGES.contactTime;
  if ([...v.memo].length > MEMO_MAX) e.memo = MESSAGES.memoLong;
  if (!v.consent_privacy) e.consent_privacy = MESSAGES.consentPrivacy;
  if (!v.consent_sensitive) e.consent_sensitive = MESSAGES.consentSensitive;
  // 제3자 제공(consent_3rd)·마케팅은 선택 — 검사하지 않는다
  return e;
}

export function validateAll(v: ConsultValues, procedureIds?: readonly string[]): FieldErrors {
  return { ...validateStep1(v, procedureIds), ...validateStep2(v) };
}

export function hasErrors(e: FieldErrors): boolean {
  return Object.keys(e).length > 0;
}

/** 화면 순서상 첫 오류 필드(포커스 이동용) */
export function firstErrorField(e: FieldErrors): FieldName | null {
  const order: readonly FieldName[] = [...STEP1_FIELDS, ...STEP2_FIELDS];
  return order.find((f) => e[f]) ?? null;
}

export type ConsentValues = Pick<ConsultValues, "consent_privacy" | "consent_sensitive" | "consent_3rd" | "consent_marketing">;

/** 필수 동의 2개 + 선택 2개 → 전체 동의 상태 */
export function allConsented(v: ConsentValues): boolean {
  return v.consent_privacy && v.consent_sensitive && v.consent_3rd && v.consent_marketing;
}
