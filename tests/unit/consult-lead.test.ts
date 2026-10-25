import { beforeEach, describe, expect, it } from "vitest";
import {
  LEAD_SESSION_KEY,
  LEAD_TRACKED_KEY,
  claimLeadConversion,
  formatKstDateTime,
  formatLeadNumber,
  parseLeadSession,
  readLeadSession,
  resetLeadConversionMemory,
  saveLeadSession,
  type LeadSession,
} from "@/lib/consult/lead";
import { NAV_KEY, previousPath, recordPageView, sourceFromReferrer, sourcePage } from "@/lib/consult/source";
import { MemoryStorage } from "./helpers/memory-storage";

const LEAD: LeadSession = {
  lead_id: "7f3a9c2e-1b4d-4e5f-8a6b-0c1d2e3f4a5b",
  procedure_id: "double-eyelid",
  clinic_id: null,
  procedure_name: "쌍꺼풀 수술",
  created_at: "2026-10-26T05:32:00.000Z",
};

beforeEach(() => resetLeadConversionMemory());

describe("접수번호", () => {
  it("RS-<KST 월일>-<lead_id 앞 4자리>", () => {
    expect(formatLeadNumber(LEAD.lead_id, LEAD.created_at)).toBe("RS-1026-7F3A");
  });
  it("UTC 자정 직전은 KST 다음 날", () => {
    expect(formatLeadNumber("abcd1234", "2026-10-26T15:30:00Z")).toBe("RS-1027-ABCD");
    expect(formatLeadNumber("abcd1234", new Date("2026-12-31T16:00:00Z"))).toBe("RS-0101-ABCD");
  });
  it("하이픈·짧은 id 보정", () => {
    expect(formatLeadNumber("a-b", "2026-01-05T00:00:00Z")).toBe("RS-0105-AB00");
  });
  it("접수 시각 KST 표기", () => {
    expect(formatKstDateTime(LEAD.created_at)).toBe("2026.10.26 14:32");
    expect(formatKstDateTime("nope")).toBe("");
  });
});

describe("완료 화면 세션(rs_lead)", () => {
  it("저장 → 읽기", () => {
    const s = new MemoryStorage();
    saveLeadSession(LEAD, s);
    expect(readLeadSession(s)).toEqual(LEAD);
    expect(JSON.parse(s.getItem(LEAD_SESSION_KEY) ?? "{}").lead_id).toBe(LEAD.lead_id);
  });
  it("없음·깨짐·필수값 누락은 null(직접 접근 차단)", () => {
    expect(readLeadSession(new MemoryStorage())).toBeNull();
    expect(parseLeadSession("{")).toBeNull();
    expect(parseLeadSession("null")).toBeNull();
    expect(parseLeadSession(JSON.stringify({ ...LEAD, lead_id: "" }))).toBeNull();
    expect(parseLeadSession(JSON.stringify({ ...LEAD, lead_id: "<script>" }))).toBeNull();
    expect(parseLeadSession(JSON.stringify({ ...LEAD, created_at: "x" }))).toBeNull();
    expect(parseLeadSession(JSON.stringify({ ...LEAD, procedure_id: 3, clinic_id: "" }))).toMatchObject({
      procedure_id: null,
      clinic_id: null,
    });
  });
  it("저장소 예외에도 던지지 않는다", () => {
    const broken = new MemoryStorage(true);
    expect(() => saveLeadSession(LEAD, broken)).not.toThrow();
    expect(readLeadSession(broken)).toBeNull();
  });
});

describe("generate_lead 1회 보장", () => {
  it("같은 lead_id 는 한 번만 true(새로고침 = 다시 호출)", () => {
    const s = new MemoryStorage();
    expect(claimLeadConversion(LEAD.lead_id, s)).toBe(true);
    expect(claimLeadConversion(LEAD.lead_id, s)).toBe(false);
    resetLeadConversionMemory(); // 새로고침하면 메모리는 비지만 sessionStorage 표시가 남는다
    expect(claimLeadConversion(LEAD.lead_id, s)).toBe(false);
    expect(JSON.parse(s.getItem(LEAD_TRACKED_KEY) ?? "[]")).toEqual([LEAD.lead_id]);
  });
  it("다른 lead_id 는 각각 1회", () => {
    const s = new MemoryStorage();
    expect(claimLeadConversion("aaaa1111", s)).toBe(true);
    expect(claimLeadConversion("bbbb2222", s)).toBe(true);
  });
  it("저장소를 못 쓰면 메모리로 이 탭에서만 막는다", () => {
    const broken = new MemoryStorage(true);
    expect(claimLeadConversion("cccc3333", broken)).toBe(true);
    expect(claimLeadConversion("cccc3333", broken)).toBe(false);
    const s = new MemoryStorage();
    s.setItem(LEAD_TRACKED_KEY, "{bad");
    expect(claimLeadConversion("dddd4444", s)).toBe(true);
  });
});

describe("source_page", () => {
  it("사이트 내부 이동 기록 → 직전 경로", () => {
    const s = new MemoryStorage();
    recordPageView("/procedures/%EC%8C%8D%EA%BA%BC%ED%92%80-%EC%88%98%EC%88%A0/", s);
    recordPageView("/consult/", s);
    recordPageView("/consult/", s); // 같은 경로 재기록은 무시
    expect(previousPath("/consult/", s)).toBe("/procedures/쌍꺼풀-수술/");
    expect(sourcePage({ referrer: "", href: "https://a.com/realsurgery/consult/", basePath: "/realsurgery" }, s)).toBe(
      "/procedures/쌍꺼풀-수술/",
    );
  });
  it("기록이 아직 지금 화면까지 오지 않았으면 마지막 기록", () => {
    const s = new MemoryStorage();
    recordPageView("/", s);
    expect(previousPath("/consult/", s)).toBe("/");
  });
  it("기록이 없으면 referrer → 외부는 호스트, 없으면 direct", () => {
    const s = new MemoryStorage();
    expect(sourcePage({ referrer: "https://m.search.naver.com/x", href: "https://a.com/consult/" }, s)).toBe("m.search.naver.com");
    expect(sourcePage({ referrer: "", href: "https://a.com/consult/" }, s)).toBe("direct");
    expect(sourceFromReferrer("https://a.com/realsurgery/clinics/x/", "https://a.com/realsurgery/consult/", "/realsurgery/")).toBe(
      "/clinics/x/",
    );
    expect(sourceFromReferrer("https://a.com/realsurgery", "https://a.com/realsurgery/consult/", "/realsurgery")).toBe("/");
    expect(sourceFromReferrer("bad", "https://a.com/")).toBe("direct");
  });
  it("깨진 기록·저장소 예외·잘못된 href 에도 동작", () => {
    const s = new MemoryStorage();
    s.setItem(NAV_KEY, "{bad");
    expect(previousPath("/consult/", s)).toBeNull();
    const broken = new MemoryStorage(true);
    expect(() => recordPageView("/x/", broken)).not.toThrow();
    expect(sourcePage({ referrer: "", href: "::" }, null)).toBe("direct");
    recordPageView("/%E0%A4%A/", s);
    expect(previousPath("/other/", s)).toBe("/%E0%A4%A/");
  });
});
