# 2026-10-25 spec — T-079 90-deliverables + 95-legal-ops

- 브랜치: `feat/T-079-deliverables-legal-ops` (feat/T-112-asset-pipeline 작업트리에서 분기, 커밋은 docs/specs·이 로그만)
- 파이프라인: docs/pipelines/08-specs.md (owner 작성 → 교차 검토 2명 + hiring-reviewer 병렬 → 1라운드 반영 → hiring-reviewer 재확인 + lint)
- 무인 모드(night run). 가정은 각 정의서 본문 "가정:" 줄에 기록.

## 90-deliverables (owner: spec-product-lead)
| 단계 | 결과 |
| --- | --- |
| 초안 v2 | 3-1 공고 요건 R0~R7, 3-2 날짜 마일스톤 M0(10-26)~M4(12-21), D1~D8 증거·담당·기한·통과 기준·폴백 |
| 교차 검토 | spec-seo-lead 9건, spec-growth-lead 12건 |
| hiring-reviewer r1 | **채용 안 함** — 경쟁 비교 선택 항목, 검색광고 운영 증거 없음, 네이버 SEO가 인증에서 멈춤 (11건) |
| 반영 v3 | 33건 중 전부 반영 31, 부분 반영 2(#13 상세·JSON-LD 미확인 → T-090, #15 플레이스 해당 없음). 반영 표 = 정의서 6절 |
| lint | `node scripts/lint-spec.mjs` exit 0 (v2·v3) |
| hiring-reviewer r2 | **approve** — 사유 3개 해소, 반영 표 표본 8/8 확인 |

후속: T-088 체크리스트 네이버 항목 정합·외부 링크 수 기준 / T-090 바비톡 "AI 검색"은 /search 링크, 상세·JSON-LD 실측 / T-080 D5 오가닉판에 네이버 서치어드바이저 열 여부.

## 95-legal-ops (owner: spec-product-lead)
| 단계 | 결과 |
| --- | --- |
| 초안 v2 | 출처 11종(법령·공식 정책·2차 등급), 금지 표현 B01~B12, 소재 검수 3-2(10항목), 거절 대응 R1~R7, 응대 SLA, 개인정보, is_demo, 자문 전 표시 S0~S4 |
| 교차 검토 | spec-content-lead 14건, spec-data-architect 14건 |
| hiring-reviewer r1 | **채용 안 함** — 한글 slug가 픽셀 URL로 유출, 사이트 자체 의료광고 여부 미판정, CPL 원장 미정 (11건) |
| 반영 v3 | 39건 전부 반영(H6·H7 부분: 통신판매업 신고는 K10 변호사 확인, 네이버·구글 항목은 3-2b로 분리). 3-11 사이트 의료광고 판정, 3-12 30-data 요건 DR1~DR10, 3-13 사업자 정보 신설 |
| lint | exit 0 (v2·v3) |
| hiring-reviewer r2 | **approve** — 사유 3개 해소, 반영 표 표본 8/8 확인 |

후속: T-083 사이트 전역 `referrer=strict-origin` + 픽셀 dl·rl 디코딩 검사, P-12 쿼리 제거 전 fbc 생성 순서 / T-088 90 R7 `/lp/eye-2026-11`(K16)·D5-creatives.md / T-080 B13 "부터" 정규식 오탐 허용 예문 / T-108 /privacy GA4 14개월 = 실제 설정 캡처.

## 남은 리스크
1. 법령 근거 일부(시행령 제24조, 복지부 체크리스트, 네이버 규정)는 2차 출처 — 원문 미확보. 변호사 검토(K10)는 비용 발생 → needs-approval.
2. 두 정의서 충돌 기록 37건(90: 19, 95: 18)은 T-088에서 일괄 정리 전까지 screen-spec과 불일치 상태.
3. 00-product·BENCHMARK 부재 상태로 작성 — T-080/T-090 확정 시 날짜·경쟁 수치 갱신 필요.
