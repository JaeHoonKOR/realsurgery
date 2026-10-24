/**
 * 브라우저에서도 안전한 환경 변수 접근.
 * NEXT_PUBLIC_* 값은 Next가 빌드 시 문자열로 치환하도록 반드시 리터럴로 참조한다(동적 접근 금지).
 * 서버 전용 키·키 파일 확인은 lib/env.ts (Node 전용).
 */

export const PUBLIC_VARS = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_BASE_PATH",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_GTM_ID",
  "NEXT_PUBLIC_GA4_MEASUREMENT_ID",
  "NEXT_PUBLIC_META_PIXEL_ID",
  "NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION",
  "NEXT_PUBLIC_NAVER_SITE_VERIFICATION",
  "NEXT_PUBLIC_NAVER_ANALYTICS_ID",
  "NEXT_PUBLIC_NAVER_MAP_CLIENT_ID",
] as const;

export type PublicVar = (typeof PUBLIC_VARS)[number];

export function readPublicVar(name: PublicVar): string {
  let value: string | undefined;
  switch (name) {
    case "NEXT_PUBLIC_SITE_URL":
      value = process.env.NEXT_PUBLIC_SITE_URL;
      break;
    case "NEXT_PUBLIC_BASE_PATH":
      value = process.env.NEXT_PUBLIC_BASE_PATH;
      break;
    case "NEXT_PUBLIC_SUPABASE_URL":
      value = process.env.NEXT_PUBLIC_SUPABASE_URL;
      break;
    case "NEXT_PUBLIC_SUPABASE_ANON_KEY":
      value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      break;
    case "NEXT_PUBLIC_GTM_ID":
      value = process.env.NEXT_PUBLIC_GTM_ID;
      break;
    case "NEXT_PUBLIC_GA4_MEASUREMENT_ID":
      value = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
      break;
    case "NEXT_PUBLIC_META_PIXEL_ID":
      value = process.env.NEXT_PUBLIC_META_PIXEL_ID;
      break;
    case "NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION":
      value = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
      break;
    case "NEXT_PUBLIC_NAVER_SITE_VERIFICATION":
      value = process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION;
      break;
    case "NEXT_PUBLIC_NAVER_ANALYTICS_ID":
      value = process.env.NEXT_PUBLIC_NAVER_ANALYTICS_ID;
      break;
    case "NEXT_PUBLIC_NAVER_MAP_CLIENT_ID":
      value = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
      break;
  }
  return (value ?? "").trim();
}

/** 브라우저에서 판단 가능한 서비스 키 묶음 */
export const PUBLIC_KEYS = {
  SUPABASE: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
  GTM: ["NEXT_PUBLIC_GTM_ID"],
  GA4: ["NEXT_PUBLIC_GA4_MEASUREMENT_ID"],
  META_PIXEL: ["NEXT_PUBLIC_META_PIXEL_ID"],
  NAVER_MAP: ["NEXT_PUBLIC_NAVER_MAP_CLIENT_ID"],
} as const satisfies Record<string, readonly PublicVar[]>;

export type PublicKeyName = keyof typeof PUBLIC_KEYS;

/** 키가 없으면 false → 호출부는 mock 경로로 진행한다. */
export function hasPublicKey(name: PublicKeyName): boolean {
  return PUBLIC_KEYS[name].every((v) => readPublicVar(v) !== "");
}

/** basePath("/realsurgery" 또는 "")를 붙인 경로. public/ 정적 파일 링크용. */
export function withBasePath(path: string): string {
  const base = readPublicVar("NEXT_PUBLIC_BASE_PATH").replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/** 절대 사이트 URL (canonical·OG용). 끝 슬래시 없음. */
export function siteUrl(): string {
  return readPublicVar("NEXT_PUBLIC_SITE_URL").replace(/\/+$/, "") || "http://localhost:3000";
}
