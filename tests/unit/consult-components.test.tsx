// @vitest-environment jsdom
// P-06 폼·P-07 완료 화면 이벤트 단위 검증 (pipelines/02-tracking VERIFY: "정확한 event·params 1회 push (중복 0)")
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const router = { push: vi.fn(), replace: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router, usePathname: () => "/consult/" }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { ConsultForm } from "@/components/consult/ConsultForm";
import { DoneView } from "@/components/consult/DoneView";
import { TrustNotes } from "@/components/consult/TrustNotes";
import type { ProcedureOption } from "@/components/consult/types";
import { DUPLICATE_STORAGE_KEY } from "@/lib/consult/duplicate";
import { LEAD_SESSION_KEY, LEAD_TRACKED_KEY, resetLeadConversionMemory } from "@/lib/consult/lead";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const PROCEDURES: ProcedureOption[] = [
  { id: "double-eyelid", name: "쌍꺼풀 수술", category_id: "eye", category_name: "눈", price_label: "50만~250만 원" },
  { id: "rhinoplasty", name: "코 성형", category_id: "nose", category_name: "코", price_label: "100만~600만 원" },
];
const CLINICS = [{ id: "danhaneul", name: "단하늘성형외과", region: "서울 강남구" }];

let container: HTMLDivElement;
let root: Root;
const render = (ui: ReactNode) => act(() => root.render(ui));
const $ = <T extends Element = HTMLElement>(sel: string) => container.querySelector<T>(sel);
const events = (name?: string) =>
  (window.dataLayer ?? []).filter((e) => {
    const ev = (e as { event?: unknown }).event;
    return typeof ev === "string" && (!name || ev === name);
  }) as Record<string, unknown>[];

