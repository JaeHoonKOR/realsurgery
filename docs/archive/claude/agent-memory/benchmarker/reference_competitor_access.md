---
name: reference-competitor-access
description: Which competitor pages are reachable by headless Playwright vs blocked (2026-10-25), robots.txt status, URL patterns, load budget, and the honest fallback used — read before any re-benchmark of 강남언니·바비톡·여신티켓·RealSelf·Zocdoc
metadata:
  type: reference
---

Access map observed 2026-10-25 (T-090 r1·r2). Re-verify each quarter; WAF rules change.

- 강남언니: `gangnamunni.com` → `unni.app`. Headless Chromium gets nginx 403 on `/`, `/events/*`, `/hospitals/*`; `/contents/*` renders 200. Node default fetch gets SSR HTML. **robots.txt: `User-agent: *` → `Disallow: /`** (only named bots allowed) — human decision pending (TASKS T-026) before measuring again. TTFB swings 0.04–11 s cold.
- 바비톡: renders fine. r1 flipped to 403 after ~25 loads; r2 (hours later) 19 loads with 0×403. Open each screen once. Nav is JS onClick (0–1 `a[href]`). Hub "카톡상담" chip is a non-interactive div (card click opens event in new tab); event page "카톡상담" → `/events/{id}/ask?type=kakao` (same 본인인증 form). robots.txt Allow /.
- 여신티켓: renders fine, robots Allow /; sitemaps `.xml.gz`. Consult → login bottom sheet. LCP sometimes unrecorded at 1280 within 3.5 s.
- RealSelf: PerimeterX press-and-hold captcha for every rendered page incl. `/dr/*` (403); Node fetch SSR works (3 more fetches in r3, no block); robots has no rule for measured paths. Procedure page = 14 section accordions (= FAQPage 14 Questions). r4 raw `reports/benchmark/raw/r3-realself-ssr.json` (script-reproduced): aria-expanded 14 = button 14, accordion-class 14, menu 0, true 2; academic links unique 4 (PubMed 2·PMC 1·NCBI Books 1, DOI 0). SSR header/nav-range classifier gave 14/14 "inside" on this page — unreliable there; use attribute classifier. SSR HTML is 397,762 bytes and was unchanged r2→r4.
- Zocdoc: DataDome blocks Playwright, Node fetch, WebFetch, and robots.txt (all 403) — don't try further URLs.

Tooling: `scripts/bench-measure.mjs` (cold = new browser per run; since r3 `--runs N` = N recorded LCPs, refills up to `--max-runs` (default N+2), exit 1 if short — budget extra loads per competitor URL; since r4 status ≥400/null stops that width immediately with no retry, `statusFail` separate from `lcpMissing`; `--ssr` outputs `ariaExpanded`·`refLinks`·`ld.question`, render outputs `ax=`). Reviewer rejects any doc value that only came from gitignored one-off code — every number feeding a target needs a raw file from the tracked script. Import Playwright from `@playwright/test` — plain `playwright` is not resolvable in this repo (check-density.mjs is broken by that).

Rule kept: no UA spoofing, no captcha solving, no form input/submission. Speed best values = cold 3-run medians only (reviewer rejected 1-run values in r1).

**How to apply:** budget loads per service up front, run `--robots-only` first, prefer SSR probe for blocked pages, record blocked screens with reason + block-page screenshot.
