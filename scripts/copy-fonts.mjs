// Pretendard Variable 동적 서브셋(CSS + woff2 청크)을 node_modules 에서 public/fonts/pretendard/ 로 복사한다.
// 빌드 산출물이므로 git 에 올리지 않는다(.gitignore). `pnpm build`·`pnpm dev` 가 먼저 실행한다.
import fs from "node:fs";
import path from "node:path";

const SRC = path.join(process.cwd(), "node_modules", "pretendard", "dist", "web", "variable");
const DEST = path.join(process.cwd(), "public", "fonts", "pretendard");
const CSS = "pretendardvariable-dynamic-subset.css";
const CHUNKS = "woff2-dynamic-subset";

if (!fs.existsSync(path.join(SRC, CSS))) {
  console.error(`[copy-fonts] ${path.join(SRC, CSS)} 없음 — pnpm install 을 먼저 실행하세요.`);
  process.exit(1);
}

fs.mkdirSync(path.join(DEST, CHUNKS), { recursive: true });
fs.copyFileSync(path.join(SRC, CSS), path.join(DEST, CSS));
let n = 0;
for (const f of fs.readdirSync(path.join(SRC, CHUNKS))) {
  if (!f.endsWith(".woff2")) continue;
  fs.copyFileSync(path.join(SRC, CHUNKS, f), path.join(DEST, CHUNKS, f));
  n++;
}
console.log(`[copy-fonts] Pretendard Variable 동적 서브셋 CSS 1개 + woff2 ${n}개 → public/fonts/pretendard/`);
