/**
 * 사이트 공통 문구 (screen-spec 3절 푸터·면책). 화면마다 같은 문구를 쓰도록 한 곳에 둔다.
 */

export const SITE = {
  name: "리얼성형",
  tagline: "성형 시술 가격·회복기간 비교",
  description: "의료기관이 아닌 성형 시술 정보·상담 연결 서비스입니다.",
  /** 3절 푸터 면책 — 모든 시술 페이지 하단에 같은 문구(4절 C-01) */
  disclaimer: "본 정보는 의료 조언이 아니며 진단·치료는 의료진 상담 필요",
  /** 상담 신청 연락 시간(P-07 "영업일 1일 내 연락"과 같은 기준) — SPEC-GAP: 사람 확인 필요 */
  hours: "평일 10:00–18:00 (주말·공휴일 휴무)",
  /**
   * 사업자 정보 — 등록 전에는 null. 값이 생기면 푸터에 그대로 표시한다. SPEC-GAP: 사람 입력 필요.
   */
  business: null as null | { company: string; representative: string; registrationNo: string; address: string; email: string },
  copyright: "© 2026 리얼성형",
} as const;
