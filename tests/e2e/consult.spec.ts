import type { Page } from "@playwright/test";
import { test, expect } from "../fixtures";
import { tooSmall, visibleTargets } from "./touch-targets";

// P-06 상담 폼 → P-07 완료 (screen-spec 4절·5절). 키가 없으므로 submit-lead 는 mock 모드(같은 인터페이스)로 통과한다.

type Ev = { event: string } & Record<string, unknown>;
const events = (page: Page, name: string) =>
  page.evaluate(
    (n) => ((window.dataLayer ?? []) as Ev[]).filter((e) => e && typeof e === "object" && e.event === n),
    name,
  );

/** 쿠키 배너가 하단 버튼을 덮지 않게 먼저 선택한다(실사용자와 같은 순서) */
async function dismissConsent(page: Page) {
  await page.getByTestId("consent-save").click();
  await expect(page.getByTestId("consent-banner")).toBeHidden();
}

const choose = (page: Page, text: string | RegExp) => page.locator("label", { hasText: text }).first().click();

/** 빌드에 Supabase 공개 키가 없으면 시연(demo) 모드 — 이 E2E 는 키 없이 돌리므로 보통 true */
const DEMO = !(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());
const DEMO_NOTICE = "포트폴리오 시연용 화면입니다. 입력한 정보는 서버로 전송되지 않고 이 브라우저에만 저장됩니다.";

