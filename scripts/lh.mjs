// Lighthouse 모바일 게이트 (docs/QUALITY.md 1절): 3회 실행 중앙값으로 판정한다.
// 사용: pnpm build && pnpm lh [route] [--runs 3]   예) pnpm lh /   pnpm lh /procedures/쌍꺼풀-수술/
// 기준: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO = 100, LCP ≤ 2.0s, CLS ≤ 0.05
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import { chromium } from "@playwright/test";
import { startServer, OUT_DIR } from "./serve-out.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPORT_DIR = path.join(ROOT, "test-results", "lh");

const THRESHOLDS = {
  performance: 0.9,
  accessibility: 0.95,
  "best-practices": 0.95,
  seo: 1,
};
const METRIC_LIMITS = {
  "largest-contentful-paint": 2000,
  "cumulative-layout-shift": 0.05,
};
// INP는 랩(내비게이션) 측정이 불가 → TBT를 대리 지표로 함께 출력한다.
const REPORT_METRICS = [
  "first-contentful-paint",
  "largest-contentful-paint",
  "cumulative-layout-shift",
  "total-blocking-time",
  "speed-index",
];

function parseArgs(argv) {
  const args = { route: "/", runs: 3 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--runs") args.runs = Number(argv[++i]);
    else if (!a.startsWith("--")) args.route = a;
  }
  // Git Bash(MSYS)는 "/foo" 인자를 "C:/Program Files/Git/foo" 로 바꾼다 → 원래 경로로 복구
  if (/^[A-Za-z]:[\\/]/.test(args.route)) {
    args.route = args.route.replace(/^[A-Za-z]:[\\/](?:.*?[\\/])?Git[\\/]?/i, "/").replace(/\\/g, "/");
  }
  if (!args.route.startsWith("/")) args.route = `/${args.route}`;
  if (!args.route.endsWith("/") && !path.extname(args.route)) args.route = `${args.route}/`;
  return args;
}

function median(values) {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

async function runOnce(url) {
  const chrome = await chromeLauncher.launch({
    chromePath: chromium.executablePath(),
    chromeFlags: ["--headless=new", "--no-first-run", "--no-default-browser-check", "--disable-extensions"],
  });
  try {
    const result = await lighthouse(url, {
      port: chrome.port,
      output: ["json", "html"],
      logLevel: "error",
      onlyCategories: Object.keys(THRESHOLDS),
    });
    if (!result) throw new Error("Lighthouse 결과 없음");
    return { lhr: result.lhr, html: result.report[1] };
  } finally {
    try {
      await chrome.kill();
    } catch {
      /* Windows 임시 프로필 삭제 EPERM 은 무시 */
    }
  }
}

async function main() {
  const { route, runs } = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(path.join(OUT_DIR, "index.html"))) {
    console.error("[lh] out/ 이 없습니다. 먼저 `pnpm build` 를 실행하세요.");
    process.exit(1);
  }
  const builtAt = fs.statSync(path.join(OUT_DIR, "index.html")).mtime.toISOString();
  const { server, port, basePath } = await startServer({ port: 0 });
  const url = `http://localhost:${port}${basePath}${encodeURI(route)}`;
  console.log(`[lh] ${url}  (out/ 빌드 시각 ${builtAt}, ${runs}회)`);

  const results = [];
  try {
    for (let i = 0; i < runs; i++) {
      const r = await runOnce(url);
      if (r.lhr.runtimeError) throw new Error(`${r.lhr.runtimeError.code}: ${r.lhr.runtimeError.message}`);
      const scores = Object.fromEntries(Object.keys(THRESHOLDS).map((k) => [k, r.lhr.categories[k]?.score ?? 0]));
      console.log(
        `[lh] run ${i + 1}: ` +
          Object.entries(scores)
            .map(([k, v]) => `${k} ${Math.round(v * 100)}`)
            .join(" · "),
      );
      results.push(r);
    }
  } finally {
    server.close();
  }

  const summary = { url, route, runs, builtAt, categories: {}, metrics: {}, failures: [] };
  for (const [k, min] of Object.entries(THRESHOLDS)) {
    const m = median(results.map((r) => r.lhr.categories[k]?.score ?? 0));
    summary.categories[k] = Math.round(m * 100);
    if (m < min) summary.failures.push(`${k} ${Math.round(m * 100)} < ${Math.round(min * 100)}`);
  }
  for (const id of REPORT_METRICS) {
    const m = median(results.map((r) => r.lhr.audits[id]?.numericValue ?? Number.POSITIVE_INFINITY));
    summary.metrics[id] = id === "cumulative-layout-shift" ? Number(m.toFixed(3)) : Math.round(m);
    const limit = METRIC_LIMITS[id];
    if (limit !== undefined && m > limit) summary.failures.push(`${id} ${summary.metrics[id]} > ${limit}`);
  }
  // 100점이 아닌 SEO·접근성 감사 항목은 원인 파악용으로 출력
  const medianRun = [...results].sort(
    (a, b) => (a.lhr.categories.performance?.score ?? 0) - (b.lhr.categories.performance?.score ?? 0),
  )[Math.floor(results.length / 2)];
  const failedAudits = [];
  for (const k of Object.keys(THRESHOLDS)) {
    for (const ref of medianRun.lhr.categories[k]?.auditRefs ?? []) {
      const a = medianRun.lhr.audits[ref.id];
      if (ref.weight > 0 && a && a.score !== null && a.score < 1) failedAudits.push(`${k}/${ref.id} (${a.score})`);
    }
  }
  summary.failedAudits = failedAudits;

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const slug = route === "/" ? "home" : route.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "route";
  fs.writeFileSync(path.join(REPORT_DIR, `${slug}.summary.json`), JSON.stringify(summary, null, 2), "utf8");
  fs.writeFileSync(path.join(REPORT_DIR, `${slug}.report.html`), medianRun.html, "utf8");
  fs.writeFileSync(path.join(REPORT_DIR, `${slug}.lhr.json`), JSON.stringify(medianRun.lhr), "utf8");

  console.log("[lh] 중앙값:", JSON.stringify(summary.categories), JSON.stringify(summary.metrics));
  if (failedAudits.length) console.log("[lh] 감점 항목:", failedAudits.join(", "));
  console.log(`[lh] 리포트: ${path.relative(ROOT, path.join(REPORT_DIR, `${slug}.report.html`))}`);
  if (summary.failures.length) {
    console.error(`[lh] FAIL: ${summary.failures.join(" / ")}`);
    process.exit(1);
  }
  console.log("[lh] PASS");
}

main().catch((err) => {
  console.error(`[lh] 오류: ${err.stack ?? err}`);
  process.exit(1);
});
