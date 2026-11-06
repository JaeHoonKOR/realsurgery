너는 realsurgery 프로젝트의 중간점검·개선 세션이다. 사람은 없다. 질문하지 말고 끝까지 진행해서 결과를 남겨라. 멈추는 조건은 "돌릴 작업이 없음(NOTHING_TO_DO)" 또는 "되돌릴 수 없는 결정(외부 발송·결제·삭제·외부 서비스 설정 변경)"뿐이다. 그 외의 모든 막힘은 우회하지 말고 원인을 고쳐서 진행한다.

## 0. 규칙
CLAUDE.md, docs/QUALITY.md, docs/pipelines/*.md를 먼저 읽고 그대로 따른다. 특히: 작업 경로 C:\rs, 한글 파일명 금지, 테스트를 약화해서 통과시키기 금지, [human-gate] 작업은 review에 두기, 비용 발생은 needs-approval.

## 1. 밤샘 결과 진단 (15분 이내)
- backlog/log/night-*.log 전체를 읽고 루프별로 "작업 / 결과 / 실패 원인"을 표로 정리해 backlog/log/midcheck-<날짜시각>.md 에 쓴다.
- backlog/TASKS.md에서 blocked, needs-key, spec-question, review 상태를 전부 목록화한다.
- git log --oneline -30, git status, 현재 브랜치·미머지 feat 브랜치를 확인한다. main이 빌드 통과 상태인지 pnpm build로 검증한다. 깨져 있으면 먼저 고친다.

## 2. 막힌 것 해소 (우선순위 순)
1. blocked 작업: 로그의 실패 원인을 읽고 근본 원인을 고친다(의존성 버전, 설정, 경로, 테스트 환경). 고친 뒤 todo로 되돌린다. 같은 원인이 반복되면 CLAUDE.md 또는 해당 파이프라인에 재발 방지 규칙을 1줄 추가한다.
2. review 상태(approve됐는데 done이 안 된 것): [human-gate]가 아니면 reviewer를 다시 돌려 approve 확인 후 done + main 머지.
3. spec-question: 스펙의 가장 단순한 해석으로 결정하고 결정 내용을 스펙 파일에 반영한다. 결정 로그를 midcheck 파일에 남긴다.
4. needs-key: 그대로 둔다(사람 몫). 단 mock 모드로 더 진행할 수 있는 부분이 있으면 진행한다.

## 3. 품질 회귀 점검 (done 작업 전부)
- done 상태의 모든 화면에 대해 QUALITY.md 4절 게이트를 다시 전부 실행한다. 하나라도 떨어졌으면 그 작업을 todo로 되돌리고 원인을 적는다.
- **배포 URL과 로컬(`npx serve out`, basePath 포함)을 playwright MCP로 직접 열어** M1 흐름을 끝까지 클릭한다. 저장된 스크린샷은 보지 않는다. 막히는 지점·텍스트만 있는 구간·클릭 불가 카드를 찾아 TASKS.md에 "fix:" P0 작업으로 추가한다.
- 콘솔 에러·경고 0인지 playwright로 전 화면 재확인.

## 4. 개선 루프 (턴 예산이 끝날 때까지 반복)
아래를 순서대로 반복한다. 한 사이클 = 작업 1건.
a. backlog/TASKS.md에서 선행이 done인 todo 중 우선순위가 가장 높은 1건을 PICK (fix: 작업이 있으면 그것부터).
b. 해당 파이프라인의 READ→ACT→VERIFY를 수행한다. VERIFY는 QUALITY.md 전체 포함, 통과할 때까지 반복.
c. reviewer 서브에이전트를 별도 컨텍스트로 띄워 재검증. approve면 main에 --no-ff 머지 후 git push origin main 시도(403이면 needs-key 기록). request-changes면 b로.
d. TASKS.md 상태 갱신, 로그 기록, 다음 사이클.
돌릴 todo가 없으면 "개선 탐색" 모드로 전환: 전 화면을 다시 열어 (1) Lighthouse 점수를 95 이상으로 올릴 수 있는 항목, (2) 접근성 경고(serious 미만 포함) 제거, (3) 카피·빈 상태·에러 메시지 다듬기, (4) 테스트 커버리지 90% 이상 — 이 순서로 fix: 작업을 스스로 만들어 처리한다. 그래도 할 게 없으면 마지막 줄에 NOTHING_TO_DO를 출력한다.

## 5. 종료 보고 (턴이 얼마 안 남았을 때 반드시 작성)
backlog/log/midcheck-<날짜시각>.md 하단에:
- 이번 세션에서 done으로 바뀐 작업, 새로 만든 fix: 작업, 남은 blocked/needs-key
- 사람이 아침에 해야 할 것 3줄 이내
- 다음 세션이 이어받을 첫 작업 ID
그리고 TASKS.md 맨 위 "사람 확인 필요" 섹션을 최신화한다. 미커밋 변경은 전부 커밋한다.
