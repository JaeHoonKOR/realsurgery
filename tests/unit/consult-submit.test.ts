import { describe, expect, it, vi } from "vitest";
import type { Attribution } from "@/lib/consult/attribution";
import { CONSENT_DETAILS, consentDetail } from "@/lib/consult/policy";
import {
  CONSENT_VERSION,
  MOCK_LEADS_KEY,
  SUBMIT_MESSAGES,
  buildLeadPayload,
  isMockMode,
  readMockLeads,
  submitLead,
  type LeadPayload,
} from "@/lib/consult/submit";
import { PROCEDURE_UNDECIDED, emptyValues, type ConsultValues } from "@/lib/consult/validation";
import { MemoryStorage } from "./helpers/memory-storage";

const ATTR: Attribution = {
  utm_source: "naver",
  utm_medium: "cpc",
  utm_campaign: "eye_2026-11",
  utm_content: null,
  gclid: null,
  fbclid: null,
  landing_page: "/procedures/x/?utm_source=naver",
  referrer: "https://m.search.naver.com/",
  fbc: null,
  fbp: "fb.1.1.2",
  ga_client_id: "555.666",
};

const VALUES: ConsultValues = {
  ...emptyValues({ procedure_id: "double-eyelid", clinic_id: "danhaneul" }),
  region: "gangnam-seocho",
  timing: "within_1m",
  name: "  김지은 ",
  phone: "010-1234-5678",
  contact_time: "evening",
  memo: "  ",
  consent_privacy: true,
  consent_sensitive: true,
  consent_3rd: true,
};

const payload = (): LeadPayload => buildLeadPayload(VALUES, ATTR, { consent_ads: true, page_url: "https://a.com/consult/" });
const ENDPOINT = { url: "https://proj.supabase.co", anonKey: "anon-key" };

describe("buildLeadPayload — leads 컬럼 + 유입·동의", () => {
  it("숫자만 번호, 이름 trim, 빈 메모 null, 동의 버전", () => {
    expect(payload()).toEqual({
      ...ATTR,
      procedure_id: "double-eyelid",
      clinic_id: "danhaneul",
      name: "김지은",
      phone: "01012345678",
      region: "gangnam-seocho",
      timing: "within_1m",
      contact_time: "evening",
      memo: null,
      consent_privacy: true,
      consent_sensitive: true,
      consent_3rd: true,
      consent_marketing: false,
      consent_version: CONSENT_VERSION,
      consent_ads: true,
      page_url: "https://a.com/consult/",
    });
  });
  it("'아직 정하지 못했어요'는 procedure_id null", () => {
    const p = buildLeadPayload({ ...VALUES, procedure_id: PROCEDURE_UNDECIDED, clinic_id: null, memo: "메모" }, ATTR, {
      consent_ads: false,
      page_url: "",
    });
    expect(p.procedure_id).toBeNull();
    expect(p.clinic_id).toBeNull();
    expect(p.memo).toBe("메모");
  });
  it("검증 전 값(필수 동의 누락)으로는 만들지 않는다", () => {
    expect(() => buildLeadPayload({ ...VALUES, consent_sensitive: false }, ATTR, { consent_ads: false, page_url: "" })).toThrow();
    expect(() => buildLeadPayload({ ...VALUES, consent_privacy: false }, ATTR, { consent_ads: false, page_url: "" })).toThrow();
  });
  it("병원 제3자 제공(선택)에 동의하지 않으면 consent_3rd=false 로 보낸다", () => {
    const p = buildLeadPayload({ ...VALUES, consent_3rd: false }, ATTR, { consent_ads: false, page_url: "" });
    expect(p.consent_3rd).toBe(false);
    expect(p.consent_sensitive).toBe(true);
  });
});

