---
name: reference-no-bash-lint
description: spec-designer runs have no Bash tool — lint-spec.mjs must be emulated with Grep; exact rule of the lint script
metadata:
  type: reference
---

spec-designer 서브에이전트 실행 환경에는 Bash가 없다(도구: Read·Write·Edit·Glob·Grep·Web*). `node scripts/lint-spec.mjs <file>`을 직접 못 돌린다.

**Why:** 2026-10-25 T-081에서 lint 실행 지시를 받았지만 셸 도구가 없어 Grep으로 재현했다.

**How to apply:** lint 규칙을 Grep 2번으로 재현하고 보고에 "재현 결과"라고 명시, 오케스트레이터에게 실제 실행을 요청한다.
- 금지 어간(표 행 `|`로 시작 + 숫자 없음일 때만 오류): `(적절|충분|깔끔|적당|자연스럽|보기 좋|세련|예쁘|괜찮|잘 보이|알맞|적정|원활)` — 문서 전체에서 0건으로 두는 게 안전("충분 조건" 같은 논리 용어도 걸린다).
- 절 제목: `#`로 시작하는 줄에 목적·원칙·규칙·접점·검수 체크리스트·변경 이력이 각각 1번 이상.
