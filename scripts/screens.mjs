// 리뷰용 스크린샷: backlog/log/screens/<ID>-375.png, <ID>-1280.png (전체 페이지)
// 사용: pnpm build && pnpm screens <ID> [route] [--suffix 상태명] [--preview] [--state 상태]
//   예) pnpm screens T-100 /        pnpm screens P-06 /consult/ --suffix error
//       pnpm screens T-100b /preview/ --preview                       (공통 컴포넌트 미리보기, next dev)
//       pnpm screens T-100b /preview/ --preview --state search-open --suffix search
// --state: consent-saved(동의 후 배너 숨김) · search-open(검색 자동완성 열림, 화면 1장) · scrolled(900px 스크롤, 화면 1장)
//          viewport(첫 방문 그대로 화면 1장 — 고정 요소 확인용). --viewport 를 붙이면 어떤 상태든 화면 1장.
// 주의: 전체 페이지 캡처는 고정 요소(동의 배너·하단 바)를 첫 화면 높이 위치에 그린다 → 본문 검토는 consent-saved 로 찍는다.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { detectBasePath, startServer } from "./serve-out.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCREEN_DIR = path.join(ROOT, "backlog", "log", "screens");
const PREVIEW_PORT = 4174;
const STATES = new Set(["consent-saved", "search-open", "scrolled", "viewport"]);

const VIEWPORTS = [
  { width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
];

const args = process.argv.slice(2);
const id = args[0];
if (!id || !/^[A-Z]-\d{2,3}[a-z]?$|^T-\d{3}[a-z]?$/.test(id)) {
  console.error("사용: pnpm screens <ID> [route] [--suffix 상태명] [--preview] [--state 상태]   (ID 예: T-100, P-03)");
  process.exit(1);
}
const valueOf = (flag) => {
  const i = args.indexOf(flag);
  return i > -1 ? args[i + 1] : undefined;
};
const suffix = valueOf("--suffix") ? `-${valueOf("--suffix")}` : "";
const state = valueOf("--state");
if (state && !STATES.has(state)) {
  console.error(`--state 는 ${[...STATES].join(", ")} 중 하나`);
  process.exit(1);
}
const usePreview = args.includes("--preview");
const flagValues = new Set([valueOf("--suffix"), valueOf("--state")]);
let route = args.slice(1).find((a) => !a.startsWith("--") && !flagValues.has(a)) ?? "/";
// Git Bash(MSYS)는 "/foo" 인자를 "C:/Program Files/Git/foo" 로 바꾼다 → 원래 경로로 복구
if (/^[A-Za-z]:[\\/]/.test(route)) route = route.replace(/^[A-Za-z]:[\\/](?:.*?[\\/])?Git[\\/]?/i, "/").replace(/\\/g, "/");
if (!route.startsWith("/")) route = `/${route}`;

async function reachable(url) {
  try {
    const r = await fetch(url);
    return r.ok;
  } catch {
    return false;
  }
}

/** 미리보기 개발 서버가 떠 있으면 쓰고, 없으면 띄운 뒤 끝나면 닫는다. */
async function previewServer(basePath) {
  const base = `http://localhost:${PREVIEW_PORT}${basePath}`;
  if (await reachable(`${base}/preview/`)) return { base, close: () => {} };
  const child = spawn(process.execPath, [path.join(ROOT, "scripts", "preview.mjs"), "--port", String(PREVIEW_PORT)], {
    cwd: ROOT,
    stdio: "ignore",
  });
  for (let i = 0; i < 90; i++) {
    if (await reachable(`${base}/preview/`)) return { base, close: () => child.kill() };
    await new Promise((r) => setTimeout(r, 2000));
  }
  child.kill();
  throw new Error("미리보기 서버가 180초 안에 뜨지 않았습니다.");
}

async function applyState(page) {
  if (state === "consent-saved") {
    await page.getByTestId("consent-accept-all").click();
    await page.getByTestId("consent-banner").waitFor({ state: "hidden" });
  } else if (state === "search-open") {
    const input = page.getByRole("combobox", { name: "시술 검색" });
    await input.fill("눈");
    await input.press("ArrowDown");
    await page.getByRole("listbox").waitFor({ state: "visible" });
  } else if (state === "scrolled") {
    await page.evaluate(() => window.scrollTo(0, 900));
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  }
}

const out = usePreview ? null : await startServer({ port: 0 });
const preview = usePreview ? await previewServer(detectBasePath()) : null;
const base = preview ? preview.base : `http://localhost:${out.port}${out.basePath}`;
const browser = await chromium.launch();
try {
  fs.mkdirSync(SCREEN_DIR, { recursive: true });
  for (const vp of VIEWPORTS) {
    const { width, height, ...rest } = vp;
    const context = await browser.newContext({ viewport: { width, height }, locale: "ko-KR", ...rest });
    const page = await context.newPage();
    await page.goto(`${base}${encodeURI(route)}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await applyState(page);
    const file = path.join(SCREEN_DIR, `${id}-${width}${suffix}.png`);
    // 상호작용 상태(검색 열림·스크롤)는 그 순간의 화면 1장, 나머지는 전체 페이지
    const viewportOnly = args.includes("--viewport") || ["search-open", "scrolled", "viewport"].includes(state ?? "");
    await page.screenshot({ path: file, fullPage: !viewportOnly });
    console.log(`[screens] ${path.relative(ROOT, file)}`);
    await context.close();
  }
} finally {
  await browser.close();
  out?.server.close();
  preview?.close();
}
