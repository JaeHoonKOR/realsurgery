import { test, expect } from "../fixtures";
import { tooSmall, visibleTargets } from "./touch-targets";

// P-04 병원 목록·비교 → P-05 병원 상세 (screen-spec 2절·4절 P-05·5절 이벤트·6절 JSON-LD·8절 폴백)
// out/ 정적 빌드를 GitHub Pages 와 같은 basePath 로 서빙한 화면을 검사한다(한글 slug 경로 포함).

type Entry = { event?: string } & Record<string, unknown>;
const events = (page: import("@playwright/test").Page, name: string) =>
  page.evaluate((n) => ((window.dataLayer ?? []) as Entry[]).filter((e) => e && e.event === n), name);

/** 동의 배너를 미리 닫아 둔다(하단 고정 요소와 겹치지 않게). 동의 상태는 이벤트 push 와 무관 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("rs_consent", JSON.stringify({ v: 1, analytics: false, ads: false, at: new Date().toISOString() }));
    } catch {
      /* 저장소 차단 환경 */
    }
  });
});

test.describe("P-04 병원 목록·비교", () => {
  test("목록 → 지역 필터 → 병원 상세(P-05) 이동, select_clinic·view_clinic", async ({ page }) => {
    await page.goto("clinics/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("병원 찾기");
    const cards = page.getByTestId("clinic-card");
    const total = await cards.count();
    expect(total).toBeGreaterThanOrEqual(3);
    await expect(page.getByTestId("clinic-count")).toContainText(`${total}곳`);

    // 지역 칩: "서울 강남구" 같은 시·도 + 구 단위, 누르면 그 지역만
    const chip = page.getByTestId("region-filter").getByRole("button", { name: /서울 강남구/ });
    await chip.click();
    await expect(chip).toHaveAttribute("aria-pressed", "true");
    await expect(page).toHaveURL(/region=/);
    const filtered = await cards.count();
    expect(filtered).toBeGreaterThan(0);
    expect(filtered).toBeLessThan(total);
    for (const region of await cards.locator("p", { hasText: "서울" }).allTextContents()) {
      expect(region).toContain("서울 강남구");
    }
    await expect(page.getByTestId("clinic-count")).toContainText(`${filtered}곳`);

    const first = cards.first();
    const name = (await first.getByTestId("clinic-card-link").textContent())?.trim() ?? "";
    await first.getByTestId("clinic-card-link").click();
    await expect(page).toHaveURL(/\/clinics\/[^/]+\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);

    // select_clinic(from=clinics) 은 이동 전 push — 클라이언트 이동이라 dataLayer 가 유지된다
    const selected = await events(page, "select_clinic");
    expect(selected.at(-1)).toMatchObject({ from: "clinics" });
    await expect.poll(async () => (await events(page, "view_clinic")).length).toBe(1);
    expect((await events(page, "view_clinic"))[0]).toMatchObject({ clinic_name: name, is_premium: false });
  });

  test("시술 필터 + 빈 상태 + 초기화", async ({ page }) => {
    await page.goto("clinics/");
    const total = await page.getByTestId("clinic-card").count();
    await page.getByTestId("procedure-filter").selectOption({ label: "쌍꺼풀 수술 (눈)" });
    await expect(page.getByTestId("clinic-count")).toContainText("쌍꺼풀 수술");
    const n = await page.getByTestId("clinic-card").count();
    expect(n).toBeGreaterThan(0);
    // 필터한 시술의 가격·막대가 카드에 나온다
    await expect(page.getByTestId("clinic-card-focus")).toHaveCount(n);

    // 조건에 맞는 병원이 없으면 빈 상태 + 초기화
    const regions = page.getByTestId("region-filter").getByRole("button");
    let empty = false;
    for (let i = 1; i < (await regions.count()) && !empty; i++) {
      if ((await regions.nth(i).textContent())?.trim().endsWith(" 0")) {
        await regions.nth(i).click();
        empty = true;
      }
    }
    if (!empty) {
      // 모든 지역에 쌍꺼풀 병원이 있으면 다른 시술로 빈 조합을 만든다
      await page.goto("clinics/?region=" + encodeURIComponent("경기 성남시") + "&procedure=breast-augmentation");
    }
    await expect(page.getByTestId("clinic-empty")).toBeVisible();
    await page.getByTestId("clinic-empty-reset").click();
    await expect(page.getByTestId("clinic-card")).toHaveCount(total);
  });

  test("비교: 2곳 담으면 비교 표(dialog), Esc 로 닫힘, 최대 3곳", async ({ page }) => {
    await page.goto("clinics/");
    const cards = page.getByTestId("clinic-card");
    await cards.nth(0).locator("label").click();
    await expect(page.getByTestId("compare-tray")).toBeVisible();
    await expect(page.getByTestId("compare-open")).toBeDisabled();
    await cards.nth(1).locator("label").click();
    await expect(page.getByTestId("compare-open")).toBeEnabled();
    await expect(page.getByTestId("compare-tray-item")).toHaveCount(2);

    await page.getByTestId("compare-open").click();
    const dialog = page.getByRole("dialog", { name: /병원 2곳 비교/ });
    await expect(dialog).toBeVisible();
    const table = dialog.getByTestId("compare-table");
    await expect(table).toBeVisible();
    // 행 = 시술, 칸마다 가격 막대 또는 —
    expect(await table.locator("tbody tr[data-procedure]").count()).toBeGreaterThan(0);
    expect(await table.getByRole("img").count()).toBeGreaterThan(0);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByTestId("compare-open")).toBeFocused();

    // 3곳까지, 4번째는 안내만
    if ((await cards.count()) >= 4) {
      await cards.nth(2).locator("label").click();
      await cards.nth(3).locator("label").click();
      await expect(cards.nth(3).getByTestId("compare-limit")).toBeVisible();
      await expect(page.getByTestId("compare-tray-item")).toHaveCount(3);
      await expect(cards.nth(3).getByTestId("compare-toggle")).not.toBeChecked();
    }
  });

  test("메타·BreadcrumbList·가로 스크롤 없음", async ({ page }) => {
    await page.goto("clinics/");
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toMatch(/\/clinics\/$/);
    const ld = await page.$$eval('script[type="application/ld+json"]', (els) => els.map((e) => JSON.parse(e.textContent ?? "null")));
    expect(ld.some((d) => d?.["@type"] === "BreadcrumbList")).toBe(true);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("모바일 터치 타겟 44px 이상(비교함 열린 상태 포함)", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-375", "모바일 기준");
    await page.goto("clinics/");
    expect(tooSmall(await visibleTargets(page))).toEqual([]);
    await page.getByTestId("clinic-card").nth(0).locator("label").click();
    await page.getByTestId("clinic-card").nth(1).locator("label").click();
    expect(tooSmall(await visibleTargets(page))).toEqual([]);
  });
});

test.describe("P-05 병원 상세", () => {
  async function openFirstClinic(page: import("@playwright/test").Page) {
    await page.goto("clinics/");
    const href = await page.getByTestId("clinic-card-link").first().getAttribute("href");
    expect(href).toBeTruthy();
    // 한글 slug 를 퍼센트 인코딩 경로로 직접 연다(검색·공유 링크와 같은 형태)
    const res = await page.goto(href!);
    expect(res?.status()).toBe(200);
  }

  test("JSON-LD MedicalClinic(평점·후기 없음) + BreadcrumbList, 메타", async ({ page }) => {
    await openFirstClinic(page);
    const ld = await page.$$eval('script[type="application/ld+json"]', (els) => els.map((e) => JSON.parse(e.textContent ?? "null")));
    const clinic = ld.find((d) => d?.["@type"] === "MedicalClinic");
    expect(clinic).toBeTruthy();
    expect(clinic).toMatchObject({
      medicalSpecialty: expect.anything(),
      address: { "@type": "PostalAddress", addressCountry: "KR" },
      geo: { "@type": "GeoCoordinates" },
    });
    expect(clinic.openingHoursSpecification.length).toBeGreaterThan(0);
    expect(JSON.stringify(ld)).not.toMatch(/AggregateRating|"Review"|ratingValue/);
    const crumbs = ld.find((d) => d?.["@type"] === "BreadcrumbList");
    expect(crumbs.itemListElement.map((i: { name: string }) => i.name)).toEqual(["홈", "병원 찾기", clinic.name]);

    await expect(page).toHaveTitle(new RegExp(`${clinic.name} 시술 가격·진료시간 \\(`));
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toMatch(/\/clinics\/%[0-9A-F]{2}.+\/$/);
    const desc = (await page.locator('meta[name="description"]').getAttribute("content")) ?? "";
    expect(desc).toContain(clinic.name);
    expect(desc.length).toBeLessThanOrEqual(150);
  });

  test("view_clinic 1회, 지도 링크 click_map, 주소 복사 확인 표시", async ({ page, context }, testInfo) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await openFirstClinic(page);
    await expect.poll(async () => (await events(page, "view_clinic")).length).toBe(1);

    const map = page.getByTestId("clinic-map-link");
    await expect(map).toHaveAttribute("href", /^https:\/\/map\.naver\.com\/p\/search\//);
    await expect(map).toHaveAttribute("target", "_blank");
    // 새 창 열기를 막고(외부 사이트 접속 금지) 이벤트만 확인
    await page.evaluate(() => {
      document.querySelector('[data-testid="clinic-map-link"]')?.addEventListener("click", (e) => e.preventDefault());
    });
    await map.click();
    const clicks = await events(page, "click_map");
    expect(clicks).toHaveLength(1);
    expect(clicks[0]).toHaveProperty("clinic_id");

    await page.getByTestId("clinic-copy-address").click();
    await expect(page.getByTestId("clinic-copy-status")).toContainText("복사했습니다");
    const address = (await page.getByTestId("clinic-address").textContent())?.trim();
    if (testInfo.project.name === "desktop-1280") {
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(address);
    }
  });

  test("가격표·진료 시간(오늘 강조)·예시 데이터 안내·8절 폴백", async ({ page }) => {
    await openFirstClinic(page);
    await expect(page.getByTestId("clinic-demo-notice")).toContainText("제휴 전 예시 데이터입니다. 실제 병원 정보가 아닙니다.");
    const rows = page.getByTestId("clinic-prices").locator("li[data-procedure]");
    expect(await rows.count()).toBeGreaterThan(0);
    await expect(rows.first().getByRole("img")).toHaveAttribute("aria-label", /전체 공개 가격/);
    await expect(page.getByText("병원이 공개한 가격이며 상담 후 달라질 수 있습니다.").first()).toBeVisible();

    const hours = page.getByTestId("clinic-hours");
    await expect(hours.locator("tr")).toHaveCount(8);
    await expect(hours.locator('tr[aria-current="date"]')).toHaveCount(1);
    await expect(page.getByTestId("clinic-open-status").first()).not.toContainText("확인 중");

    // 비제휴: 전화·카톡 없음, "제휴"·"추천" 표현 없음(예시 데이터 안내의 "제휴 전" 제외)
    await expect(page.getByTestId("clinic-phone")).toHaveCount(0);
    await expect(page.getByTestId("clinic-kakao")).toHaveCount(0);
    await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
    const text = (await page.locator("main").innerText()).replace(/제휴 전/g, "");
    expect(text).not.toMatch(/제휴|추천/);
    await expect(page.getByTestId("clinic-disclaimer")).toContainText("의료 조언이 아니며");
  });

  test("같은 시술 병원 → 다른 P-05, select_clinic(from=clinic)", async ({ page }) => {
    await openFirstClinic(page);
    const similar = page.getByTestId("clinic-similar").getByRole("link").filter({ has: page.locator("h3") });
    expect(await similar.count()).toBeGreaterThan(0);
    expect(await similar.count()).toBeLessThanOrEqual(3);
    const name = (await similar.first().locator("h3").textContent())?.trim();
    await similar.first().click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(name ?? "");
    expect((await events(page, "select_clinic")).at(-1)).toMatchObject({ from: "clinic" });
  });

  test("가로 스크롤 없음, 모바일 터치 타겟 44px", async ({ page }, testInfo) => {
    await openFirstClinic(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    if (testInfo.project.name === "mobile-375") expect(tooSmall(await visibleTargets(page))).toEqual([]);
  });
});
