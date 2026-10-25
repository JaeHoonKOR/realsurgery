/**
 * 상담 신청 동의 문구와 개인정보처리방침의 공통 값 (screen-spec 1절 법적 고려: 민감정보 별도 동의, 제3자 제공 별도 동의, 보관 기간 명시).
 * 상담 폼의 "내용 보기"와 /privacy/ 가 같은 문구를 쓰도록 한 곳에 둔다. 문구를 바꾸면 submit.ts 의 CONSENT_VERSION 도 올린다.
 *
 * 동의 4종(「개인정보 보호법」 제22조 구분 동의):
 *  1. 개인정보 수집·이용 [필수] — 제15조
 *  2. 민감정보(관심 시술) 처리 [필수] — 제23조: 다른 개인정보와 구분해 따로 동의
 *  3. 병원 연결을 위한 제3자 제공 [선택] — 제17조: 제휴 병원이 없으므로 필수로 받지 않는다(병원 연결을 원할 때만)
 *  4. 마케팅 정보 수신 [선택] — 제22조 제2항
 */

/** 개인정보처리방침·이용약관 시행일 */
export const POLICY_EFFECTIVE_DATE = "2026-11-01";
export const POLICY_EFFECTIVE_LABEL = "2026년 11월 1일";

/** 보관 기간(screen-spec 8절 C-01: 상담 완료 후 1년) */
export const RETENTION_LABEL = "상담 완료 후 1년";

export type ConsentKey = "consent_privacy" | "consent_sensitive" | "consent_3rd" | "consent_marketing";

export type ConsentDetail = {
  key: ConsentKey;
  required: boolean;
  title: string;
  rows: { label: string; value: string }[];
  /** 민감정보 등 강조 안내 */
  notice?: string;
  /** 동의 거부 권리와 불이익 */
  refusal: string;
};

/** 민감정보로 다루는 항목(동의 문구·개인정보처리방침 공통) */
export const SENSITIVE_ITEMS = "관심 시술(신체 부위·시술 종류), 메모에 직접 적은 건강 관련 내용";
export const SENSITIVE_PURPOSE = "시술별 가격 범위·회복 일정을 정리한 상담 가이드 안내, 상담 일정 조율";
const RETENTION_FULL = `${RETENTION_LABEL} 파기 (상담이 이뤄지지 않으면 신청일로부터 1년)`;

/** 병원 제3자 제공(선택) — 개인정보처리방침 표와 같은 값 */
export const THIRD_PARTY = {
  recipient: "병원 연결을 원할 때 고른 병원 1곳 — 병원 이름은 연결할 때 개별로 안내합니다",
  items: "이름, 휴대폰 번호, 관심 시술(민감정보), 희망 시기, 연락 가능 시간, 메모",
  purpose: "병원 상담·진료 예약 안내",
  retention: "상담 목적 달성 후 지체 없이 파기 (진료로 이어지면 의료법에 따른 보존 기간)",
} as const;

export const CONSENT_DETAILS: readonly ConsentDetail[] = [
  {
    key: "consent_privacy",
    required: true,
    title: "개인정보 수집·이용 동의",
    rows: [
      { label: "수집 항목", value: "이름, 휴대폰 번호, 희망 지역, 희망 시기, 연락 가능 시간, 메모(선택), 유입 경로 정보" },
      { label: "이용 목적", value: "상담 가이드 안내 연락, 상담 일정 조율, 중복 신청 확인, 유입 경로별 신청 통계" },
      { label: "보유 기간", value: RETENTION_FULL },
    ],
    notice: "관심 시술은 민감정보라 이 항목과 나눠 바로 아래에서 따로 동의받습니다.",
    refusal: "동의를 거부할 수 있으나, 거부하면 상담 신청을 접수할 수 없습니다.",
  },
  {
    key: "consent_sensitive",
    required: true,
    title: "민감정보(관심 시술) 처리 동의",
    rows: [
      { label: "처리 항목", value: SENSITIVE_ITEMS },
      { label: "처리 목적", value: SENSITIVE_PURPOSE },
      { label: "보유 기간", value: RETENTION_FULL },
    ],
    notice:
      "관심 시술은 신체 부위나 건강 상태를 짐작할 수 있는 민감정보라 「개인정보 보호법」 제23조에 따라 다른 개인정보와 구분해 따로 동의받습니다. 상담 안내에만 쓰고, 마케팅 정보 수신에 따로 동의한 경우에만 관심 시술에 맞춘 안내에 씁니다.",
    refusal: "동의를 거부할 수 있으나, 관심 시술을 알 수 없으면 상담 가이드를 만들 수 없어 신청을 접수할 수 없습니다.",
  },
  {
    key: "consent_3rd",
    required: false,
    title: "병원 연결을 위한 제3자 제공 동의",
    rows: [
      { label: "제공받는 자", value: THIRD_PARTY.recipient },
      { label: "제공 항목", value: THIRD_PARTY.items },
      { label: "제공 목적", value: THIRD_PARTY.purpose },
      { label: "보유 기간", value: THIRD_PARTY.retention },
    ],
    notice:
      "병원 연결을 원할 때만 동의해 주세요. 지금은 제휴 병원이 없어 어떤 병원에도 정보를 제공하지 않습니다. 연결하게 되면 제공받는 병원 이름을 먼저 알려 드리고, 다시 확인을 받은 뒤 제공합니다.",
    refusal:
      "동의하지 않아도 상담 신청과 운영팀의 상담 가이드 안내는 똑같이 받을 수 있습니다. 다만 병원 상담 연결은 해 드릴 수 없습니다.",
  },
  {
    key: "consent_marketing",
    required: false,
    title: "마케팅 정보 수신 동의",
    rows: [
      { label: "이용 항목", value: "이름, 휴대폰 번호, 관심 시술(민감정보)" },
      { label: "이용 목적", value: "관심 시술의 가격 변동, 새 가이드, 이벤트 안내 (문자·알림톡)" },
      { label: "보유 기간", value: `동의 철회 시까지 (최대 ${RETENTION_LABEL})` },
    ],
    refusal: "동의하지 않아도 상담 신청과 안내는 똑같이 받을 수 있습니다.",
  },
];

export function consentDetail(key: ConsentKey): ConsentDetail {
  const d = CONSENT_DETAILS.find((c) => c.key === key);
  if (!d) throw new Error(`알 수 없는 동의 항목: ${key}`);
  return d;
}
