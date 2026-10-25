import { describe, expect, it } from "vitest";
import {
  UTM_COOKIE,
  buildFirstTouch,
  captureFirstTouch,
  fbcFromFbclid,
  parseCookies,
  parseFirstTouch,
  parseGaClientId,
  readAttribution,
  utmCookieString,
} from "@/lib/consult/attribution";

const NOW = new Date("2026-10-26T01:00:00Z");

/** document.cookie 흉내: 쓰기는 "name=value; attrs" 를 받아 이름별로 저장 */
function fakeDoc(href: string, referrer = "", initial: Record<string, string> = {}) {
  const jar = new Map(Object.entries(initial));
  const writes: string[] = [];
  return {
    writes,
    jar,
    referrer,
    location: { href, protocol: new URL(href).protocol },
    get cookie() {
      return [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
    },
    set cookie(v: string) {
      writes.push(v);
      const [pair] = v.split(";");
      const i = (pair ?? "").indexOf("=");
      jar.set((pair ?? "").slice(0, i), (pair ?? "").slice(i + 1));
    },
  };
}

describe("쿠키 파싱", () => {
  it("이름=값 목록, 디코딩, 첫 값 우선, 잘못된 인코딩은 원문", () => {
    const m = parseCookies("a=1; b=%ED%95%9C; a=2; broken=%E0%A4%A; noeq; =x");
    expect(m.get("a")).toBe("1");
    expect(m.get("b")).toBe("한");
    expect(m.get("broken")).toBe("%E0%A4%A");
    expect(m.has("noeq")).toBe(false);
  });

  it("_ga → GA 클라이언트 ID", () => {
    expect(parseGaClientId("GA1.1.1234567890.1700000000")).toBe("1234567890.1700000000");
    expect(parseGaClientId("GA1.2.99.88")).toBe("99.88");
    expect(parseGaClientId("garbage")).toBeNull();
    expect(parseGaClientId(undefined)).toBeNull();
  });

  it("fbclid → _fbc 형식", () => {
    expect(fbcFromFbclid("AbC", NOW)).toBe(`fb.1.${NOW.getTime()}.AbC`);
  });
});

describe("첫 유입 레코드", () => {
  it("UTM·클릭 ID·랜딩·외부 리퍼러를 담는다", () => {
    const t = buildFirstTouch(
      "https://jaehoonkor.github.io/realsurgery/procedures/x/?utm_source=naver&utm_medium=cpc&utm_campaign=eye_2026-11&utm_content=A1&gclid=G1",
      "https://m.search.naver.com/search.naver?query=쌍꺼풀",
      NOW,
    );
    expect(t).toMatchObject({
      utm_source: "naver",
      utm_medium: "cpc",
      utm_campaign: "eye_2026-11",
      utm_content: "A1",
      gclid: "G1",
      fbclid: null,
      referrer: "https://m.search.naver.com/search.naver?query=쌍꺼풀",
      ts: NOW.toISOString(),
    });
    expect(t.landing_page.startsWith("/realsurgery/procedures/x/?utm_source=naver")).toBe(true);
  });

  it("같은 사이트에서 온 리퍼러·잘못된 리퍼러는 버린다, 빈 값은 null", () => {
    expect(buildFirstTouch("https://a.com/x?utm_source=", "https://a.com/prev").referrer).toBeNull();
    expect(buildFirstTouch("https://a.com/x", "not a url").referrer).toBeNull();
    expect(buildFirstTouch("https://a.com/x?utm_source=%20", "").utm_source).toBeNull();
  });

  it("긴 값은 300자로 자른다", () => {
    const t = buildFirstTouch(`https://a.com/?utm_campaign=${"x".repeat(400)}`, "");
    expect(t.utm_campaign).toHaveLength(300);
  });

  it("쿠키 문자열: 90일, path=/, SameSite=Lax, https 면 Secure", () => {
    const t = buildFirstTouch("https://a.com/", "", NOW);
    expect(utmCookieString(t, true)).toMatch(/^_utm=.+; Max-Age=7776000; Path=\/; SameSite=Lax; Secure$/);
    expect(utmCookieString(t, false)).not.toContain("Secure");
  });

  it("쿠키 값 파싱 — 형식이 틀리면 null", () => {
    expect(parseFirstTouch(null)).toBeNull();
    expect(parseFirstTouch("{")).toBeNull();
    expect(parseFirstTouch(JSON.stringify({ utm_source: "x" }))).toBeNull();
    expect(parseFirstTouch("null")).toBeNull();
    expect(parseFirstTouch(JSON.stringify({ landing_page: "/", utm_source: "", gclid: 3 }))).toMatchObject({
      utm_source: null,
      gclid: null,
      ts: "",
    });
  });
});

describe("captureFirstTouch — 첫 방문만 저장, 덮어쓰지 않음", () => {
  it("쿠키가 없으면 만든다", () => {
    const doc = fakeDoc("https://a.com/lp/eye/?utm_source=meta&fbclid=FB1", "https://l.instagram.com/");
    const t = captureFirstTouch(doc, NOW);
    expect(t?.utm_source).toBe("meta");
    expect(doc.writes).toHaveLength(1);
    expect(doc.writes[0]).toContain("Secure");
    expect(parseFirstTouch(parseCookies(doc.cookie).get(UTM_COOKIE))?.fbclid).toBe("FB1");
  });

  it("이미 있으면 그대로 두고 기존 값을 돌려준다", () => {
    const doc = fakeDoc("https://a.com/lp/eye/?utm_source=meta", "");
    captureFirstTouch(doc, NOW);
    const second = fakeDoc("https://a.com/consult/?utm_source=google", "", Object.fromEntries(doc.jar));
    const t = captureFirstTouch(second, NOW);
    expect(t?.utm_source).toBe("meta");
    expect(second.writes).toHaveLength(0);
  });

  it("깨진 쿠키는 새로 쓴다, 문서가 없으면 null", () => {
    const doc = fakeDoc("http://localhost/", "", { _utm: "%7Bbad" });
    expect(captureFirstTouch(doc, NOW)?.landing_page).toBe("/");
    expect(doc.writes[0]).not.toContain("Secure");
    expect(captureFirstTouch(null)).toBeNull();
  });

  it("쿠키 접근이 막혀 있으면 null", () => {
    const doc = {
      referrer: "",
      location: { href: "https://a.com/", protocol: "https:" },
      get cookie(): string {
        throw new Error("blocked");
      },
      set cookie(_v: string) {
        throw new Error("blocked");
      },
    };
    expect(captureFirstTouch(doc, NOW)).toBeNull();
  });
});

describe("readAttribution — 리드에 실을 값", () => {
  it("_utm + _fbc·_fbp + _ga", () => {
    const first = fakeDoc("https://a.com/lp/?utm_source=meta&utm_medium=paid_social&fbclid=FB1", "https://l.facebook.com/");
    captureFirstTouch(first, NOW);
    const doc = fakeDoc("https://a.com/consult/", "", {
      ...Object.fromEntries(first.jar),
      _fbc: "fb.1.1700000000000.FB1",
      _fbp: "fb.1.1700000000000.123",
      _ga: "GA1.1.555.666",
    });
    expect(readAttribution(doc, NOW)).toEqual({
      utm_source: "meta",
      utm_medium: "paid_social",
      utm_campaign: null,
      utm_content: null,
      gclid: null,
      fbclid: "FB1",
      landing_page: "/lp/?utm_source=meta&utm_medium=paid_social&fbclid=FB1",
      referrer: "https://l.facebook.com/",
      fbc: "fb.1.1700000000000.FB1",
      fbp: "fb.1.1700000000000.123",
      ga_client_id: "555.666",
    });
  });

  it("_fbc 가 없고 fbclid 가 있으면 첫 유입 시각으로 만든다", () => {
    const first = fakeDoc("https://a.com/?fbclid=FB2", "");
    captureFirstTouch(first, NOW);
    const a = readAttribution(fakeDoc("https://a.com/consult/", "", Object.fromEntries(first.jar)), new Date("2027-01-01"));
    expect(a.fbc).toBe(`fb.1.${NOW.getTime()}.FB2`);
  });

  it("_utm 이 없으면(쿠키 차단·캡처 전) 지금 페이지 기준", () => {
    const a = readAttribution(fakeDoc("https://a.com/consult/?utm_source=google&gclid=G9", "https://www.google.com/"), NOW);
    expect(a).toMatchObject({ utm_source: "google", gclid: "G9", referrer: "https://www.google.com/", fbc: null, fbp: null });
  });

  it("문서가 없으면 빈 값", () => {
    expect(readAttribution(null)).toMatchObject({ landing_page: "/", utm_source: null, ga_client_id: null });
  });
});
