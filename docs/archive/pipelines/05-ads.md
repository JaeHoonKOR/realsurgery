# 05 ads — 광고·검색 유입 성과 분석 루프

**단위**: 주 1회. 에이전트는 **분석·제안만**, 집행·예산 변경은 하지 않는다(needs-approval).
**에이전트**: `.claude/agents/ads-analyst.md`
**선행**: 사람이 광고 집행 시작 + CSV export를 `reports/ads/inbox/<week>/`에 둠.

## 입력 파일 (사람이 export)
| 파일 | 출처 | 필수 컬럼 |
| --- | --- | --- |
| meta.csv | 메타 광고 관리자 | campaign, adset, ad, impressions, clicks, spend, leads(결과), date |
| ga4-sessions.csv | GA4 탐색(세션 소스/매체×랜딩) | source, medium, campaign, landing_page, sessions, generate_lead |
| naver-sa.csv | 네이버 검색광고 | campaign, keyword, impressions, clicks, cost, date |
| leads.csv | A-01 export(마스킹) | lead_id, created_at, utm_*, landing_page, status |

## ACT
1. `scripts/ads-report.py <week>` — 4개 파일을 병합해 채널×시술 매트릭스 계산: 노출·클릭·CTR·CPC·세션·리드·CPL·예약확정률(leads.status). 결과 `reports/ads/<week>/metrics.csv`.
2. 전주 대비 변화율. 소재(ad)별·랜딩 변형(variant)별 CPL 순위.
3. 진단 규칙:
   - CPL이 평균의 1.5배 이상인 광고세트 → "중단 후보"
   - CTR 상위 20% + 랜딩 전환율 하위 20% → "랜딩 문제" (P-12 A/B 제안)
   - form_start 대비 generate_lead 50% 미만 → "폼 이탈" (build lane 작업 생성)
   - 리드 50건 미만 → 최적화 목표 InitiateCheckout 유지 권고
4. 다음 주 실험 1개 제안(가설·변경 1개·측정 지표·판정 기준). 예산 변경은 숫자로 제안만.
5. 리포트 `reports/ads/<week>/report.md`: 요약 5줄 → 매트릭스 → 소재 순위 → 진단 → 제안. 포트폴리오용 그대로 쓸 수 있는 형식.

## VERIFY
- [ ] 4개 입력 파일 모두 파싱 (누락 시 어떤 파일인지 명시하고 부분 리포트)
- [ ] 리드 합계가 leads.csv 건수와 일치 (±0)
- [ ] CPL = spend / leads 재계산 일치
- [ ] 제안에 비용 발생 항목은 전부 needs-approval 태그

## REPORT
report.md 경로 + 승인 필요 항목 목록을 TASKS.md에. review.

## 종료 조건
없음(상시). 4단계 게이트 "CPL 20% 개선" 판정 근거 제공.
