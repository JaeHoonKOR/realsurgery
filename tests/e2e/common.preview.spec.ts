import type { Page } from "@playwright/test";
import { test, expect } from "../fixtures";
import { MIN_TARGET, tooSmall, visibleTargets } from "./touch-targets";

/**
 * 공통 컴포넌트 (screen-spec 3절) — 개발 서버 미리보기(/preview/, RS_PREVIEW=1)에서 검증.
 * 미리보기에서는 모든 경로를 "있음"으로 보므로 아직 없는 화면(상담 폼·P1 목록 등)으로의 실제 이동은 막고
 * 링크 주소·dataLayer 이벤트만 확인한다(캡처 단계에서 preventDefault → next/link 도 이동하지 않음).
 */

type Entry = Record<string, unknown> & { args?: unknown[] };

async function dataLayer(page: Page): Promise<Entry[]> {
  return page.evaluate(() =>
    (window.dataLayer ?? []).map((e) =>
      Object.prototype.toString.call(e) === "[object Arguments]"
        ? { args: Array.from(e as ArrayLike<unknown>) }
        : (e as Record<string, unknown>),
    ),
  );
}
const events = async (page: Page) => (await dataLayer(page)).filter((e) => typeof e.event === "string");
const consentCommands = async (page: Page) => (await dataLayer(page)).filter((e) => e.args?.[0] === "consent").map((e) => e.args);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.addEventListener(
      "click",
      (e) => {
        if ((e.target as Element | null)?.closest?.("a")) e.preventDefault();
      },
      true,
    );
  });
});

const isMobile = (name: string) => name.endsWith("375");

test.describe("헤더 (3절: 로고·GNB·검색창·CTA, 스크롤 시 축소 고정)", () => {
  test("로고·GNB 4개·CTA 가 있고 CTA 클릭 시 click_cta(location=header)", async ({ page }, info) => {
    await page.goto("./");
    const header = page.getByTestId("site-header");
    await expect(header).toBeVisible();
    await expect(page.getByTestId("site-logo")).toHaveText("리얼성형");

    const gnb = page.getByTestId(isMobile(info.project.name) ? "gnb-mobile" : "gnb-desktop");
    await expect(gnb).toBeVisible();
    const links = gnb.getByRole("link");
    await expect(links).toHaveText(["시술 가이드", "병원 찾기", "가격 비교", "칼럼"]);
    const hrefs = await links.evaluateAll((els) => els.map((el) => new URL((el as HTMLAnchorElement).href).pathname));
    expect(hrefs.map((h) => h.replace(/^\/[^/]+(?=\/(procedures|clinics|prices|blog)\/)/, ""))).toEqual([
      "/procedures/",
      "/clinics/",
      "/prices/",
      "/blog/",
    ]);

    const cta = page.getByTestId("header-cta");
    await expect(cta).toHaveText("무료 상담 예약");
    await expect(cta).toHaveAttribute("data-track", "click_cta");
    expect(new URL((await cta.getAttribute("href")) ?? "", "http://x").pathname).toMatch(/\/consult\/$/);
    await cta.click();
    expect(await events(page)).toContainEqual({ event: "click_cta", location: "header" });
  });

  test("스크롤하면 상단 바는 고정되고 레이아웃 이동(CLS)은 0", async ({ page }, info) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __shift: number };
      w.__shift = 0;
      new PerformanceObserver((list) => {
        for (const e of list.getEntries() as (PerformanceEntry & { value: number })[]) w.__shift += e.value;
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto("./");
    await page.evaluate(() => document.fonts.ready);
    const before = await page.evaluate(() => (window as unknown as { __shift: number }).__shift);
    for (const y of [150, 300, 600, 900]) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    }
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
    const box = await page.getByTestId("site-header").boundingBox();
    expect(box?.y).toBe(0);
    if (isMobile(info.project.name)) {
      // 모바일 2번째 줄(검색·GNB)은 스크롤과 함께 헤더 뒤로 사라진다 = 축소
      const sub = await page.getByTestId("site-header-sub").boundingBox();
      expect((sub?.y ?? 0) + (sub?.height ?? 0)).toBeLessThanOrEqual(box?.height ?? 0);
    }
    const after = await page.evaluate(() => (window as unknown as { __shift: number }).__shift);
    expect(after - before).toBe(0);
  });
});

