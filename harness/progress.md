# 진행 기록

최신이 위. 항목 형식은 `harness/README.md`.

## 2026-11-06 · harness · 회귀 게이트·공유 기준·이용자 지표 + 시험 실행
- 결과: 기능별 회귀 테스트(`tests/e2e/features`, CI 배포 게이트) · RUBRIC "공유" 기준 · evaluator 트래킹/OG 확인 · `scripts/metrics.mjs`(GA4, 키 없으면 needs-key) · 개발 서버 `.next-dev` 분리
- builder 시험: v2 lib 3개 단위 테스트 → 커버리지 99.6%, `formatManwon` 억 경계 반올림 버그 수정
- evaluator 시험(현재 홈, 시험용 F-000): FAIL — 시술 이름이 링크 아님·라우트 없음, og:image 배포본 404, 독창성 2. 금지 표현 "최저가"는 고침
- 메모: 홈은 `/define` 뒤 새로 만든다. 배포본 og:image 404는 main 재배포 후 다시 확인

## 2026-11-06 · harness · v3 하네스 구축
- 결과: v2 하네스(에이전트 17개·파이프라인 9개·정의서 6종)를 `docs/archive/`로 옮기고, 오케스트레이터 1세션 + planner·builder·evaluator 구조로 교체
- 상태: features.json 비어 있음. 다음은 `/define brief` → content → screens → features
- 메모: 앱 코드(app·components·lib·data·scripts·tests)는 v2 그대로. 홈은 임시 화면이라 화면 정의 뒤 다시 만든다
