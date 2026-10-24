// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { LEAD_VALUE_KRW, QUALIFIED_LEAD_VALUE_KRW, TRACK_EVENTS, track } from "@/lib/track";

afterEach(() => {
  delete window.dataLayer;
});

describe("track()", () => {
  it("screen-spec 5절 이벤트 21개를 정의한다(중복 없음)", () => {
    expect(TRACK_EVENTS).toHaveLength(21);
    expect(new Set(TRACK_EVENTS).size).toBe(21);
  });

  it("dataLayer 가 없으면 만들고 { event, ...params } 를 push 한다", () => {
    expect(window.dataLayer).toBeUndefined();
    track("click_cta", { location: "hero" });
    expect(window.dataLayer).toEqual([{ event: "click_cta", location: "hero" }]);
  });

  it("기존 dataLayer(GTM 이 만든 배열)에 이어서 push 한다", () => {
    const existing = [{ "gtm.start": 1 }];
    window.dataLayer = existing;
    track("search", { search_term: "쌍꺼풀" });
    expect(window.dataLayer).toBe(existing);
    expect(window.dataLayer).toHaveLength(2);
    expect(window.dataLayer[1]).toEqual({ event: "search", search_term: "쌍꺼풀" });
  });

  it("undefined 파라미터는 보내지 않는다", () => {
    track("form_start", { procedure_id: "double-eyelid", clinic_id: undefined, source_page: "/consult" });
    expect(window.dataLayer?.[0]).toEqual({
      event: "form_start",
      procedure_id: "double-eyelid",
      source_page: "/consult",
    });
  });

  it("파라미터 없는 이벤트(kakao_add)도 push 된다", () => {
    track("kakao_add");
    expect(window.dataLayer).toEqual([{ event: "kakao_add" }]);
  });

  it("generate_lead 는 value·currency 를 그대로 싣는다", () => {
    track("generate_lead", { lead_id: "L-20261024-0001", value: LEAD_VALUE_KRW, currency: "KRW" });
    expect(window.dataLayer?.[0]).toEqual({
      event: "generate_lead",
      lead_id: "L-20261024-0001",
      value: 50000,
      currency: "KRW",
    });
    expect(QUALIFIED_LEAD_VALUE_KRW).toBe(200000);
  });

  it("모든 이벤트명이 dataLayer 로 push 된다", () => {
    for (const name of TRACK_EVENTS) {
      // 타입 검사는 컴파일 단계에서, 여기서는 push 경로만 확인
      (track as (n: string, p?: Record<string, unknown>) => void)(name, {});
    }
    expect(window.dataLayer?.map((e) => (e as { event: string }).event)).toEqual([...TRACK_EVENTS]);
  });
});

describe("track() 서버 환경", () => {
  it("window 가 없으면 아무것도 하지 않는다", async () => {
    const original = globalThis.window;
    // @ts-expect-error 서버 환경 흉내
    delete globalThis.window;
    try {
      expect(() => track("click_cta", { location: "hero" })).not.toThrow();
    } finally {
      globalThis.window = original;
    }
    expect(window.dataLayer).toBeUndefined();
  });
});
