import type { Page } from "@playwright/test";
import { test, expect } from "../fixtures";
import { tooSmall, visibleTargets } from "./touch-targets";

/**
 * P-03 중 아직 없는 화면(P-06 상담 폼·P-05 병원 상세)으로 이어지는 요소 — 미리보기(next dev, RS_PREVIEW=1)에서 검증.
 * 미리보기는 모든 경로를 "있음"으로 보므로 중간·하단 CTA, 모바일 하단 바, 가격 표의 병원 링크가 그려진다.
 * 실제 이동은 막고(링크 클릭 preventDefault) 주소·dataLayer 이벤트만 확인한다.
 * baseURL 이 /preview/ 이므로 시술 상세는 ../procedures/<slug>/.
 */

const P03 = "../procedures/쌍꺼풀-수술/";
const isMobile = (name: string) => name.endsWith("375");
const events = (page: Page) =>
  page.evaluate(() => (window.dataLayer ?? []).filter((e) => typeof (e as { event?: unknown }).event === "string") as Record<string, unknown>[]);

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

test("중간 CTA(location=mid)·하단 CTA(location=bottom): procedure_id 를 상담 폼에 넘기고 click_cta", async ({ page }) => {
  await page.goto(P03);
  await page.getByTestId("consent-save").click();
  const mid = page.getByTestId("consult-cta-mid");
  await expect(mid.getByRole("heading", { level: 2 })).toHaveText("이 시술 상담 가능한 병원 보기");
  for (const location of ["mid", "bottom"] as const) {
    const button = page.getByTestId(`consult-cta-${location}`).getByRole("link", { name: "무료 상담 예약" });
    const url = new URL((await button.getAttribute("href")) ?? "", "http://x");
    expect(url.pathname).toMatch(/\/consult\/$/);
    expect(url.searchParams.get("procedure_id")).toBe("double-eyelid");
    await button.click();
    expect(await events(page)).toContainEqual({ event: "click_cta", location, procedure_id: "double-eyelid" });
  }
  // 중간 CTA 는 가격 표 다음, FAQ 앞(본문 중간), 하단 CTA 는 관련 시술 다음
  const order = await page.evaluate(() =>
    ["procedure-prices", "consult-cta-mid", "procedure-faq", "procedure-related", "consult-cta-bottom"].map(
      (id) => document.querySelector(`[data-testid="${id}"]`)!.getBoundingClientRect().top + scrollY,
    ),
  );
  expect([...order].sort((a, b) => a - b)).toEqual(order);
});

test("가격 표 병원명 → 병원 상세(P-05) 링크, select_clinic(from=procedure)", async ({ page }) => {
  await page.goto(P03);
  await page.getByTestId("consent-save").click();
  const links = page.getByTestId("procedure-prices").getByRole("link");
  await expect(links).toHaveText(["새솔결의원", "단하늘성형외과"]);
  expect(decodeURIComponent(new URL((await links.first().getAttribute("href")) ?? "", "http://x").pathname)).toMatch(/\/clinics\/새솔결의원\/$/);
  await links.first().click();
  expect(await events(page)).toContainEqual({ event: "select_clinic", clinic_id: "saesolgyeol", from: "procedure" });
});

test("모바일 하단 바: 상담 버튼(전화·카톡은 병원이 정해지지 않은 시술 페이지라 없음), 마지막 콘텐츠를 가리지 않음", async ({ page }, info) => {
  test.skip(!isMobile(info.project.name), "모바일 전용 요소");
  await page.goto(P03);
  await page.getByTestId("consent-save").click();
  const bar = page.getByTestId("bottom-bar");
  await expect(bar.getByRole("link")).toHaveText(["무료 상담 예약"]);
  await bar.getByRole("link").click();
  expect(await events(page)).toContainEqual({ event: "click_cta", location: "bottom_bar", procedure_id: "double-eyelid" });
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const disclaimer = await page.getByTestId("medical-disclaimer").boundingBox();
  const barTop = (await bar.boundingBox())!.y;
  expect(disclaimer!.y + disclaimer!.height).toBeLessThanOrEqual(barTop);
  expect(tooSmall(await visibleTargets(page))).toEqual([]);
});

test("데스크톱: 하단 바 숨김, 헤더 CTA 노출", async ({ page }, info) => {
  test.skip(isMobile(info.project.name), "데스크톱 전용");
  await page.goto(P03);
  await expect(page.getByTestId("bottom-bar")).toBeHidden();
  await expect(page.getByTestId("header-cta")).toBeVisible();
});

test.describe("첫 방문 동의 배너 + 하단 바 — 낮은 화면에서 접힘(T-100b 리뷰 권고)", () => {
  for (const viewport of [
    { width: 320, height: 568, max: 0.5 },
    { width: 375, height: 667, max: 0.4 },
    { width: 375, height: 812, max: 0.45 },
    { width: 667, height: 375, max: 0.55 },
  ]) {
    test(`${viewport.width}×${viewport.height}: 배너+바 ≤ ${viewport.max * 100}%, 바 버튼·배너 버튼 모두 눌림`, async ({ browser, baseURL }, info) => {
      test.skip(info.project.name !== "preview-375", "뷰포트를 직접 지정 — 한 프로젝트에서만");
      const ctx = await browser.newContext({ viewport, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: "ko-KR" });
      const page = await ctx.newPage();
      await page.goto(new URL(P03, baseURL).href);
      const banner = page.getByTestId("consent-banner");
      const bar = page.getByTestId("bottom-bar");
      await expect(banner).toBeVisible();
      await expect(bar).toBeVisible();
      const b = (await banner.boundingBox())!;
      const top = b.y;
      const share = (viewport.height - top) / viewport.height;
      console.log(`[banner+bar] ${viewport.width}x${viewport.height}: banner ${Math.round(b.height)}px, 배너 위 끝 ${Math.round(top)} → 화면 ${Math.round(share * 100)}%`);
      expect(share).toBeLessThanOrEqual(viewport.max);
      for (const el of [...(await bar.getByRole("link").all()), page.getByTestId("consent-save"), page.getByTestId("consent-accept-all")]) {
        const hit = await el.evaluate((node) => {
          const r = node.getBoundingClientRect();
          return node.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
        });
        expect(hit, (await el.textContent()) ?? "").toBe(true);
      }
      expect(tooSmall(await visibleTargets(page))).toEqual([]);
      await ctx.close();
    });
  }
});

test("회복기 추천템(미리보기 예시 상품): 광고 표기, click_affiliate", async ({ page }) => {
  await page.goto("./");
  const block = page.getByTestId("procedure-affiliates");
  await expect(block).toContainText("광고");
  await expect(block.getByRole("link")).toHaveCount(3);
  await block.getByRole("link").first().click();
  expect(await events(page)).toContainEqual({ event: "click_affiliate", item_id: "preview-cold-pack", procedure_id: "double-eyelid" });
  await expect(page.getByTestId("procedure-prices-empty")).toBeVisible();
});
