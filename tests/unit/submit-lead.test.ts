// Edge Function submit-lead (supabase/functions/submit-lead/index.ts) — Deno 없이 createHandler 를 Node 에서 검증한다.
import { describe, expect, it, vi } from "vitest";
import { buildLeadPayload } from "@/lib/consult/submit";
import { emptyValues, validateAll, type ConsultValues } from "@/lib/consult/validation";
import {
  createHandler,
  decryptPhone,
  encryptPhone,
  metaPhone,
  phoneHash,
  sha256Hex,
  validateLead,
  type Deps,
} from "../../supabase/functions/submit-lead/index";

const KEY = Buffer.alloc(32, 7).toString("base64");
const VALUES: ConsultValues = {
  ...emptyValues({ procedure_id: "double-eyelid" }),
  region: "seoul-etc",
  timing: "undecided",
  name: "김지은",
  phone: "010-1234-5678",
  contact_time: "anytime",
  consent_privacy: true,
  consent_sensitive: true,
  consent_3rd: true,
};
const ATTR = {
  utm_source: "meta",
  utm_medium: "paid_social",
  utm_campaign: "eye_2026-11",
  utm_content: "A1",
  gclid: null,
  fbclid: "FB1",
  landing_page: "/lp/eye/",
  referrer: null,
  fbc: "fb.1.1700000000000.FB1",
  fbp: "fb.1.1700000000000.42",
  ga_client_id: "555.666",
};
const body = (over: Record<string, unknown> = {}) => ({
  ...buildLeadPayload(VALUES, ATTR, { consent_ads: true, page_url: "https://a.com/consult/" }),
  ...over,
});

type Call = { url: string; init: RequestInit };

function setup(opts: { env?: Record<string, string>; dup?: boolean; insertStatus?: number; insertBody?: unknown; failSide?: boolean } = {}) {
  const env: Record<string, string> = {
    SUPABASE_URL: "https://proj.supabase.co/",
    SUPABASE_SERVICE_ROLE_KEY: "service-key",
    LEAD_ENCRYPTION_KEY: KEY,
    ...opts.env,
  };
  const calls: Call[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.includes("/rest/v1/leads?select=id")) return new Response(JSON.stringify(opts.dup ? [{ id: "x" }] : []), { status: 200 });
    if (url.endsWith("/rest/v1/leads")) {
      return new Response(opts.insertBody ? JSON.stringify(opts.insertBody) : null, { status: opts.insertStatus ?? 201 });
    }
    return new Response("{}", { status: opts.failSide ? 500 : 200 });
  });
  const logs: string[] = [];
  const deps: Deps = {
    env: (k) => env[k],
    fetch: fetchMock as unknown as typeof fetch,
    now: () => new Date("2026-10-26T05:00:00Z"),
    uuid: () => "7f3a9c2e-1b4d-4e5f-8a6b-0c1d2e3f4a5b",
    log: (m) => logs.push(m),
  };
  return { handler: createHandler(deps), calls, logs };
}

const post = (b: unknown, headers: Record<string, string> = {}) =>
  new Request("https://proj.supabase.co/functions/v1/submit-lead", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://jaehoonkor.github.io", ...headers },
    body: typeof b === "string" ? b : JSON.stringify(b),
  });

describe("검증 — 화면(lib/consult/validation)과 같은 판정", () => {
  it("화면에서 통과한 값은 함수에서도 통과", () => {
    expect(validateAll(VALUES)).toEqual({});
    const r = validateLead(body());
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toMatchObject({ phone: "01012345678", name: "김지은", consent_ads: true, utm_source: "meta" });
  });
  it.each([
    [{ name: "김" }, "name"],
    [{ name: "김지은1" }, "name"],
    [{ phone: "0212345678" }, "phone"],
    [{ region: "jeju" }, "region"],
    [{ timing: "" }, "timing"],
    [{ contact_time: null }, "contact_time"],
    [{ memo: "가".repeat(501) }, "memo"],
    [{ consent_privacy: false }, "consent_privacy"],
    [{ consent_sensitive: false }, "consent_sensitive"],
    [{ consent_sensitive: undefined }, "consent_sensitive"],
    [{ consent_3rd: "yes" }, "consent_3rd"],
    [{ procedure_id: "../etc" }, "procedure_id"],
    [{ clinic_id: 3 }, "clinic_id"],
    [{ consent_version: "" }, "consent_privacy"],
  ])("%o → %s 오류", (over, field) => {
    const r = validateLead(body(over));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.fields)).toContain(field);
  });
  it("병원 제3자 제공은 선택 — false·생략도 통과하고 false 로 저장 값에 남는다", () => {
    for (const over of [{ consent_3rd: false }, { consent_3rd: undefined }]) {
      const r = validateLead(body(over));
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.value.consent_3rd).toBe(false);
    }
    const yes = validateLead(body());
    expect(yes.ok && yes.value.consent_3rd).toBe(true);
  });
  it("객체가 아니면 전부 오류", () => {
    const r = validateLead(null);
    expect(r.ok).toBe(false);
  });
});

