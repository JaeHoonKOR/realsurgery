// @vitest-environment jsdom
// P-02·P-03 클라이언트 컴포넌트 이벤트 — expand_faq(질문마다 1회), view_procedure(1회), scroll_depth(기준값마다 1회), select_category
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CardRail } from "@/components/procedure/CardRail";
import { CategoryChips } from "@/components/procedure/CategoryChips";
import { FaqList } from "@/components/procedure/FaqList";
import { ProcedureToc } from "@/components/procedure/ProcedureToc";
import { ProcedureTracker } from "@/components/procedure/ProcedureTracker";
import { ProseMore } from "@/components/procedure/ProseMore";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
const render = (ui: ReactNode) => act(() => root.render(ui));
const events = () => (window.dataLayer ?? []) as { event: string }[];

function setScroll(y: number, viewport: number, docHeight: number) {
  Object.defineProperty(window, "scrollY", { configurable: true, value: y });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: viewport });
  Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: docHeight });
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  delete window.dataLayer;
  // requestAnimationFrame 을 즉시 실행(컴포넌트는 window.requestAnimationFrame 을 부른다)
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

const FAQS = [
  { id: "q1", question: "가격은 얼마인가요?", answer: "50만~250만 원입니다.", order: 1 },
  { id: "q2", question: "회복은 며칠인가요?", answer: "약 7일입니다.", order: 2 },
];

function toggle(details: HTMLDetailsElement, open: boolean) {
  act(() => {
    details.open = open;
    details.dispatchEvent(new Event("toggle"));
  });
}

describe("FaqList (expand_faq)", () => {
  it("답변이 처음부터 HTML 에 있고, 질문마다 처음 열 때 1회만 이벤트", () => {
    render(<FaqList procedureId="double-eyelid" items={FAQS} />);
    const items = [...container.querySelectorAll<HTMLDetailsElement>("details")];
    expect(items).toHaveLength(2);
    expect(container.textContent).toContain("50만~250만 원입니다.");
    toggle(items[1]!, true);
    toggle(items[1]!, false);
    toggle(items[1]!, true);
    toggle(items[0]!, true);
    expect(events()).toEqual([
      { event: "expand_faq", procedure_id: "double-eyelid", question_index: 2 },
      { event: "expand_faq", procedure_id: "double-eyelid", question_index: 1 },
    ]);
  });
});

describe("ProcedureTracker (view_procedure·scroll_depth)", () => {
  it("로드 시 view_procedure 1회, 스크롤 기준값마다 1회", () => {
    setScroll(0, 800, 8000);
    render(<ProcedureTracker procedureId="double-eyelid" procedureName="쌍꺼풀 수술" category="eye" />);
    render(<ProcedureTracker procedureId="double-eyelid" procedureName="쌍꺼풀 수술" category="eye" />);
    expect(events()).toEqual([{ event: "view_procedure", procedure_id: "double-eyelid", procedure_name: "쌍꺼풀 수술", category: "eye" }]);

    setScroll(3200, 800, 8000); // 50%
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    setScroll(3300, 800, 8000);
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    setScroll(7200, 800, 8000); // 끝
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    const depth = events().filter((e) => e.event === "scroll_depth");
    expect(depth).toEqual([
      { event: "scroll_depth", percent: 25, page_type: "procedure" },
      { event: "scroll_depth", percent: 50, page_type: "procedure" },
      { event: "scroll_depth", percent: 75, page_type: "procedure" },
      { event: "scroll_depth", percent: 100, page_type: "procedure" },
    ]);
  });

  it("다른 시술로 이동하면 다시 view_procedure", () => {
    setScroll(0, 800, 8000);
    render(<ProcedureTracker procedureId="a" procedureName="A" category="eye" />);
    render(<ProcedureTracker procedureId="b" procedureName="B" category="nose" />);
    expect(events().map((e) => (e as { procedure_id?: string }).procedure_id)).toEqual(["a", "b"]);
  });
});

