/**
 * Edge Function `submit-lead` (screen-spec 8절, 7절 CAPI) — Deno. 배포: `npx supabase functions deploy submit-lead`.
 *
 * 검증 → 5분 중복 차단 → 휴대폰 AES-GCM 암호화 → leads insert(service role) → Resend 알림 → 메타 CAPI Lead → { lead_id }
 * - 외부 의존성 없음: DB 는 PostgREST(fetch), 암호화·해시는 Web Crypto. 그래서 vitest(Node)에서도 createHandler 를 그대로 검증한다.
 * - 알림·CAPI 실패는 접수 실패가 아니다(로그만). 브라우저에는 lead_id 만 돌려준다.
 * - 검증 규칙은 lib/consult/validation.ts 와 같다(tests/unit/submit-lead.test.ts 가 같은 결과인지 확인).
 *
 * 시크릿: SUPABASE_URL·SUPABASE_SERVICE_ROLE_KEY(플랫폼 기본 주입), LEAD_ENCRYPTION_KEY(base64 32바이트),
 *        RESEND_API_KEY·LEAD_NOTIFY_EMAIL(선택), META_CAPI_TOKEN·META_PIXEL_ID·META_TEST_EVENT_CODE(선택), ALLOWED_ORIGINS(쉼표 구분)
 */

declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (req: Request) => Response | Promise<Response>): unknown;
};

export const LEAD_VALUE_KRW = 50000;
export const DUPLICATE_WINDOW_MS = 5 * 60 * 1000;
const META_API_VERSION = "v21.0";

const REGIONS = ["gangnam-seocho", "seoul-etc", "gyeonggi-incheon", "busan-gyeongnam", "etc"] as const;
const TIMINGS = ["within_1m", "within_3m", "undecided"] as const;
const CONTACT_TIMES = ["morning", "afternoon", "evening", "anytime"] as const;
const LABEL: Record<string, string> = {
  "gangnam-seocho": "서울 강남·서초",
  "seoul-etc": "서울 기타",
  "gyeonggi-incheon": "경기·인천",
  "busan-gyeongnam": "부산·경남",
  etc: "기타",
  within_1m: "1개월 내",
  within_3m: "3개월 내",
  undecided: "아직 미정",
  morning: "오전",
  afternoon: "오후",
  evening: "저녁",
  anytime: "언제든",
};
const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "gclid",
  "fbclid",
  "fbc",
  "fbp",
  "ga_client_id",
  "landing_page",
  "referrer",
  "page_url",
] as const;

export type LeadInput = {
  procedure_id: string | null;
  clinic_id: string | null;
  name: string;
  /** 숫자만 */
  phone: string;
  region: (typeof REGIONS)[number];
  timing: (typeof TIMINGS)[number];
  contact_time: (typeof CONTACT_TIMES)[number];
  memo: string | null;
  /** [선택] 병원 연결을 위한 제3자 제공 — false 면 병원에 넘기지 않는다(제휴 병원 없음) */
  consent_3rd: boolean;
  consent_marketing: boolean;
  consent_version: string;
  consent_ads: boolean;
} & Record<(typeof ATTRIBUTION_KEYS)[number], string | null>;

type Validation = { ok: true; value: LeadInput } | { ok: false; fields: Record<string, string> };

const ID = /^[a-z0-9-]{1,64}$/;
const NAME_CHARS = /^[가-힣ㄱ-ㅎㅏ-ㅣA-Za-z][가-힣ㄱ-ㅎㅏ-ㅣA-Za-z .·-]*$/;
const str = (v: unknown, max = 300): string | null => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

