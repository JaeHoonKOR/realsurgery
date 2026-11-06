// builder 서브에이전트의 Stop(→ SubagentStop) hook: 타입체크·린트가 통과해야 builder가 끝날 수 있다.
// 실패 = exit 2 + stderr(마지막 출력) → builder가 이어서 고친다. 연속 차단 상한은 Claude Code가 관리한다.
// 실행할 때마다 harness/hooks.log(gitignore)에 한 줄 남겨, hook이 실제로 발동했는지 확인할 수 있게 한다.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const CHECKS = [
  ["typecheck", "pnpm typecheck"],
  ["lint", "pnpm lint"],
];

let agent = "";
try {
  agent = JSON.parse(fs.readFileSync(0, "utf8"))?.agent_type ?? "";
} catch {}

function log(result) {
  try {
    fs.appendFileSync(path.join(ROOT, "harness", "hooks.log"), `${new Date().toISOString()} verify-build ${agent || "-"} ${result}\n`, "utf8");
  } catch {}
}

for (const [name, cmd] of CHECKS) {
  const r = spawnSync(cmd, { shell: true, encoding: "utf8", cwd: ROOT });
  if (r.status !== 0) {
    const out = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim().split("\n").slice(-60).join("\n");
    log(`FAIL ${name}`);
    process.stderr.write(`${name} 실패 — 고친 뒤 끝내세요.\n${out}\n`);
    process.exit(2);
  }
}
log("PASS");
process.exit(0);
