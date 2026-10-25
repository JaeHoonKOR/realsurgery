/**
 * 상담 신청 제출 (screen-spec 4절 P-06 "Edge Function submit-lead 호출 → lead_id", 8절 "leads 는 브라우저 읽기·쓰기 금지").
 *
 * - Supabase 공개 키가 있으면 `${SUPABASE_URL}/functions/v1/submit-lead` 로 POST 한다(anon 키 헤더). DB 는 함수만 쓴다.
 * - 키가 없으면 **mock 모드**(CLAUDE.md): 같은 인터페이스로 약 0.7초 뒤 lead_id 를 돌려주고,
 *   관리자 화면 시연용으로 마스킹한 요약만 localStorage `rs_mock_leads` 에 남긴다. 원문 번호·이름은 저장하지 않는다.
 * - 결과는 예외 대신 { ok } 로 돌려준다 → 화면이 원인별 안내(중복·검증·서버·네트워크)를 고른다.
 */
import { hasPublicKey, readPublicVar } from "@/lib/env.public";
import type { Attribution } from "./attribution";
import type { ContactTimeValue, RegionValue, TimingValue } from "./options";
import { maskName, maskPhone, phoneDigits } from "./phone";
import { PROCEDURE_UNDECIDED, type ConsultValues } from "./validation";

/** 동의 문구 버전 = 개인정보처리방침 시행일. 문구를 바꾸면 함께 올린다(동의 증빙). */
export const CONSENT_VERSION = "2026-11-01";
export const MOCK_LEADS_KEY = "rs_mock_leads";
export const MOCK_DELAY_MS = 700;
const MOCK_KEEP = 50;
const REQUEST_TIMEOUT_MS = 15000;

/** leads 테이블 컬럼(8절) + 요청 단위 값. phone 은 숫자만 — 함수가 암호화해 저장한다. */
export type LeadPayload = Attribution & {
  procedure_id: string | null;
  clinic_id: string | null;
  name: string;
  phone: string;
  region: RegionValue;
  timing: TimingValue;
  contact_time: ContactTimeValue;
  memo: string | null;
  consent_privacy: true;
  /** 민감정보(관심 시술) 처리 — 필수 */
  consent_sensitive: true;
  /** 병원 연결을 위한 제3자 제공 — 선택(false 면 병원에 넘기지 않는다) */
  consent_3rd: boolean;
  consent_marketing: boolean;
  consent_version: string;
  /** 쿠키 배너 "광고 성과 측정" 동의 — 함수는 true 일 때만 메타 CAPI 를 보낸다 */
  consent_ads: boolean;
  /** CAPI event_source_url */
  page_url: string;
};

export type SubmitFailure = {
  ok: false;
  reason: "duplicate" | "invalid" | "server" | "network";
  /** 화면에 그대로 보여 줄 한 문장(원인 + 해결) */
  message: string;
  /** 서버 검증 실패 시 필드별 메시지 */
  fields?: Record<string, string>;
};
export type SubmitResult = { ok: true; lead_id: string; mode: "live" | "mock" } | SubmitFailure;

export const SUBMIT_MESSAGES = {
  network: "인터넷 연결이 불안정해 신청을 보내지 못했으니, 연결을 확인한 뒤 다시 시도해 주세요.",
  server: "일시적인 서버 문제로 신청을 접수하지 못했으니, 잠시 후 다시 시도해 주세요. 입력하신 내용은 그대로 남아 있습니다.",
  invalid: "입력값 일부를 서버에서 확인하지 못했으니, 표시된 항목을 고친 뒤 다시 시도해 주세요.",
  duplicate: "같은 번호로 방금 접수된 신청이 있어 중복 접수를 막았으니, 5분 뒤에 다시 시도하거나 연락을 기다려 주세요.",
} as const;

export function buildLeadPayload(
  v: ConsultValues,
  attribution: Attribution,
  extra: { consent_ads: boolean; page_url: string },
): LeadPayload {
  if (!v.region || !v.timing || !v.contact_time || !v.consent_privacy || !v.consent_sensitive) {
    throw new Error("검증되지 않은 값으로 payload 를 만들 수 없습니다(validateAll 먼저).");
  }
  const memo = v.memo.trim();
  return {
    ...attribution,
    procedure_id: v.procedure_id && v.procedure_id !== PROCEDURE_UNDECIDED ? v.procedure_id : null,
    clinic_id: v.clinic_id || null,
    name: v.name.trim(),
    phone: phoneDigits(v.phone),
    region: v.region,
    timing: v.timing,
    contact_time: v.contact_time,
    memo: memo ? memo : null,
    consent_privacy: true,
    consent_sensitive: true,
    consent_3rd: v.consent_3rd,
    consent_marketing: v.consent_marketing,
    consent_version: CONSENT_VERSION,
    consent_ads: extra.consent_ads,
    page_url: extra.page_url,
  };
}

