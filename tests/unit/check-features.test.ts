import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { applyEdit, checkFeaturesChange, missingFiles, validateShape } from "../../scripts/hooks/check-features.mjs";

let tmp: string | undefined;
afterEach(() => {
  if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
  tmp = undefined;
});

describe("check-features: 통과 처리에 필요한 파일", () => {
  const setup = (files: Record<string, string>) => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "rs-features-"));
    for (const [rel, body] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(tmp, rel)), { recursive: true });
      fs.writeFileSync(path.join(tmp, rel), body, "utf8");
    }
    return tmp;
  };
  it("회귀 테스트와 계약서가 없으면 둘 다 알려 준다", () => {
    expect(missingFiles(setup({}), "F-001")).toHaveLength(2);
  });
  it("계약서에 합의 줄이 없으면 미완으로 본다", () => {
    const root = setup({ "tests/e2e/features/F-001.spec.ts": "x", "harness/contracts/F-001.md": "# F-001\n검증: ..." });
    expect(missingFiles(root, "F-001")).toEqual(['계약서 harness/contracts/F-001.md 의 "합의:" 줄(evaluator 합의 전)']);
  });
  it("회귀 테스트와 합의된 계약서가 있으면 빈 목록", () => {
    const root = setup({
      "tests/e2e/features/F-001.spec.ts": "x",
      "harness/contracts/F-001.md": "# F-001\n합의: 2026-11-06 evaluator 라운드 1\n",
    });
    expect(missingFiles(root, "F-001")).toEqual([]);
  });
});

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
  it("필요한 파일이 없으면 통과 처리를 막고 무엇이 없는지 알려 준다", () => {
    const missing = () => ["회귀 테스트 tests/e2e/features/F-001.spec.ts", "계약서 harness/contracts/F-001.md"];
    const reason = checkFeaturesChange(before, json([feature({ passes: true })]), undefined, missing);
    expect(reason).toContain("tests/e2e/features/F-001.spec.ts");
    expect(reason).toContain("harness/contracts/F-001.md");
  });
  it("필요한 파일이 다 있으면 통과 처리를 허용한다", () => {
    const seen: string[] = [];
    const missingFor = (id: string) => (seen.push(id), []);
    expect(checkFeaturesChange(before, json([feature({ passes: true })]), undefined, missingFor)).toBeNull();
    expect(seen).toEqual(["F-001"]);
  });
  it("passes를 false로 되돌릴 때는 파일을 묻지 않는다", () => {
    const passed = json([feature({ passes: true })]);
    expect(checkFeaturesChange(passed, json([feature()]), undefined, () => ["x"])).toBeNull();
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
