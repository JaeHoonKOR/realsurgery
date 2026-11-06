# 기능 계약서

기능 1개 = `harness/contracts/<기능id>.md` 1개. 구현 전에 builder가 쓰고, evaluator가 검토해 합의한다.
근거: Anthropic [Harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps) — 코딩 전에 generator가 무엇을 만들고 어떻게 검증할지 제안하고, evaluator와 합의한 뒤 구현한다.

## 규칙
- `features.json`의 steps는 바닥이다. 계약은 steps를 빼거나 약하게 바꿀 수 없고, 더 구체적인 기준만 더한다.
- evaluator는 판정 때 steps + 계약의 검증 기준 + RUBRIC으로 채점한다.
- 합의되면 오케스트레이터가 맨 아래에 `합의: YYYY-MM-DD evaluator 라운드 n` 줄을 붙인다. 이 줄이 없으면 hook이 통과 처리를 막는다.
- 검토는 최대 2라운드. 2라운드에도 합의가 안 되면 오케스트레이터가 차이를 사용자에게 묻는다.
- 구현 중 계약을 바꿔야 하면 바꾼 부분을 다시 evaluator에게 검토받는다(`합의:` 줄을 지우고 새로 받는다).

## 양식
```
# F-00x <기능 설명>

## 만드는 것
- 화면·경로: /realsurgery/...
- 들어가는 것: (구체적으로)
- 들어가지 않는 것: (이번 기능 범위 밖)

## 검증 기준 (steps 각각 + 추가)
1. <steps 1을 구체화> — 375·1280에서 <관찰 가능한 결과>
2. ...
- 추가: <예: 빈 데이터일 때 빈 상태 일러스트, 뒤로 가기 시 스크롤 위치 유지>
- 트래킹: <이벤트 이름과 파라미터, 없으면 "없음">
- 공유: <OG 제목·설명·이미지, 공유 버튼 동작, 공유 대상이 아니면 "해당 없음">
- 법: <이 화면에 나오는 문장 중 출처가 필요한 것>

## 디자인 방향 (category가 screen일 때)
- 분위기·참고 방향 한두 줄, SCREENS.md 시각 언어와의 관계
- 목표 점수: 디자인 완성도 4 · 독창성 4

합의: 2026-11-06 evaluator 라운드 1
```
