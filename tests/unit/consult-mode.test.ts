// 상담 신청 동작 모드(live/demo) — Supabase 공개 키가 없는 정적 배포에서는 연락을 약속하지 않고 시연 안내 + 색인 제외
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CONSULT_TITLE,
  DEMO_NOTICE,
  DEMO_NOTICE_TEXT,
  consultCopy,
  consultDoneMetadata,
  consultMode,
  consultPageMetadata,
} from "@/lib/consult/mode";
import { isMockMode } from "@/lib/consult/submit";

afterEach(() => {
  vi.unstubAllEnvs();
});

/** 사용자에게 연락·전화를 약속하는 표현 */
const PROMISE = /연락드립니다|연락드려요|전화드려요|전화드립니다/;

describe("consultMode — 빌드 시 키 유무로 결정", () => {
  it("인자: 키 있음 → live, 없음 → demo", () => {
    expect(consultMode(true)).toBe("live");
    expect(consultMode(false)).toBe("demo");
  });

  it("기본값은 환경 변수(NEXT_PUBLIC_SUPABASE_URL + ANON_KEY 둘 다 있어야 live) — submitLead 의 mock 판정과 같다", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(consultMode()).toBe("demo");
    expect(isMockMode()).toBe(true);

    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co");
    expect(consultMode()).toBe("demo"); // 하나만 있으면 여전히 시연
    expect(isMockMode()).toBe(true);

    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    expect(consultMode()).toBe("live");
    expect(isMockMode()).toBe(false);

    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "   ");
    expect(consultMode()).toBe("demo"); // 공백만 있는 값은 키가 아니다
  });
});

describe("시연(demo) 문구", () => {
  const demo = consultCopy("demo");

  it("안내 문구는 요청된 문장 그대로", () => {
    expect(DEMO_NOTICE_TEXT).toBe("포트폴리오 시연용 화면입니다. 입력한 정보는 서버로 전송되지 않고 이 브라우저에만 저장됩니다.");
    expect(`${DEMO_NOTICE.lead} ${DEMO_NOTICE.body}`).toBe(DEMO_NOTICE_TEXT);
    expect(demo.showDemoNotice).toBe(true);
  });

  it("완료 화면·신뢰 안내·메타 설명이 연락을 약속하지 않는다(실서비스 설명은 '실제 서비스에서는'으로만)", () => {
    expect(demo.doneLead).not.toMatch(PROMISE);
    expect(demo.doneLead).toContain("연락드리지 않습니다");
    expect(demo.doneSub).toMatch(/^실제 서비스에서는/);
    expect(demo.contactNote.title).not.toMatch(PROMISE);
    expect(demo.contactNote.body).toMatch(/^실제 서비스에서는/);
    expect(demo.receiptNote).not.toMatch(PROMISE);
    expect(demo.checklistTitle).not.toContain("연락");
    expect(demo.checklistCallItem).toBe(false);
    expect(demo.pageDescription).not.toMatch(PROMISE);
    expect(demo.pageDescription).toContain("서버로 전송되지 않고");
    expect(demo.doneDescription).not.toMatch(PROMISE);
    expect(demo.storageNote.title).toContain("저장하지 않아요");
  });
});

describe("실서비스(live) 문구 — 기존 약속 유지", () => {
  const live = consultCopy("live");
  it("영업일 기준 1일 안에 연락, 시연 안내 없음", () => {
    expect(live.doneLead).toBe("영업일 기준 1일 안에 연락드립니다.");
    expect(live.contactNote.title).toContain("영업일 기준 1일");
    expect(live.checklistCallItem).toBe(true);
    expect(live.checklistTitle).toBe("연락 오기 전에 준비해 두세요");
    expect(live.showDemoNotice).toBe(false);
    expect(live.pageDescription).not.toContain("무료");
  });
});

describe("메타데이터", () => {
  it("/consult/: 시연이면 noindex(링크는 따라감), 실서비스면 robots 지정 없음 — canonical 은 둘 다 유지", () => {
    const demo = consultPageMetadata("demo");
    expect(demo.robots).toEqual({ index: false, follow: true });
    expect(demo.title).toBe(CONSULT_TITLE);
    expect(demo.alternates).toEqual({ canonical: "./" });

    const live = consultPageMetadata("live");
    expect(live.robots).toBeUndefined();
    expect(live.title).toBe("시술 상담 신청");
    expect(live.description).toBe(consultCopy("live").pageDescription);
    expect(live.openGraph).toMatchObject({ title: "시술 상담 신청", url: "./" });
  });

  it("/consult/done/: 모드와 상관없이 noindex·nofollow, 설명은 모드별", () => {
    for (const mode of ["live", "demo"] as const) {
      const m = consultDoneMetadata(mode);
      expect(m.robots).toEqual({ index: false, follow: false });
      expect(m.title).toBe("상담 신청 완료");
      expect(m.description).toBe(consultCopy(mode).doneDescription);
    }
    expect(consultDoneMetadata("demo").description).not.toMatch(PROMISE);
  });
});
