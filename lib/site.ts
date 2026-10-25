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
   * 가짜 번호·주소·메일을 넣지 않는다(null 이면 아래 businessPending 문구를 그대로 보여 준다).
   */
  business: null as null | { company: string; representative: string; registrationNo: string; address: string; email: string },
  /** 사업자 등록 전(business = null) 푸터·방침에 쓰는 정직한 안내 */
  businessPending: "포트폴리오용 시연 사이트입니다. 사업자 등록 전으로 실제 영업을 하지 않습니다.",
  copyright: "© 2026 리얼성형",
} as const;

/**
 * /consult/ 로 가는 모든 버튼·링크의 이름 — 한 가지로 통일한다.
 * "예약"은 병원 진료 예약으로 읽히고, 버튼의 "무료"는 의료광고 심의에서 환자 유인 문구로 지적받기 쉬워 쓰지 않는다
 * (비용 안내가 필요하면 설명 문장에 "비용이 들지 않습니다"로 쓴다).
 */
export const CONSULT_CTA = {
  /** 헤더·하단 고정 바처럼 좁은 자리 */
  short: "상담 신청",
  /** CTA 블록·제출 버튼 */
  long: "상담 신청하기",
} as const;