/** 요청 본문 검증 — 화면(lib/consult/validation.ts)과 같은 기준, 문구는 원인+해결 한 문장 */
export function validateLead(body: unknown): Validation {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const fields: Record<string, string> = {};
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const nameLen = [...name].length;
  if (!name || !NAME_CHARS.test(name) || nameLen < 2 || nameLen > 20) {
    fields.name = "이름 형식이 맞지 않으니 한글 또는 영문 2~20자로 입력해 주세요.";
  }
  const phone = typeof b.phone === "string" ? b.phone.replace(/\D/g, "") : "";
  if (!/^010\d{8}$/.test(phone) && !/^01[16789]\d{7,8}$/.test(phone)) {
    fields.phone = "휴대폰 번호 형식이 맞지 않으니 010-1234-5678 형식으로 다시 입력해 주세요.";
  }
  if (!REGIONS.includes(b.region as never)) fields.region = "희망 지역이 선택되지 않았으니 가까운 지역을 골라 주세요.";
  if (!TIMINGS.includes(b.timing as never)) fields.timing = "희망 시기가 선택되지 않았으니 가장 가까운 항목을 골라 주세요.";
  if (!CONTACT_TIMES.includes(b.contact_time as never)) {
    fields.contact_time = "연락 가능 시간이 선택되지 않았으니 편한 시간대를 골라 주세요.";
  }
  const memo = typeof b.memo === "string" ? b.memo.trim() : "";
  if ([...memo].length > 500) fields.memo = "메모가 500자를 넘었으니 500자 이내로 줄여 주세요.";
  if (b.consent_privacy !== true) fields.consent_privacy = "개인정보 수집·이용 동의가 빠져 있으니 내용을 확인하고 동의해 주세요.";
  // 민감정보(관심 시술) 처리 — 개인정보 보호법 제23조 별도 필수 동의
  if (b.consent_sensitive !== true) {
    fields.consent_sensitive = "민감정보(관심 시술) 처리 동의가 빠져 있으니 내용을 확인하고 동의해 주세요.";
  }
  // 병원 제3자 제공은 선택 — 값이 오면 true/false 여야 한다
  if (b.consent_3rd != null && typeof b.consent_3rd !== "boolean") {
    fields.consent_3rd = "제3자 제공 동의 값을 확인하지 못했으니 페이지를 새로고침한 뒤 다시 신청해 주세요.";
  }
  for (const key of ["procedure_id", "clinic_id"] as const) {
    if (b[key] != null && (typeof b[key] !== "string" || !ID.test(b[key] as string))) {
      fields[key] = "선택한 항목을 확인하지 못했으니 처음부터 다시 선택해 주세요.";
    }
  }
  const version = str(b.consent_version, 20);
  if (!version) fields.consent_privacy ??= "동의 문구 버전을 확인하지 못했으니 페이지를 새로고침한 뒤 다시 신청해 주세요.";
  if (Object.keys(fields).length) return { ok: false, fields };

  const value = {
    procedure_id: (b.procedure_id as string | null) ?? null,
    clinic_id: (b.clinic_id as string | null) ?? null,
    name,
    phone,
    region: b.region as LeadInput["region"],
    timing: b.timing as LeadInput["timing"],
    contact_time: b.contact_time as LeadInput["contact_time"],
    memo: memo || null,
    consent_3rd: b.consent_3rd === true,
    consent_marketing: b.consent_marketing === true,
    consent_version: version as string,
    consent_ads: b.consent_ads === true,
  } as LeadInput;
  for (const key of ATTRIBUTION_KEYS) value[key] = str(b[key], key === "landing_page" || key === "page_url" || key === "referrer" ? 500 : 300);
  return { ok: true, value };
}

// ── 암호·해시 (Web Crypto) ─────────────────────────────────────────────────────

const enc = new TextEncoder();
const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, "0")).join("");

async function aesKey(secretB64: string): Promise<CryptoKey> {
  const raw = fromB64(secretB64);
  if (raw.length !== 32) throw new Error("LEAD_ENCRYPTION_KEY 는 base64 로 인코딩한 32바이트여야 합니다.");
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

/** "v1:<iv>:<ciphertext>" (AES-256-GCM, 96bit IV) */
export async function encryptPhone(digits: string, secretB64: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(secretB64), enc.encode(digits));
  return `v1:${b64(iv)}:${b64(new Uint8Array(ct))}`;
}

