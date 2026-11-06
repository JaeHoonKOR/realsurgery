import { describe, expect, it } from "vitest";
import { applyEdit, checkFeaturesChange, validateShape } from "../../scripts/hooks/check-features.mjs";

const feature = (over: Record<string, unknown> = {}) => ({
  id: "F-001",
  category: "flow",
  description: "메인에서 시술 카드를 누르면 가이드가 열린다",
  steps: ["메인 열기", "첫 카드 클릭"],
  priority: 1,
  passes: false,
  ...over,
});
const json = (list: unknown[]) => JSON.stringify(list, null, 2);

describe("check-features: 형식", () => {
  it("빈 배열은 통과", () => {
    expect(validateShape([])).toBeNull();
  });
  it.each([
    [{ id: "1" }, "id"],
    [{ steps: [] }, "steps"],
    [{ priority: 0 }, "priority"],
    [{ passes: "no" }, "passes"],
    [{ status: "blocked" }, "알 수 없는 필드"],
  ])("%o → %s 오류", (over, msg) => {
    expect(validateShape([feature(over)])).toContain(msg);
  });
  it("id 중복", () => {
    expect(validateShape([feature(), feature()])).toContain("중복");
  });
  it("JSON 파싱 실패는 막는다", () => {
    expect(checkFeaturesChange("[]", "[{", undefined)).toContain("JSON");
  });
});

describe("check-features: 메인 세션(오케스트레이터)", () => {
  const before = json([feature()]);
  it("passes만 바꾸면 통과", () => {
    expect(checkFeaturesChange(before, json([feature({ passes: true })]), undefined)).toBeNull();
  });
  it("steps를 바꾸면 막는다", () => {
    expect(checkFeaturesChange(before, json([feature({ steps: ["메인 열기"] })]), undefined)).toContain("passes 외");
  });
  it("passes와 steps를 함께 바꿔도 막는다", () => {
    expect(checkFeaturesChange(before, json([feature({ passes: true, steps: ["x"] })]), undefined)).not.toBeNull();
  });
  it("기능 삭제를 막는다", () => {
    expect(checkFeaturesChange(before, "[]", undefined)).toContain("추가·삭제");
  });
  it("기능 추가를 막는다", () => {
    expect(checkFeaturesChange(before, json([feature(), feature({ id: "F-002" })]), undefined)).toContain("추가·삭제");
  });
  it("파일이 없을 때 빈 배열 생성은 통과", () => {
    expect(checkFeaturesChange(null, "[]\n", undefined)).toBeNull();
  });
});

describe("check-features: 서브에이전트", () => {
  const before = json([feature()]);
  it("planner는 기능을 추가·수정·삭제할 수 있다", () => {
    expect(checkFeaturesChange(before, json([feature({ steps: ["a", "b", "c"] }), feature({ id: "F-002" })]), "planner")).toBeNull();
    expect(checkFeaturesChange(before, "[]", "planner")).toBeNull();
  });
  it("planner는 passes를 true로 만들 수 없다", () => {
    expect(checkFeaturesChange(before, json([feature({ passes: true })]), "planner")).toContain("planner");
    expect(checkFeaturesChange("[]", json([feature({ passes: true })]), "planner")).toContain("planner");
  });
  it("planner가 이미 통과한 기능의 passes를 유지하는 것은 허용", () => {
    const passed = json([feature({ passes: true })]);
    expect(checkFeaturesChange(passed, json([feature({ passes: true, description: "고친 설명" })]), "planner")).toBeNull();
  });
  it.each(["builder", "evaluator", "Explore"])("%s는 아무것도 바꿀 수 없다", (agent) => {
    expect(checkFeaturesChange(before, json([feature({ passes: true })]), agent)).toContain(agent);
  });
});

describe("check-features: Edit 적용", () => {
  it("첫 번째 일치만 바꾼다", () => {
    expect(applyEdit("a a", { old_string: "a", new_string: "b" })).toBe("b a");
  });
  it("replace_all", () => {
    expect(applyEdit("a a", { old_string: "a", new_string: "b", replace_all: true })).toBe("b b");
  });
  it("$ 같은 특수 문자를 그대로 넣는다", () => {
    expect(applyEdit("x", { old_string: "x", new_string: "$&$1" })).toBe("$&$1");
  });
});
