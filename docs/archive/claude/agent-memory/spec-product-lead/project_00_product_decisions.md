---
name: project-00-product-decisions
description: 00-product v2 (T-080 r1, 2026-10-25) load-bearing decisions — KPI-01~13 + gates G1/G2, D8 six numbers, index scope, slow-signal S1~S16, B13 regex owed to 95 v4
metadata:
  type: project
---

- IDs: KPI-01~KPI-13 (renamed from K1~ to avoid clash with 95 conflict IDs K1~K18), gates G1 (R0~R7 8/8) / G2 (hiring-reviewer), conflicts C1~C27, questions Q1~Q15.
- D8 = 6 slots × 3 elements = 18 cells (v3): KPI-01, KPI-03a meta CPL, KPI-02a+b merged, KPI-06a+b merged (index % + GSC impressions/clicks 4wk), KPI-08, KPI-12. Content differs from 90 3-9 → C18/Q12. Search CPL sample-insufficient by design → D5 only; budget raise = needs-approval Q11.
- Meta CPL = one 21-day cumulative value, zero CPL targets (no external benchmark 2026-10-25); R1 vs R2 compared on CTR/CPC/cost per landing view. KPI-01 target 11 (meta 5 = D6 floor). Hiring-reviewer rejects any implied CPL target.
- Price-survey freshness (F6) only toggles the "예시 가격" label, never noindex. Demo-clinic P-05 consult CTA = procedure-only link + "예시 병원입니다" notice.
- Index only 완본 pages (F1~F8); seed has 4 eye + 6 non-eye procedures; demo clinics, /insights, /deliverables noindex. Sitemap = 1 + 완본 + 2 + real clinics → 7~23, so 90's "색인 ≥ 20" conflicts (C25/Q8).
- AEO slow signal: 4 eye guides deployed 2026-11-03 (S13) before W1 11-10; 20 questions + 20 keywords mapped 5 per slug in 3-8-2/3-8-3.
- Lead aggregates via Edge Fn metrics-agg → reports/leads/agg.json (counts only); internal leads via `x-internal-token` header (conflicts 95 3-7, Q10). Meta landing P-12 `/lp/c2611a` from 11-10.
- Competitor baseline = newest/strongest format: O1b unni.app/contents/3f9d9338-d3d4-80da-916a-f41425fe332d (2026-10-23, 3 inline footnotes + Europe PMC refs, FAQ 2). Older O1 unni.app/contents/23bd9338-… is reference only. Also O2 unni.app/events/85230, O3 babitalk.com/search?keyword=쌍꺼풀 (observed 2026-10-25: O1 has update date, 0 citations/FAQ; O2 rating 9.5(490), price no source; O3 prices/reviews behind login). Home-screen comparison was rejected by hiring-reviewer.
- B13 regex replacement + 25 fixture sentences (11 allow / 14 deny) → 95 v4 at T-088 (C8/Q6).
- Milestone dates unchanged (M0 10-26~11-01, M1 11-09, M2 11-23, M3 12-08, M4 12-21); M0 delay n → M1 + n; M1 slip rules ≤7 / 8~14 / >14 days.

**Why:** 90/95 revisions and downstream specs (30/40/50/60/70) key off these IDs, dates, and defaults; hiring-reviewer r1 rejected home-screen comparison and unmeasurable ad numbers.
**How to apply:** keep KPI IDs and dates stable; when revising 90/95, adopt or explicitly reject each C/Q item rather than silently diverging. Compare competitors only on detail/search pages.

Related: [[project-95-legal-ops-constraints]]
