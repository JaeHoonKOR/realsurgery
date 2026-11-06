# 08 specs — 분야별 정의서 작성·교차 검토 루프 (T-080 ~ T-088)

**단위**: 정의서 1개. 순서: 00-product → 10-design → 70-engineering → 30-data → 40-tracking → 50-seo-aeo → 20-content → 60-growth. (80-quality는 QUALITY.md를 링크)
**선행**: T-090 벤치마크 done (10-design부터).
**에이전트**: 작성 = `.claude/agents/spec-<name>.md`, 검토 = 다른 분야 owner 2명 + `.claude/agents/hiring-reviewer.md`

## ACT (정의서 1개당, 한 루프 안에서 작성→검토→수정→승인까지)
1. 오케스트레이터가 owner 서브에이전트를 띄운다. 입력: `docs/specs/README.md` 형식, `docs/specs/00-product.md`, `docs/BENCHMARK.md`, 기존 `docs/spec/screen-spec.md`, 해당 분야의 현재 코드(있으면).
2. owner가 초안 작성 → `docs/specs/<name>.md`. 형용사 대신 숫자·예시. 검수 체크리스트 포함.
3. 오케스트레이터가 **교차 검토 2명(sonnet)을 병렬**로 띄운다(README 배정표). 각자 "충돌 / 누락"만 **최대 10건**, 번호 목록. 제안은 "비차단" 절에 분리. hiring-reviewer는 00·90·T-088에만 추가로 띄운다.
4. (00·90·T-088에 한함) `hiring-reviewer` 서브에이전트: 채용 심사자 관점. (a) 이 정의서대로 만든 결과물이 강남언니·바비톡보다 나은가 (b) 공고 요건(SEO·AEO·GA4/GTM·검색광고·메타광고)이 이 정의서에서 드러나는가 (c) 채용하고 싶은가 — 아니오면 사유 3개.
5. owner가 차단 지적 반영(1라운드, 반영 못 하면 사유). 재확인은 `node scripts/lint-spec.mjs` + 교차 검토 1명(sonnet). **반려 상한 2회, 3회차는 approve + fix 후속**. 루프 1회(≤90분).
6. 다른 문서와의 충돌은 기록만 하고 T-088(화면 정의서 재조립 + 충돌 전수 점검)에서 일괄 수정한다.

## 검토 배정표
| 정의서 | 교차 검토 1 | 교차 검토 2 |
| --- | --- | --- |
| 00-product | spec-tech-lead | spec-content-lead |
| 90-deliverables | spec-seo-lead | spec-growth-lead |
| 95-legal-ops | spec-content-lead | spec-data-architect |
| 10-design | spec-content-lead | spec-tech-lead |
| 70-engineering | spec-data-architect | spec-analytics-lead |
| 30-data | spec-tech-lead | spec-analytics-lead |
| 40-tracking | spec-data-architect | spec-growth-lead |
| 50-seo-aeo | spec-content-lead | spec-analytics-lead |
| 20-content | spec-designer | spec-seo-lead |
| 60-growth | spec-analytics-lead | spec-product-lead(법무 시각) |
+ hiring-reviewer는 00-product·90-deliverables·T-088만.

## VERIFY
- [ ] README 공통 형식 6개 절 전부 존재
- [ ] 규칙 표에 형용사만 있는 행 0 (`scripts/lint-spec.mjs`: "적절한", "충분한", "깔끔한" 등 금지어)
- [ ] 교차 검토 2명 + hiring-reviewer 지적 전부 "반영" 또는 "사유" 표시
- [ ] 검수 체크리스트 항목 ≥ 10, 각 항목이 화면에서 확인 가능한 문장
- [ ] 1쪽 요약 정의서(10·20·30·60)는 ≤ 120줄
- [ ] 충돌하는 기존 문서 수정 커밋 포함

## REPORT
`backlog/log/<date>-spec-<name>.md`: 초안 → 지적 목록 → 반영 표 → 승인. TASKS `spec:<name>` done.
