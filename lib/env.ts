/**
 * 외부 서비스 mock 가드 (Node 전용: 빌드·서버 컴포넌트·스크립트·테스트).
 * - 키 = 환경 변수 값이 비어 있지 않음 + (파일형 키는) 파일이 실제로 존재하고 형식이 맞음.
 * - 키가 없으면 호출부는 인터페이스만 쓰고 더미 응답으로 진행한다(CLAUDE.md "외부 서비스 mock 모드").
 * - 브라우저 코드는 lib/env.public.ts 의 hasPublicKey 를 쓴다(이 파일은 node:fs 를 import 한다).
 */
import fs from "node:fs";
import path from "node:path";
import { PUBLIC_KEYS, PUBLIC_VARS, readPublicVar, type PublicVar } from "./env.public";

type KeySpec = {
  /** 값이 비어 있으면 안 되는 환경 변수 */
  vars: readonly string[];
  /** 값이 "파일 경로"인 변수 — 파일 존재·형식까지 확인 */
  files?: readonly { pathVar: string; validate?: (content: string) => boolean }[];
  /** 함께 갖춰져야 하는 다른 키 (KEYS 의 이름) */
  requires?: readonly string[];
};

function isServiceAccountJson(content: string): boolean {
  try {
    const json = JSON.parse(content) as Record<string, unknown>;
    return (
      json.type === "service_account" &&
      typeof json.client_email === "string" &&
      json.client_email.length > 0 &&
      typeof json.private_key === "string" &&
      json.private_key.includes("PRIVATE KEY")
    );
  } catch {
    return false;
  }
}

export const KEYS = {
  ...PUBLIC_KEYS,
  SUPABASE_ADMIN: { vars: ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_PROJECT_REF", "SUPABASE_DB_PASSWORD"] },
  ADMIN_ACCOUNT: { vars: ["ADMIN_EMAIL", "ADMIN_PASSWORD"] },
  LEAD_ENCRYPTION: { vars: ["LEAD_ENCRYPTION_KEY"] },
  RESEND: { vars: ["RESEND_API_KEY", "LEAD_NOTIFY_EMAIL"] },
  META_CAPI: { vars: ["META_CAPI_TOKEN"] },
  GEMINI: { vars: ["GEMINI_API_KEY"] },
  GCP: { vars: ["GCP_SA_KEY_PATH"], files: [{ pathVar: "GCP_SA_KEY_PATH", validate: isServiceAccountJson }] },
  GA4_API: { vars: ["GA4_PROPERTY_ID"], requires: ["GCP"] },
  GTM_API: { vars: ["GTM_ACCOUNT_ID", "GTM_CONTAINER_ID", "GTM_WORKSPACE_ID"], requires: ["GCP"] },
  GSC: { vars: ["GSC_SITE_URL"], requires: ["GCP"] },
} as const satisfies Record<string, readonly PublicVar[] | KeySpec>;

export type KeyName = keyof typeof KEYS;

function specOf(name: KeyName): KeySpec {
  const raw: readonly string[] | KeySpec = KEYS[name];
  return Array.isArray(raw) ? { vars: raw } : (raw as KeySpec);
}

function readVar(name: string): string {
  if ((PUBLIC_VARS as readonly string[]).includes(name)) return readPublicVar(name as PublicVar);
  return (process.env[name] ?? "").trim();
}

/** 상대 경로는 저장소 루트(process.cwd()) 기준 */
function resolveKeyFile(p: string): string {
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

export type KeyCheck = { name: KeyName; ok: boolean; missing: string[] };

/** 무엇이 빠졌는지까지 돌려준다(로그·needs-key 기록용). 값 자체는 절대 포함하지 않는다. */
export function checkKey(name: KeyName, seen: Set<KeyName> = new Set()): KeyCheck {
  const spec = specOf(name);
  const missing: string[] = [];
  seen.add(name);

  for (const v of spec.vars) {
    if (readVar(v) === "") missing.push(v);
  }

  for (const f of spec.files ?? []) {
    const p = readVar(f.pathVar);
    if (p === "") continue; // 이미 vars 에서 missing 처리
    const abs = resolveKeyFile(p);
    let content: string | null = null;
    try {
      content = fs.statSync(abs).isFile() ? fs.readFileSync(abs, "utf8") : null;
    } catch {
      content = null;
    }
    if (content === null) missing.push(`${f.pathVar}: 파일 없음 (${p})`);
    else if (f.validate && !f.validate(content)) missing.push(`${f.pathVar}: 형식 오류 (${p})`);
  }

  for (const dep of (spec.requires ?? []) as readonly KeyName[]) {
    if (seen.has(dep)) continue;
    const sub = checkKey(dep, seen);
    if (!sub.ok) missing.push(...sub.missing.map((m) => `${dep} → ${m}`));
  }

  return { name, ok: missing.length === 0, missing };
}

/** true = 실서비스 호출 가능, false = mock 모드로 진행 */
export function hasKey(name: KeyName): boolean {
  return checkKey(name).ok;
}

/** 모든 키 상태. 빌드 로그·needs-key 재검증에 쓴다. */
export function keyReport(): KeyCheck[] {
  return (Object.keys(KEYS) as KeyName[]).map((k) => checkKey(k));
}

export function mockModeKeys(): KeyName[] {
  return keyReport()
    .filter((r) => !r.ok)
    .map((r) => r.name);
}