describe("submitLead — mock 모드(키 없음)", () => {
  it("환경 변수에 Supabase 키가 없으면 mock", () => {
    expect(isMockMode()).toBe(true);
    expect(isMockMode(ENDPOINT)).toBe(false);
  });

  it("지연 후 lead_id 반환, 마스킹 요약만 localStorage 에", async () => {
    const storage = new MemoryStorage();
    const r = await submitLead(payload(), {
      endpoint: null,
      delayMs: 0,
      storage,
      uuid: () => "11111111-2222-4333-8444-555555555555",
      now: () => new Date("2026-10-26T05:00:00Z"),
    });
    expect(r).toEqual({ ok: true, lead_id: "11111111-2222-4333-8444-555555555555", mode: "mock" });
    const saved = readMockLeads(storage);
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      name_masked: "김*은",
      phone_masked: "010-****-5678",
      status: "new",
      utm_source: "naver",
      consent_3rd: true,
    });
    const raw = storage.getItem(MOCK_LEADS_KEY) ?? "";
    expect(raw).not.toContain("김지은");
    expect(raw).not.toContain("01012345678");
  });

  it("기본 옵션: 실제 지연(타이머)·crypto.randomUUID·window 없는 환경", async () => {
    vi.useFakeTimers();
    const pending = submitLead(payload());
    await vi.advanceTimersByTimeAsync(700);
    const r = await pending;
    vi.useRealTimers();
    expect(r.ok && r.mode).toBe("mock");
    expect(r.ok && r.lead_id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("최근 50건만 남기고, 저장 실패·깨진 값에도 접수는 성공", async () => {
    const storage = new MemoryStorage();
    storage.setItem(MOCK_LEADS_KEY, JSON.stringify(Array.from({ length: 50 }, (_, i) => ({ lead_id: String(i) }))));
    await submitLead(payload(), { endpoint: null, delayMs: 0, storage, uuid: () => "new" });
    const all = readMockLeads(storage);
    expect(all).toHaveLength(50);
    expect(all.at(-1)?.lead_id).toBe("new");
    expect(all[0]?.lead_id).toBe("1");
    const r = await submitLead(payload(), { endpoint: null, delayMs: 0, storage: new MemoryStorage(true) });
    expect(r.ok).toBe(true);
    storage.setItem(MOCK_LEADS_KEY, "{bad");
    expect(readMockLeads(storage)).toEqual([]);
    storage.setItem(MOCK_LEADS_KEY, "{}");
    expect(readMockLeads(storage)).toEqual([]);
  });
});

describe("submitLead — Edge Function 호출", () => {
  const respond = (status: number, body?: unknown) =>
    vi.fn(async () => new Response(body === undefined ? null : JSON.stringify(body), { status }));

  it("anon 키 헤더로 submit-lead 에 POST 하고 lead_id 를 받는다", async () => {
    const fetchImpl = respond(200, { lead_id: "srv-1" });
    const r = await submitLead(payload(), { endpoint: ENDPOINT, fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(r).toEqual({ ok: true, lead_id: "srv-1", mode: "live" });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://proj.supabase.co/functions/v1/submit-lead");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ apikey: "anon-key", Authorization: "Bearer anon-key" });
    expect(JSON.parse(String(init.body))).toMatchObject({ phone: "01012345678", ga_client_id: "555.666" });
  });

  it.each([
    [409, { error: "duplicate" }, "duplicate", SUBMIT_MESSAGES.duplicate],
    [422, { error: "invalid", fields: { phone: "번호 오류" } }, "invalid", SUBMIT_MESSAGES.invalid],
    [400, undefined, "invalid", SUBMIT_MESSAGES.invalid],
    [500, { error: "server_error" }, "server", SUBMIT_MESSAGES.server],
    [200, { nope: 1 }, "server", SUBMIT_MESSAGES.server],
  ])("HTTP %s → %s", async (status, body, reason, message) => {
    const r = await submitLead(payload(), { endpoint: ENDPOINT, fetchImpl: respond(status, body) as unknown as typeof fetch });
    expect(r).toMatchObject({ ok: false, reason, message });
    if (status === 422 && !r.ok) expect(r.fields).toEqual({ phone: "번호 오류" });
  });

  it("네트워크 오류 → 재시도 안내", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    const r = await submitLead(payload(), { endpoint: ENDPOINT, fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(r).toEqual({ ok: false, reason: "network", message: SUBMIT_MESSAGES.network });
  });

  it("오류 문구는 원인 + 해결 한 문장", () => {
    for (const m of Object.values(SUBMIT_MESSAGES)) expect(m).toMatch(/니,? .+ 주세요\./);
  });
});

describe("동의 문구", () => {
  it("필수 2(개인정보·민감정보) + 선택 2(제3자 제공·마케팅), 항목마다 보유 기간·거부 시 불이익", () => {
    expect(CONSENT_DETAILS.map((c) => [c.key, c.required])).toEqual([
      ["consent_privacy", true],
      ["consent_sensitive", true],
      ["consent_3rd", false],
      ["consent_marketing", false],
    ]);
    for (const c of CONSENT_DETAILS) {
      expect(c.rows.some((r) => r.label === "보유 기간")).toBe(true);
      expect(c.refusal).toMatch(/동의/);
    }
    expect(() => consentDetail("x" as never)).toThrow();
  });
  it("민감정보 동의: 개인정보 보호법 제23조 별도 동의, 처리 항목에 관심 시술, 거부 시 접수 불가 안내", () => {
    const s = consentDetail("consent_sensitive");
    expect(s.title).toContain("민감정보");
    expect(s.notice).toContain("제23조");
    expect(s.rows.find((r) => r.label === "처리 항목")?.value).toContain("관심 시술");
    expect(s.rows.map((r) => r.label)).toEqual(["처리 항목", "처리 목적", "보유 기간"]);
    expect(s.refusal).toContain("접수할 수 없습니다");
    // 일반 개인정보 동의 항목에는 관심 시술을 넣지 않는다(구분 동의)
    expect(consentDetail("consent_privacy").rows[0]?.value).not.toContain("관심 시술");
    expect(consentDetail("consent_privacy").notice).toContain("민감정보");
  });
  it("제3자 제공은 선택: 제휴 병원 없음, 병원 연결을 원할 때만, 거부해도 상담 신청 가능", () => {
    const t = consentDetail("consent_3rd");
    expect(t.required).toBe(false);
    expect(t.notice).toContain("제휴 병원이 없어");
    expect(t.notice).toContain("병원 연결을 원할 때만");
    expect(t.rows.find((r) => r.label === "제공받는 자")?.value).toContain("개별로 안내");
    expect(t.refusal).toContain("동의하지 않아도 상담 신청");
  });
});
