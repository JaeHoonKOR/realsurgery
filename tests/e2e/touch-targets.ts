import type { Page } from "@playwright/test";

/**
 * 모바일 터치 타겟 44px (docs/QUALITY.md 3절) — 화면에 보이는 인터랙티브 요소를 목록 없이 전부 잰다.
 * 새 컴포넌트가 추가돼도 테스트 목록을 고칠 필요가 없게, 선택자로 모은다.
 * - 대상: 링크·버튼·입력·스위치·검색 옵션 등 누를 수 있는 모든 요소(tabindex="-1" 인 일반 요소는 제외, role=option 은 포함)
 * - 제외: 화면에 그려지지 않는 요소(display:none·hidden → 0×0, sr-only → 1×1, visibility:hidden)
 *   sr-only 로 숨긴 "본문 바로가기"는 포커스를 받았을 때 따로 잰다(tests/e2e/common.preview.spec.ts).
 */
export const MIN_TARGET = 44;

const INTERACTIVE = [
  "a[href]",
  "button",
  'input:not([type="hidden"])',
  "select",
  "textarea",
  "summary",
  '[role="button"]',
  '[role="link"]',
  '[role="switch"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="tab"]',
  '[role="option"]',
  '[role="menuitem"]',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export type Target = { label: string; width: number; height: number };

/** 지금 화면에 보이는 인터랙티브 요소 전부의 크기 */
export async function visibleTargets(page: Page): Promise<Target[]> {
  return page.evaluate((selector) => {
    const out: { label: string; width: number; height: number }[] = [];
    for (const el of document.querySelectorAll<HTMLElement>(selector)) {
      const r = el.getBoundingClientRect();
      if (r.width <= 1 && r.height <= 1) continue;
      if (getComputedStyle(el).visibility === "hidden") continue;
      const name = (
        el.getAttribute("aria-label") ||
        el.textContent ||
        el.getAttribute("placeholder") ||
        (el.getAttribute("aria-labelledby") &&
          document.getElementById(el.getAttribute("aria-labelledby") ?? "")?.textContent) ||
        ""
      )
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 30);
      const testId = el.closest("[data-testid]")?.getAttribute("data-testid") ?? "";
      out.push({
        label: `${testId ? `[${testId}] ` : ""}${el.tagName.toLowerCase()} "${name}"`,
        width: Math.round(r.width * 100) / 100,
        height: Math.round(r.height * 100) / 100,
      });
    }
    return out;
  }, INTERACTIVE);
}

/** 44px 미만 요소만 "라벨 너비×높이" 문자열로 */
export function tooSmall(targets: Target[]): string[] {
  return targets
    .filter((t) => t.width < MIN_TARGET || t.height < MIN_TARGET)
    .map((t) => `${t.label} ${t.width}×${t.height}`);
}
