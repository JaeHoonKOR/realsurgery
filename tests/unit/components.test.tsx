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
import { AffiliateItems } from "@/components/procedure/AffiliateItems";
import { ClinicPriceTable } from "@/components/procedure/ClinicPriceTable";
import { FaqAccordion } from "@/components/procedure/FaqAccordion";
import { GuideBody } from "@/components/procedure/GuideBody";
import { GuideMeta } from "@/components/procedure/GuideMeta";
import { GuideToc } from "@/components/procedure/GuideToc";
import { ProcedureSummary } from "@/components/procedure/ProcedureSummary";
import { ScrollDepthTracker, ViewProcedureTracker } from "@/components/procedure/ProcedureTrackers";
import { RelatedProcedures } from "@/components/procedure/RelatedProcedures";
import { CONSENT_ATTR } from "@/lib/consent";
import { loadContent } from "@/lib/content";
import { clinicPriceRows, relatedProcedures, summaryCells, tocItems } from "@/lib/procedure";

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

  it("낮은 화면용 접기: 항목 설정 버튼이 토글 영역을 열고 닫고, 상태를 data 속성으로 알린다", () => {
    render(<ConsentBanner />);
    const banner = $("[data-testid=consent-banner]")!;
    const disclosure = $("[data-testid=consent-disclosure]")!;
    expect(disclosure.getAttribute("aria-expanded")).toBe("false");
    expect(document.getElementById(disclosure.getAttribute("aria-controls")!)?.querySelectorAll("[role=switch]")).toHaveLength(2);
    expect(banner.hasAttribute("data-expanded")).toBe(false);
    expect(banner.hasAttribute("data-any-on")).toBe(false);
    // 접힌 상태 + 모두 꺼짐이면 CSS 가 "동의 안 함" 라벨을 보여 준다(두 라벨 모두 DOM 에 있음)
    expect($("[data-testid=consent-save]")?.textContent).toBe("선택 저장동의 안 함");
    act(() => disclosure.click());
    expect(disclosure.getAttribute("aria-expanded")).toBe("true");
    expect(disclosure.textContent).toBe("설정 접기");
    expect(banner.hasAttribute("data-expanded")).toBe(true);
    act(() => $$("[role=switch]")[0]!.click());
    expect(banner.hasAttribute("data-any-on")).toBe(true);
    // 끝 표시가 마지막 자식 — CSS 는 이것이 파싱된 뒤에만 배너를 그린다(CLS 방지)
    expect(banner.lastElementChild?.hasAttribute("data-consent-end")).toBe(true);
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

describe("P-03 시술 상세 컴포넌트 (4절 P-03 이벤트)", () => {
  const content = loadContent();
  const p = content.procedures.find((x) => x.id === "double-eyelid")!;

  it("view_procedure: 로드 시 1회(다시 그려도 1회)", () => {
    const ui = <ViewProcedureTracker procedure_id={p.id} procedure_name={p.name} category={p.category_id} />;
    render(ui);
    render(ui);
    expect(events()).toEqual([{ event: "view_procedure", procedure_id: "double-eyelid", procedure_name: "쌍꺼풀 수술", category: "eye" }]);
  });

  it("scroll_depth: 넘은 구간마다 1회, 프레임당 한 번 계산, 해제 시 리스너 제거", () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => frames.push(cb));
    vi.stubGlobal("cancelAnimationFrame", () => {});
    Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 4000 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
    const scrollTo = (y: number) => {
      Object.defineProperty(window, "scrollY", { configurable: true, value: y });
      window.dispatchEvent(new Event("scroll"));
      window.dispatchEvent(new Event("scroll")); // 같은 프레임 두 번째는 무시
      act(() => frames.splice(0).forEach((f) => f(0)));
    };
    render(<ScrollDepthTracker pageType="procedure" />);
    scrollTo(1300); // 52.5%
    scrollTo(1300);
    scrollTo(3200); // 끝
    expect(events()).toEqual([
      { event: "scroll_depth", percent: 25, page_type: "procedure" },
      { event: "scroll_depth", percent: 50, page_type: "procedure" },
      { event: "scroll_depth", percent: 75, page_type: "procedure" },
      { event: "scroll_depth", percent: 100, page_type: "procedure" },
    ]);
    act(() => root.unmount());
    root = createRoot(container);
    scrollTo(0);
    expect(events()).toHaveLength(4);
    vi.unstubAllGlobals();
  });

  it("FAQ 아코디언: 열 때만 expand_faq(question_index 1부터), 답변은 처음부터 DOM 에", () => {
    render(<FaqAccordion procedureId={p.id} faqs={p.faqs} />);
    const details = $$("details") as HTMLDetailsElement[];
    expect(details).toHaveLength(5);
    expect(details[1]!.querySelector("p")?.textContent).toBe(p.faqs[1]!.answer);
    expect(details[0]!.querySelector("summary")?.getAttribute("data-track")).toBe("expand_faq");
    act(() => {
      details[1]!.open = true;
      details[1]!.dispatchEvent(new Event("toggle"));
    });
    act(() => {
      details[1]!.open = false;
      details[1]!.dispatchEvent(new Event("toggle"));
    });
    expect(events()).toEqual([{ event: "expand_faq", procedure_id: "double-eyelid", question_index: 2 }]);
  });

  it("가격 비교 표: 병원명 → P-05 링크 + select_clinic(from=procedure), 예시 데이터 안내, 빈 상태", () => {
    render(<ClinicPriceTable id="prices" title="가격" rows={clinicPriceRows(content.clinics, p.id)} />);
    const links = $$("[data-testid=procedure-prices] a");
    expect(links.map((a) => a.textContent)).toEqual(["새솔결의원", "단하늘성형외과"]);
    expect(links[0]!.getAttribute("href")).toBe("/clinics/새솔결의원/");
    click(links[0]!);
    expect(events()).toEqual([{ event: "select_clinic", clinic_id: "saesolgyeol", from: "procedure" }]);
    expect($("[data-testid=procedure-prices-demo]")?.textContent).toContain("병원명과 가격은");
    // 예시(가상) 병원이면 "병원이 공개한 가격"이라고 쓰지 않는다(리뷰 T-103 r1 반려 3 — 근거 없는 출처 귀속 금지)
    expect($("[data-testid=procedure-prices]")?.textContent).not.toContain("병원이 공개한");
    expect($("td")?.textContent).toContain("2026.10.05 기준");

    vi.stubEnv("RS_PREVIEW", ""); // 병원 상세(P-05)가 아직 없으면 링크 없이 이름만
    act(() => root.render(<ClinicPriceTable id="prices" title="가격" rows={clinicPriceRows(content.clinics, p.id)} />));
    expect($$("[data-testid=procedure-prices] a")).toHaveLength(0);
    expect($("tbody")?.textContent).toContain("새솔결의원");

    const real = clinicPriceRows(content.clinics, p.id).map((r) => ({ ...r, clinic: { ...r.clinic, is_demo: false } }));
    act(() => root.render(<ClinicPriceTable id="prices" title="가격" rows={real} />));
    expect($("[data-testid=procedure-prices]")?.textContent).toContain("병원이 공개한 가격 기준");
    expect($("[data-testid=procedure-prices-demo]")).toBeNull();

    act(() => root.render(<ClinicPriceTable id="prices" title="가격" rows={[]} />));
    expect($("[data-testid=procedure-prices-empty]")?.textContent).toContain("병원별 가격 정보가 없습니다");
    expect($("table")).toBeNull();
  });

  it("회복기 추천템: 광고 표기·sponsored 새 창·click_affiliate, 상품이 없으면 그리지 않음", () => {
    const items = [{ id: "cold-pack", name: "냉찜질 팩", url: "https://link.coupang.com/a/x", image: null, order: 1 }];
    render(<AffiliateItems procedureId={p.id} items={items} />);
    expect($("[data-testid=procedure-affiliates]")?.textContent).toContain("광고");
    expect($("[data-testid=procedure-affiliates]")?.textContent).toContain("쿠팡 파트너스");
    const a = $<HTMLAnchorElement>("a")!;
    expect(a.getAttribute("rel")).toBe("sponsored noopener noreferrer");
    expect(a.getAttribute("target")).toBe("_blank");
    click(a);
    expect(events()).toEqual([{ event: "click_affiliate", item_id: "cold-pack", procedure_id: "double-eyelid" }]);
    act(() => root.render(<AffiliateItems procedureId={p.id} items={[]} />));
    expect(container.innerHTML).toBe("");
  });

  it("관련 시술 카드 4개: select_procedure(from_page=procedure), 화면이 없으면 숨김", () => {
    const related = relatedProcedures(content.procedures, p);
    const name = (id: string) => content.categories.find((c) => c.id === id)?.name;
    render(<RelatedProcedures items={related} categoryName={name} />);
    const cards = $$("[data-testid=procedure-related] a");
    expect(cards).toHaveLength(4);
    expect(cards[0]!.getAttribute("href")).toBe("/procedures/눈매교정/");
    expect(cards[0]!.textContent).toContain("60만~350만 원");
    click(cards[0]!);
    expect(events()).toEqual([{ event: "select_procedure", procedure_id: "ptosis-correction", from_page: "procedure" }]);
    act(() => root.render(<RelatedProcedures items={[]} categoryName={name} />));
    expect(container.innerHTML).toBe("");
  });

  it("요약 박스·목차·메타: 4칸 값, H2 앵커 목록, 의료 자문 미정 표기와 출처 번호", () => {
    render(
      <>
        <ProcedureSummary name={p.name} category="눈" summary={p.summary} cells={summaryCells(p)} updatedLabel="2026.10.24" updatedIso={p.updated_at} authorName="리얼성형 편집팀" />
        <GuideToc items={tocItems(p, { prices: true, faq: true })} />
        <GuideMeta author={content.authors[0]} reviewer={undefined} updatedLabel="2026.10.24" updatedIso={p.updated_at} sources={p.sources} />
      </>,
    );
    expect($("h1")?.textContent).toBe("쌍꺼풀 수술");
    expect($$("[data-fact-value]").map((e) => e.textContent)).toEqual(["50만~250만 원", "약 1시간", "약 7일", "국소 마취 (수면 마취 병행 가능)"]);
    expect($$("[data-testid=procedure-toc] a").map((a) => a.getAttribute("href"))).toHaveLength(7);
    expect($("[data-testid=procedure-reviewer]")?.textContent).toContain("자문의 검토 전");
    expect($$("[data-testid=procedure-sources] li").map((li) => li.id)).toEqual(["source-1", "source-2", "source-3"]);
    act(() =>
      root.render(<GuideMeta author={undefined} reviewer={{ id: "dr", name: "김자문", role: "성형외과 전문의" }} updatedLabel="x" updatedIso="x" sources={[]} />),
    );
    expect($("[data-testid=procedure-reviewer]")?.textContent).toBe("김자문 (성형외과 전문의)");
  });

  it("MDX 본문: H2 앵커 5개·[n] 각주 sup·표 스크롤 영역, 물결표는 취소선이 되지 않는다", async () => {
    const el = await GuideBody({ body: p.guide!.body, sectionIds: p.guide!.sections.map((s) => s.id) });
    render(el);
    expect($$("h2").map((h) => h.id)).toEqual(["guide-who", "guide-cost", "guide-recovery", "guide-risks", "guide-compare"]);
    expect($$("sup[data-cite]").length).toBeGreaterThanOrEqual(5);
    expect($("sup[data-cite]")?.textContent).toBe("⁠[1]");
    expect($("del")).toBeNull();
    expect($("[data-testid=procedure-body]")?.textContent).toContain("50만~150만 원");
    const region = $("[role=region]")!;
    expect(region.getAttribute("tabindex")).toBe("0");
    expect(region.querySelector("table th")?.getAttribute("scope")).toBe("col");
  });
});
