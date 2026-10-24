/**
 * 이벤트 트래킹 — dataLayer.push 만 한다.
 * GA4·Meta Pixel·네이버 태그는 전부 GTM 컨테이너 안에서 관리한다(screen-spec 3절·5절).
 * 이 파일과 앱 코드에서 GA4·Meta 전역 함수를 직접 부르거나 태그 스크립트를 하드코딩하지 않는다.
 */

/** screen-spec.md 5절 이벤트 21개 (전환 1 + 보조 3 + 행동 17) 와 파라미터 */
export type TrackEvents = {
  view_procedure: { procedure_id: string; procedure_name: string; category: string };
  view_clinic: { clinic_id: string; clinic_name: string; is_premium: boolean };
  view_lp: { campaign: string; variant: string };
  click_cta: { location: string; procedure_id?: string };
  form_start: { procedure_id?: string; clinic_id?: string; source_page: string };
  form_step2: { procedure_id?: string; clinic_id?: string; source_page: string };
  generate_lead: {
    lead_id: string;
    procedure_id?: string;
    clinic_id?: string;
    value: number;
    currency: "KRW";
  };
  phone_click: { clinic_id: string; page: string };
  kakao_click: { clinic_id: string; page: string };
  click_affiliate: { item_id: string; procedure_id: string };
  scroll_depth: { percent: 25 | 50 | 75 | 100; page_type: string };
  search: { search_term: string };
  lead_qualified: { lead_id: string; value: number };
  select_category: { category: string };
  select_procedure: { procedure_id: string; from_page: string };
  select_clinic: { clinic_id: string; from: string };
  select_post: { post_id: string };
  expand_faq: { procedure_id: string; question_index: number };
  click_map: { clinic_id: string };
  kakao_add: Record<string, never>;
  experiment_variant: { campaign: string; variant: string };
};

export type TrackEventName = keyof TrackEvents;

export const TRACK_EVENTS = [
  "view_procedure",
  "view_clinic",
  "view_lp",
  "click_cta",
  "form_start",
  "form_step2",
  "generate_lead",
  "phone_click",
  "kakao_click",
  "click_affiliate",
  "scroll_depth",
  "search",
  "lead_qualified",
  "select_category",
  "select_procedure",
  "select_clinic",
  "select_post",
  "expand_faq",
  "click_map",
  "kakao_add",
  "experiment_variant",
] as const satisfies readonly TrackEventName[];

/** 전환 값 (5절): generate_lead 50,000원, lead_qualified 200,000원 */
export const LEAD_VALUE_KRW = 50000;
export const QUALIFIED_LEAD_VALUE_KRW = 200000;

export type DataLayerEntry = { event: TrackEventName } & Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

type ParamsArg<N extends TrackEventName> = TrackEvents[N] extends Record<string, never>
  ? [params?: TrackEvents[N]]
  : [params: TrackEvents[N]];

/**
 * dataLayer 에 `{ event: name, ...params }` 를 push 한다.
 * 서버(빌드) 환경에서는 아무것도 하지 않는다. undefined 값은 빼고 보낸다.
 */
export function track<N extends TrackEventName>(name: N, ...args: ParamsArg<N>): void {
  if (typeof window === "undefined") return;
  const params = (args[0] ?? {}) as Record<string, unknown>;
  const entry: DataLayerEntry = { event: name };
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) entry[k] = v;
  }
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(entry);
}
