# 06 reviewer — 스펙 대조 검수 루프

**단위**: TASKS.md 상태 `review` 1건. 작업을 만든 에이전트와 **다른 컨텍스트**에서 실행한다(자기 채점 금지).
**에이전트**: `.claude/agents/reviewer.md`

## READ
해당 작업의 로그 파일 + 스펙의 해당 절 + 변경 diff.

## ACT
1. 스펙 표의 각 행을 체크리스트로 변환해 diff·스크린샷과 1:1 대조.
2. 해당 파이프라인 VERIFY 항목을 **직접 재실행**(테스트·빌드·스크립트). 로그의 "통과" 주장을 믿지 않는다.
3. 공통 위반 탐지: 하드코딩 태그, 개인정보, 금칙어, AggregateRating, 비용 발생 코드, 저장소 밖 경로.
4. 판정:
   - **approve**: 전 항목 통과 → TASKS.md에 `review ✔ reviewer` 표시(사람이 done으로)
   - **request-changes**: 누락 행·실패 항목을 번호 목록으로 → 상태 `todo`로 되돌리고 원 lane에 재할당. 같은 작업 3회 반려 시 `blocked`.

## REPORT
`backlog/log/<date>-reviewer-<task>.md`: 판정, 대조표(스펙 행 / 결과 / 증거 경로), 반려 사유.

## 종료 조건
없음(상시).
