/**
 * form_start·form_step2 의 source_page (screen-spec 5절): 상담 폼에 들어오기 직전 화면.
 *
 * next/link 로 이동하면 document.referrer 가 바뀌지 않는다(첫 로드 기준 값 그대로). 그래서
 * AttributionCapture 가 화면 이동마다 sessionStorage `rs_nav` 에 { prev, cur } 경로를 남기고, 폼은 그 값을 먼저 쓴다.
 * - 사이트 안에서 왔으면 basePath 를 뺀 경로("/procedures/쌍꺼풀-수술/")
 * - 다른 사이트에서 왔으면 호스트("m.search.naver.com")
 * - 둘 다 없으면 "direct"
 */

export const NAV_KEY = "rs_nav";

type Nav = { prev: string | null; cur: string };

function sessionStore(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

function readNav(storage: Storage | null): Nav | null {
  try {
    const v = JSON.parse(storage?.getItem(NAV_KEY) ?? "null") as Partial<Nav> | null;
    if (!v || typeof v.cur !== "string") return null;
    return { prev: typeof v.prev === "string" ? v.prev : null, cur: v.cur };
  } catch {
    return null;
  }
}

/** 화면 이동 기록(경로는 basePath 를 뺀 값). 같은 경로를 다시 기록(새로고침·중복 마운트)하면 그대로 둔다. */
export function recordPageView(rawPath: string, storage: Storage | null = sessionStore()): void {
  let path = rawPath;
  try {
    path = decodeURIComponent(rawPath);
  } catch {
    /* 그대로 */
  }
  const nav = readNav(storage);
  if (nav?.cur === path) return;
  try {
    storage?.setItem(NAV_KEY, JSON.stringify({ prev: nav?.cur ?? null, cur: path } satisfies Nav));
  } catch {
    /* 저장 불가 — referrer 로 대신한다 */
  }
}

/**
 * 지금 화면 직전의 사이트 내부 경로. 기록이 지금 화면까지 갱신됐으면 prev, 아직이면(효과 실행 순서) cur.
 */
export function previousPath(currentPath: string, storage: Storage | null = sessionStore()): string | null {
  const nav = readNav(storage);
  if (!nav) return null;
  return nav.cur === currentPath ? nav.prev : nav.cur;
}

function stripBase(pathname: string, basePath: string): string {
  let p = pathname;
  try {
    p = decodeURIComponent(p);
  } catch {
    /* 그대로 */
  }
  const base = basePath.replace(/\/+$/, "");
  if (base && (p === base || p.startsWith(`${base}/`))) p = p.slice(base.length) || "/";
  return p;
}

/** document.referrer 기준 source_page */
export function sourceFromReferrer(referrer: string, currentHref: string, basePath = ""): string {
  if (!referrer) return "direct";
  let ref: URL;
  let cur: URL;
  try {
    ref = new URL(referrer);
    cur = new URL(currentHref);
  } catch {
    return "direct";
  }
  if (ref.host !== cur.host) return ref.host || "direct";
  return stripBase(ref.pathname, basePath);
}

/** 사이트 내부 이동 기록 → referrer → "direct" 순서 */
export function sourcePage(
  { referrer, href, basePath = "" }: { referrer: string; href: string; basePath?: string },
  storage: Storage | null = sessionStore(),
): string {
  let current = "/";
  try {
    current = stripBase(new URL(href).pathname, basePath);
  } catch {
    /* 기본값 */
  }
  return previousPath(current, storage) ?? sourceFromReferrer(referrer, href, basePath);
}