describe("ProcedureToc", () => {
  it("앵커 목록, 모바일 접기 버튼, 지나간 섹션을 현재 위치로 표시", () => {
    const a = document.createElement("h2");
    a.id = "who";
    a.getBoundingClientRect = () => ({ top: -200 }) as DOMRect;
    const b = document.createElement("h2");
    b.id = "cost";
    b.getBoundingClientRect = () => ({ top: 600 }) as DOMRect;
    document.body.append(a, b);
    try {
      render(
        <ProcedureToc
          items={[
            { id: "who", label: "누가 받나요" },
            { id: "cost", label: "비용은 얼마인가요" },
          ]}
        />,
      );
      const links = [...container.querySelectorAll("a")];
      expect(links.map((l) => l.getAttribute("href"))).toEqual(["#who", "#cost"]);
      expect(links[0]!.getAttribute("aria-current")).toBe("location");
      expect(links[1]!.hasAttribute("aria-current")).toBe(false);
      const button = container.querySelector("button")!;
      expect(button.getAttribute("aria-expanded")).toBe("false");
      act(() => button.click());
      expect(button.getAttribute("aria-expanded")).toBe("true");
      expect(container.querySelector("ol")!.className).toContain("block");
      act(() => links[1]!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })));
      expect(button.getAttribute("aria-expanded")).toBe("false");
    } finally {
      a.remove();
      b.remove();
    }
  });

  it("항목이 없으면 그리지 않는다", () => {
    render(<ProcedureToc items={[]} />);
    expect(container.innerHTML).toBe("");
  });
});

describe("CategoryChips (select_category)", () => {
  it("부위 앵커 링크, 누르면 select_category", () => {
    render(
      <CategoryChips
        items={[
          { id: "eye", slug: "눈", name: "눈", count: 4, icon: "ic-eye" },
          { id: "nose", slug: "코", name: "코", count: 1, icon: "ic-nose" },
        ]}
      />,
    );
    const links = [...container.querySelectorAll("a")];
    expect(links.map((l) => l.getAttribute("href"))).toEqual(["#눈", "#코"]);
    expect(links[0]!.getAttribute("data-track")).toBe("select_category");
    expect(links[0]!.getAttribute("aria-current")).toBe("location");
    act(() => links[1]!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })));
    expect(events()).toEqual([{ event: "select_category", category: "nose" }]);
  });
});

describe("ProseMore (본문 자세히 보기)", () => {
  it("네이티브 details: 처음엔 접혀 있지만 내용은 HTML 에 있고, 어느 섹션인지 화면낭독기에 알린다", () => {
    render(<ProseMore html="<p>접힌 설명입니다.</p>" topic="누가 받나요" />);
    const details = container.querySelector("details")!;
    expect(details.open).toBe(false);
    expect(details.querySelector(".prose-rs")!.innerHTML).toBe("<p>접힌 설명입니다.</p>");
    const summary = details.querySelector("summary")!;
    expect(summary.textContent).toBe("자세히 보기접기: 누가 받나요");
    expect(summary.querySelector(".sr-only")!.textContent).toBe(": 누가 받나요");
    act(() => {
      details.open = true;
    });
    expect(details.open).toBe(true);
  });

  it("접을 내용이 없으면 그리지 않는다", () => {
    render(<ProseMore html="" topic="x" />);
    expect(container.innerHTML).toBe("");
  });
});

describe("CardRail", () => {
  it("카드마다 li 로 감싸고, 모바일 가로 넘김·sm 그리드 클래스를 붙인다", () => {
    render(
      <CardRail label="비슷한 시술">
        <a href="/a/">A</a>
        <a href="/b/">B</a>
      </CardRail>,
    );
    const ul = container.querySelector("ul")!;
    expect(ul.getAttribute("aria-label")).toBe("비슷한 시술");
    expect(ul.className).toContain("overflow-x-auto");
    expect(ul.className).toContain("sm:grid");
    const items = [...ul.querySelectorAll(":scope > li")];
    expect(items.map((li) => li.textContent)).toEqual(["A", "B"]);
    expect(items.every((li) => li.className.includes("snap-start"))).toBe(true);
  });
});
