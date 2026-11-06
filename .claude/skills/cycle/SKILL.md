---
name: cycle
description: 오케스트레이터 루프. features.json의 미통과 기능을 하나씩 builder → evaluator로 돌려 통과시키고 커밋한다. 사용자가 /cycle [기능 수]로 시작한다.
argument-hint: "[통과시킬 기능 수, 기본 3]"
disable-model-invocation: true
---
너(메인 세션)는 오케스트레이터다. 직접 구현하거나 직접 판정하지 않는다. 구현은 `builder`, 판정은 `evaluator` 서브에이전트가 한다.
너의 일은 순서 정하기, 서브에이전트에 넘길 정보 고르기, 상태 파일 기록, 커밋이다.

목표 기능 수: `$ARGUMENTS` (비어 있으면 3).

## 1. 오리엔트
1. `pwd`가 저장소 루트(`/c/rs`)인지 확인한다.
2. `git status --short`, `git log --oneline -15`, `harness/progress.md` 위쪽 3개 항목을 읽는다.
3. 작업 브랜치: 현재 브랜치가 `cycle/`로 시작하지 않으면 `git switch -c cycle/<오늘 YYYY-MM-DD>`(이미 있으면 switch). 커밋 안 된 변경이 있으면 무엇인지 확인하고, 이전 사이클의 잔여물이면 사용자에게 묻는다.
4. `node harness/init.mjs`로 개발 서버와 스모크 확인. 실패하면 새 기능보다 먼저 고친다(builder에게 "스모크 실패 수정"을 맡긴다).
5. `harness/features.json`을 읽는다. 비어 있으면 "기능 목록이 없습니다. /define을 먼저 실행하세요."라고 말하고 끝낸다.

## 2. 기능 고르기
- `passes: false` 중 `priority`가 가장 작은 것. 같은 사이클에서 이미 막힌(blocked) 기능은 건너뛴다.
- progress.md에 같은 기능이 지난 사이클에 막혔다고 적혀 있으면, 그 이유가 해소됐는지(DECISIONS 답변 등) 보고 아니면 건너뛴다.

## 3. builder → evaluator 루프 (기능 1개, 최대 3라운드)
1. **builder**를 부른다. 넘길 것: 기능 JSON 그대로, 관련 SCREENS.md 절 위치, 이전 라운드가 있으면 evaluator의 BUGS 전문. 지난 사이클 progress 메모 중 이 기능 관련 줄.
2. builder 반환에서 "바뀐 파일", "확인할 URL"만 뽑는다.
3. **evaluator**를 새로 부른다(매 라운드 새 인스턴스). 넘길 것: 기능 JSON, URL, 바뀐 파일 목록. builder의 설명·자가 확인 결과는 넘기지 않는다.
4. VERDICT가
   - **PASS** → 4절로.
   - **FAIL** → BUGS를 같은 builder에게 `SendMessage`로 돌려준다(맥락 유지). SendMessage를 쓸 수 없으면 새 builder에 BUGS와 바뀐 파일 목록을 넘긴다. 다음 라운드.
5. 3라운드 FAIL, 또는 builder가 "사용자 결정 필요"를 반환 → 그 기능은 이번 사이클 blocked. 변경은 `git stash push -m "<기능id> blocked"`로 치우고, progress에 이유를 적고, 필요하면 DECISIONS.md에 1줄 추가(5건 이하 유지). 다음 기능으로.

## 4. 통과 처리
1. `harness/features.json`에서 그 기능의 `passes`만 `true`로 바꾼다(다른 필드는 hook이 막는다).
2. `harness/progress.md` 맨 위에 항목 추가(형식은 `harness/README.md`).
3. 커밋: `feat(<기능id>): <description 요약>` + 본문에 evaluator 점수 1줄. 커밋 메시지 끝에 저장소 규칙의 Co-Authored-By 줄.
4. evaluator가 남긴 375·1280 스크린샷 경로를 기억해 둔다(/report에서 사용자에게 보여준다).

## 5. 끝내기
다음 중 하나면 멈춘다: 목표 기능 수 통과, 미통과 기능 소진, 연속 2개 blocked, 사용량 한도 경고.
멈추면 `/report`의 절차대로 보고를 쓰고 사용자 판정을 받는다.

## 원칙
- 서브에이전트에게는 필요한 것만 넘긴다. 특히 evaluator는 구현자의 추론을 보지 않아야 한다.
- 네 컨텍스트에는 서브에이전트의 요약만 둔다. 파일 덤프·긴 로그를 읽지 않는다. 사이클이 길어져도 상태는 progress.md와 git에 있으므로 이어서 할 수 있다.
- 기능 목록·steps를 바꾸고 싶어지면 직접 바꾸지 말고 사이클을 멈추고 사용자에게 `/define`을 제안한다.
- 비용이 드는 행동, 외부 발송, main 머지·push는 하지 않는다(`/release`는 사용자만 실행).
