/**
 * P-04 병원 목록·비교 — 서버(page)가 만들어 클라이언트 컴포넌트로 넘기는 최소 데이터.
 * 클라이언트 번들에 콘텐츠 전체가 들어가지 않게 화면에 쓰는 값만 담는다.
 */

export type CardOffer = {
  procedure_id: string;
  price_low: number | null;
  price_high: number | null;
  price_note: string | null;
};

export type ClinicCardData = {
  id: string;
  name: string;
  /** 병원 상세 경로(빌드된 경우만) */
  href: string | null;
  region: string;
  /** 지역 필터 칩 단위(시·도 + 시·군·구) */
  regionKey: string;
  is_demo: boolean;
  is_premium: boolean;
  offers: CardOffer[];
  /** 진료 시간 요약 */
  week: { weekday: string[]; saturday: string; sunday: string };
  /** 가장 최근 가격 갱신일(ISO) */
  updated: string | null;
};

export type ProcedureOption = {
  id: string;
  name: string;
  /** 부위 id(일러스트용)·이름 */
  category_id: string;
  category: string;
  /** 시술 전체 공개가(눈금) */
  price_low: number | null;
  price_high: number | null;
  price_note: string | null;
};
