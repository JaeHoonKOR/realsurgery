// @vitest-environment jsdom
// 공통 컴포넌트 이벤트 단위 검증 (pipelines/01-build VERIFY: "이벤트 전부 dataLayer에 push됨 (vitest)")
// 실제 브라우저 동작(스크롤·레이아웃·접근성)은 tests/e2e/common.preview.spec.ts·tests/a11y 에서 본다.
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { BottomBar } from "@/components/common/BottomBar";
import { Breadcrumb, breadcrumbJsonLd } from "@/components/common/Breadcrumb";
import { ConsentBanner } from "@/components/common/ConsentBanner";
import { ConsultCta } from "@/components/common/ConsultCta";
import { HeaderSearch } from "@/components/common/HeaderSearch";
import { SiteFooter } from "@/components/common/SiteFooter";
import { SkeletonList, SkeletonText } from "@/components/common/Skeleton";
import { TrackedLink } from "@/components/common/TrackedLink";
import { CONSENT_ATTR } from "@/lib/consent";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
const render = (ui: ReactNode) => act(() => root.render(ui));
const $ = <T extends Element = HTMLElement>(sel: string) => container.querySelector<T>(sel);
const $$ = (sel: string) => [...container.querySelectorAll<HTMLElement>(sel)];
const events = () => (window.dataLayer ?? []).filter((e) => typeof (e as { event?: unknown }).event === "string");

/** 링크 클릭 — jsdom 은 이동을 구현하지 않으므로 기본 동작은 막는다 */
function click(el: Element | null) {
  if (!el) throw new Error("요소 없음");
  const ev = new MouseEvent("click", { bubbles: true, cancelable: true });
  el.addEventListener("click", (e) => e.preventDefault(), { once: true });
  act(() => {
    el.dispatchEvent(ev);
  });
}

function type(input: HTMLInputElement, value: string) {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
function key(input: HTMLElement, k: string) {
  act(() => {
    input.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  });
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  delete window.dataLayer;
  localStorage.clear();
  document.documentElement.removeAttribute(CONSENT_ATTR);
  vi.stubEnv("RS_PREVIEW", "1"); // 아직 없는 화면(상담 폼 등)도 링크로 그린다
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllEnvs();
});

describe("TrackedLink", () => {
  it("클릭 시 track + data-track, 내부 경로는 next/link, 외부는 <a>", () => {
    const onClick = vi.fn();
    render(
      <>
        <TrackedLink href="/consult/" event="click_cta" params={{ location: "hero" }} onClick={onClick}>
          상담
        </TrackedLink>
        <TrackedLink href="tel:0200000000" event="phone_click" params={{ clinic_id: "c", page: "clinic" }}>
          전화
        </TrackedLink>
      </>,
    );
    const [inner, outer] = $$("a");
    expect(inner!.getAttribute("data-track")).toBe("click_cta");
    click(inner!);
    click(outer!);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(events()).toEqual([
      { event: "click_cta", location: "hero" },
      { event: "phone_click", clinic_id: "c", page: "clinic" },
    ]);
  });
});

describe("ConsultCta (3절 상담 예약 CTA 블록)", () => {
  it("제목·혜택·버튼, location·procedure_id 를 이벤트와 링크에 싣는다", () => {
    render(<ConsultCta location="mid" procedureId="double-eyelid" title="이 시술 상담 가능한 병원 보기" />);
    expect($("h2")?.textContent).toBe("이 시술 상담 가능한 병원 보기");
    expect($("p")?.textContent).toContain("영업일 기준 1일");
    const a = $<HTMLAnchorElement>("a")!;
    expect(a.getAttribute("href")).toBe("/consult/?procedure_id=double-eyelid");
    click(a);
    expect(events()).toEqual([{ event: "click_cta", location: "mid", procedure_id: "double-eyelid" }]);
  });

  it("상담 폼이 아직 없으면 그리지 않는다(깨진 CTA 금지)", () => {
    vi.stubEnv("RS_PREVIEW", "");
    render(<ConsultCta location="bottom" />);
    expect(container.innerHTML).toBe("");
  });
});

