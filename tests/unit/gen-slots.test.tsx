// @vitest-environment jsdom
// 생성 에셋이 "들어왔을 때" 자동 전환 — lib/gen-assets.json 을 mock 해 finalize-images.mjs 실행 후 상태를 재현한다.
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
vi.mock("@/lib/gen-assets.json", () => ({
  default: ["clinic-danhaneul", "hero-obj-a", "hero-obj-b", "ic-clinic", "ic-eye", "proc-double-eyelid"],
}));

import { SiteFooter, AI_IMAGE_NOTICE } from "@/components/common/SiteFooter";
import { ClinicCard } from "@/components/clinic/ClinicCard";
import { ClinicPhoto } from "@/components/clinic/ClinicPhoto";
import { HeroCutoutBack, HeroCutoutFront } from "@/components/home/HeroCutouts";
import { ProcedureCard } from "@/components/procedure/ProcedureCard";
import { ProcedureSummary } from "@/components/procedure/ProcedureSummary";
import { Icon3D } from "@/components/ui/Icon3D";
import { CLINIC_PHOTO_ALT, Illustration } from "@/components/ui/Illustration";
import type { ClinicCardData } from "@/lib/clinic/types";
import { loadContent } from "@/lib/content";
import { hasAnyAsset, hasAsset } from "@/lib/gen-assets";

function mount(ui: ReactNode): HTMLDivElement {
  const el = document.createElement("div");
  el.innerHTML = renderToStaticMarkup(ui);
  return el;
}
/** 테스트 환경의 next/image 는 기본 로더라 src 가 /_next/image?url=… 로 감싸진다 → 원래 경로만 꺼낸다 */
function srcPath(img: Element): string {
  const src = img.getAttribute("src") ?? "";
  const url = new URL(src, "http://x");
  return url.searchParams.get("url") ?? url.pathname;
}

