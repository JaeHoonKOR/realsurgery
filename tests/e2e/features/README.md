# 기능 회귀 테스트

`harness/features.json`의 기능 1개 = 이 폴더의 `F-xxx.spec.ts` 1개. builder가 기능을 만들 때 함께 쓴다.

- 테스트는 그 기능의 `steps`를 순서대로 옮긴 것이다. steps마다 `expect`가 1개 이상 있어야 한다.
- `import { test, expect } from "../../fixtures";` — 콘솔 error·warning, 페이지 예외, 같은 출처 4xx/5xx가 있으면 실패한다.
- 빌드 산출물(`out/`)을 basePath 하위로 서빙해 375·1280 두 크기에서 돈다: `pnpm build && pnpm test:features [F-001 ...]`.
- 회귀 테스트 파일이 없으면 오케스트레이터가 `passes: true`로 바꿀 수 없다(`scripts/hooks/check-features.mjs`).
- 통과한 기능의 테스트는 `/cycle` 시작 때마다 전부 돈다. 하나라도 실패하면 새 기능보다 그 회귀를 먼저 고친다.
