/** 서버 컴포넌트(page.tsx)가 상담 폼에 넘기는 최소 필드 — content.json 전체를 클라이언트로 보내지 않는다. */
export type ProcedureOption = {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  /** 가격 표기("50만~250만 원") — 서버에서 미리 포맷 */
  price_label: string;
};

export type ClinicOption = {
  id: string;
  name: string;
  region: string;
};

/** 완료 화면 "관련 시술" 카드용 */
export type RelatedProcedure = {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  tagline: string;
  price_label: string;
  recovery_label: string;
  /** P-03 경로(화면이 빌드됐을 때만) */
  href: string | null;
};
