/**
 * 쿠키·동의 (screen-spec 3절 "쿠키·동의 배너: GA4·메타 픽셀 동의 토글, Consent Mode 기본 denied, 동의 후 업데이트")
 *
 * - Consent Mode v2 명령은 dataLayer 에 Arguments 객체로 push 한다(GTM 이 consent 명령으로 읽는 표준 형식).
 *   태그(GA4·Pixel) 스크립트는 여기서 로드하지 않는다 — 태그는 전부 GTM 안에서 관리(3절·5절).
 * - 방문 통계(GA4) → analytics_storage, 광고 성과 측정(메타 픽셀·구글 광고) → ad_storage·ad_user_data·ad_personalization.
 * - 선택은 localStorage 에 저장. 저장된 선택이 있으면 <html data-consent="set"> → 배너를 CSS 로 숨긴다(첫 페인트부터, 깜박임 없음).
 */

export const CONSENT_STORAGE_KEY = "rs_consent";
export const CONSENT_VERSION = 1;
/** <html> 에 붙는 속성. 값 "set" = 사용자가 이미 선택함 → 배너 숨김(app/globals.css) */
export const CONSENT_ATTR = "data-consent";
/** GTM 이 기본값 뒤 업데이트를 기다리는 시간(ms) */
export const CONSENT_WAIT_MS = 500;

export type ConsentChoice = { analytics: boolean; ads: boolean };
export type StoredConsent = ConsentChoice & { v: number; at: string };
export type ConsentValue = "granted" | "denied";
export type ConsentState = {
  ad_storage: ConsentValue;
  ad_user_data: ConsentValue;
  ad_personalization: ConsentValue;
  analytics_storage: ConsentValue;
};

const g = (on: boolean): ConsentValue => (on ? "granted" : "denied");

export function toConsentState(choice: ConsentChoice): ConsentState {
  return {
    ad_storage: g(choice.ads),
    ad_user_data: g(choice.ads),
    ad_personalization: g(choice.ads),
    analytics_storage: g(choice.analytics),
  };
}

export const DEFAULT_CONSENT_STATE: ConsentState = toConsentState({ analytics: false, ads: false });

/** 저장 문자열 → 선택. 형식·버전이 다르면 null(다시 묻는다). */
export function parseStoredConsent(raw: string | null | undefined): StoredConsent | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<StoredConsent> | null;
    if (!v || v.v !== CONSENT_VERSION || typeof v.analytics !== "boolean" || typeof v.ads !== "boolean") return null;
    return { v: v.v, analytics: v.analytics, ads: v.ads, at: typeof v.at === "string" ? v.at : "" };
  } catch {
    return null;
  }
}

function browserStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null; // 사파리 개인정보 보호 모드 등에서 접근 자체가 예외
  }
}

export function readConsent(storage: Storage | null = browserStorage()): StoredConsent | null {
  try {
    return parseStoredConsent(storage?.getItem(CONSENT_STORAGE_KEY));
  } catch {
    return null;
  }
}

/** gtag('consent', …) 와 같은 형식: dataLayer 에 Arguments 객체를 push 한다. */
function consentCommand(...args: unknown[]): void {
  window.dataLayer = window.dataLayer ?? [];
  // GTM 은 일반 배열이 아닌 Arguments 객체만 consent 명령으로 해석한다.
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
  void args;
}

export function pushConsent(kind: "default" | "update", state: ConsentState | (ConsentState & { wait_for_update: number })): void {
  if (typeof window === "undefined") return;
  consentCommand("consent", kind, state);
}

/** 사용자 선택을 저장하고 Consent Mode 를 업데이트한 뒤 배너를 숨긴다. */
export function saveConsent(
  choice: ConsentChoice,
  { storage = browserStorage(), now = new Date() }: { storage?: Storage | null; now?: Date } = {},
): StoredConsent {
  const stored: StoredConsent = { v: CONSENT_VERSION, analytics: choice.analytics, ads: choice.ads, at: now.toISOString() };
  try {
    storage?.setItem(CONSENT_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    /* 저장 불가(용량·차단)여도 이번 페이지에는 적용 */
  }
  pushConsent("update", toConsentState(choice));
  if (typeof document !== "undefined") document.documentElement.setAttribute(CONSENT_ATTR, "set");
  return stored;
}

/**
 * <head> 인라인 스크립트. GTM 보다 먼저 실행돼야 한다(Consent Mode v2 기본값).
 * 1) 기본 denied  2) 저장된 선택이 있으면 update + <html data-consent="set">
 */
export function consentInitScript(): string {
  const defaults = JSON.stringify({ ...DEFAULT_CONSENT_STATE, wait_for_update: CONSENT_WAIT_MS });
  return (
    `(function(w,d){w.dataLayer=w.dataLayer||[];function c(){w.dataLayer.push(arguments)}` +
    `c("consent","default",${defaults});` +
    `var s=null;try{s=JSON.parse(w.localStorage.getItem(${JSON.stringify(CONSENT_STORAGE_KEY)})||"null")}catch(e){}` +
    `if(s&&s.v===${CONSENT_VERSION}&&typeof s.analytics==="boolean"&&typeof s.ads==="boolean"){` +
    `var g=function(b){return b?"granted":"denied"};` +
    `c("consent","update",{ad_storage:g(s.ads),ad_user_data:g(s.ads),ad_personalization:g(s.ads),analytics_storage:g(s.analytics)});` +
    `d.documentElement.setAttribute(${JSON.stringify(CONSENT_ATTR)},"set")}})(window,document);`
  );
}
