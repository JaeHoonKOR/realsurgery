// 통과한 기능의 회귀 테스트(tests/e2e/features/F-*.spec.ts)를 375·1280에서 전부 돌린다.
// 빌드 산출물(out/)을 검사하므로 먼저 `pnpm build`. 미리보기 서버는 띄우지 않는다(RS_FEATURES=1, playwright.config.ts).
// 사용: pnpm test:features [F-001 ...]   (id를 주면 그 기능만)
import { spawnSync } from "node:child_process";

const ids = process.argv.slice(2).filter((a) => /^F-\d{3}$/.test(a));
const targets = ids.length ? ids.map((id) => `tests/e2e/features/${id}.spec.ts`) : ["tests/e2e/features"];
const cmd = ["pnpm exec playwright test", ...targets, "--project mobile-375 --project desktop-1280 --pass-with-no-tests"].join(" ");

const r = spawnSync(cmd, { shell: true, stdio: "inherit", env: { ...process.env, RS_FEATURES: "1" } });
process.exit(r.status ?? 1);
