# 04 seo — 기술 SEO·AEO 점검 루프

**단위**: 전체 사이트 1회 (주 1회, 또는 배포 후). 
**에이전트**: `.claude/agents/seo-auditor.md`
**선행**: 배포 URL(`SITE_URL`) 확보.

## READ
`screen-spec.md` 6절 전체, 2절 URL 규칙.

## ACT
1. 크롤: `scripts/crawl.mjs $SITE_URL` → `reports/seo/<date>/pages.json` (status, title, description, canonical, h1, jsonld[], og, 내부링크 수, lastmod).
2. 검사 항목을 `reports/seo/<date>/issues.md`로:
   - title 60자 초과 / description 범위 밖 / canonical 누락·불일치 / H1 0개 또는 2개 이상
   - JSON-LD: P-03에 MedicalWebPage+MedicalProcedure+FAQPage+BreadcrumbList 4종 존재, P-05에 MedicalClinic, AggregateRating 발견 시 **치명**
   - sitemap.xml 수록 == 크롤 페이지 수, robots가 /admin·/consult/done·/my 차단
   - llms.txt 존재·최신
   - Lighthouse(모바일, `npx lighthouse --chrome-path=<playwright chromium 경로>`): LCP ≤ 2.5s, CLS ≤ 0.1 — 실패 페이지 목록
   - 고아 페이지 0, 깨진 내부 링크 0
3. 자동 수정 가능한 항목(메타 길이, canonical, sitemap 누락)은 브랜치 `fix/seo-<date>`에 수정 PR. 구조 변경이 필요한 항목은 TASKS.md에 build lane 작업으로 생성.
4. 순위 추적: `backlog/keywords.md`의 20개 키워드를 `reports/seo/rank.csv`에 (사람이 서치콘솔·서치어드바이저 CSV export → `reports/seo/inbox/`에 두면 파싱).
5. AEO 측정 템플릿 `reports/aeo/<week>.md` 생성(질문 20개 × 엔진 4개 표). 입력은 사람. 입력되면 `aeo_checks` upsert + 인용률 계산.

## VERIFY
- [ ] issues.md 치명 0건 (AggregateRating, canonical 오류, robots 오류)
- [ ] 수정 PR이 있으면 `pnpm build` 통과
- [ ] rank.csv·aeo 리포트에 이번 주 행 존재(데이터 없으면 "입력 대기"로 명시)

## REPORT
`reports/seo/<date>/summary.md`: 치명/경고/정보 건수, 전주 대비 변화, 상위 3개 조치. TASKS.md review.

## 종료 조건
없음(상시). 2단계 게이트 "색인 20페이지"와 4단계 AEO 측정에 데이터 공급.
