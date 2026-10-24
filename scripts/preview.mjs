// 공통 컴포넌트 미리보기 개발 서버: RS_PREVIEW=1 next dev (app/**/page.preview.tsx 를 라우트로 포함)
// 사용: node scripts/preview.mjs [--port 4174]   → http://localhost:4174<basePath>/preview/
// playwright.config.ts(preview-* 프로젝트)와 scripts/screens.mjs --preview 가 이 스크립트로 서버를 띄운다.
// Windows cmd 에서도 동작하도록 환경 변수는 여기서 설정한다(패키지 스크립트의 VAR=1 문법은 cmd 에서 실패).
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const i = process.argv.indexOf("--port");
const port = i > -1 ? process.argv[i + 1] : "4174";
const env = { ...process.env, RS_PREVIEW: "1" };

for (const script of ["scripts/copy-fonts.mjs", "scripts/build-data.mjs"]) {
  const r = spawnSync(process.execPath, [script], { stdio: "inherit", env });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const nextBin = require.resolve("next/dist/bin/next");
const child = spawn(process.execPath, [nextBin, "dev", "--port", port], { stdio: "inherit", env });
const stop = () => child.kill();
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
child.on("exit", (code) => process.exit(code ?? 0));
