---
name: project-95-legal-ops-constraints
description: Cross-doc coupling in 95-legal-ops that must not break (3-2 = exactly 10 items, D6 path, internal lead rule)
metadata:
  type: project
---

- 95-legal-ops 3-2 must stay exactly 10 items and keep the number "3-2": T-502 and 90-deliverables D6 ("10안 × 10항목 = 100칸", file `docs/deliverables/D6-creatives.md`) reference it.
- Channel-specific extras (Naver N1–N3, Google G1–G2) live in 3-2b outside the 100 cells (v3, 2026-10-25); Naver sheet = `docs/deliverables/D5-creatives.md`.
- v3 keys internal-lead exclusion on `leads.is_demo` (conflict K12 with 90's utm_source rule, pending T-088).
- QA leads use `utm_source=internal` (90-deliverables 3-5); 95 3-7 adds phone 010-0000-0000.
- Key position written into 95 v2 (2026-10-25): the service is not 의료인등 (의료법 56조 1항), so our own ads never name clinics/doctors.
- No Bash tool was available in the 2026-10-25 session; lint-spec was emulated with Grep (same regex + section check).

**Why:** other specs and tasks key off these numbers; renumbering silently breaks them.
**How to apply:** when revising 95, keep section IDs 3-1/3-2 stable; log conflicts in its "충돌 기록" list rather than editing other specs.

Related: [[reference-legal-sources]]