test.describe("헤더 검색 (3절: 시술명 자동완성 최대 5개 → P-03, 이벤트 search)", () => {
  test("자동완성 목록·키보드 선택·search 이벤트", async ({ page }) => {
    await page.goto("./");
    const input = page.getByRole("combobox", { name: "시술 검색" });
    await expect(input).toHaveCount(1); // 보이는 검색창은 화면 폭마다 1개
    await input.fill("눈");
    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();
    await expect(input).toHaveAttribute("aria-expanded", "true");
    const options = listbox.getByRole("option");
    const count = await options.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(5);
    // 시술명 일치(눈매교정·눈밑지방재배치)가 부위(눈) 일치보다 먼저
    await expect(options.nth(0)).toContainText("눈매교정");
    await expect(options.nth(1)).toContainText("눈밑지방재배치");

    await input.press("ArrowDown");
    await input.press("ArrowDown");
    await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(input).toHaveAttribute("aria-activedescendant", (await options.nth(1).getAttribute("id")) ?? "");
    const href = decodeURIComponent(new URL((await options.nth(1).getAttribute("href")) ?? "", "http://x").pathname);
    expect(href).toMatch(/\/procedures\/눈밑지방재배치\/$/);

    await input.press("Enter");
    expect(await events(page)).toContainEqual({ event: "search", search_term: "눈" });
    await expect(listbox).toBeHidden();
  });

  test("일치하는 시술이 없으면 안내 문구, Esc 로 닫기", async ({ page }) => {
    await page.goto("./");
    const input = page.getByRole("combobox", { name: "시술 검색" });
    await input.fill("없는시술명");
    await expect(page.getByRole("status").filter({ hasText: "일치하는 시술이 없습니다" })).toBeVisible();
    await input.fill("쌍꺼풀");
    await expect(page.getByRole("option")).toHaveText([/쌍꺼풀 수술/]);
    await input.press("Escape");
    await expect(page.getByRole("listbox")).toBeHidden();
    await expect(input).toHaveAttribute("aria-expanded", "false");
  });

  test("마우스로 고른 항목도 search 이벤트를 보낸다", async ({ page }) => {
    await page.goto("./");
    const input = page.getByRole("combobox", { name: "시술 검색" });
    await input.fill("코");
    await page.getByRole("option", { name: /코 성형/ }).click();
    expect(await events(page)).toContainEqual({ event: "search", search_term: "코" });
  });
});

test.describe("상담 예약 CTA 블록 (3절: 제목·1줄 혜택·버튼, location 구분)", () => {
  for (const location of ["mid", "bottom"] as const) {
    test(`location=${location}: 시술 ID 를 상담 폼에 넘기고 click_cta 를 보낸다`, async ({ page }) => {
      await page.goto("./");
      const block = page.getByTestId(`consult-cta-${location}`);
      await expect(block.getByRole("heading", { level: 2 })).toBeVisible();
      await expect(block.locator("p")).toContainText("영업일 기준 1일");
      const button = block.getByRole("link", { name: "무료 상담 예약" });
      const url = new URL((await button.getAttribute("href")) ?? "", "http://x");
      expect(url.pathname).toMatch(/\/consult\/$/);
      expect(url.searchParams.get("procedure_id")).toBe("double-eyelid");
      await button.click();
      expect(await events(page)).toContainEqual({ event: "click_cta", location, procedure_id: "double-eyelid" });
    });
  }
});

