/**
 * 첫 유입(first-touch) 기록 — screen-spec 4절 P-06 숨김 필드, 5절 GTM 변수 "쿠키 _utm(첫 유입 UTM 90일)·_fbc·_fbp".
 *
 * - 첫 방문 때 `_utm` 쿠키(90일, SameSite=Lax, path=/)에 UTM·클릭 ID·랜딩·리퍼러를 JSON 으로 저장한다. 한 번 저장되면 덮어쓰지 않는다.
 * - 상담 신청 시 `_utm` + 메타 쿠키(_fbc·_fbp) + GA 클라이언트 ID(_ga)를 함께 읽어 리드에 싣는다(오프라인 전환·CAPI 매칭).
 * - 쿠키·문서 접근은 인자로 받아 단위 테스트에서 바꿔 끼운다.
 */

export const UTM_COOKIE = "_utm";
export const UTM_MAX_AGE_DAYS = 90;
const MAX_VALUE_LEN = 300;

export type FirstTouch = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  gclid: string | null;
  fbclid: string | null;
  /** 첫 랜딩 경로(+쿼리) — basePath 포함 그대로 */
  landing_page: string;
  /** 외부 리퍼러(같은 사이트 내부 이동은 null) */
  referrer: string | null;
  /** 저장 시각 ISO */
  ts: string;
};

/** 리드에 싣는 유입 정보 전체 */
export type Attribution = Omit<FirstTouch, "ts"> & {
  fbc: string | null;
  fbp: string | null;
  ga_client_id: string | null;
};

const PARAM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "gclid", "fbclid"] as const;

function clip(v: string | null | undefined): string | null {
  const t = (v ?? "").trim();
  return t ? t.slice(0, MAX_VALUE_LEN) : null;
}

/** "a=1; b=2" → Map. 값은 디코딩(실패하면 원문) */
export function parseCookies(cookieString: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const part of cookieString.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const key = part.slice(0, i).trim();
    if (!key || out.has(key)) continue;
    const raw = part.slice(i + 1).trim();
    let value = raw;
    try {
      value = decodeURIComponent(raw);
    } catch {
      /* 잘못된 인코딩은 원문 */
    }
    out.set(key, value);
  }
  return out;
}

/** 현재 URL·리퍼러로 첫 유입 레코드를 만든다. 같은 호스트에서 온 리퍼러는 내부 이동이라 버린다. */
export function buildFirstTouch(href: string, referrer: string, now: Date = new Date()): FirstTouch {
  const url = new URL(href);
  const params = url.searchParams;
  let ref: string | null = null;
  if (referrer) {
    try {
      ref = new URL(referrer).host === url.host ? null : clip(referrer);
    } catch {
      ref = null;
    }
  }
  const touch: FirstTouch = {
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    gclid: null,
    fbclid: null,
    landing_page: clip(`${url.pathname}${url.search}`) ?? "/",
    referrer: ref,
    ts: now.toISOString(),
  };
  for (const key of PARAM_KEYS) touch[key] = clip(params.get(key));
  return touch;
}

/** 쿠키 값(JSON) → 레코드. 형식이 틀리면 null */
export function parseFirstTouch(raw: string | null | undefined): FirstTouch | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<FirstTouch> | null;
    if (!v || typeof v !== "object" || typeof v.landing_page !== "string") return null;
    const s = (x: unknown) => (typeof x === "string" && x ? x : null);
    return {
      utm_source: s(v.utm_source),
      utm_medium: s(v.utm_medium),
      utm_campaign: s(v.utm_campaign),
      utm_content: s(v.utm_content),
      gclid: s(v.gclid),
      fbclid: s(v.fbclid),
      landing_page: v.landing_page,
      referrer: s(v.referrer),
      ts: typeof v.ts === "string" ? v.ts : "",
    };
  } catch {
    return null;
  }
}

/** _ga 쿠키 "GA1.1.1234567890.1700000000" → "1234567890.1700000000" */
export function parseGaClientId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const m = raw.trim().match(/^GA\d+\.\d+\.(\d+\.\d+)$/);
  return m ? (m[1] as string) : null;
}

/** fbclid 로 _fbc 형식 값을 만든다(Pixel 이 쿠키를 아직 안 만들었을 때의 CAPI 매칭용): fb.1.<ms>.<fbclid> */
export function fbcFromFbclid(fbclid: string, createdAt: Date): string {
  return `fb.1.${createdAt.getTime()}.${fbclid}`;
}

export function utmCookieString(touch: FirstTouch, secure: boolean): string {
  const maxAge = UTM_MAX_AGE_DAYS * 24 * 60 * 60;
  return `${UTM_COOKIE}=${encodeURIComponent(JSON.stringify(touch))}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure ? "; Secure" : ""}`;
}

type DocLike = { cookie: string; referrer: string; location: { href: string; protocol: string } };

function browserDoc(): DocLike | null {
  return typeof document === "undefined" ? null : (document as unknown as DocLike);
}

/**
 * 첫 방문이면 `_utm` 쿠키를 만든다. 이미 있으면(형식이 맞으면) 손대지 않는다.
 * @returns 저장(또는 기존) 레코드
 */
export function captureFirstTouch(doc: DocLike | null = browserDoc(), now: Date = new Date()): FirstTouch | null {
  if (!doc) return null;
  try {
    const existing = parseFirstTouch(parseCookies(doc.cookie).get(UTM_COOKIE));
    if (existing) return existing;
    const touch = buildFirstTouch(doc.location.href, doc.referrer, now);
    doc.cookie = utmCookieString(touch, doc.location.protocol === "https:");
    return touch;
  } catch {
    return null; // 쿠키 차단 환경
  }
}

/**
 * 리드에 실을 유입 정보. `_utm` 이 없으면(쿠키 차단·캡처 전) 지금 페이지 기준으로 만든다.
 * _fbc 쿠키가 없고 fbclid 가 있으면 첫 유입 시각으로 _fbc 형식 값을 만든다.
 */
export function readAttribution(doc: DocLike | null = browserDoc(), now: Date = new Date()): Attribution {
  const cookies = doc ? parseCookies(doc.cookie) : new Map<string, string>();
  const touch =
    parseFirstTouch(cookies.get(UTM_COOKIE)) ?? (doc ? buildFirstTouch(doc.location.href, doc.referrer, now) : null);
  const fbcCookie = clip(cookies.get("_fbc"));
  const fbc =
    fbcCookie ?? (touch?.fbclid ? fbcFromFbclid(touch.fbclid, touch.ts ? new Date(touch.ts) : now) : null);
  return {
    utm_source: touch?.utm_source ?? null,
    utm_medium: touch?.utm_medium ?? null,
    utm_campaign: touch?.utm_campaign ?? null,
    utm_content: touch?.utm_content ?? null,
    gclid: touch?.gclid ?? null,
    fbclid: touch?.fbclid ?? null,
    landing_page: touch?.landing_page ?? "/",
    referrer: touch?.referrer ?? null,
    fbc,
    fbp: clip(cookies.get("_fbp")),
    ga_client_id: parseGaClientId(cookies.get("_ga")),
  };
}
