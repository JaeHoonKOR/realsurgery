// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  CONSENT_ATTR,
  CONSENT_STORAGE_KEY,
  DEFAULT_CONSENT_STATE,
  consentInitScript,
  parseStoredConsent,
  pushConsent,
  readConsent,
  saveConsent,
  toConsentState,
} from "@/lib/consent";

const args = () =>
  (window.dataLayer ?? []).map((e) =>
    Object.prototype.toString.call(e) === "[object Arguments]" ? Array.from(e as ArrayLike<unknown>) : e,
  );

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute(CONSENT_ATTR);
  delete window.dataLayer;
});
afterEach(() => {
  delete window.dataLayer;
});

describe("Consent Mode v2 상태 매핑", () => {
  it("방문 통계 → analytics_storage, 광고 → ad_storage·ad_user_data·ad_personalization", () => {
    expect(toConsentState({ analytics: true, ads: false })).toEqual({
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "granted",
    });
    expect(Object.values(toConsentState({ analytics: false, ads: true })).filter((v) => v === "granted")).toHaveLength(3);
    expect(Object.values(DEFAULT_CONSENT_STATE).every((v) => v === "denied")).toBe(true);
  });
});

describe("저장값 파싱", () => {
  it.each([null, "", "not json", "null", '{"v":2,"analytics":true,"ads":true}', '{"v":1,"analytics":"yes","ads":true}'])(
    "잘못된 값 %s → null(다시 묻는다)",
    (raw) => {
      expect(parseStoredConsent(raw)).toBeNull();
    },
  );
  it("올바른 값", () => {
    expect(parseStoredConsent('{"v":1,"analytics":true,"ads":false,"at":"t"}')).toEqual({ v: 1, analytics: true, ads: false, at: "t" });
    expect(parseStoredConsent('{"v":1,"analytics":true,"ads":false}')?.at).toBe("");
  });
  it("저장소 접근 예외는 null", () => {
    const broken = { getItem: () => { throw new Error("SecurityError"); } } as unknown as Storage;
    expect(readConsent(broken)).toBeNull();
    expect(readConsent(null)).toBeNull();
  });
});

describe("saveConsent", () => {
  it("저장 + consent update(Arguments 객체) + <html data-consent=set>", () => {
    const stored = saveConsent({ analytics: true, ads: false }, { now: new Date("2026-10-25T00:00:00Z") });
    expect(stored).toEqual({ v: 1, analytics: true, ads: false, at: "2026-10-25T00:00:00.000Z" });
    expect(JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY) ?? "null")).toEqual(stored);
    expect(readConsent()).toEqual(stored);
    const pushed = window.dataLayer?.[0];
    expect(Object.prototype.toString.call(pushed)).toBe("[object Arguments]");
    expect(args()).toEqual([
      ["consent", "update", toConsentState({ analytics: true, ads: false })],
      // GTM 트리거용 이벤트(tracking-plan R-1): 같은 페이지에서 새로 동의한 태그를 로드
      {
        event: "consent_update",
        analytics_storage: "granted",
        ad_storage: "denied",
        prev_analytics_storage: "denied",
        prev_ad_storage: "denied",
      },
    ]);
    expect(document.documentElement.getAttribute(CONSENT_ATTR)).toBe("set");
  });

  it("consent_update 의 prev_* 는 이전에 저장된 선택이다", () => {
    saveConsent({ analytics: true, ads: true });
    window.dataLayer = [];
    saveConsent({ analytics: false, ads: true });
    expect(args()).toContainEqual({
      event: "consent_update",
      analytics_storage: "denied",
      ad_storage: "granted",
      prev_analytics_storage: "granted",
      prev_ad_storage: "granted",
    });
  });

  it("저장이 막혀도 이번 페이지에는 적용한다", () => {
    const full = { setItem: () => { throw new Error("QuotaExceeded"); } } as unknown as Storage;
    saveConsent({ analytics: false, ads: true }, { storage: full });
    expect(args()).toHaveLength(2);
    expect(document.documentElement.getAttribute(CONSENT_ATTR)).toBe("set");
  });

  it("기존 dataLayer(GTM)에 이어서 push 한다", () => {
    window.dataLayer = [{ "gtm.start": 1 }];
    pushConsent("default", DEFAULT_CONSENT_STATE);
    expect(window.dataLayer).toHaveLength(2);
  });
});

describe("<head> 인라인 초기화 스크립트", () => {
  const run = () => new Function(consentInitScript())();

  it("첫 방문: default denied(wait_for_update) 만 push, 배너 표시", () => {
    run();
    expect(args()).toEqual([["consent", "default", { ...DEFAULT_CONSENT_STATE, wait_for_update: 500 }]]);
    expect(document.documentElement.hasAttribute(CONSENT_ATTR)).toBe(false);
  });

  it("재방문: default 뒤에 저장된 선택으로 update, 배너 숨김 속성", () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ v: 1, analytics: false, ads: true, at: "x" }));
    run();
    expect(args()[1]).toEqual(["consent", "update", toConsentState({ analytics: false, ads: true })]);
    expect(document.documentElement.getAttribute(CONSENT_ATTR)).toBe("set");
  });

  it("저장값이 깨졌으면 default 만", () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, "{broken");
    run();
    expect(args()).toHaveLength(1);
  });

  it("GA·Pixel 태그를 로드하지 않는다(하드코딩 금지)", () => {
    expect(consentInitScript()).not.toMatch(/gtag\(|fbq\(|googletagmanager|facebook|<script|src=/);
  });
});
