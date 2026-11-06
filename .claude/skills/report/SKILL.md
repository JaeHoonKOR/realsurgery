---
name: report
description: 하루치 사이클 결과를 사용자에게 보고하고 화면 판정(좋다/별로 + 이유)을 받아 평가 보정 예시로 쌓는다. /cycle이 끝날 때 자동으로, 또는 사용자가 /report로 실행한다.
---
## 1. 모으기
- `git log --oneline` 중 오늘 사이클 브랜치의 커밋, `harness/progress.md` 오늘 항목, `harness/features.json` 통과 수/전체 수.
- 오늘 통과한 기능마다 evaluator 스크린샷(375·1280) 경로와 점수.
- `docs/product/DECISIONS.md` 대기 항목.
- `node scripts/metrics.mjs` — 최근 7일 활성·신규 사용자, 세션, 공유 유입, share 이벤트(지난주 대비). 키가 없으면 needs-key 한 줄이 나온다. 그대로 옮긴다.

## 2. 보고 (채팅, 20줄 이내)
```
이용자: 활성 n (지난주 대비 ±n%) · 공유 유입 n · share n   ← metrics.mjs, 키 없으면 "needs-key (D-3)"
오늘: 통과 n개 (전체 통과 a/b) · 막힘 m개
- F-00x <기능> — 점수 디자인 n · 독창성 n · 만듦새 n
막힌 것: F-00y — <이유 한 줄>
결정 필요: D-n <한 줄>
미리보기: http://localhost:3000/realsurgery/<경로>
```
스크린샷은 `SendUserFile`로 함께 보낸다(기능당 375·1280 두 장).

## 3. 판정 받기
화면이 바뀐 기능마다 `AskUserQuestion`으로 묻는다(한 번에 4개까지):
- 질문: "<기능> 화면은 어떤가요?" · 선택지: 좋다 / 괜찮다 / 별로다. 사용자가 이유를 적으면 그대로 받는다.
- 결정 필요 항목이 있으면 같은 호출에 함께 묻는다.

## 4. 기록
- 판정마다 `docs/design/calibration/YYYY-MM-DD-<기능id>.md`를 쓴다(형식은 그 폴더 README). 사용자 판정 점수: 좋다 = 4, 괜찮다 = 3, 별로다 = 2. 스크린샷을 같은 이름으로 복사한다.
- "별로다"인 기능은 `harness/features.json`에서 되돌리지 않는다. 대신 사용자 이유를 progress.md에 적고, 사용자에게 `/define features`로 개선 기능을 추가할지 묻는다.
- DECISIONS 답변은 해당 항목을 지우고 결과를 BRIEF·features 등 해당 문서에 반영하도록 다음 /define에 넘긴다.
- 커밋: `docs(report): YYYY-MM-DD 판정 n건`.