function click(el: Element | null) {
  if (!el) throw new Error("요소 없음");
  act(() => {
    (el as HTMLElement).click();
  });
}
function type(el: HTMLInputElement | HTMLTextAreaElement | null, value: string) {
  if (!el) throw new Error("입력 없음");
  act(() => {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
const radio = (name: string, value: string) => $<HTMLInputElement>(`input[name="${name}"][value="${value}"]`);
const submitBtn = () => $<HTMLButtonElement>('[data-testid="consult-submit"]');

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  window.scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
  window.history.replaceState(null, "", "/consult/?procedure_id=double-eyelid&clinic_id=danhaneul");
  localStorage.clear();
  sessionStorage.clear();
  resetLeadConversionMemory();
  router.push.mockReset();
  router.replace.mockReset();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  delete window.dataLayer;
  vi.useRealTimers();
});

describe("P-06 상담 폼", () => {
  it("쿼리 선입력: 시술·병원, 병원 지역으로 희망 지역", async () => {
    await render(<ConsultForm procedures={PROCEDURES} clinics={CLINICS} />);
    expect($('[data-testid="consult-procedure-trigger"]')?.textContent).toContain("쌍꺼풀 수술");
    expect($('[data-testid="consult-clinic"]')?.textContent).toContain("단하늘성형외과");
    expect(radio("region", "gangnam-seocho")?.checked).toBe(true);
    // 선입력만으로는 form_start 가 나가지 않는다(사용자 입력 아님)
    expect(events("form_start")).toHaveLength(0);
  });

  it("목록에 없는 쿼리 값은 무시", async () => {
    window.history.replaceState(null, "", "/consult/?procedure_id=nope&clinic_id=nope");
    await render(<ConsultForm procedures={PROCEDURES} clinics={CLINICS} />);
    expect($('[data-testid="consult-procedure-trigger"]')?.textContent).toContain("시술을 선택해 주세요");
    expect($('[data-testid="consult-clinic"]')).toBeNull();
  });

  it("1단계: 빈 값으로 다음 → 필드별 오류(aria-invalid·describedby), 단계 유지", async () => {
    window.history.replaceState(null, "", "/consult/");
    await render(<ConsultForm procedures={PROCEDURES} clinics={CLINICS} />);
    click(submitBtn());
    const region = $('[data-testid="consult-region"]');
    expect(region?.getAttribute("aria-invalid")).toBe("true");
    expect(region?.getAttribute("aria-describedby")).toContain("region-error");
    expect($("#region-error")?.textContent).toContain("희망 지역이 선택되지 않았으니");
    expect($('[data-testid="consult-procedure"]')?.textContent).toContain("관심 시술이 선택되지 않았으니");
    expect($('[data-testid="consult-step1"]')).not.toBeNull();
    expect(events("form_step2")).toHaveLength(0);
    // 고치면 그 필드 오류가 바로 사라진다
    click(radio("region", "seoul-etc"));
    expect($("#region-error")).toBeNull();
  });

  it("form_start 는 첫 입력에 1회, form_step2 는 2단계 진입 1회(이전·다음 반복해도)", async () => {
    await render(<ConsultForm procedures={PROCEDURES} clinics={CLINICS} />);
    click(radio("region", "seoul-etc"));
    click(radio("timing", "within_1m"));
    expect(events("form_start")).toEqual([
      { event: "form_start", procedure_id: "double-eyelid", clinic_id: "danhaneul", source_page: "direct" },
    ]);
    click(submitBtn());
    expect($('[data-testid="consult-step2"]')).not.toBeNull();
    expect(events("form_step2")).toEqual([
      { event: "form_step2", procedure_id: "double-eyelid", clinic_id: "danhaneul", source_page: "direct" },
    ]);
    // 이전 → 값 유지 → 다시 다음
    click($('[data-testid="consult-back"]'));
    expect($('[data-testid="consult-step1"]')).not.toBeNull();
    expect(radio("region", "seoul-etc")?.checked).toBe(true);
    expect(radio("timing", "within_1m")?.checked).toBe(true);
    click(submitBtn());
    expect(events("form_step2")).toHaveLength(1);
    expect(events("form_start")).toHaveLength(1);
  });

  it("2단계: 휴대폰 자동 하이픈, 잘못된 번호·동의 누락 오류, 정상 제출 → 세션 저장·완료 화면 이동, generate_lead 없음", async () => {
    await render(<ConsultForm procedures={PROCEDURES} clinics={CLINICS} />);
    click(radio("timing", "within_3m"));
    click(submitBtn());

    const phone = $<HTMLInputElement>("#consult-phone");
    type($<HTMLInputElement>("#consult-name"), "김지은");
    type(phone, "0101234");
    expect(phone?.value).toBe("010-1234");
    click(submitBtn());
    expect(phone?.getAttribute("aria-invalid")).toBe("true");
    expect(phone?.getAttribute("aria-describedby")).toBe("phone-error");
    expect($("#phone-error")?.textContent).toContain("자릿수가 모자라니");
    expect($("#contact_time-error")).not.toBeNull();
    expect($("#consent_privacy-error")).not.toBeNull();

    type(phone, "01012345678");
    expect(phone?.value).toBe("010-1234-5678");
    click(radio("contact_time", "evening"));
    type($<HTMLTextAreaElement>("#consult-memo"), "회복 기간이 궁금합니다.");
    expect(container.textContent).toContain("13/500");
    click($('[data-testid="consent-all"]'));
    expect($<HTMLInputElement>('[data-testid="consent_marketing"]')?.checked).toBe(true);

    vi.useFakeTimers();
    click(submitBtn());
    expect(submitBtn()?.disabled).toBe(true);
    expect(submitBtn()?.textContent).toContain("접수하고 있어요");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    expect(router.push).toHaveBeenCalledWith("/consult/done/");
    const lead = JSON.parse(sessionStorage.getItem(LEAD_SESSION_KEY) ?? "{}");
    expect(lead).toMatchObject({ procedure_id: "double-eyelid", clinic_id: "danhaneul", procedure_name: "쌍꺼풀 수술" });
    expect(localStorage.getItem(DUPLICATE_STORAGE_KEY)).not.toBeNull();
    expect(events("generate_lead")).toHaveLength(0);
  });

  it("같은 번호 5분 안 재제출은 안내 문구로 막는다(서버 호출 없음)", async () => {
    await render(<ConsultForm procedures={PROCEDURES} clinics={CLINICS} />);
    click(radio("timing", "undecided"));
    click(submitBtn());
    type($<HTMLInputElement>("#consult-name"), "김지은");
    type($<HTMLInputElement>("#consult-phone"), "01012345678");
    click(radio("contact_time", "anytime"));
    click($('[data-testid="consent_privacy"]'));
    click($('[data-testid="consent_sensitive"]'));
    localStorage.setItem(DUPLICATE_STORAGE_KEY, JSON.stringify({}));
    const { recordSubmission } = await import("@/lib/consult/duplicate");
    recordSubmission("010-1234-5678");
    click(submitBtn());
    const alert = $('[data-testid="consult-submit-error"]');
    expect(alert?.getAttribute("role")).toBe("alert");
    expect(alert?.textContent).toContain("중복 접수를 막았으니");
    expect(router.push).not.toHaveBeenCalled();
  });

  /** 1단계를 통과해 2단계(연락처)에 연락처까지 채운 상태 */
  async function toStep2Filled(mode?: "live" | "demo") {
    await render(<ConsultForm procedures={PROCEDURES} clinics={CLINICS} mode={mode} />);
    click(radio("timing", "within_1m"));
    click(submitBtn());
    type($<HTMLInputElement>("#consult-name"), "박서연");
    type($<HTMLInputElement>("#consult-phone"), "01055556666");
    click(radio("contact_time", "morning"));
  }

  it("동의 4종: 필수 2(개인정보·민감정보) + 선택 2(제3자 제공·마케팅), 항목마다 거부 시 불이익, 전체 동의는 4개 모두", async () => {
    await toStep2Filled();
    const keys = ["consent_privacy", "consent_sensitive", "consent_3rd", "consent_marketing"];
    const boxes = keys.map((k) => $<HTMLInputElement>(`[data-testid="${k}"]`));
    expect(boxes.map((b) => b?.required)).toEqual([true, true, false, false]);
    const labels = boxes.map((b) => b?.closest("label")?.textContent ?? "");
    expect(labels[0]).toContain("[필수]");
    expect(labels[1]).toBe("[필수]민감정보(관심 시술) 처리 동의");
    expect(labels[2]).toContain("[선택]");
    expect(labels[3]).toContain("[선택]");
    for (const k of keys) expect($(`#${k}-detail`)?.textContent).toContain("거부 시 불이익");
    // 민감정보 내용 보기: 항목·목적·보유 기간·거부 시 불이익을 펼친다
    const toggle = $<HTMLButtonElement>('[aria-controls="consent_sensitive-detail"]');
    expect($("#consent_sensitive-detail")?.hidden).toBe(true);
    click(toggle);
    expect(toggle?.getAttribute("aria-expanded")).toBe("true");
    const detail = $("#consent_sensitive-detail")?.textContent ?? "";
    for (const t of ["처리 항목", "관심 시술", "처리 목적", "보유 기간", "거부 시 불이익", "제23조"]) expect(detail).toContain(t);

    click($('[data-testid="consent-all"]'));
    expect(boxes.every((b) => b?.checked)).toBe(true);
    click($('[data-testid="consent-all"]'));
    expect(boxes.some((b) => b?.checked)).toBe(false);
  });

  it("민감정보 동의가 빠지면 그 항목에 오류·포커스, 제3자 제공 없이도 제출된다(선택)", async () => {
    await toStep2Filled();
    click($('[data-testid="consent_privacy"]'));
    click(submitBtn());
    const sensitive = $<HTMLInputElement>('[data-testid="consent_sensitive"]');
    expect($("#consent_sensitive-error")?.textContent).toContain("민감정보(관심 시술) 처리 동의가 빠져 있으니");
    expect(sensitive?.getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(sensitive);
    expect($("#consent_3rd-error")).toBeNull();

    click(sensitive);
    expect($("#consent_sensitive-error")).toBeNull();
    expect($<HTMLInputElement>('[data-testid="consent_3rd"]')?.checked).toBe(false);
    vi.useFakeTimers();
    click(submitBtn());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    expect(router.push).toHaveBeenCalledWith("/consult/done/");
    const mock = JSON.parse(localStorage.getItem("rs_mock_leads") ?? "[]") as { consent_3rd: boolean }[];
    expect(mock.at(-1)?.consent_3rd).toBe(false);
  });

  it("제출 버튼은 '상담 신청하기', 폼 이름은 '시술 상담 신청'", async () => {
    await toStep2Filled();
    expect(submitBtn()?.textContent).toBe("상담 신청하기");
    expect($("form")?.getAttribute("aria-label")).toBe("시술 상담 신청");
  });

  it("시연 모드: 1·2단계 모두 제출 영역 바로 위에 시연 안내, 실서비스 모드에는 없음", async () => {
    const notice = () => $('[data-testid="consult-demo-notice"]');
    await render(<ConsultForm procedures={PROCEDURES} clinics={CLINICS} mode="demo" />);
    expect(notice()?.textContent).toBe("포트폴리오 시연용 화면입니다. 입력한 정보는 서버로 전송되지 않고 이 브라우저에만 저장됩니다.");
    expect(notice()?.getAttribute("role")).toBe("note");
    expect(notice()?.nextElementSibling?.getAttribute("data-testid")).toBe("consult-actions");
    click(radio("timing", "within_1m"));
    click(submitBtn());
    expect($('[data-testid="consult-step2"]')).not.toBeNull();
    expect(notice()?.nextElementSibling?.getAttribute("data-testid")).toBe("consult-actions");

    act(() => root.unmount());
    root = createRoot(container);
    await render(<ConsultForm procedures={PROCEDURES} clinics={CLINICS} mode="live" />);
    expect(notice()).toBeNull();
    act(() => root.unmount());
    root = createRoot(container);
    await render(<ConsultForm procedures={PROCEDURES} clinics={CLINICS} />);
    expect(notice()).toBeNull(); // 기본은 live
  });
});

describe("상담 폼 신뢰 안내", () => {
  it("실서비스: 영업일 1일 내 연락 / 시연: 연락·서버 저장을 약속하지 않는다, 버튼·제목에 '무료' 없음", async () => {
    await render(<TrustNotes mode="live" />);
    expect(container.textContent).toContain("영업일 기준 1일 안에 연락드려요");
    expect(container.textContent).toContain("신청 비용은 들지 않아요");
    expect(container.textContent).not.toContain("무료");
    await render(<TrustNotes mode="demo" />);
    expect(container.textContent).not.toContain("영업일 기준 1일 안에 연락드려요");
    expect(container.textContent).toContain("시연 화면에서는 연락드리지 않아요");
    expect(container.textContent).toContain("서버에 저장하지 않아요");
  });
});

describe("P-07 완료 화면", () => {
  const SESSION = {
    lead_id: "7f3a9c2e-1b4d-4e5f-8a6b-0c1d2e3f4a5b",
    procedure_id: "double-eyelid",
    clinic_id: null,
    procedure_name: "쌍꺼풀 수술",
    created_at: "2026-10-26T05:32:00.000Z",
  };
  const view = () => <DoneView related={{}} fallback={[]} />;

  it("세션이 없으면 메인으로(직접 접근 차단), 전환 없음", async () => {
    await render(view());
    expect(router.replace).toHaveBeenCalledWith("/");
    expect($('[data-testid="consult-done"]')).toBeNull();
    expect(events("generate_lead")).toHaveLength(0);
  });

  it("접수번호 표시 + generate_lead 1회, 다시 마운트(새로고침)해도 1회", async () => {
    sessionStorage.setItem(LEAD_SESSION_KEY, JSON.stringify(SESSION));
    await render(view());
    expect($('[data-testid="consult-done-number"]')?.textContent).toBe("RS-1026-7F3A");
    expect(events("generate_lead")).toEqual([
      {
        event: "generate_lead",
        lead_id: SESSION.lead_id,
        procedure_id: "double-eyelid",
        value: 50000,
        currency: "KRW",
      },
    ]);
    act(() => root.unmount());
    resetLeadConversionMemory();
    root = createRoot(container);
    await render(view());
    expect(events("generate_lead")).toHaveLength(1);
    expect(JSON.parse(sessionStorage.getItem(LEAD_TRACKED_KEY) ?? "[]")).toEqual([SESSION.lead_id]);
  });

  it("실서비스: 영업일 1일 내 연락 약속 + 전화 안내, 시연 안내 없음", async () => {
    sessionStorage.setItem(LEAD_SESSION_KEY, JSON.stringify(SESSION));
    await render(<DoneView related={{}} fallback={[]} mode="live" />);
    expect($("h1")?.textContent).toBe("상담 신청이 접수됐습니다");
    expect($('[data-testid="consult-done-lead"]')?.textContent).toContain("영업일 기준 1일 안에 연락드립니다.");
    expect($('[data-testid="consult-done-checklist"]')?.textContent).toContain("모르는 번호도 받아 주세요");
    expect($('[data-testid="consult-done-demo-notice"]')).toBeNull();
  });

  it("시연 모드: 연락을 약속하지 않고 시연 안내를 띄운다(접수번호·전환 이벤트는 그대로)", async () => {
    sessionStorage.setItem(LEAD_SESSION_KEY, JSON.stringify(SESSION));
    await render(<DoneView related={{}} fallback={[]} mode="demo" />);
    expect($("h1")?.textContent).toBe("상담 신청이 접수됐습니다");
    const page = container.textContent ?? "";
    expect(page).not.toContain("영업일 기준 1일 안에 연락드립니다");
    expect(page).not.toContain("모르는 번호도 받아 주세요");
    expect(page).not.toContain("전화 상담 때 접수번호를");
    expect($('[data-testid="consult-done-lead"]')?.textContent).toContain("시연 화면이라 실제로 연락드리지 않습니다.");
    expect($('[data-testid="consult-done-demo-notice"]')?.textContent).toBe(
      "포트폴리오 시연용 화면입니다. 입력한 정보는 서버로 전송되지 않고 이 브라우저에만 저장됩니다.",
    );
    expect($('[data-testid="consult-done-checklist"] h2')?.textContent).toBe("상담 전에 준비해 두면 좋아요");
    expect($('[data-testid="consult-done-number"]')?.textContent).toBe("RS-1026-7F3A");
    expect(events("generate_lead")).toHaveLength(1);
  });
});
