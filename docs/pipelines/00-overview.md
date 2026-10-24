# 파이프라인 전체 구조

6개 파이프라인이 `backlog/TASKS.md`를 공유 큐로 쓰고, 오케스트레이터가 순서와 의존성을 관리한다.

```
                 ┌──────────────── orchestrator (매 루프 시작) ────────────────┐
                 │  TASKS.md 읽기 → 게이트 확인 → lane별 todo 분배 → 요약 보고  │
                 └──────┬─────────┬─────────┬─────────┬─────────┬────────────┘
                        ▼         ▼         ▼         ▼         ▼
                     build    tracking   content     seo       ads
                   (화면)    (GTM/GA4)   (MDX)    (기술SEO)  (광고분석)
                        │         │         │         │         │
                        └─────────┴────┬────┴─────────┴─────────┘
                                       ▼
                                    reviewer  (모든 review 상태 건 검수 → 사람 게이트로)
```

| 파이프라인 | lane | 담당 | 입력 | 출력 | 루프 단위 |
| --- | --- | --- | --- | --- | --- |
| 01 build | `build` | 화면 구현 | screen-spec 4절, 8절 | Next.js 페이지·컴포넌트·마이그레이션 | 화면 ID 1개 |
| 02 tracking | `tracking` | 이벤트·GTM·CAPI | screen-spec 5절, 7절 | dataLayer 코드, GTM export JSON, CAPI 핸들러 | 이벤트 1개 |
| 03 content | `content` | 시술 가이드 MDX | screen-spec 6절 AEO 규칙 | MDX 1편 + FAQ + JSON-LD 데이터 | 시술 1개 |
| 04 seo | `seo` | 기술 SEO 점검·수정 | 배포 URL, 6절 | 점검 리포트, 수정 PR | 주 1회 전체 사이트 |
| 05 ads | `ads` | 광고·검색 성과 분석 | GA4·메타 CSV(사람이 export) | 주간 리포트, 다음 실험 제안 | 주 1회 |
| 06 reviewer | `review` | 스펙 대조 검수 | review 상태 작업 | 승인/반려 코멘트 | 작업 1건 |

## 의존성 (게이트)
- build P-06·P-07 완료 → tracking generate_lead 착수.
- build P-03 완료 → content 첫 MDX 착수 (템플릿이 있어야 함).
- 첫 Pages 배포 성공(T-100의 Actions 통과, 에이전트 확인) → seo 루프 시작.
- T-001 키 투입(사람) → tracking·seo의 needs-key 항목 자동 재검증.
- 광고 집행 승인(사람, T-500) → ads 루프 시작.
- 모든 lane: 선행 작업이 `done`이 되기 전까지 다음 의존 작업 착수 금지. reviewer approve → 오케스트레이터가 `done`으로 바꾼다. `[human-gate]` 작업만 사람이 `done`으로 바꾼다(CLAUDE.md 루프 프로토콜 6).

## 상태 전이
`todo → doing → review → done` / `doing → blocked` / `todo → needs-approval` / `any → spec-question`

## 실행 방법 (Claude Code)
```
# 오케스트레이터 1회 (순차 기본, 병렬은 "/loop --parallel"). 무인 반복은 run-night.ps1
claude -p "/loop" --permission-mode acceptEdits

# 특정 lane만
claude -p "/build P-03"
```
서브에이전트 정의는 `.claude/agents/`에, 슬래시 명령은 `.claude/commands/`에 있다.
