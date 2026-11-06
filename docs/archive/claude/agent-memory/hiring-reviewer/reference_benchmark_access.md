---
name: reference-benchmark-access
description: How to open 강남언니·바비톡 for benchmark comparison in this project, which competitor pages are the like-for-like comparison targets for P-03, and what they showed on 2026-10-25
metadata:
  type: reference
---

- CLAUDE.md limits playwright to localhost and the deployed URL, so open competitor pages with WebFetch. Bash curl to competitor sites was permission-denied (2026-10-25), so raw HTML and JSON-LD can't be checked.
- gangnamunni.com returns a 301 redirect to https://unni.app/. Fetch unni.app directly.
- **Like-for-like targets for P-03.** Don't compare our guide page to their home pages; specs keep making that mistake.
  - 강남언니: content pages `unni.app/contents/{uuid}`. The sitemap index is `unni.app/sitemap.xml`, with 61 gz child sitemaps. `st_kr_contents_1.xml.gz` holds 255 URLs. WebFetch saves .gz files as .bin; decompress them with node zlib.
  - 바비톡: keyword pages `babitalk.com/search?keyword=쌍꺼풀`, listed in sitemap-search-0.xml (눈밑지방재배치 and 눈매교정 are there too).
- **unni.app/contents/3f9d9338-d3d4-80da-916a-f41425fe332d, observed 2026-10-25:**
  - Shows "업데이트: 2026.10.23".
  - Footnotes 1–3 cite 2026 papers in Aesthetic Surgery Journal, Cureus, and JCMFS.
  - Has a "5. 자주 묻는 질문(FAQ)" section with 2 questions.
  - Has an info/no-ad disclaimer.
  - CTA is "앱 다운로드 받기". No author or doctor name.
  - So 강남언니 already has FAQ, updated date, and citations at the page level.
  - Re-fetched later on 2026-10-25 (T-081 review). The same page also has:
    - "세 문장 요약": an H4 with 3 bullets at the top, not a boxed panel.
    - "목차": a numbered table of contents with 5 entries.
    - 1 AI illustration, captioned as AI-made.
    - 0 charts.
    - 3 app/coupon banners.
  - Specs and BENCHMARK that say "요약 박스 0" are stale. Our summary has to differ visually (box, copy, 3중 일치).
- **unni.app/contents/23bd9338-d3d4-803d-af5b-da1273ec67d1 (쌍꺼풀 회복기간), observed 2026-10-25:** "업데이트: 2026.07.06", 0 footnotes, 0 FAQ, evidence = 100-person survey. This is an older-format page. 00-product v2 used it as O1 to claim "강남언니 학술 각주 0·FAQ 0". The 10-23 page above contradicts that claim. Always check a spec's competitor page against the newest content format.
- **unni.app/events/85230, re-fetched later on 2026-10-25:** WebFetch returned a clinic-style page.
  - Procedure prices: 0.
  - Ratings: 9.5 with "후기 640개"; the doctor shows 9.4 with 1,807 reviews.
  - 4 badge icons, for example "의료진 실명 공개".
  - A manual gallery (1/3), a static map image, and an address "복사" button.
  - Login gates for reviews and for 상담신청.
  - The content may vary between fetches.
- **unni.app/events/85230 (하니성형외과 쌍꺼풀), earlier fetch on 2026-10-25:** 1,100,000원 / 2,200,000원→1,650,000원 (25%), no price source or date, rating 9.5 (490), reviews behind login, 89,000원 app coupon.
- **babitalk.com/search?keyword=쌍꺼풀, observed 2026-10-25:**
  - The page is a shell. It has no summary, price, or FAQ.
  - 시술후기 and 발품후기 sit behind "로그인 및 회원가입 하기". There is also a "더 많은 시술정보 앱에서 보기" link.
  - The real differentiator here is no signup and no app required.
- **Home pages, observed 2026-10-25:**
  - 강남언니 cards show "VAT 포함" with a price and discount (for example 45%), a 10-point rating with count, and an "앱 다운로드" CTA plus "앱 설치만 해도 89,000원 쿠폰팩". It has 14 procedure categories.
  - 바비톡 cards show 40–49% discounts, a 5-point rating with count, and a "카톡상담" button. "궁금할 땐 AI 검색!" is a link to /search, not an input field. robots.txt lists 9 sitemaps.
- **Legal:**
  - Both footers show business registration, a 통신판매업 number, and "통신판매의 당사자가 아니므로" text.
  - 바비톡 also shows an ISMS badge (2024.02.07–2027.02.06).
  - Neither shows a 심의번호, a "광고" label, or a cookie banner.
- Re-verify before you cite these. Competitor UIs change.
