// builder 서브에이전트의 Stop(→ SubagentStop) hook: 타입체크·린트가 통과해야 builder가 끝날 수 있다.
// 실패 = exit 2 + stderr(마지막 출력) → builder가 이어서 고친다. 연속 차단 상한은 Claude Code가 관리한다.
import { spawnSync } from "node:child_process";

const CHECKS = [
  ["typecheck", "pnpm typecheck"],
  ["lint", "pnpm lint"],
];

for (const [name, cmd] of CHECKS) {
  const r = spawnSync(cmd, { shell: true, encoding: "utf8", cwd: process.env.CLAUDE_PROJECT_DIR || process.cwd() });
  if (r.status !== 0) {
    const out = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim().split("\n").slice(-60).join("\n");
    process.stderr.write(`${name} 실패 — 고친 뒤 끝내세요.\n${out}\n`);
    process.exit(2);
  }
}
process.exit(0);
