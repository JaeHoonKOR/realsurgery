import { describe, expect, it } from "vitest";
import { inScope, scanText, stripComments } from "../../scripts/lint-medical.mjs";

// 금지·허용 예문은 docs/archive/specs/95-legal-ops.md 3-1 표에서 옮겼다.
const codes = (text: string, file = "app/page.tsx") => scanText(text, file).map((v) => v.code);

describe("lint-medical: 금지 예문은 걸린다", () => {
  it.each([
    ["쌍꺼풀 100% 유지 보장", "B01"],
    ["완벽하게 교정", "B01"],
    ["흉터 없는 눈매교정", "B02"],
    ["강남 1위 눈성형", "B03"],
    ["눈 특화 병원", "B03"],
    ["다음날 바로 출근 가능", "B04"],
    ["비포 애프터로 확인하세요", "B05"],
    ["환자들이 말하는 회복 1주 차", "B06"],
    ["타 병원보다 30% 저렴", "B07"],
    ["상담만 해도 리프팅 1회 증정", "B08"],
    ["병원 공개가 기준 최저가부터 최고가까지", "B08"],
    ["전문의가 말하는 코 성형 3가지", "B09"],
    ["작은 눈 때문에 고민이세요?", "B10"],
    ["쌍꺼풀 평균 150만 원", "B13"],
    ["89만 원부터", "B13"],
  ])("%s → %s", (text, code) => {
    expect(codes(`<p>${text}</p>`)).toContain(code);
  });
});

describe("lint-medical: 허용 예문은 통과한다", () => {
  it.each([
    "매몰법은 풀림이 재수술 사유 중 하나로 보고됩니다[출처1]",
    "절개 흉터는 개인차가 있습니다[출처1][출처2]",
    "일상 복귀는 7일 정도로 안내됩니다[출처1]",
    "시술 전후 주의사항 5가지",
    "회복 1주 차에 병원이 안내하는 관리 항목 4개[출처1]",
    "120만~180만 원 (병원 공개 가격 3곳, 조사일 2026-10-20)",
    "무료 상담 예약",
    "출처: 대한성형외과학회 환자 안내 자료",
    "성형외과 전문의",
    "결과가 불확실한 경우",
    "개인정보 보호 보장",
    "병원이 공개한 가격의 하한부터 상한까지",
  ])("%s", (text) => {
    expect(codes(`<p>${text}</p>`)).toEqual([]);
  });

  it("100%는 효과·만족 같은 말이 함께 있을 때만 걸린다", () => {
    expect(codes("<p>진행률 100%</p>")).toEqual([]);
    expect(codes("<p>만족도 100% 보장</p>")).toContain("B01");
  });

  it("가격 문장이 아니면 '최소'·'부터'는 걸리지 않는다", () => {
    expect(codes("<p>최소 2주는 쉬는 것이 좋다고 안내됩니다[출처1]</p>")).toEqual([]);
    expect(codes("<p>내일부터 운동을 시작합니다</p>")).toEqual([]);
  });

  it("영어 단어 위치·위험의 '위'는 순위로 보지 않는다", () => {
    expect(codes("<p>2위치에서 시작</p>")).toEqual([]);
  });
});

describe("lint-medical: 검사 범위", () => {
  it("코드 주석은 검사하지 않는다", () => {
    expect(codes("// 최고가 표시\nconst a = 1;\n/* 최저가 */")).toEqual([]);
    expect(codes("{/* 최고 */}<p>정보</p>")).toEqual([]);
  });

  it("URL 의 // 는 주석으로 지우지 않는다", () => {
    expect(stripComments('href="https://example.com/a" 최저가')).toContain("최저가");
  });

  it("JSON 은 값만 보고 키는 보지 않는다", () => {
    expect(codes('{\n  "최저가": "공개 가격 하한"\n}', "data/seed/x.json")).toEqual([]);
    expect(codes('{\n  "note": "강남 1위"\n}', "data/seed/x.json")).toContain("B03");
  });

  it("줄 번호를 돌려준다", () => {
    expect(scanText("const a = 1;\n<p>최저가</p>", "app/x.tsx")[0]?.line).toBe(2);
  });

  it.each([
    ["app/(site)/page.tsx", true],
    ["components/common/SiteFooter.tsx", true],
    ["data/seed/procedures.json", true],
    ["content/procedures/double-eyelid.mdx", true],
    ["docs/legal/MEDICAL-AD.md", false],
    ["tests/unit/x.test.ts", false],
    ["app/icon.svg", false],
  ])("%s → %s", (rel, want) => {
    expect(inScope(rel)).toBe(want);
  });
});