test.describe("모바일 하단 고정 바 (3절: 전화·카카오톡·무료 상담 예약, 버튼별 이벤트)", () => {
  test("모바일: 화면 하단 고정, 버튼 3개와 각 이벤트, 콘텐츠를 가리지 않음", async ({ page }, info) => {
    test.skip(!isMobile(info.project.name), "모바일 전용 요소");
    await page.goto("./");
    // 동의 배너가 바를 덮지 않도록 먼저 선택을 끝낸다
    await page.getByTestId("consent-save").click();
    const bar = page.getByTestId("bottom-bar");
    await expect(bar).toBeVisible();
    const vp = page.viewportSize();
    const box = await bar.boundingBox();
    expect(Math.round((box?.y ?? 0) + (box?.height ?? 0))).toBe(vp?.height);

    const phone = bar.getByRole("link", { name: "전화" });
    const kakao = bar.getByRole("link", { name: "카카오톡 상담" });
    const consult = bar.getByRole("link", { name: "무료 상담 예약" });
    await expect(phone).toHaveAttribute("href", "tel:0200000000");
    await expect(kakao).toHaveAttribute("target", "_blank");
    await expect(kakao).toHaveAttribute("rel", /noopener/);
    const consultUrl = new URL((await consult.getAttribute("href")) ?? "", "http://x");
    expect(consultUrl.searchParams.get("procedure_id")).toBe("double-eyelid");
    expect(consultUrl.searchParams.get("clinic_id")).toBe("danhaneul");

    await phone.click();
    await kakao.click();
    await consult.click();
    const ev = await events(page);
    expect(ev).toContainEqual({ event: "phone_click", clinic_id: "danhaneul", page: "clinic" });
    expect(ev).toContainEqual({ event: "kakao_click", clinic_id: "danhaneul", page: "clinic" });
    expect(ev).toContainEqual({ event: "click_cta", location: "bottom_bar", procedure_id: "double-eyelid" });
    for (const [el, name] of [
      [phone, "phone_click"],
      [kakao, "kakao_click"],
      [consult, "click_cta"],
    ] as const) {
      await expect(el).toHaveAttribute("data-track", name);
    }

    // 맨 아래까지 내려도 푸터 면책 문구가 바에 가리지 않는다
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const disclaimer = await page.getByTestId("medical-disclaimer").boundingBox();
    const barTop = (await bar.boundingBox())?.y ?? 0;
    expect((disclaimer?.y ?? 0) + (disclaimer?.height ?? 0)).toBeLessThanOrEqual(barTop);
  });

  test("모바일 첫 방문: 동의 배너는 하단 바 위에 뜨고 바의 버튼 3개를 가리지 않는다", async ({ page }, info) => {
    test.skip(!isMobile(info.project.name), "모바일 전용 요소");
    await page.goto("./");
    const banner = page.getByTestId("consent-banner");
    const bar = page.getByTestId("bottom-bar");
    await expect(banner).toBeVisible();
    await expect(bar).toBeVisible();
    const bannerBox = await banner.boundingBox();
    const links = await bar.getByRole("link").all();
    expect(links).toHaveLength(3);
    for (const link of links) {
      const box = await link.boundingBox();
      expect((bannerBox?.y ?? 0) + (bannerBox?.height ?? 0), "배너 아래 끝 ≤ 버튼 위 끝").toBeLessThanOrEqual(box?.y ?? 0);
      // 버튼 가운데를 실제로 누르면 그 버튼이 맞는다(다른 요소가 덮지 않음)
      const hit = await link.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
      });
      expect(hit, `${await link.textContent()} 버튼이 가려짐`).toBe(true);
    }
    await bar.getByRole("link", { name: "무료 상담 예약" }).click();
    expect(await events(page)).toContainEqual({ event: "click_cta", location: "bottom_bar", procedure_id: "double-eyelid" });
    // 배너의 저장·동의 버튼도 그대로 누를 수 있다
    await page.getByTestId("consent-save").click();
    await expect(banner).toBeHidden();
  });

  test("데스크톱: 하단 고정 바를 숨긴다", async ({ page }, info) => {
    test.skip(isMobile(info.project.name), "데스크톱 전용 검사");
    await page.goto("./");
    await expect(page.getByTestId("bottom-bar")).toBeHidden();
  });
});

test.describe("쿠키·동의 배너 (3절: GA4·메타 픽셀 동의 토글, Consent Mode 기본 denied → 동의 후 업데이트)", () => {
  test("기본 denied → 방문 통계만 켜고 저장 → update·저장·배너 숨김 → 새로고침해도 유지", async ({ page }) => {
    await page.goto("./");
    const banner = page.getByTestId("consent-banner");
    await expect(banner).toBeVisible();
    expect((await consentCommands(page))[0]).toEqual([
      "consent",
      "default",
      {
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        analytics_storage: "denied",
        wait_for_update: 500,
      },
    ]);
    const analytics = banner.getByRole("switch", { name: "방문 통계" });
    const ads = banner.getByRole("switch", { name: "광고 성과 측정" });
    await expect(analytics).toHaveAttribute("aria-checked", "false");
    await expect(ads).toHaveAttribute("aria-checked", "false");
    await analytics.click();
    await expect(analytics).toHaveAttribute("aria-checked", "true");
    await banner.getByRole("button", { name: "선택 저장" }).click();
    await expect(banner).toBeHidden();
    const update = {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "granted",
    };
    expect(await consentCommands(page)).toContainEqual(["consent", "update", update]);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("rs_consent") ?? "null"));
    expect(stored).toMatchObject({ v: 1, analytics: true, ads: false });

    await page.reload();
    await expect(page.getByTestId("consent-banner")).toBeHidden();
    const cmds = await consentCommands(page);
    expect(cmds[0]?.[1]).toBe("default");
    expect(cmds[1]).toEqual(["consent", "update", update]);
  });

  test("모두 동의 → 전부 granted", async ({ page }) => {
    await page.goto("./");
    await page.getByTestId("consent-accept-all").click();
    await expect(page.getByTestId("consent-banner")).toBeHidden();
    expect(await consentCommands(page)).toContainEqual([
      "consent",
      "update",
      { ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted", analytics_storage: "granted" },
    ]);
  });
});

