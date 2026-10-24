// 요약 박스 수치 ↔ 본문·FAQ 근거 대조 (scripts/fact-support.mjs, 리뷰 T-103 r2 반려 1)
import { describe, expect, it } from "vitest";
import { anesthesiaKinds, clauses, dayValues, durationValues, faqContext, unsupportedFacts, type FactUnit } from "../../scripts/fact-support.mjs";
import { parseProcedureMdx, readProcedureDocs } from "../../scripts/procedure-mdx.mjs";
import { loadContent } from "@/lib/content";
import { UNKNOWN, summaryCells } from "@/lib/procedure";

describe("값 읽기", () => {
  it("소요시간: 단일·범위·시간+분·'에서' 범위, 시점·간격 표현은 뺀다", () => {
    expect(durationValues("대개 1시간 정도 걸린다")).toEqual([60]);
    expect(durationValues("1시간가량 수술하고")).toEqual([60]);
    expect(durationValues("10~30분 정도로")).toEqual([10, 30]);
    expect(durationValues("30분에서 1시간 정도가 더 소요")).toEqual([30, 60]);
    expect(durationValues("약 2시간 30분", { lengthOnly: false })).toEqual([150]);
    expect(durationValues("외출 30분 전에 바르고 3시간 간격으로 덧바른다")).toEqual([]);
    expect(durationValues("마취가 풀린 후 24시간 내지 48시간 동안 금식")).toEqual([]);
    expect(durationValues("첫 24~36시간까지 제일 많이 붓고")).toEqual([]);
  });

  it("회복기간: 일·주·주일·개월·낱말, 범위 양 끝, 'N일째' 시점은 뺀다, '당일 복귀' = 0", () => {
    expect(dayValues("7~10일 정도 지나야")).toEqual([7, 10]);
    expect(dayValues("1주일 정도면 정상생활")).toEqual([7]);
    expect(dayValues("1~2주 정도 지나면")).toEqual([7, 14]);
    expect(dayValues("3주 말 무렵부터 정상생활")).toEqual([21]);
    expect(dayValues("일주일간, 하루, 한 달")).toEqual([7, 1, 30]);
    expect(dayValues("수술 후 3~4일째 봉합실을 제거")).toEqual([]);
    expect(dayValues("당일 복귀")).toEqual([0]);
    expect(dayValues("약 2주")).toEqual([14]);
  });

  it("마취 종류·절 나누기·FAQ 맥락", () => {
    expect(anesthesiaKinds("국소 마취 (필요하면 진정제 병행)")).toEqual(["국소", "진정"]);
    expect(anesthesiaKinds("마취 크림")).toEqual(["연고"]);
    expect(anesthesiaKinds("수면 마취 또는 전신 마취")).toEqual(["수면", "전신"]);
    expect(clauses("가나다.⁠[1] 라마바, 사아자.[2]")).toEqual(["가나다.", "라마바", "사아자."]);
    expect(faqContext("쌍꺼풀 수술 회복기간은 얼마나 걸리나요?")).toBe("recovery");
    expect(faqContext("수술 시간은 얼마나 걸리나요?")).toBe("duration");
    expect(faqContext("입원이 필요한가요?")).toBeNull();
  });
});