describe("BottomBar (3절 모바일 하단 고정 바)", () => {
  const partner = { id: "danhaneul", phone: "02-000-0000", kakao_url: "https://pf.kakao.com/_x", is_partner: true };

  it("제휴 병원: 전화·카톡·상담 3개, 버튼마다 별도 이벤트", () => {
    render(<BottomBar page="clinic" procedureId="double-eyelid" clinic={partner} />);
    const links = $$("[data-testid=bottom-bar] a");
    expect(links.map((a) => a.textContent)).toEqual(["전화", "카카오톡 상담", "무료 상담 예약"]);
    expect(links[0]!.getAttribute("href")).toBe("tel:020000000");
    expect(links[1]!.getAttribute("target")).toBe("_blank");
    expect(links[2]!.getAttribute("href")).toBe("/consult/?procedure_id=double-eyelid&clinic_id=danhaneul");
    links.forEach(click);
    expect(events()).toEqual([
      { event: "phone_click", clinic_id: "danhaneul", page: "clinic" },
      { event: "kakao_click", clinic_id: "danhaneul", page: "clinic" },
      { event: "click_cta", location: "bottom_bar", procedure_id: "double-eyelid" },
    ]);
  });

  it("비제휴 병원·시술 페이지: 전화·카톡 없이 상담만(8절 폴백)", () => {
    render(<BottomBar page="procedure" procedureId="x" clinic={{ ...partner, is_partner: false }} />);
    expect($$("a").map((a) => a.textContent)).toEqual(["무료 상담 예약"]);
  });

  it("보여 줄 버튼이 하나도 없으면 그리지 않는다", () => {
    vi.stubEnv("RS_PREVIEW", "");
    render(<BottomBar page="procedure" />);
    expect(container.innerHTML).toBe("");
  });
});

