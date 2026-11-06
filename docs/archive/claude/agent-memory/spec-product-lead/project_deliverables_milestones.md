---
name: deliverables-milestones
description: Provisional M0-M4 dates, the single ad flight, and the AEO window fixed in 90-deliverables v3 (2026-10-25); 00-product (T-080) must reuse or explicitly change them
metadata:
  type: project
---
90-deliverables v3 (T-079, 2026-10-25) set these provisional milestones:
- M0: 10-26 to 11-01 (domain; Search Console, Naver Search Advisor and Bing registration; T-500 request)
- M1: 11-09 (the ad operation appendix is due here, regardless of approval)
- M2: 11-23
- M3: 12-08
- M4: 12-21

Signal windows:
- Ads: one single flight 11-10 to 11-30, with no separate warmup. Meta gets 168,000원; Naver search gets 98,700원 with a 1,000원 CPC cap.
- P-12 A/B test: 11-24 to 11-30.
- AEO measurement: 11-10 to 12-07 (320 rows, with competitor columns).

T-500 approval deadline is 2026-11-09. D5 switches to an organic version and D6 to a not-run version if T-500 is not approved, if the ad is still rejected after one re-submission under 95-legal-ops 3-3, or if the account is restricted.

**Why:** "Slow signals first." The growth-lead review chose a single flight to remove the 7-day warmup gap.

**How to apply:** When writing 00-product (T-080), adopt these dates or change them and log the change in 90's history.

Open spec-questions:
- P-07 proof path for reviewers
- who does the weekly human input (AEO 80 cells + Naver ranking 20)
- the internal-lead flag
- whether the repo stays public
- T-141 (PDF and metrics scripts) as a new task

Related: [[lint-without-bash]]