describe("r2 반려 사례 — 시드 값이 본문·FAQ·출처와 어긋나면 잡는다", () => {
  // content/procedures/square-jaw-reduction.mdx (r2 시점 본문·FAQ 문장 그대로)
  const jaw: FactUnit[] = [
    { text: "전신 마취로 1시간가량 수술하고 1~2일 입원하며, 7~10일 정도 지나야 일상적인 사회활동이 가능합니다.[2]" },
    { text: "전신 마취로 1시간가량 수술하고, 회복 경과를 살피기 위해 1~2일 입원 치료가 필요하다고 안내됩니다.", ctx: faqContext("입원이 필요한가요?") },
  ];
  it("사각턱: 약 2시간 30분·약 4주(r2) → 2건, 약 1시간·약 10일 → 통과", () => {
    const r2 = unsupportedFacts({ duration: "약 2시간 30분", recovery: "약 4주", anesthesia: "전신 마취" }, jaw);
    expect(r2).toHaveLength(2);
    expect(r2.join("\n")).toMatch(/소요시간 "약 2시간 30분"/);
    expect(r2.join("\n")).toMatch(/회복기간 "약 4주"/);
    expect(unsupportedFacts({ duration: "약 1시간", recovery: "약 10일", anesthesia: "전신 마취" }, jaw)).toEqual([]);
    expect(unsupportedFacts({ recovery: "약 7일" }, jaw)).toEqual([]);
    // 입원 1~2일은 일상 복귀 맥락이 아니다(같은 문장이지만 다른 절)
    expect(unsupportedFacts({ recovery: "약 2일" }, jaw)).toHaveLength(1);
  });

  it("광대: 약 2시간(r2) ↔ FAQ '대략 4시간' → 잡음, 약 4시간 → 통과", () => {
    const units: FactUnit[] = [{ text: "상태에 따라 차이가 크지만, 안면 윤곽 수술은 대략 4시간 정도 걸린다고 안내됩니다.", ctx: faqContext("수술 시간은 얼마나 걸리나요?") }];
    expect(unsupportedFacts({ duration: "약 2시간" }, units)).toHaveLength(1);
    expect(unsupportedFacts({ duration: "약 4시간" }, units)).toEqual([]);
  });

  it("눈매교정: 약 1시간 30분·국소+수면(r2) ↔ AMC154 2시간·국소/전신 → 잡음", () => {
    const units: FactUnit[] = [
      { text: "협조가 가능한 성인은 국소 마취로 수술할 수 있고, 경우에 따라서는 전신 마취로 합니다.[1] 소요 시간은 2시간 정도로 추정되며 수술 진행 상황에 따라 달라질 수 있습니다.[1]" },
    ];
    const r2 = unsupportedFacts({ duration: "약 1시간 30분", anesthesia: "국소 마취 + 수면 마취" }, units).join("\n");
    expect(r2).toMatch(/소요시간 "약 1시간 30분"/);
    expect(r2).toMatch(/"수면" 근거/);
    expect(r2).not.toMatch(/"국소" 근거/);
    expect(unsupportedFacts({ duration: "약 2시간", anesthesia: "국소 마취 (경우에 따라 전신 마취)" }, units)).toEqual([]);
  });

  it("레이저 토닝: '당일 복귀' 는 같은 절에 당일·즉시 + 복귀 맥락이 있어야 한다", () => {
    expect(unsupportedFacts({ recovery: "당일 복귀" }, [{ text: "시술 뒤 반응과 관리 기간은 진찰한 병원의 안내를 따르는 것이 좋습니다." }])).toHaveLength(1);
    expect(unsupportedFacts({ recovery: "당일 복귀" }, [{ text: "특별한 회복 기간이 필요하지 않고 즉시 일상생활이 가능합니다." }])).toEqual([]);
  });

  it("마취 종류를 알 수 없는 문자열은 문제", () => {
    expect(unsupportedFacts({ anesthesia: "병원마다 다름" }, [])[0]).toMatch(/종류.*알 수 없음/);
  });
});

describe("저장소 MDX 10편 — 검증된 칸은 본문 문장·FAQ 에 근거가 있다(빌드 check-triple 과 같은 기준을 원본에서)", () => {
  const content = loadContent();
  // MDX 본문 → 근거 후보: 문단·목록 줄(표·제목·검토 메모·"요약 박스" 문장 제외) + FAQ 답변
  const unitsOf = (source: string): FactUnit[] => {
    const { frontmatter, body } = parseProcedureMdx(source);
    const lines = body
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !/^[|#]/.test(l))
      .map((l) => l.replace(/^[-*]\s+/, ""))
      .filter((l) => !l.includes("요약 박스"));
    const faqs = (frontmatter?.faqs as { question: string; answer: string }[]) ?? [];
    return [...lines.map((text) => ({ text })), ...faqs.map((f) => ({ text: f.answer, ctx: faqContext(f.question) }))];
  };

  it.each(readProcedureDocs().map((d) => [d.id, d.source] as const))("%s", (id, source) => {
    const p = content.procedures.find((x) => x.id === id)!;
    const cells = summaryCells(p);
    const value = (key: string) => {
      const c = cells.find((x) => x.key === key)!;
      return c.unverified || c.value === UNKNOWN.other ? null : c.value;
    };
    expect(unsupportedFacts({ duration: value("duration"), recovery: value("recovery"), anesthesia: value("anesthesia") }, unitsOf(source))).toEqual([]);
  });

  it("검증 전 칸 목록(2026-10-25): 출처에 값이 없는 칸만", () => {
    const list = Object.fromEntries(content.procedures.map((p) => [p.id, p.guide!.unverified_facts]));
    expect(list).toEqual({
      "double-eyelid": ["price"],
      "ptosis-correction": ["price"],
      epicanthoplasty: ["price", "duration", "recovery", "anesthesia"],
      "lower-fat-repositioning": ["price"],
      rhinoplasty: ["price", "duration", "anesthesia"],
      "square-jaw-reduction": ["price"],
      "zygoma-reduction": ["price", "anesthesia"],
      "breast-augmentation": ["price"],
      "thread-lift": ["price", "duration", "recovery", "anesthesia"],
      "laser-toning": ["price", "recovery"],
    });
  });
});