/** admin-leads 함수가 쓰는 복호화(여기서는 검증용으로 함께 둔다) */
export async function decryptPhone(payload: string, secretB64: string): Promise<string> {
  const [v, iv, ct] = payload.split(":");
  if (v !== "v1" || !iv || !ct) throw new Error("알 수 없는 암호문 형식");
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(iv) }, await aesKey(secretB64), fromB64(ct));
  return new TextDecoder().decode(pt);
}

/** 중복 확인용 키 — HMAC-SHA256(암호화 키, 번호). 암호문은 매번 달라 비교할 수 없으므로 따로 둔다. */
export async function phoneHash(digits: string, secretB64: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", fromB64(secretB64), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, enc.encode(`phone:${digits}`)));
}

export async function sha256Hex(text: string): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", enc.encode(text)));
}

/** 메타 고객 정보 정규화: 국가 번호 포함 숫자만(+ 없음) — 01012345678 → 821012345678 */
export function metaPhone(digits: string): string {
  return `82${digits.replace(/^0/, "")}`;
}

const maskName = (name: string) => {
  const c = [...name];
  return c.length <= 2 ? `${c[0]}*` : `${c[0]}${"*".repeat(c.length - 2)}${c[c.length - 1]}`;
};

// ── 핸들러 ─────────────────────────────────────────────────────────────────────

export type Deps = {
  env: (key: string) => string | undefined;
  fetch: typeof fetch;
  now?: () => Date;
  uuid?: () => string;
  log?: (msg: string) => void;
};