describe("HeaderSearch (3절 시술명 자동완성)", () => {
  const items = [
    { id: "double-eyelid", name: "쌍꺼풀 수술", slug: "쌍꺼풀-수술", category: "눈" },
    { id: "ptosis-correction", name: "눈매교정", slug: "눈매교정", category: "눈" },
    { id: "rhinoplasty", name: "코 성형", slug: "코-성형", category: "코" },
  ];

  it("입력 → 목록, ↓ 로 선택, Enter → search 이벤트·P-03 경로", () => {
    render(<HeaderSearch items={items} />);
    const input = $<HTMLInputElement>("input[role=combobox]")!;
    act(() => input.focus());
    type(input, "눈");
    expect(input.getAttribute("aria-expanded")).toBe("true");
    const options = $$("[role=option]");
    expect(options.map((o) => o.textContent)).toEqual(["눈매교정눈", "쌍꺼풀 수술눈"]);
    expect(options[1]!.getAttribute("href")).toBe("/procedures/쌍꺼풀-수술/");
    key(input, "ArrowDown");
    key(input, "ArrowDown");
    expect(input.getAttribute("aria-activedescendant")).toBe(options[1]!.id);
    key(input, "ArrowDown"); // 끝에서 처음으로
    expect(input.getAttribute("aria-activedescendant")).toBe(options[0]!.id);
    key(input, "ArrowUp"); // 처음에서 끝으로
    expect(input.getAttribute("aria-activedescendant")).toBe(options[1]!.id);
    options[1]!.addEventListener("click", (e) => e.preventDefault(), { once: true });
    act(() => {
      $<HTMLFormElement>("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    expect(events()).toEqual([{ event: "search", search_term: "눈" }]);
  });

  it("결과 없음 안내, Esc 로 닫고 한 번 더 누르면 지운다", () => {
    render(<HeaderSearch items={items} />);
    const input = $<HTMLInputElement>("input")!;
    act(() => input.focus());
    type(input, "없는시술");
    expect($("[role=status]")?.textContent).toContain("일치하는 시술이 없습니다");
    act(() => {
      $<HTMLFormElement>("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    expect(events()).toEqual([]);
    key(input, "ArrowDown"); // 결과가 없으면 이동 없음
    key(input, "Escape");
    expect(input.getAttribute("aria-expanded")).toBe("false");
    key(input, "Escape");
    expect(input.value).toBe("");
    act(() => input.blur());
  });
});

describe("ConsentBanner (3절 쿠키·동의 배너)", () => {
  it("토글 → 선택 저장 → consent update, 저장된 선택은 다시 열 때 복원", () => {
    render(<ConsentBanner privacyHref="/privacy/" />);
    const [analytics, ads] = $$("[role=switch]");
    expect(analytics!.getAttribute("aria-checked")).toBe("false");
    act(() => analytics!.click());
    expect(analytics!.getAttribute("aria-checked")).toBe("true");
    act(() => $("[data-testid=consent-save]")!.click());
    expect(document.documentElement.getAttribute(CONSENT_ATTR)).toBe("set");
    expect(JSON.parse(localStorage.getItem("rs_consent")!)).toMatchObject({ analytics: true, ads: false });
    expect(ads!.getAttribute("aria-checked")).toBe("false");
    expect($("a")?.getAttribute("href")).toBe("/privacy/");

    act(() => root.unmount());
    root = createRoot(container);
    render(<ConsentBanner />);
    expect($$("[role=switch]").map((s) => s.getAttribute("aria-checked"))).toEqual(["true", "false"]);
    expect($("a")).toBeNull();
  });

  it("모두 동의 → 두 토글 모두 켜짐", () => {
    render(<ConsentBanner />);
    act(() => $("[data-testid=consent-accept-all]")!.click());
    expect($$("[role=switch]").map((s) => s.getAttribute("aria-checked"))).toEqual(["true", "true"]);
    expect(JSON.parse(localStorage.getItem("rs_consent")!)).toMatchObject({ analytics: true, ads: true });
  });
});

describe("Skeleton·Breadcrumb·SiteFooter", () => {
  it("스켈레톤은 role=status·aria-busy 와 읽을 문구를 가진다", () => {
    render(
      <>
        <SkeletonList count={2} />
        <SkeletonText lines={2} label="본문을 불러오는 중입니다" />
      </>,
    );
    expect($("[data-testid=skeleton-list]")?.getAttribute("aria-busy")).toBe("true");
    expect($$("[data-testid=skeleton-list] > div")).toHaveLength(2);
    expect($("[data-testid=skeleton-text]")?.textContent).toBe("본문을 불러오는 중입니다");
  });

  it("브레드크럼: 마지막은 aria-current, JSON-LD 는 링크 있는 단계만 item", () => {
    render(<Breadcrumb items={[{ name: "홈", href: "/" }, { name: "눈" }, { name: "쌍꺼풀 수술", href: "/x/" }]} />);
    expect($$("li").map((l) => l.textContent)).toEqual(["홈", "눈", "쌍꺼풀 수술"]);
    expect($("[aria-current=page]")?.textContent).toBe("쌍꺼풀 수술");
    const ld = JSON.parse($("script")!.textContent!);
    expect(ld.itemListElement.map((i: { item?: string }) => i.item ?? null)).toEqual([expect.stringMatching(/\/$/), null, null]);
    expect(breadcrumbJsonLd([{ name: "쌍꺼풀 수술", href: "/procedures/쌍꺼풀-수술/" }], "https://a.kr").itemListElement[0]).toEqual({
      "@type": "ListItem",
      position: 1,
      name: "쌍꺼풀 수술",
      item: "https://a.kr/procedures/%EC%8C%8D%EA%BA%BC%ED%92%80-%EC%88%98%EC%88%A0/",
    });
  });

  it("푸터: 면책 문구·운영 시간·사업자 정보, minimal 은 링크 없음", () => {
    render(<SiteFooter />);
    expect($("[data-testid=medical-disclaimer]")?.textContent).toBe("본 정보는 의료 조언이 아니며 진단·치료는 의료진 상담 필요");
    expect($("[data-testid=footer-info]")?.textContent).toContain("평일 10:00–18:00");
    expect($$("a").map((a) => a.textContent)).toEqual(["이용약관", "개인정보처리방침"]);
    act(() => root.render(<SiteFooter variant="minimal" />));
    expect($$("a")).toHaveLength(0);
  });
});
