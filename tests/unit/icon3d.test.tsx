// @vitest-environment jsdom
// Icon3D·Illustration·시술/병원 카드·푸터 — 생성 에셋이 "없을 때" (지금 저장소 상태: lib/gen-assets.json = [])
// 에셋이 있을 때는 tests/unit/gen-slots.test.tsx (레지스트리 mock)
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
// 레지스트리를 빈 목록으로 고정(실제 파일에 무엇이 커밋돼 있든 폴백 동작을 검증)
vi.mock("@/lib/gen-assets.json", () => ({ default: [] }));

import { SiteFooter } from "@/components/common/SiteFooter";
import { ClinicPhoto } from "@/components/clinic/ClinicPhoto";
import { HeroCutoutBack, HeroCutoutFront } from "@/components/home/HeroCutouts";
import { ProcedureCard } from "@/components/procedure/ProcedureCard";
import { CATEGORY_ICON, ICON_FALLBACK, ICON_NAMES, ICON_SIZES, Icon3D, categoryIcon } from "@/components/ui/Icon3D";
import { EMOJI } from "@/components/ui/Emoji3D";
import { Illustration } from "@/components/ui/Illustration";
import { loadContent } from "@/lib/content";
import manifest from "@/content/images/prompts.json";

function mount(ui: ReactNode): HTMLDivElement {
  const el = document.createElement("div");
  el.innerHTML = renderToStaticMarkup(ui);
  return el;
}

describe("Icon3D 폴백(생성 아이콘 없음)", () => {
  it("3절 매핑대로 Fluent 3D 이모지를 같은 크기로 그린다", () => {
    const el = mount(<Icon3D name="ic-contour" size={56} />);
    const img = el.querySelector("img")!;
    expect(img.getAttribute("src")).toBe("/images/emoji/ruler.webp");
    expect(img.getAttribute("width")).toBe("56");
    expect(img.className).toContain("size-14");
    expect(img.className).not.toContain("mix-blend-multiply");
    // 장식(기본 alt="")은 보조기기에서 숨긴다
    expect(img.getAttribute("alt")).toBe("");
    expect(img.getAttribute("aria-hidden")).toBe("true");
    // 고정 크기 원본 1장 — srcset 없음
    expect(img.hasAttribute("srcset")).toBe(false);
  });

  it("의미가 있는 아이콘은 alt 를 넘기고 aria-hidden 을 붙이지 않는다", () => {
    const img = mount(<Icon3D name="ic-done" size={96} alt="접수 완료" />).querySelector("img")!;
    expect(img.getAttribute("alt")).toBe("접수 완료");
    expect(img.hasAttribute("aria-hidden")).toBe(false);
    expect(img.className).toContain("size-24");
  });

  it("매핑: 아이콘 31종이 prompts.json 의 ic-* 와 1:1, 폴백은 실제 이모지 파일, 모든 크기에 클래스", () => {
    const manifestIcons = (manifest as { images: { id: string }[] }).images.map((i) => i.id).filter((id) => id.startsWith("ic-"));
    expect([...ICON_NAMES].sort()).toEqual([...manifestIcons].sort());
    for (const name of ICON_NAMES) expect(EMOJI).toContain(ICON_FALLBACK[name]);
    for (const size of ICON_SIZES) {
      const img = mount(<Icon3D name="ic-eye" size={size} />).querySelector("img")!;
      expect(img.getAttribute("width")).toBe(String(size));
      expect(img.className).toMatch(/\bsize-\d+\b/);
    }
  });

  it("부위 → 아이콘(리본·$ 대신 세트 아이콘), 모르는 부위는 가이드 아이콘", () => {
    expect(categoryIcon("eye")).toBe("ic-eye");
    expect(categoryIcon("breast")).toBe("ic-breast");
    expect(categoryIcon("unknown")).toBe("ic-guide");
    for (const c of loadContent().categories) expect(CATEGORY_ICON[c.id]).toBeDefined();
  });
});

describe("이미지 자리 폴백(빈 회색 상자 금지)", () => {
  it("Illustration: fallback 이 있으면 같은 비율 상자 안 3D 아이콘, 없으면 아무것도 그리지 않는다", () => {
    const el = mount(<Illustration id="flow-compare" aspect="4:3" fallback="ic-search" alt="" sizes="100vw" />);
    expect(el.firstElementChild!.className).toContain("aspect-4/3");
    expect(el.querySelector("img")!.getAttribute("src")).toBe("/images/emoji/search.webp");
    expect(el.textContent).not.toContain("예시 이미지");
    expect(mount(<Illustration id="proc-double-eyelid" aspect="16:10" alt="" sizes="100vw" />).innerHTML).toBe("");
    expect(mount(<ClinicPhoto clinicId="danhaneul" />).innerHTML).toBe("");
  });

  it("시술 카드: 썸네일 없이 지금 모양(부위 아이콘 타일·태그라인 2줄)", () => {
    const p = loadContent().procedures.find((x) => x.id === "double-eyelid")!;
    const el = mount(<ProcedureCard procedure={p} fromPage="procedures" />);
    const card = el.querySelector("[data-testid=procedure-card]")!;
    expect(card.className).toContain("p-6");
    expect(card.querySelector("img")!.getAttribute("src")).toBe("/images/emoji/eye.webp");
    expect(card.querySelector(".line-clamp-2")).not.toBeNull();
    expect(mount(<ProcedureCard procedure={p} fromPage="procedure" showEmoji={false} />).querySelector("img")).toBeNull();
  });

  it("히어로 컷아웃: 앞쪽은 지금의 스파클 이모지, 뒤쪽은 그리지 않는다", () => {
    expect(mount(<HeroCutoutFront />).querySelector("img")!.getAttribute("src")).toBe("/images/emoji/sparkles.webp");
    expect(mount(<HeroCutoutBack />).innerHTML).toBe("");
  });

  it("푸터: 생성 이미지가 없으면 AI 생성 고지를 붙이지 않는다", () => {
    expect(mount(<SiteFooter />).querySelector("[data-testid=footer-ai-notice]")).toBeNull();
  });
});
