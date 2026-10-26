// scripts/serve-out.mjs — 작업 트리별 Playwright 포트(병렬 /improve 구현 에이전트가 서로의 서버를 재사용하지 않게)
import { describe, expect, it } from "vitest";
import { DEFAULT_PORT, defaultPorts } from "../../scripts/serve-out.mjs";

describe("serve-out: 기본 포트", () => {
  it("저장소 본체는 4173/4174 그대로", () => {
    expect(defaultPorts("C:\\rs")).toEqual({ serve: DEFAULT_PORT, preview: DEFAULT_PORT + 1 });
    expect(defaultPorts("/home/u/realsurgery")).toEqual({ serve: 4173, preview: 4174 });
  });

  it("작업 트리는 경로마다 다르고 결정적인 4200~4799 짝(Windows·POSIX 구분자 동일)", () => {
    const a = defaultPorts("C:\\rs\\.claude\\worktrees\\agent-a1");
    const b = defaultPorts("C:\\rs\\.claude\\worktrees\\agent-b2");
    expect(a).toEqual(defaultPorts("C:/rs/.claude/worktrees/agent-a1"));
    expect(a).not.toEqual(b);
    for (const p of [a, b]) {
      expect(p.serve).toBeGreaterThanOrEqual(4200);
      expect(p.preview).toBeLessThan(4800);
      expect(p.preview).toBe(p.serve + 1);
      expect(p.serve % 2).toBe(0);
    }
  });
});
