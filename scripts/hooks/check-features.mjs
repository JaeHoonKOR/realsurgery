// PreToolUse(Write|Edit) hook: harness/features.json 변경 규칙을 강제한다.
// - planner 서브에이전트: 기능 추가·수정·삭제 가능. 단 passes를 true로 만들 수는 없다.
// - 메인 세션(오케스트레이터): passes 값만 바꿀 수 있다. 기능 추가·삭제·다른 필드 변경 금지.
//   passes를 true로 바꾸려면 회귀 테스트 tests/e2e/features/<id>.spec.ts 와
//   evaluator와 합의된 계약서 harness/contracts/<id>.md("합의:" 줄 포함)가 있어야 한다.
// - 그 밖의 서브에이전트(builder·evaluator 등): 변경 금지.
// 위반 = exit 2 + stderr (Claude Code가 도구 호출을 막고 이유를 Claude에게 돌려준다).
// 회귀 테스트: tests/unit/check-features.test.ts
import fs from "node:fs";
import path from "node:path";

export const FEATURES_SUFFIX = "harness/features.json";
export const specPath = (id) => `tests/e2e/features/${id}.spec.ts`;
export const contractPath = (id) => `harness/contracts/${id}.md`;
export const AGREED = /^합의:/m;

/** 저장소 root 기준으로, 통과 처리에 필요한 파일 중 없거나 미완인 것을 돌려준다. */
export function missingFiles(root, id) {
  const missing = [];
  if (!fs.existsSync(path.join(root, specPath(id)))) missing.push(`회귀 테스트 ${specPath(id)}`);
  const contract = path.join(root, contractPath(id));
  if (!fs.existsSync(contract)) missing.push(`계약서 ${contractPath(id)}`);
  else if (!AGREED.test(fs.readFileSync(contract, "utf8"))) missing.push(`계약서 ${contractPath(id)} 의 "합의:" 줄(evaluator 합의 전)`);
  return missing;
}
const FIELDS = ["id", "category", "description", "steps", "priority", "passes"];

/** @returns {string | null} 형식 오류 메시지 */
export function validateShape(list) {
  if (!Array.isArray(list)) return "최상위는 배열이어야 합니다";
  const ids = new Set();
  for (const [i, f] of list.entries()) {
    const at = `${i}번째 기능`;
    if (!f || typeof f !== "object" || Array.isArray(f)) return `${at}: 객체가 아닙니다`;
    const extra = Object.keys(f).filter((k) => !FIELDS.includes(k));
    if (extra.length) return `${at}: 알 수 없는 필드 ${extra.join(", ")}`;
    if (typeof f.id !== "string" || !/^F-\d{3}$/.test(f.id)) return `${at}: id는 F-000 형식`;
    if (ids.has(f.id)) return `${at}: id ${f.id} 중복`;
    ids.add(f.id);
    if (typeof f.category !== "string" || !f.category) return `${f.id}: category가 비었습니다`;
    if (typeof f.description !== "string" || !f.description) return `${f.id}: description이 비었습니다`;
    if (!Array.isArray(f.steps) || !f.steps.length || f.steps.some((s) => typeof s !== "string" || !s))
      return `${f.id}: steps는 비어 있지 않은 문자열 배열`;
    if (!Number.isInteger(f.priority) || f.priority < 1) return `${f.id}: priority는 1 이상 정수`;
    if (typeof f.passes !== "boolean") return `${f.id}: passes는 true/false`;
  }
  return null;
}

const withoutPasses = (f) => JSON.stringify({ ...f, passes: null });

/**
 * @param {string | null} oldText 변경 전 파일 내용(없으면 null)
 * @param {string} newText 변경 후 파일 내용
 * @param {string | undefined} agentType hook 입력의 agent_type (메인 세션이면 undefined)
 * @param {(id: string) => string[]} [missingFor] 통과 처리에 필요한데 없는 파일 목록. 생략하면 검사하지 않는다
 * @returns {string | null} 막을 이유, 허용이면 null
 */
export function checkFeaturesChange(oldText, newText, agentType, missingFor) {
  let next;
  try {
    next = JSON.parse(newText);
  } catch (e) {
    return `JSON 파싱 실패: ${e.message}`;
  }
  const shape = validateShape(next);
  if (shape) return shape;

  let prev = [];
  if (oldText != null && oldText.trim()) {
    try {
      prev = JSON.parse(oldText);
    } catch {
      prev = [];
    }
  }
  const prevById = new Map(prev.map((f) => [f.id, f]));

  if (agentType === "planner") {
    for (const f of next) {
      const before = prevById.get(f.id);
      if (f.passes && !before?.passes) return `${f.id}: planner는 passes를 true로 바꿀 수 없습니다(오케스트레이터 몫)`;
    }
    return null;
  }

  if (agentType) return `${agentType} 서브에이전트는 features.json을 바꿀 수 없습니다. 바꿀 내용은 반환값으로 오케스트레이터에게 알리세요`;

  // 메인 세션: passes만
  if (next.length !== prev.length) return "오케스트레이터는 기능을 추가·삭제할 수 없습니다. 목록 변경은 /define(planner)로";
  for (const f of next) {
    const before = prevById.get(f.id);
    if (!before) return `${f.id}: 목록에 없던 기능입니다. 목록 변경은 /define(planner)로`;
    if (withoutPasses(f) !== withoutPasses(before))
      return `${f.id}: passes 외 필드가 바뀌었습니다. steps·설명 변경은 /define(planner)로`;
    const missing = f.passes && !before.passes && missingFor ? missingFor(f.id) : [];
    if (missing.length) return `${f.id}: 통과 처리 전에 필요한 것이 없습니다 — ${missing.join(", ")}`;
  }
  return null;
}

/** Edit 도구 입력을 파일 내용에 적용한다. */
export function applyEdit(text, { old_string, new_string, replace_all }) {
  if (!text.includes(old_string)) return text;
  return replace_all ? text.split(old_string).join(new_string) : text.replace(old_string, () => new_string);
}

function main() {
  let input;
  try {
    input = JSON.parse(fs.readFileSync(0, "utf8"));
  } catch {
    process.exit(0);
  }
  const ti = input?.tool_input ?? {};
  const file = String(ti.file_path ?? "").replace(/\\/g, "/");
  if (!file.endsWith(FEATURES_SUFFIX)) process.exit(0);

  const abs = path.isAbsolute(ti.file_path) ? ti.file_path : path.join(input.cwd ?? process.cwd(), ti.file_path);
  const oldText = fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : null;
  let newText;
  if (input.tool_name === "Write") newText = ti.content ?? "";
  else if (input.tool_name === "Edit") newText = applyEdit(oldText ?? "", ti);
  else process.exit(0);

  const root = path.resolve(path.dirname(abs), "..");
  const reason = checkFeaturesChange(oldText, newText, input.agent_type, (id) => missingFiles(root, id));
  if (reason) {
    process.stderr.write(`FEATURES BLOCKED: ${reason}\n`);
    process.exit(2);
  }
  process.exit(0);
}

if (path.basename(process.argv[1] ?? "") === "check-features.mjs") main();
