---
name: feedback-benchmark-review
description: How to review docs/BENCHMARK.md (T-090 lane) — trace every best value to section 2 tables, catch exclusions that lower targets, verify "same script" claims, cross-check competitor observations against 00-product 3-3
metadata:
  type: feedback
---

T-090 r1 (2026-10-25) was rejected although the checklist was format-perfect (46/46 numeric, 0 adjectives) and two live re-samples matched exactly. The defects were all in *meaning*:
- Page-type exclusions (keyword hub vs product detail) applied only where they lowered the target (B-05, B-19), while hub values were used elsewhere when they raised it.
- Composite targets whose lower bound does not add up (B-44: FAQ 5~8 + 2 ≥ 9).
- "Same rule as check-density.mjs" / "same script" claims — the real measurement code lived in gitignored `.playwright-mcp/bm-run.js` and differed (bg images, visibility, lazy scroll, 1280). Cache state (375 cold → 1280 warm on one page) undocumented.
- The benchmark recorded a fact (babitalk hub shows prices without login) that contradicts 00-product 3-3 O3/V1, but did not raise a spec-question.
- Missing the Korean de-facto consult path (카톡상담 chip) when comparing form friction.

T-090 r2 fixed 10/11, but the hub-rule defect recurred in a new form: a *counting-unit* mismatch. B-05 counted all elements on the hub first screen (16) while B-03 counted hub numbers "per card" (4 instead of 3 cards × 4 = 12). After a rule like R-허브 is introduced, check that every row it lists uses the same unit (instances vs kinds) and look at the hub screenshot to count it yourself.
T-090 r3 fixed B-03 (13, verified on screenshot) but the r1 "same script" defect recurred for SSR-only values: RealSelf aria-expanded/PMID/reference counts came from gitignored `.playwright-mcp/ssr.mjs` or ad-hoc analysis, not `bench-measure --ssr` (ssrOne has no such fields), and no raw saved — yet B-44 ≥14 hinged on it. For every number that sets a target, grep the script for the field and check the raw JSON contains it; grep `.playwright-mcp/` for the signal name to find shadow code. Also watch retry loops that re-request 403 pages (conflicts with the doc's own anti-evasion rationale).
T-090 r4 approved. Lesson: when an author calls a script field "probably a regex bug" (inHeaderNav 14/14), test it with synthetic HTML via `--ssr data:text/html,...` before accepting — accordion items wrapped in `<header>` give the same 14/14 legitimately. Then check whether the competitor value and our check use the *same exclusion rule* (attribute-based vs `closest("header,nav")`) — an R-단위 issue even when the target isn't lowered.
Also: bench-measure drops LCP-missing runs, so a "3-run median" can silently be a 2-run mean. Check `lcpMissing`/`okRuns` in the raw JSON.

**Why:** the final question is whether a marketing lead who uses these apps daily finds the targets defensible; format checks never catch this.
**How to apply:** for each B-row, find the value in section 2 tables (untraceable = defect), recompute min/max across all measured columns, check composite arithmetic, read the measurement script itself, and diff competitor observations against 00-product 3-3 "잠정" cells. Keep external re-access to 1-2 samples (Playwright MCP 1 page + node fetch 1 page). Related: [[reference-bash-env]].
