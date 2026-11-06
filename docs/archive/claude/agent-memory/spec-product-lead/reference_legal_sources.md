---
name: reference-legal-sources
description: Where Korean statute text can actually be fetched for 95-legal-ops citations (law.go.kr fails, casenote works for 법률 only)
metadata:
  type: reference
---

- law.go.kr article pages render via JS; WebFetch returns only the title. Do not rely on it.
- casenote.kr works for statutes: `https://casenote.kr/법령/의료법/제56조`, `https://casenote.kr/법령/개인정보_보호법/제23조` (swap article number).
- casenote 404s for enforcement decrees (의료법 시행령 제23·24조) and 표시광고법; those were cited via 2차 자료 (medicaltimes ID=1162255, 2024-12 복지부 체크리스트 해설).
- Official Meta policy pages that fetch: transparency.meta.com/policies/ad-standards/restricted-goods-services/health-wellness.
- admedical.org (의협 의료광고심의위원회) failed TLS cert verification on WebFetch.
- Naver searchad official medical guide was not found; only agency blogs (inside.ampm.co.kr).

Related: [[project-95-legal-ops-constraints]]
