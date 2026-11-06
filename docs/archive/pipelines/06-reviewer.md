# 06 reviewer — 실사용 흐름 검수 루프 (v2)

**단위**: TASKS.md 상태 `review` 1건. 작업을 만든 에이전트와 **다른 컨텍스트**에서 실행(자기 채점 금지).
**에이전트**: `.claude/agents/reviewer.md` (playwright MCP 필수)
**원칙**: 저장된 스크린샷·로그의 "통과" 주장은 증거가 아니다. **직접 열고, 직접 클릭하고, 직접 센다.**

## READ
작업 로그, 스펙 해당 절, `docs/layouts/<ID>.md`(레이아웃 명세), `docs/BENCHMARK.md`, diff.

## ACT
1. 레이아웃 명세 단계 리뷰(명세만 올라온 경우): BENCHMARK 대조표가 채워졌는지, 섹션마다 비주얼·인터랙션·데이터가 구체적인지, 3초 규칙·밀도 기준을 설계상 만족하는지. 미달이면 반려(구현 시작 금지).
2. 구현 리뷰:
   a. 브랜치 체크아웃 → `pnpm build` → `npx serve out -l 3100`(정적 export는 `pnpm start` 불가) → **basePath 포함 경로**(`http://localhost:3100/realsurgery/`)를 playwright MCP로 375×812·1280×800 각각 연다. 로컬은 되고 배포는 404인 패턴을 여기서 잡는다.
   b. **M1 흐름을 처음부터 클릭**한다: 메인 → (검색 또는 시술 카드) → 시술 가이드 → (병원 카드 또는 중간 CTA) → 병원 상세 → 상담 폼 1단계 → 2단계 → 완료. `tests/e2e/flow.spec.ts`도 같은 경로를 자동 검사한다. 해당 작업 구간뿐 아니라 그 앞뒤가 연결되는지 본다. 막히는 지점(링크 없음·404·빈 화면)은 즉시 반려 사유.
   c. 화면마다 `scripts/check-density.mjs`·`scripts/check-links.mjs` 실행 + 직접 스크린샷을 찍어 Read로 본다. 이미지·SVG·링크·클릭 불가 카드 수를 기록.
   d. 인터랙션을 실제로 해본다: 호버, 아코디언, 폼 1→2단계, 유효성 에러, 제출, 완료 애니메이션, 빈 상태(검색 0건), 에러 상태(네트워크 차단).
   e. 콘솔 error·warning 0 확인.
   f. BENCHMARK.md 대조표를 채운다. 벤치마크 최고값보다 낮은 항목은 반려 사유.
   g. QUALITY 3절(요건 증명 요소)이 그 화면에 있는지.
   h. 4절 게이트 재실행.
3. **최종 질문**: "성형외과 마케팅 팀장에게 보여줬을 때 채용하고 싶은가?" 아니오면 사유 3개 이상. 레이아웃 명세 승인·M1(T-130)·M2 검수에서는 `hiring-reviewer` 서브에이전트를 별도로 띄워 독립 판정을 받고, 둘 다 예여야 approve.
4. 판정:
   - approve → 오케스트레이터가 main 머지·push → **배포 URL에서 2-b를 한 번 더** → done. 배포 URL에서 깨지면 done 취소·todo.
   - request-changes → **차단 사유만**(CLAUDE.md 검토 예산) 번호 목록(화면·요소·수치·수정안) → todo. 비차단은 로그에 기록하고 판정에 넣지 않는다. **같은 작업 반려 2회 후 3회차는 approve + 남은 차단 사유를 `fix:` 작업으로 생성.**

## REPORT
`backlog/log/<date>-reviewer-<task>.md`: 흐름 클릭 기록(단계·URL·결과), 화면별 카운트 표, BENCHMARK 대조표, 최종 질문 답, 판정.