test.describe("상담 신청 (P-06 → P-07)", () => {
  test("선입력 → 1단계 → 휴대폰 오류 → 제출 → 접수번호, generate_lead 1회(새로고침 포함)", async ({ page }) => {
    await page.goto("consult/?procedure_id=double-eyelid");
    await expect(page).toHaveTitle(/시술 상담 신청/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("시술 상담 신청");
    await dismissConsent(page);
    await expect(page.getByTestId("consult-procedure-trigger")).toContainText("쌍꺼풀 수술");

    // 1단계
    await choose(page, "서울 강남·서초");
    await choose(page, "3개월 내");
    await page.getByTestId("consult-submit").click();
    await expect(page.getByTestId("consult-step2")).toBeVisible();
    expect(await events(page, "form_start")).toEqual([
      expect.objectContaining({ event: "form_start", procedure_id: "double-eyelid", source_page: "direct" }),
    ]);
    expect(await events(page, "form_step2")).toEqual([
      expect.objectContaining({ event: "form_step2", procedure_id: "double-eyelid" }),
    ]);

    // 2단계: 잘못된 번호
    const phone = page.locator("#consult-phone");
    await page.locator("#consult-name").fill("김지은");
    await phone.fill("0101234");
    await expect(phone).toHaveValue("010-1234");
    await page.getByTestId("consult-submit").click();
    await expect(phone).toHaveAttribute("aria-invalid", "true");
    await expect(phone).toHaveAttribute("aria-describedby", "phone-error");
    await expect(page.locator("#phone-error")).toContainText("010-1234-5678 형식");
    await expect(page).toHaveURL(/\/consult\/\?procedure_id=double-eyelid$/);

    // 이전 → 값 유지 → 다음
    await page.getByTestId("consult-back").click();
    await expect(page.getByRole("radio", { name: "서울 강남·서초" })).toBeChecked();
    await page.getByTestId("consult-submit").click();
    await expect(page.locator("#consult-name")).toHaveValue("김지은");
    expect(await events(page, "form_step2")).toHaveLength(1);

    // 정상 제출
    await phone.fill("01012345678");
    await expect(phone).toHaveValue("010-1234-5678");
    await choose(page, /^오후$/);
    await choose(page, "약관 전체 동의");
    for (const key of ["consent_privacy", "consent_sensitive", "consent_3rd", "consent_marketing"]) {
      await expect(page.getByTestId(key)).toBeChecked();
    }
    await expect(page.getByTestId("consult-submit")).toHaveText("상담 신청하기");
    if (DEMO) {
      // 제출 버튼 바로 위에 시연 안내
      const notice = page.getByTestId("consult-demo-notice");
      await expect(notice).toHaveText(DEMO_NOTICE);
      await notice.scrollIntoViewIfNeeded();
      await expect(notice).toBeInViewport();
      expect(await notice.evaluate((el) => el.nextElementSibling?.getAttribute("data-testid"))).toBe("consult-actions");
    }
    await page.getByTestId("consult-submit").click();
    await expect(page.getByTestId("consult-submit")).toBeDisabled();
    expect(await events(page, "generate_lead")).toHaveLength(0); // P-06 에서는 보내지 않는다

    await page.waitForURL(/\/consult\/done\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("상담 신청이 접수됐습니다");
    if (DEMO) {
      // 시연: 연락을 약속하지 않는다
      await expect(page.getByTestId("consult-done-demo-notice")).toHaveText(DEMO_NOTICE);
      await expect(page.getByTestId("consult-done-lead")).toContainText("실제로 연락드리지 않습니다");
      await expect(page.getByTestId("consult-done")).not.toContainText("영업일 기준 1일 안에 연락드립니다");
    } else {
      await expect(page.getByTestId("consult-done-lead")).toContainText("영업일 기준 1일 안에 연락드립니다");
    }
    await expect(page.getByTestId("consult-done-number")).toHaveText(/^RS-\d{4}-[0-9A-F]{4}$/);
    await expect(page.getByTestId("consult-done-receipt")).toContainText("쌍꺼풀 수술");

    const leads = await events(page, "generate_lead");
    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({ procedure_id: "double-eyelid", value: 50000, currency: "KRW" });
    expect(String(leads[0]?.lead_id)).toMatch(/^[0-9a-f-]{36}$/);
    const number = await page.getByTestId("consult-done-number").textContent();
    expect(number?.slice(-4)).toBe(String(leads[0]?.lead_id).slice(0, 4).toUpperCase());

    // 새로고침해도 다시 보내지 않는다
    await page.reload();
    await expect(page.getByTestId("consult-done-number")).toHaveText(number ?? "");
    expect(await events(page, "generate_lead")).toHaveLength(0);

    // 첫 유입 쿠키와 mock 저장(마스킹)
    const utm = (await page.context().cookies()).find((c) => c.name === "_utm");
    expect(utm).toBeDefined();
    const mock = await page.evaluate(() => localStorage.getItem("rs_mock_leads") ?? "");
    expect(mock).toContain("010-****-5678");
    expect(mock).not.toContain("01012345678");
  });

  test("같은 번호로 5분 안에 다시 신청하면 막는다", async ({ page }) => {
    await page.goto("consult/?procedure_id=rhinoplasty");
    await dismissConsent(page);
    await page.evaluate(() => {
      // 방금 같은 번호로 접수된 상태
      let h = 0x811c9dc5;
      for (const ch of "rs:01099998888") {
        h ^= ch.charCodeAt(0);
        h = Math.imul(h, 0x01000193) >>> 0;
      }
      localStorage.setItem("rs_recent_leads", JSON.stringify({ [h.toString(36)]: Date.now() - 60_000 }));
    });
    await choose(page, "경기·인천");
    await choose(page, "아직 미정");
    await page.getByTestId("consult-submit").click();
    await page.locator("#consult-name").fill("이준");
    await page.locator("#consult-phone").fill("01099998888");
    await choose(page, "언제든");
    await choose(page, "약관 전체 동의");
    await page.getByTestId("consult-submit").click();
    await expect(page.getByTestId("consult-submit-error")).toContainText("중복 접수를 막았으니");
    await expect(page).toHaveURL(/\/consult\//);
    await expect(page.locator("#consult-name")).toHaveValue("이준");
  });

  test("완료 화면 직접 접근은 메인으로 돌려보낸다(전환 없음)", async ({ page, baseURL }) => {
    await page.goto("consult/done/");
    await page.waitForURL((url) => url.href === baseURL);
    expect(await events(page, "generate_lead")).toHaveLength(0);
  });

  test("완료 화면은 검색 노출 차단, 상담 폼은 canonical(시연 모드면 noindex)", async ({ page }) => {
    // 리다이렉트 전 정적 HTML 의 메타를 본다
    const res = await page.request.get("consult/done/");
    expect(res.status()).toBe(200);
    expect(await res.text()).toMatch(/<meta name="robots" content="noindex, nofollow"/);
    await page.goto("consult/");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/consult\/$/);
    const robots = page.locator('meta[name="robots"]');
    if (DEMO) await expect(robots).toHaveAttribute("content", "noindex, follow");
    else await expect(robots).toHaveCount(0);
  });

  test("동의: 민감정보는 따로 [필수], 병원 제3자 제공은 [선택] — 제3자 제공 없이도 접수", async ({ page }) => {
    await page.goto("consult/?procedure_id=rhinoplasty");
    await dismissConsent(page);
    await choose(page, "서울 기타");
    await choose(page, "1개월 내");
    await page.getByTestId("consult-submit").click();
    await page.locator("#consult-name").fill("최민아");
    await page.locator("#consult-phone").fill("01077778888");
    await choose(page, /^저녁$/);
    const label = (key: string) => page.locator("label", { has: page.getByTestId(key) });
    await expect(label("consent_sensitive")).toHaveText("[필수]민감정보(관심 시술) 처리 동의");
    await expect(label("consent_3rd")).toContainText("[선택]");
    // 민감정보 내용 보기: 항목·목적·보유 기간·거부 시 불이익
    await page.getByRole("button", { name: "민감정보(관심 시술) 처리 동의 내용 보기" }).click();
    const detail = page.locator("#consent_sensitive-detail");
    for (const t of ["처리 항목", "처리 목적", "보유 기간", "거부 시 불이익"]) await expect(detail).toContainText(t);

    // 개인정보 동의만 → 민감정보 오류
    await label("consent_privacy").click();
    await page.getByTestId("consult-submit").click();
    await expect(page.locator("#consent_sensitive-error")).toContainText("민감정보(관심 시술) 처리 동의가 빠져 있으니");
    await expect(page.getByTestId("consent_sensitive")).toBeFocused();
    // 민감정보 동의 후 제3자 제공 없이 제출 → 접수
    await label("consent_sensitive").click();
    await expect(page.getByTestId("consent_3rd")).not.toBeChecked();
    await page.getByTestId("consult-submit").click();
    await page.waitForURL(/\/consult\/done\/$/);
    const mock = await page.evaluate(() => JSON.parse(localStorage.getItem("rs_mock_leads") ?? "[]") as { consent_3rd: boolean }[]);
    if (DEMO) expect(mock.at(-1)?.consent_3rd).toBe(false);
  });

  test("하단 고정 바가 있는 화면: 모바일은 헤더 CTA 숨김(중복 노출 방지), 데스크톱은 헤더 CTA 노출", async ({ page }, testInfo) => {
    await page.goto(encodeURI("procedures/쌍꺼풀-수술/"));
    const header = page.getByTestId("header-cta");
    await expect(header).toHaveText("상담 신청");
    if (testInfo.project.name === "mobile-375") {
      await expect(page.getByTestId("bottom-bar").getByRole("link", { name: "상담 신청" })).toBeVisible();
      await expect(header).toBeHidden();
    } else {
      await expect(page.getByTestId("bottom-bar")).toBeHidden();
      await expect(header).toBeVisible();
    }
    // 하단 바가 없는 화면(메인)에서는 모바일도 헤더 CTA 를 보인다
    await page.goto("./");
    await expect(page.getByTestId("header-cta")).toBeVisible();
  });

  test("모바일 터치 타겟 44px 이상 — 1·2단계", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-375", "모바일 기준");
    // 이 화면이 만든 요소만 잰다. 공통 헤더 CTA(h-10)는 상담 폼에서 숨김 처리 예정(통합 시 data-consult-page 기준) — 범위 밖
    const own = async () => (await visibleTargets(page)).filter((t) => !t.label.startsWith("[header-cta]"));
    await page.goto("consult/?procedure_id=double-eyelid");
    await dismissConsent(page);
    expect(tooSmall(await own()), "1단계 44px 미만").toEqual([]);
    await choose(page, "서울 기타");
    await choose(page, "1개월 내");
    await page.getByTestId("consult-submit").click();
    await expect(page.getByTestId("consult-step2")).toBeVisible();
    expect(tooSmall(await own()), "2단계 44px 미만").toEqual([]);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("시술 시트에서 검색해 바꿀 수 있다", async ({ page }) => {
    await page.goto("consult/");
    await dismissConsent(page);
    await page.getByTestId("consult-procedure-trigger").click();
    const sheet = page.getByTestId("consult-procedure-sheet");
    await expect(sheet).toBeVisible();
    await sheet.getByRole("searchbox").fill("코");
    await sheet.locator('[data-procedure-id="rhinoplasty"]').click();
    await expect(sheet).toBeHidden();
    await expect(page.getByTestId("consult-procedure-trigger")).toContainText("코 성형");
    expect(await events(page, "form_start")).toHaveLength(1);
  });
});

test.describe("약관·개인정보처리방침 (C-01)", () => {
  for (const [path, title] of [
    ["privacy/", "개인정보처리방침"],
    ["terms/", "이용약관"],
  ] as const) {
    test(`${title}: 조항·목차 앵커·시행일`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
      await expect(page.getByText("시행일 2026년 11월 1일")).toBeVisible();
      const anchors = await page.locator('nav[aria-label="목차"] a').evaluateAll((as) => as.map((a) => a.getAttribute("href")));
      expect(anchors.length).toBeGreaterThan(5);
      for (const href of anchors) await expect(page.locator(href ?? "#none")).toHaveCount(1);
    });
  }

  test("개인정보처리방침: 민감정보·제3자 제공·보유 기간·위탁", async ({ page }) => {
    await page.goto("privacy/");
    const main = page.locator("main");
    for (const text of ["민감정보", "현재 제휴 병원은 없습니다", "상담 완료 후 1년", "Supabase", "Resend", "GitHub", "Meta 픽셀", "리얼성형 운영팀"]) {
      await expect(main).toContainText(text);
    }
    // 동의 화면과 같은 구분: 민감정보 별도 [필수], 제3자 제공 [선택]
    await expect(page.locator("#sensitive")).toContainText("[필수] 민감정보(관심 시술) 처리 동의");
    await expect(page.locator("#sensitive")).toContainText("거부 시 불이익");
    await expect(page.locator("#third-party")).toContainText("[선택] 병원 연결을 위한 제3자 제공");
    await expect(page.locator("#third-party")).toContainText("동의하지 않아도 상담 신청");
    // 자리 표시 문구 대신 정직한 시연 사이트 안내(가짜 연락처 없음)
    await expect(main).not.toContainText("사업자 등록 절차를 마친 뒤");
    await expect(page.getByTestId("privacy-demo-note")).toContainText("포트폴리오용 시연 사이트입니다");
    await expect(page.getByTestId("privacy-officer-contact")).toContainText("시연 사이트");
    await expect(page.getByTestId("footer-business-pending")).toHaveText(
      "포트폴리오용 시연 사이트입니다. 사업자 등록 전으로 실제 영업을 하지 않습니다.",
    );
  });
});
