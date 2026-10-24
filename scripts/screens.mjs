// 리뷰용 스크린샷: backlog/log/screens/<ID>-375.png, <ID>-1280.png (전체 페이지)
// 사용: pnpm build && pnpm screens <ID> [route] [--suffix 상태명]
//   예) pnpm screens T-100 /        pnpm screens P-06 /consult/ --suffix error
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { startServer } from "./serve-out.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCREEN_DIR = path.join(ROOT, "backlog", "log", "screens");

const VIEWPORTS = [
  { width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
];

const args = process.argv.slice(2);
const id = args[0];
if (!id || !/^[A-Z]-\d{2,3}[a-z]?$|^T-\d{3}[a-z]?$/.test(id)) {
  console.error("사용: pnpm screens <ID> [route] [--suffix 상태명]   (ID 예: T-100, P-03)");
  process.exit(1);
}
const suffixIdx = args.indexOf("--suffix");
const suffix = suffixIdx > -1 ? `-${args[suffixIdx + 1]}` : "";
let route = args.slice(1).find((a, i) => !a.startsWith("--") && args[i] !== "--suffix") ?? "/";
// Git Bash(MSYS)는 "/foo" 인자를 "C:/Program Files/Git/foo" 로 바꾼다 → 원래 경로로 복구
if (/^[A-Za-z]:[\\/]/.test(route)) route = route.replace(/^[A-Za-z]:[\\/](?:.*?[\\/])?Git[\\/]?/i, "/").replace(/\\/g, "/");
if (!route.startsWith("/")) route = `/${route}`;

const { server, port, basePath } = await startServer({ port: 0 });
const browser = await chromium.launch();
try {
  fs.mkdirSync(SCREEN_DIR, { recursive: true });
  for (const vp of VIEWPORTS) {
    const { width, height, ...rest } = vp;
    const context = await browser.newContext({ viewport: { width, height }, locale: "ko-KR", ...rest });
    const page = await context.newPage();
    await page.goto(`http://localhost:${port}${basePath}${encodeURI(route)}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const file = path.join(SCREEN_DIR, `${id}-${width}${suffix}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`[screens] ${path.relative(ROOT, file)}`);
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}
