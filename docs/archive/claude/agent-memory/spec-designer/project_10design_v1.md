---
name: project-10design-v1
description: 10-design v1 (T-081, 2026-10-25) key decisions that deviate from code/other specs, and why — check before revising 10-design
metadata:
  type: project
---

docs/specs/10-design.md v1 작성 2026-10-25(T-081), 다음 단계 = 교차 검토(spec-content-lead·spec-tech-lead) + hiring-reviewer.

결정 중 코드·다른 문서와 다른 것(충돌 DC-01~19로 기록, T-088에서 정리):
- 하단 고정 바 ≤ 64px(BENCHMARK 최고 72보다 엄격), 코드는 72px.
- 첫 화면 채운 배경 CTA 정확히 1 → 헤더 CTA·쿠키 배너 버튼은 외곽선형. 근거: `bench-measure.mjs`가 흰색·투명 아닌 배경의 a/button을 전부 CTA로 셈(canvas 배경 카드도 걸림).
- `hover:opacity-90` 금지: accent-strong 주 CTA가 hover 시 흰 글자 4.08:1.
- ink-muted on line = 4.499:1 → 글자 금지(disabled는 surface 배경 + ink-muted).
- R-TXT1: 비텍스트 요소 윗변 간격 375 ≤ 320px / 1280 ≤ 380px — 밀도 셈이 "윗변이 속한 고정 구간" 방식이라 d ≤ 구간/2면 구간당 2개 보장.
- 쿠키 배너 1층 바(≤64px) + 2층 시트(토글 2개) — 95 "배너 토글 2개" 해석은 DQ-02로 질문.
- B-40 P-03 인터랙션에서 스켈레톤 제외(P-03 정적, B-46과 모순).

**Why:** 리뷰어가 배포 URL에서 측정 스크립트로 세기 때문에 셈 규칙에 맞춘 값이어야 반려되지 않는다.
**How to apply:** v1 개정 시 이 결정들의 근거(측정 스크립트 행)를 다시 확인하고, 코드가 이미 고쳐졌으면 DC 항목을 닫는다. [[reference-no-bash-lint]]
