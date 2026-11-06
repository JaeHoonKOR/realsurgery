---
name: feedback-procedure-content-checks
description: P-03 procedure guide content review — summary-box values vs body/FAQ/source meaning (not just number match); check-triple/fact-support keyword false negatives; test-results/ scratch = non-reproducible
metadata:
  type: feedback
---

When reviewing procedure MDX (content/procedures/*.mdx), compare frontmatter `duration_min`/`recovery_days`/`anesthesia` (summary box + MedicalProcedure howPerformed/followup) against the same page's body, FAQ and the cited source text. T-103 r2 was rejected for seed values contradicting body (사각턱 150min vs "1시간가량").

Since r3 there is `scripts/fact-support.mjs` (check-triple step 5) + `unverified_facts` frontmatter. It matches by keyword+number per clause, so a value passes if ANY number in a "생활/회복/일상" clause or in a FAQ "회복기간" answer matches — exercise limits, swelling, "자리 잡기" periods all count. r3 was rejected because breast 회복기간 21 came from "일상생활은 가능하나 과격한 운동은 2~3주까지" (meaning mismatch), and the r2-rejected zygoma 4주 would also pass.

**Why:** YMYL — builder tables mark ✔ with a source phrase; the number exists in the source but means something else.
**How to apply:** Fetch the full source sentence (incl. the preceding clause) for every ✔ cell, check the *meaning* (일상 복귀 vs 붓기 vs 운동 제한), and run a mutation probe with `checkTripleHtml` from `scripts/check-triple.mjs` on out/ HTML (replace box span + followup string) using previous-round rejected values. Sources fetch fine via `htmlText` exported from `scripts/verify-sources.mjs` + node fetch with UA. Also flag scripts cited as evidence that live in gitignored `test-results/`. Related: [[reference-bash-env]].
