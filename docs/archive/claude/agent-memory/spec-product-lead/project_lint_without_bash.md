---
name: lint-without-bash
description: spec-product-lead has no Bash tool; lint-spec.mjs must be reproduced with Grep (2 checks) and the reply must say so
metadata:
  type: project
---
spec-product-lead's tool list has no Bash, so `node scripts/lint-spec.mjs` can't be run. The script only does two checks: (1) table rows (lines starting with `|`) that contain a banned adjective (적절|충분|깔끔|적당|자연스럽|보기 좋|세련|예쁘|괜찮|잘 보이|알맞|적정|원활) and no digit; (2) `#` headings that include each of 목적/원칙/규칙/접점/검수 체크리스트/변경 이력.

**Why:** In T-079 (2026-10-25) the 90-deliverables draft failed check (2) because section 3 was titled "제출물 목록". That was caught only by reproducing the check by hand.

**How to apply:** Section 3 must always have "규칙" in its heading. Reproduce both checks with Grep, and tell the orchestrator that the real script still needs to run before approval. Related: [[deliverables-milestones]]