export type SubmitOptions = {
  /** null = mock 강제, 객체 = 해당 프로젝트로 호출. 기본: 환경 변수 */
  endpoint?: { url: string; anonKey: string } | null;
  fetchImpl?: typeof fetch;
  delayMs?: number;
  storage?: Storage | null;
  now?: () => Date;
  uuid?: () => string;
};

function envEndpoint(): { url: string; anonKey: string } | null {
  if (!hasPublicKey("SUPABASE")) return null;
  return {
    url: readPublicVar("NEXT_PUBLIC_SUPABASE_URL").replace(/\/+$/, ""),
    anonKey: readPublicVar("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

function defaultStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function defaultUuid(): string {
  return globalThis.crypto.randomUUID();
}

export type MockLeadSummary = {
  lead_id: string;
  created_at: string;
  procedure_id: string | null;
  clinic_id: string | null;
  region: string;
  timing: string;
  contact_time: string;
  name_masked: string;
  phone_masked: string;
  consent_3rd: boolean;
  consent_marketing: boolean;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  status: "new";
};

export function readMockLeads(storage: Storage | null = defaultStorage()): MockLeadSummary[] {
  try {
    const v = JSON.parse(storage?.getItem(MOCK_LEADS_KEY) ?? "[]") as unknown;
    return Array.isArray(v) ? (v as MockLeadSummary[]) : [];
  } catch {
    return [];
  }
}

function appendMockLead(summary: MockLeadSummary, storage: Storage | null): void {
  try {
    storage?.setItem(MOCK_LEADS_KEY, JSON.stringify([...readMockLeads(storage), summary].slice(-MOCK_KEEP)));
  } catch {
    /* 시연용 기록이므로 실패해도 접수는 성공 */
  }
}

async function submitMock(payload: LeadPayload, o: Required<Pick<SubmitOptions, "delayMs" | "now" | "uuid">> & { storage: Storage | null }): Promise<SubmitResult> {
  await new Promise((r) => setTimeout(r, o.delayMs));
  const lead_id = o.uuid();
  appendMockLead(
    {
      lead_id,
      created_at: o.now().toISOString(),
      procedure_id: payload.procedure_id,
      clinic_id: payload.clinic_id,
      region: payload.region,
      timing: payload.timing,
      contact_time: payload.contact_time,
      name_masked: maskName(payload.name),
      phone_masked: maskPhone(payload.phone),
      consent_3rd: payload.consent_3rd,
      consent_marketing: payload.consent_marketing,
      utm_source: payload.utm_source,
      utm_medium: payload.utm_medium,
      utm_campaign: payload.utm_campaign,
      status: "new",
    },
    o.storage,
  );
  return { ok: true, lead_id, mode: "mock" };
}

async function submitLive(payload: LeadPayload, endpoint: { url: string; anonKey: string }, fetchImpl: typeof fetch): Promise<SubmitResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetchImpl(`${endpoint.url}/functions/v1/submit-lead`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: endpoint.anonKey,
        Authorization: `Bearer ${endpoint.anonKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch {
    return { ok: false, reason: "network", message: SUBMIT_MESSAGES.network };
  } finally {
    clearTimeout(timer);
  }

  let body: { lead_id?: unknown; error?: unknown; fields?: unknown } = {};
  try {
    body = (await res.json()) as typeof body;
  } catch {
    /* 본문 없음 */
  }
  if (res.ok && typeof body.lead_id === "string" && body.lead_id) {
    return { ok: true, lead_id: body.lead_id, mode: "live" };
  }
  if (res.status === 409) return { ok: false, reason: "duplicate", message: SUBMIT_MESSAGES.duplicate };
  if (res.status === 400 || res.status === 422) {
    const fields =
      body.fields && typeof body.fields === "object" ? (body.fields as Record<string, string>) : undefined;
    return { ok: false, reason: "invalid", message: SUBMIT_MESSAGES.invalid, fields };
  }
  return { ok: false, reason: "server", message: SUBMIT_MESSAGES.server };
}

export function isMockMode(endpoint: SubmitOptions["endpoint"] = envEndpoint()): boolean {
  return endpoint === null;
}

export async function submitLead(payload: LeadPayload, options: SubmitOptions = {}): Promise<SubmitResult> {
  const endpoint = options.endpoint === undefined ? envEndpoint() : options.endpoint;
  if (endpoint === null) {
    return submitMock(payload, {
      delayMs: options.delayMs ?? MOCK_DELAY_MS,
      now: options.now ?? (() => new Date()),
      uuid: options.uuid ?? defaultUuid,
      storage: options.storage === undefined ? defaultStorage() : options.storage,
    });
  }
  return submitLive(payload, endpoint, options.fetchImpl ?? globalThis.fetch.bind(globalThis));
}