describe("레지스트리에 있는 에셋으로 자동 전환", () => {
  it("hasAsset 은 목록 기준", () => {
    expect(hasAsset("ic-eye")).toBe(true);
    expect(hasAsset("ic-nose")).toBe(false);
    expect(hasAnyAsset()).toBe(true);
  });

  it("Icon3D: 256px 원본 1장을 고정 크기·multiply 로, 없는 아이콘은 계속 폴백", () => {
    const img = mount(<Icon3D name="ic-eye" size={72} />).querySelector("img")!;
    expect(img.getAttribute("src")).toBe("/images/gen/ic-eye.webp");
    expect(img.getAttribute("width")).toBe("72");
    expect(img.className).toContain("mix-blend-multiply");
    expect(img.className).toContain("select-none");
    expect(img.className).toContain("size-18");
    expect(img.hasAttribute("srcset")).toBe(false);
    expect(mount(<Icon3D name="ic-nose" size={72} />).querySelector("img")!.getAttribute("src")).toBe("/images/emoji/nose.webp");
  });

  it("Illustration: 확장자 없는 기본 경로를 로더에 넘기고, 병원 사진은 '예시 이미지' 표기·고정 alt", () => {
    const proc = mount(<Illustration id="proc-double-eyelid" aspect="16:10" alt="" sizes="100vw" />);
    expect(proc.firstElementChild!.className).toContain("aspect-16/10");
    const img = proc.querySelector("img")!;
    expect(srcPath(img)).toBe("/images/gen/proc-double-eyelid");
    expect(img.getAttribute("sizes")).toBe("100vw");
    expect(proc.textContent).not.toContain("예시 이미지");

    const clinic = mount(<ClinicPhoto clinicId="danhaneul" />);
    expect(clinic.querySelector("img")!.getAttribute("alt")).toBe(CLINIC_PHOTO_ALT);
    expect(clinic.textContent).toContain("예시 이미지");
    // clinic-* 은 호출부가 alt·라벨을 빠뜨려도 강제
    const raw = mount(<Illustration id="clinic-danhaneul" aspect="1:1" alt="" sizes="44px" />);
    expect(raw.querySelector("img")!.getAttribute("alt")).toBe(CLINIC_PHOTO_ALT);
    expect(raw.textContent).toContain("예시 이미지");
  });

  it("시술 카드: 상단 16:10 썸네일 + 태그라인 1줄, 아이콘 타일 없음(showEmoji 와 무관)", () => {
    const p = loadContent().procedures.find((x) => x.id === "double-eyelid")!;
    for (const showEmoji of [true, false]) {
      const card = mount(<ProcedureCard procedure={p} fromPage="procedures" showEmoji={showEmoji} />).querySelector("[data-testid=procedure-card]")!;
      expect(card.className).toContain("overflow-hidden");
      const imgs = [...card.querySelectorAll("img")];
      expect(imgs).toHaveLength(1);
      expect(srcPath(imgs[0]!)).toBe("/images/gen/proc-double-eyelid");
      expect(imgs[0]!.getAttribute("sizes")).toBe("(min-width: 1024px) 352px, (min-width: 640px) 50vw, 288px");
      expect(card.querySelector(".line-clamp-1")).not.toBeNull();
    }
    // 이미지가 없는 시술은 지금 모양
    const other = loadContent().procedures.find((x) => x.id === "rhinoplasty")!;
    const plain = mount(<ProcedureCard procedure={other} fromPage="procedures" />).querySelector("[data-testid=procedure-card]")!;
    expect(plain.querySelector("img")!.getAttribute("src")).toBe("/images/emoji/nose.webp");
  });

  it("P-03 요약: 시술 이미지가 있으면 히어로(이미지 요소 1개, priority·sizes)", () => {
    const { procedures, categories, authors } = loadContent();
    const p = procedures.find((x) => x.id === "double-eyelid")!;
    const el = mount(<ProcedureSummary procedure={p} category={categories.find((c) => c.id === p.category_id)} author={authors[0]} />);
    const hero = el.querySelector("[data-testid=procedure-hero]")!;
    const heroImgs = [...hero.querySelectorAll("img")].filter((i) => srcPath(i).startsWith("/images/gen/proc-"));
    expect(heroImgs).toHaveLength(1);
    expect(heroImgs[0]!.getAttribute("sizes")).toBe("(min-width: 1024px) 460px, 100vw");
    // priority: 지연 로딩이 아니고 preload 링크가 붙는다
    expect(heroImgs[0]!.getAttribute("loading")).not.toBe("lazy");
    expect(el.querySelector('link[rel="preload"][as="image"]')).not.toBeNull();
    // 제목·직답은 그대로
    expect(hero.querySelector("h1")!.textContent).toBe(p.name);
    expect(hero.querySelector("[data-testid=procedure-answer]")).not.toBeNull();

    const other = procedures.find((x) => x.id === "rhinoplasty")!;
    const plain = mount(<ProcedureSummary procedure={other} category={undefined} author={undefined} />);
    expect(plain.querySelector("[data-testid=procedure-hero]")).toBeNull();
  });

  it("병원 카드(P-04): 사진 커버가 있으면 병원 아이콘 타일 대신", () => {
    const c = loadContent().clinics.find((x) => x.id === "danhaneul")!;
    const data: ClinicCardData = {
      id: c.id,
      name: c.name,
      href: "/clinics/x/",
      region: c.region,
      regionKey: c.region,
      is_demo: c.is_demo,
      is_premium: false,
      offers: [],
      week: { weekday: [], saturday: "휴진", sunday: "휴진" },
      updated: null,
    };
    const el = mount(<ClinicCard clinic={data} procedures={new Map()} focusProcedure={null} selected={false} blocked={false} onToggle={() => {}} />);
    const imgs = [...el.querySelectorAll("img")];
    expect(imgs).toHaveLength(1);
    expect(imgs[0]!.getAttribute("alt")).toBe(CLINIC_PHOTO_ALT);
    expect(el.textContent).toContain("예시 이미지");
    expect(el.textContent).toContain("예시 데이터");
  });

  it("히어로 컷아웃: 장식(aria-hidden·pointer-events-none)·multiply·고정 크기", () => {
    for (const ui of [<HeroCutoutFront key="a" />, <HeroCutoutBack key="b" />]) {
      const img = mount(ui).querySelector("img")!;
      expect(img.getAttribute("src")).toMatch(/^\/images\/gen\/hero-obj-[ab]\.webp$/);
      expect(img.getAttribute("aria-hidden")).toBe("true");
      expect(img.getAttribute("alt")).toBe("");
      expect(img.className).toContain("pointer-events-none");
      expect(img.className).toContain("mix-blend-multiply");
      // 160px 장식이라 LCP 후보가 아니다 → priority 없이 지연 로딩
      expect(img.getAttribute("loading")).toBe("lazy");
    }
  });

  it("푸터: 생성 이미지가 있으면 AI 생성 고지 1줄", () => {
    expect(mount(<SiteFooter />).querySelector("[data-testid=footer-ai-notice]")!.textContent).toBe(AI_IMAGE_NOTICE);
  });
});
