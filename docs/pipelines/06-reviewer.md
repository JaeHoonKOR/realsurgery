# 06 reviewer — 스펙 대조 검수 루프

**단위**: TASKS.md 상태 `review` 1건. 작업을 만든 에이전트와 **다른 컨텍스트**에서 실행한다(자기 채점 금지).
**에이전트**: `.claude/agents/reviewer.md`

## READ
해당 작업의 로그 파일 + 스펙의 해당 절 + 변경 diff.

## ACT
1. 스펙 표의 각 행을 체크리스트로 변환해 diff·스크린샷과 1:1 대조.
2. 해당 파이프라인 VERIFY 항목과 `docs/QUALITY.md` 1절 스크립트를 **직접 재실행**. 로그의 "통과" 주장을 믿지 않는다.
2-1. 스크린샷(375·1280·상태별)을 **Read로 열어** QUALITY.md 3절을 항목별 대조. 위반은 요소·좌표·수정안을 적는다. "템플릿 느낌"이면 반려.
3. 공통 위반 탐지: 하드코딩 태그, 개인정보, 금칙어, AggregateRating, 비용 발생 코드, 저장소 밖 경로.
4. 판정:
   - **approve**: 전 항목 통과 → 오케스트레이터가 `done`으로 (`[human-gate]`는 `review ✔ reviewer`로 두고 사람 대기)
   - **request-changes**: 누락 행·실패 항목을 번호 목록으로 → 상태 `todo`로 되돌리고 원 lane에 재할당. 반려 횟수 제한 없음, 단 같은 사유 5회 반복 시 `blocked`.

## REPORT
`backlog/log/<date>-reviewer-<task>.md`: 판정, 대조표(스펙 행 / 결과 / 증거 경로), 반려 사유.

## 종료 조건
없음(상시).