function corsHeaders(origin: string | null, allowed: string[]): Record<string, string> {
  const allow = !allowed.length || allowed.includes("*") ? "*" : origin && allowed.includes(origin) ? origin : allowed[0]!;
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function createHandler(deps: Deps) {
  const now = deps.now ?? (() => new Date());
  const uuid = deps.uuid ?? (() => crypto.randomUUID());
  const log = deps.log ?? ((m: string) => console.log(m));

  return async function handler(req: Request): Promise<Response> {
    const allowed = (deps.env("ALLOWED_ORIGINS") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    const cors = corsHeaders(req.headers.get("origin"), allowed);
    const json = (status: number, body: unknown) =>
      new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8" } });

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json(400, { error: "invalid_json" });
    }
    const checked = validateLead(body);
    if (!checked.ok) return json(422, { error: "invalid", fields: checked.fields });
    const lead = checked.value;

    const supabaseUrl = (deps.env("SUPABASE_URL") ?? "").replace(/\/+$/, "");
    const serviceKey = deps.env("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const secret = deps.env("LEAD_ENCRYPTION_KEY") ?? "";
    if (!supabaseUrl || !serviceKey || !secret) {
      log("[submit-lead] 시크릿 누락: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / LEAD_ENCRYPTION_KEY");
      return json(500, { error: "server_misconfigured" });
    }
    const db = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };

    try {
      // 1) 5분 중복 차단(같은 번호)
      const hash = await phoneHash(lead.phone, secret);
      const since = new Date(now().getTime() - DUPLICATE_WINDOW_MS).toISOString();
      const dupRes = await deps.fetch(
        `${supabaseUrl}/rest/v1/leads?select=id&phone_hash=eq.${hash}&created_at=gte.${encodeURIComponent(since)}&limit=1`,
        { headers: db },
      );
      if (!dupRes.ok) throw new Error(`중복 조회 실패 ${dupRes.status}`);
      if (((await dupRes.json()) as unknown[]).length > 0) return json(409, { error: "duplicate" });

      // 2) 암호화 후 저장 — lead_id 를 먼저 만들어 CAPI event_id 로 같이 쓴다
      const leadId = uuid();
      const { consent_ads: _ads, phone: _plain, ...columns } = lead;
      void _ads;
      void _plain;
      const row = {
        ...columns,
        id: leadId,
        phone: await encryptPhone(lead.phone, secret),
        phone_hash: hash,
        consent_privacy: true,
        consent_sensitive: true,
      };
      const insRes = await deps.fetch(`${supabaseUrl}/rest/v1/leads`, {
        method: "POST",
        headers: { ...db, Prefer: "return=minimal" },
        body: JSON.stringify(row),
      });
      if (!insRes.ok) {
        const err = (await insRes.json().catch(() => ({}))) as { code?: string };
        if (err.code === "23503") {
          return json(422, { error: "invalid", fields: { procedure_id: "선택한 시술을 확인하지 못했으니 시술을 다시 골라 주세요." } });
        }
        throw new Error(`저장 실패 ${insRes.status} ${err.code ?? ""}`);
      }

      // 3) 알림·CAPI — 실패해도 접수는 성공
      const side = await Promise.allSettled([notify(lead, leadId, deps), sendCapi(lead, leadId, req, deps, now())]);
      for (const r of side) if (r.status === "rejected") log(`[submit-lead] 부가 작업 실패: ${String(r.reason)}`);

      return json(200, { lead_id: leadId });
    } catch (e) {
      log(`[submit-lead] ${e instanceof Error ? e.message : String(e)}`);
      return json(500, { error: "server_error" });
    }
  };
}

/** 운영자 알림 메일 — 번호는 넣지 않는다(개인정보처리방침 「개인정보 처리 위탁」: 해외 이전 최소화). 관리자 화면에서 복호화해 본다. */
async function notify(lead: LeadInput, leadId: string, deps: Deps): Promise<void> {
  const key = deps.env("RESEND_API_KEY");
  const to = deps.env("LEAD_NOTIFY_EMAIL");
  if (!key || !to) return;
  const lines = [
    `접수 ID: ${leadId}`,
    `신청자: ${maskName(lead.name)}`,
    `관심 시술: ${lead.procedure_id ?? "미정"}${lead.clinic_id ? ` / 병원 ${lead.clinic_id}` : ""}`,
    `희망 지역·시기: ${LABEL[lead.region]} / ${LABEL[lead.timing]}`,
    `연락 가능 시간: ${LABEL[lead.contact_time]}`,
    `병원 연결(제3자 제공) 동의: ${lead.consent_3rd ? "예" : "아니오 — 병원에 넘기지 않음"}`,
    `유입: ${[lead.utm_source, lead.utm_medium, lead.utm_campaign].filter(Boolean).join(" / ") || "직접·자연 유입"}`,
  ];
  const res = await deps.fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: deps.env("LEAD_FROM_EMAIL") ?? "리얼성형 <onboarding@resend.dev>",
      to: [to],
      subject: `[리얼성형] 새 상담 신청 (${LABEL[lead.timing]})`,
      text: `${lines.join("\n")}\n\n연락처는 관리자 화면에서 확인하세요.`,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}`);
}

/** 메타 전환 API Lead — event_id = lead_id(브라우저 픽셀 Lead 와 중복 제거). 쿠키 배너 "광고 성과 측정" 동의 시에만. */
async function sendCapi(lead: LeadInput, leadId: string, req: Request, deps: Deps, at: Date): Promise<void> {
  const token = deps.env("META_CAPI_TOKEN");
  const pixel = deps.env("META_PIXEL_ID");
  if (!token || !pixel || !lead.consent_ads) return;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const userData: Record<string, unknown> = { ph: [await sha256Hex(metaPhone(lead.phone))] };
  if (lead.fbc) userData.fbc = lead.fbc;
  if (lead.fbp) userData.fbp = lead.fbp;
  if (ip) userData.client_ip_address = ip;
  const ua = req.headers.get("user-agent");
  if (ua) userData.client_user_agent = ua;
  const testCode = deps.env("META_TEST_EVENT_CODE");
  const res = await deps.fetch(`https://graph.facebook.com/${META_API_VERSION}/${pixel}/events?access_token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: [
        {
          event_name: "Lead",
          event_time: Math.floor(at.getTime() / 1000),
          event_id: leadId,
          action_source: "website",
          event_source_url: lead.page_url ?? undefined,
          user_data: userData,
          custom_data: { value: LEAD_VALUE_KRW, currency: "KRW", content_category: lead.procedure_id ?? "undecided" },
        },
      ],
      ...(testCode ? { test_event_code: testCode } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Meta CAPI ${res.status}`);
}

if (typeof Deno !== "undefined") {
  Deno.serve(createHandler({ env: (k) => Deno.env.get(k), fetch: (...a) => fetch(...a) }));
}