test.describe("스켈레톤·브레드크럼·푸터", () => {
  test("스켈레톤은 로딩 상태를 보조기기에 알린다", async ({ page }) => {
    await page.goto("./");
    const list = page.getByTestId("skeleton-list");
    await expect(list).toHaveAttribute("role", "status");
    await expect(list).toHaveAttribute("aria-busy", "true");
    await expect(list).toContainText("시술 목록을 불러오는 중입니다");
  });

  test("브레드크럼: 현재 위치 표시 + BreadcrumbList JSON-LD", async ({ page }) => {
    await page.goto("./");
    const nav = page.getByTestId("breadcrumb");
    await expect(nav.getByRole("listitem")).toHaveText(["홈", "시술 가이드", "눈", "쌍꺼풀 수술"]);
    await expect(nav.locator('[aria-current="page"]')).toHaveText("쌍꺼풀 수술");
    const ld = JSON.parse((await nav.locator('script[type="application/ld+json"]').textContent()) ?? "{}");
    expect(ld["@type"]).toBe("BreadcrumbList");
    expect(ld.itemListElement).toHaveLength(4);
    expect(ld.itemListElement[0].item).toMatch(/^https?:\/\/.+\/$/);
    expect(ld.itemListElement[3]).toEqual({ "@type": "ListItem", position: 4, name: "쌍꺼풀 수술" });
  });

  test("푸터: 사업자 정보·약관 링크·면책 문구·운영 시간", async ({ page }) => {
    await page.goto("./");
    const footer = page.getByTestId("site-footer");
    await expect(footer.getByTestId("medical-disclaimer")).toHaveText(
      "본 정보는 의료 조언이 아니며 진단·치료는 의료진 상담 필요",
    );
    await expect(footer.getByTestId("footer-info")).toContainText("상담 연락 시간");
    await expect(footer.getByTestId("footer-info")).toContainText("사업자 정보");
    await expect(footer.getByRole("link")).toHaveText(["이용약관", "개인정보처리방침"]);
  });
});

test.describe("레이아웃 기준 (QUALITY 3절)", () => {
  test("가로 스크롤 없음", async ({ page }) => {
    await page.goto("./");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("모바일 터치 타겟 44px 이상 — 보이는 인터랙티브 요소 전부(첫 방문·검색 목록·동의 후·본문 바로가기)", async ({
    page,
  }, info) => {
    test.skip(!isMobile(info.project.name), "모바일 기준");
    await page.goto("./");

    // 1) 첫 방문: 헤더·GNB·검색창·브레드크럼·CTA 블록·푸터 링크·동의 배너·하단 바
    const first = await visibleTargets(page);
    // 선택자가 영역을 놓치지 않았는지: 3절 공통 요소마다 최소 1개는 잡혀야 한다
    for (const area of [
      "site-logo",
      "gnb-mobile",
      "header-search-mobile",
      "breadcrumb",
      "consult-cta-mid",
      "consult-cta-bottom",
      "footer-links",
      "consent-banner",
      "bottom-bar",
    ]) {
      expect(first.some((t) => t.label.startsWith(`[${area}]`)), `${area} 의 요소를 찾지 못함`).toBe(true);
    }
    expect(first.find((t) => t.label.startsWith("[breadcrumb]") && t.label.includes('"홈"'))).toBeTruthy();
    expect(tooSmall(first), "첫 방문 화면의 44px 미만 요소").toEqual([]);

    // 2) 검색 자동완성 목록이 열린 상태(옵션 링크)
    const input = page.getByRole("combobox", { name: "시술 검색" });
    await input.fill("눈");
    await expect(page.getByRole("listbox")).toBeVisible();
    const searching = await visibleTargets(page);
    const options = searching.filter((t) => t.label.startsWith("[header-search-mobile] a"));
    expect(options.length).toBeGreaterThan(0);
    expect(tooSmall(searching), "검색 목록이 열린 화면의 44px 미만 요소").toEqual([]);
    await input.press("Escape");

    // 3) 동의 저장 후(배너 사라짐)
    await page.getByTestId("consent-save").click();
    await expect(page.getByTestId("consent-banner")).toBeHidden();
    expect(tooSmall(await visibleTargets(page)), "동의 후 화면의 44px 미만 요소").toEqual([]);

    // 4) 본문 바로가기: 평소 sr-only(1×1), 키보드 포커스를 받으면 보인다 → 그때 잰다
    await page.goto("./");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "본문 바로가기" });
    await expect(skip).toBeFocused();
    const box = await skip.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(MIN_TARGET);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(MIN_TARGET);
  });

  test("1280: 콘텐츠 최대폭 1120px, 좌우 여백 균형", async ({ page }, info) => {
    test.skip(isMobile(info.project.name), "데스크톱 기준");
    await page.goto("./");
    const row = await page.getByTestId("site-header").locator(":scope > div").boundingBox();
    expect(row?.width).toBe(1120);
    expect(Math.abs((row?.x ?? 0) - (1280 - (row?.x ?? 0) - (row?.width ?? 0)))).toBeLessThanOrEqual(1);
  });
});
