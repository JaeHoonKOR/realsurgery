---
name: feedback-target-vs-best
description: Reviewer rejected T-090 twice for checklist targets below the measured best value — rules for counting units and the full sweep to run before handing BENCHMARK.md to review
metadata:
  type: feedback
---

Every checklist target must be ≥ (or ≤ for lower-is-better) the measured best, counted in the **same unit across all columns** of that screen type (hubs, single details, RealSelf SSR included). If we can't match, move it to 7-2 exceptions with reason + release condition — never quietly use a smaller unit.

**Why:** T-090 r1 (B-05/B-19/B-32) and r2 (B-03: hub counted "per card" = 4 while the hub screen showed 12 numbers) were both rejected for "기준이 목표를 낮추는 쪽으로 흔들린다". A 심사자 who uses 바비톡 daily will count the screenshot. r3 sweep then found 3 more silent cases (B-44 RealSelf accordions 14 vs 9, P-01 search y ≤ 200 vs 70, empty-state links 10 vs 55) and a wrong best (B-30 0% vs RealSelf PMID 67%).

**How to apply:** before REPORT, (1) put the unit (개수/종류) in every item name, (2) count multi-card screens per instance, (3) include RealSelf SSR values even when render is blocked, (4) sweep all B-rows **and** numeric targets in the 화면별 필수 요소 section with a direction column (↑/↓/=), log the sweep table. Re-count from saved screenshots instead of re-visiting competitors. See [[reference-competitor-access]].
