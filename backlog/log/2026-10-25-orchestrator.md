# 2026-10-25 orchestrator /loop (순차)

- PICK: T-100 (build, P0, 반려 1회 후 todo). review 상태 건 없음.
- ACT: builder → `feat/T-100-scaffold` 05a09fd (check-tokens hex 예외 수정 + 회귀 테스트 40건, 인라인 style 숫자 검사, workflow 권한 deploy job 분리, pages.yml YAML 파싱 오류 수정, fonts.css 주석). 로그 `2026-10-25-builder-T-100.md`.
- REVIEW: reviewer APPROVE (r2). lint/typecheck OK, test 64/64, build OK, a11y 2/2, e2e 11+1skip, LH 99/100/100/100. 로그 `2026-10-25-reviewer-T-100-r2.md`.
- MERGE: main `--no-ff` e11d20d, `pnpm build` 통과, `git push origin main` 성공(403 해소 → T-001 토큰 항목 체크).
- DEPLOY: Actions run 40107146392 성공(build·deploy), https://jaehoonkor.github.io/realsurgery/ HTTP 200 → seo 게이트 충족.
- TASKS.md: T-100 → done. 리뷰 후속 권고 4건을 T-100b 비고로 이관.

남은 리스크
1. Actions 경고: Node 20 기반 액션 deprecated(Node 24로 강제 실행 중) — 액션 메이저 버전 업 필요(차기 build 작업).
2. check-tokens 사각지대(data-id, 명명색, lib/·MDX 범위) — T-100b에서 처리 예정.
3. 작업 트리에 사람이 수정한 미커밋 파일(.claude/agents/*, CLAUDE.md, docs/* 등)이 main 위에 그대로 남아 있음 — 오케스트레이터는 커밋하지 않음.

---

# 2026-10-25 orchestrator /loop #2 (순차)

- PICK: T-100b (build, P0, 선행 T-100 done). review 상태 건 없음. 후보 T-109·T-112(P0)·T-400(P1)보다 목록 우선.
- ACT: builder → `feat/T-100b-common-components` 16b49c0 (공통 컴포넌트 6종, 더미 시드 시술10·병원3·칼럼3, 빌드 JSON, check-tokens 후속 4건, 액션 메이저 업). 로그 `2026-10-25-builder-T-100b.md`.
- REVIEW: reviewer **REQUEST-CHANGES**. 게이트 7종 통과(test 205/205, a11y 8/8, e2e 45+5skip, LH 99/100/100/100). 사유: Breadcrumb "홈" 링크 12×44px(44px 터치 타깃 위반) + 터치 타깃 e2e 범위 부족. 로그 `2026-10-25-reviewer-T-100b.md`.
- TASKS.md: T-100b → todo(반려 사유 기록). builder 제기 spec-question 5건을 T-003~T-007로 "사람 확인 필요"에 등록.

남은 리스크
1. workflow 액션 신규 메이저 태그 존재 미검증 — 머지 전 확인 안 하면 main 배포 실패 가능.
2. 가상 병원명 실존 여부는 builder 검색에만 의존 — 재작업 때 재검색 필요.
3. 미구현 화면 링크 숨김으로 배포 홈이 로고·배너·푸터뿐 — T-103/T-105 이후 자동 노출.

---

# 2026-10-25 orchestrator /loop #3 (순차)

- PICK: T-100b (build, P0, 반려 1회 후 todo). review 상태 건 없음.
- ACT: builder → 39a4ad0 (브레드크럼 "홈" 48×44, 배너 내 개인정보 링크 44px, 터치 타깃 테스트를 보이는 전 인터랙티브 요소로 확대 `tests/e2e/touch-targets.ts`, 배너를 하단바 위로, tsconfig 정리, 마이그레이션 policy drop-if-exists). 액션 태그 4종 존재 확인. 로그 `2026-10-25-builder-T-100b-r2.md`.
- REVIEW: reviewer **APPROVE** (r2). lint/typecheck OK, test 205/205, build OK(103 kB), a11y 8/8, e2e 47+7skip, LH 99/100/100/100. 가상 병원명 카카오맵·네이버 검색 0건. 로그 `2026-10-25-reviewer-T-100b-r2.md`.
- MERGE: main `--no-ff` 54babba, `pnpm build` 통과, push 성공.
- DEPLOY: Actions run 40113495392 성공, 배포 URL HTTP 200.
- TASKS.md: T-100b → done. T-008(네이버 지도 병원명 확인, human) 추가. T-109 비고에 db push 순서·마이그레이션 첫 실행 검증 이관.

남은 리스크
1. 마이그레이션 SQL은 정적 검토만 — T-109 `db push`가 첫 실행.
2. 소형·가로 화면 첫 방문 시 배너+하단바가 화면 67~89% 차지 — 실제 화면(T-103/104/106)에서 재확인.
3. 하단바 높이 72px가 3곳에 하드매칭 — T-111에서 변수화.

## /loop (T-103)
- builder: T-103 P-03 구현 → `feat/T-103-procedure-guide`@88145a2 (+로그 598db52), 턴 한도로 1회 재개.
- reviewer: REQUEST-CHANGES — ① 외부 .rsc.js 로드 실패 시 페이지 공백 ② externalize-rsc 무매치 시 빌드 무사 통과 ③ MDX 각주가 문장 근거 아님. 게이트는 전부 통과.
- TASKS: T-103 → todo(반려 사유 기록), spec-question T-012(검증 전 가이드 공개 여부) 추가. 머지 없음.

## /loop (T-103 r2)
- PICK: T-103 (build, P0, 반려 1회 후 todo). review 상태 건 없음.
- ACT: builder가 46630ed(출처 20개를 문장별 근거 페이지로 교체, 가격은 "검증 전 예시 데이터"+MD-REVIEW), cc9b59d(payload 실패 시 hydration 보류·재시도 1회·정적 HTML 유지, 0/부분 매치면 빌드 실패), ec4a55f(로그) 커밋. 턴 한도로 1회 재개. 로그 `2026-10-25-builder-T-103-r2.md`.
- REVIEW: reviewer **REQUEST-CHANGES** (r2). 게이트 전부 통과, ①② 해결. 사유: 요약 박스 값(JSON-LD)이 본문·FAQ·출처와 모순(사각턱·광대·눈매교정) 또는 출처 없음(토닝·실리프팅·앞트임). 출처 검증 스크립트가 gitignore된 `test-results/`에 있음. 로그 `2026-10-25-reviewer-T-103-r2.md`.
- TASKS: T-103 → todo(반려 사유·권고 R1~R5 기록). 머지 없음. 새 spec-question 없음.

남은 리스크
1. 박스↔본문 불일치를 잡는 자동 검사가 없어 같은 유형이 다시 생길 수 있음 → 재작업에서 check-triple 확대.
2. hydration 보류가 Next 내부 동작에 의존 — `"next": "15"` 범위 지정이라 업그레이드 시 깨질 수 있음(R1).
3. 실리프팅 가이드는 대부분 "검증 전" — 공개 여부는 T-012 결정에 달림.