describe("암호화·해시", () => {
  it("AES-GCM 왕복, 매번 다른 암호문, 형식 v1:iv:ct", async () => {
    const a = await encryptPhone("01012345678", KEY);
    const b = await encryptPhone("01012345678", KEY);
    expect(a).toMatch(/^v1:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/);
    expect(a).not.toBe(b);
    expect(await decryptPhone(a, KEY)).toBe("01012345678");
    await expect(decryptPhone("v2:x:y", KEY)).rejects.toThrow();
    await expect(encryptPhone("010", Buffer.alloc(16).toString("base64"))).rejects.toThrow(/32바이트/);
  });
  it("중복 확인 해시는 같은 번호면 같고, 키가 다르면 다르다", async () => {
    expect(await phoneHash("01012345678", KEY)).toBe(await phoneHash("01012345678", KEY));
    expect(await phoneHash("01012345678", KEY)).not.toBe(await phoneHash("01012345678", Buffer.alloc(32, 1).toString("base64")));
  });
  it("메타 전화번호 정규화 + SHA-256", async () => {
    expect(metaPhone("01012345678")).toBe("821012345678");
    expect(await sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});

describe("handler", () => {
  it("CORS preflight 204, POST 외 405, JSON 아님 400", async () => {
    const { handler } = setup({ env: { ALLOWED_ORIGINS: "https://jaehoonkor.github.io, http://localhost:3000" } });
    const pre = await handler(new Request("https://x/", { method: "OPTIONS", headers: { origin: "https://jaehoonkor.github.io" } }));
    expect(pre.status).toBe(204);
    expect(pre.headers.get("access-control-allow-origin")).toBe("https://jaehoonkor.github.io");
    const other = await handler(new Request("https://x/", { method: "OPTIONS", headers: { origin: "https://evil.example" } }));
    expect(other.headers.get("access-control-allow-origin")).toBe("https://jaehoonkor.github.io");
    expect((await handler(new Request("https://x/", { method: "GET" }))).status).toBe(405);
    expect((await handler(post("{bad"))).status).toBe(400);
  });

  it("검증 실패 422 + 필드별 문구", async () => {
    const { handler, calls } = setup();
    const res = await handler(post(body({ phone: "02-123-4567" })));
    expect(res.status).toBe(422);
    expect(((await res.json()) as { fields: Record<string, string> }).fields.phone).toMatch(/주세요\.$/);
    expect(calls).toHaveLength(0);
  });

  it("정상: 중복 조회 → 암호화 저장(평문 번호 없음) → Resend(번호 없음) → CAPI(event_id=lead_id, 해시 번호) → lead_id", async () => {
    const { handler, calls } = setup({
      env: { RESEND_API_KEY: "re_x", LEAD_NOTIFY_EMAIL: "ops@example.com", META_CAPI_TOKEN: "tok", META_PIXEL_ID: "123", META_TEST_EVENT_CODE: "TEST1" },
    });
    const res = await handler(post(body(), { "user-agent": "UA/1", "x-forwarded-for": "1.2.3.4, 5.6.7.8" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ lead_id: "7f3a9c2e-1b4d-4e5f-8a6b-0c1d2e3f4a5b" });
    expect(res.headers.get("access-control-allow-origin")).toBe("*");

    const [dup, insert, ...side] = calls;
    expect(dup?.url).toContain(`phone_hash=eq.${await phoneHash("01012345678", KEY)}`);
    expect(dup?.url).toContain(encodeURIComponent("2026-10-26T04:55:00.000Z"));
    expect(insert?.init.headers).toMatchObject({ Authorization: "Bearer service-key", Prefer: "return=minimal" });
    const row = JSON.parse(String(insert?.init.body)) as Record<string, unknown>;
    expect(row).toMatchObject({
      id: "7f3a9c2e-1b4d-4e5f-8a6b-0c1d2e3f4a5b",
      consent_privacy: true,
      consent_sensitive: true,
      consent_3rd: true,
      ga_client_id: "555.666",
    });
    expect(row.consent_ads).toBeUndefined();
    expect(String(row.phone)).toMatch(/^v1:/);
    expect(await decryptPhone(String(row.phone), KEY)).toBe("01012345678");
    expect(String(insert?.init.body)).not.toContain("01012345678");

    const resend = side.find((c) => c.url.includes("resend.com"));
    expect(String(resend?.init.body)).toContain("김*은");
    expect(String(resend?.init.body)).not.toContain("5678");

    const capi = side.find((c) => c.url.includes("graph.facebook.com"));
    expect(capi?.url).toContain("/123/events?access_token=tok");
    const event = (JSON.parse(String(capi?.init.body)) as { data: Record<string, unknown>[]; test_event_code: string });
    expect(event.test_event_code).toBe("TEST1");
    expect(event.data[0]).toMatchObject({
      event_name: "Lead",
      event_id: "7f3a9c2e-1b4d-4e5f-8a6b-0c1d2e3f4a5b",
      action_source: "website",
      event_source_url: "https://a.com/consult/",
      custom_data: { value: 50000, currency: "KRW" },
      user_data: {
        ph: [await sha256Hex("821012345678")],
        fbc: "fb.1.1700000000000.FB1",
        fbp: "fb.1.1700000000000.42",
        client_ip_address: "1.2.3.4",
        client_user_agent: "UA/1",
      },
    });
  });

  it("제3자 제공에 동의하지 않은 신청도 접수 — 행에는 consent_3rd=false, 알림 메일에 '병원에 넘기지 않음'", async () => {
    const { handler, calls } = setup({ env: { RESEND_API_KEY: "re_x", LEAD_NOTIFY_EMAIL: "ops@example.com" } });
    const res = await handler(post(body({ consent_3rd: false })));
    expect(res.status).toBe(200);
    const insert = calls.find((c) => c.url.endsWith("/rest/v1/leads"));
    expect(JSON.parse(String(insert?.init.body))).toMatchObject({ consent_privacy: true, consent_sensitive: true, consent_3rd: false });
    const resend = calls.find((c) => c.url.includes("resend.com"));
    expect(String(resend?.init.body)).toContain("병원에 넘기지 않음");
  });

  it("광고 측정 동의가 없거나 키가 없으면 CAPI·알림을 보내지 않는다", async () => {
    const { handler, calls } = setup({ env: { META_CAPI_TOKEN: "tok", META_PIXEL_ID: "123" } });
    const res = await handler(post(body({ consent_ads: false, fbc: null, fbp: null })));
    expect(res.status).toBe(200);
    expect(calls.map((c) => new URL(c.url).host)).toEqual(["proj.supabase.co", "proj.supabase.co"]);
  });

  it("5분 안 같은 번호 → 409", async () => {
    const { handler, calls } = setup({ dup: true });
    expect((await handler(post(body()))).status).toBe(409);
    expect(calls).toHaveLength(1);
  });

  it("없는 시술(FK 위반) → 422, 그 밖 저장 실패 → 500", async () => {
    const fk = setup({ insertStatus: 409, insertBody: { code: "23503" } });
    expect((await fk.handler(post(body()))).status).toBe(422);
    const fail = setup({ insertStatus: 503 });
    const res = await fail.handler(post(body()));
    expect(res.status).toBe(500);
    expect(fail.logs.join()).toContain("저장 실패 503");
  });

  it("알림·CAPI 실패는 로그만 남기고 접수는 성공", async () => {
    const { handler, logs } = setup({
      failSide: true,
      env: { RESEND_API_KEY: "re_x", LEAD_NOTIFY_EMAIL: "ops@example.com", META_CAPI_TOKEN: "tok", META_PIXEL_ID: "123" },
    });
    expect((await handler(post(body()))).status).toBe(200);
    expect(logs.some((l) => l.includes("Resend 500"))).toBe(true);
    expect(logs.some((l) => l.includes("Meta CAPI 500"))).toBe(true);
  });

  it("시크릿이 없으면 500(설정 오류)", async () => {
    const { handler, logs } = setup({ env: { LEAD_ENCRYPTION_KEY: "" } });
    expect((await handler(post(body()))).status).toBe(500);
    expect(logs[0]).toContain("시크릿 누락");
  });
});
