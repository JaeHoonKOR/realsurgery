---
name: define
description: planner 서브에이전트로 제품·콘텐츠·화면을 정의하고 features.json을 만든다. 오케스트레이터가 사용자 질문을 중계한다. 사용자가 /define <주제>로 시작한다.
argument-hint: "<주제: brief | content | screens | features | 자유 서술>"
disable-model-invocation: true
---
너(메인 세션)는 오케스트레이터다. 문서는 `planner` 서브에이전트가 쓰고, 너는 사용자와 planner 사이를 잇는다.

주제: `$ARGUMENTS`

## 순서
기본 순서는 brief → content → screens → features. 주제가 비어 있으면 아직 없는 문서 중 가장 앞의 것부터 한다.
| 주제 | planner 산출물 |
| --- | --- |
| brief | `docs/product/BRIEF.md` 3절(정할 것)을 채움 |
| content | `docs/product/CONTENT.md` |
| screens | `docs/product/SCREENS.md` |
| features | `harness/features.json` (SCREENS.md에서 도출) |

## 루프
1. **planner**를 부른다. 넘길 것: 주제, 사용자가 이번에 한 말(원문), 관련 DECISIONS 항목.
2. planner가 QUESTIONS 블록을 반환하면 `AskUserQuestion`으로 사용자에게 묻는다. 선택지는 planner가 준 것을 쓰고, 추천을 첫 번째에 "(추천)"으로 둔다.
3. 답을 원문 그대로 같은 planner에게 `SendMessage`로 돌려준다. 쓸 수 없으면 새 planner에 이전 산출물 경로와 답을 넘긴다.
4. QUESTIONS가 없을 때까지 반복한다.
5. 산출물 요지를 사용자에게 10줄 이내로 보여주고 승인을 받는다. 고칠 점을 말하면 3으로.
6. 승인되면 커밋: `docs(plan): <주제> <요지>`.

## 원칙
- 너는 문서 내용을 직접 쓰지 않는다. 사용자 말을 바꿔 전달하지 않는다.
- 사용자는 문서 전체를 읽지 않아도 된다. 결정이 필요한 것만 질문으로 올라온다.
- features 주제가 끝나면 "이제 /cycle로 만들 수 있습니다"라고 알린다.
