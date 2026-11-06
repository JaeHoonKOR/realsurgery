---
name: feedback-lint-without-bash
description: spec-tech-lead has no Bash tool; lint-spec.mjs must be reproduced with Grep and flagged for orchestrator re-run
metadata:
  type: feedback
---

The spec-tech-lead agent definition grants only Read/Write/Edit/Glob/Grep/WebSearch/WebFetch — no Bash. Orchestrator tasks still say "run `node scripts/lint-spec.mjs`".

**Why:** T-082 (2026-10-25) could not execute the script; reproduced its 3 rules with Grep instead and reported honestly.

**How to apply:** Reproduce `scripts/lint-spec.mjs` exactly: (1) Grep `^\|.*(적절|충분|깔끔|적당|자연스럽|보기 좋|세련|예쁘|괜찮|잘 보이|알맞|적정|원활)` and check those lines have a digit, (2) headings starting with `#` must contain 목적 / 원칙 / 규칙|목록|정의 / 접점 / 체크리스트 / 변경 이력, (3) 10·20·30·60 ≤ 120 lines unless a `#` heading contains "완본". Say in the report and log that the real script was not run and ask the orchestrator to run it once.
