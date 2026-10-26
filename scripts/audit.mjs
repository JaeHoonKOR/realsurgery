// 사이트 감사 (/improve 루프의 auditor·구현 서브에이전트용, docs/loop/GOAL.md 채점 근거)
// 빌드된 정적 사이트(out/)를 GitHub Pages 와 같은 basePath 로 서빙하고, 라우트 × 375·1280 마다 잰다:
//   스크린샷(첫 화면·전체·시트·텍스트 벽 구간), 콘솔 error·warning, axe critical·serious, LCP·CLS(PerformanceObserver),
//   전송량(js·css·img·font), 이미지 수, 보이는 글자 수 대 시각 요소 면적, 텍스트 벽(1화면 이상 시각 요소 없는 구간),
//   H1 수, title·description 길이, canonical, JSON-LD @type(AggregateRating·Review 는 치명).
// 핵심 여정 2개를 dataLayer 와 함께 기록한다: 홈 검색 → 가이드 → 본문 중간 CTA → 상담 2단계 → 완료(generate_lead 정확히 1회, 50000 KRW),
//   홈 → 병원 목록 → 병원 상세 → 상담 CTA.
// 사용: pnpm audit:site [--no-build] [--routes home,consult,procedures-double-eyelid | /,/clinics/] [--label before]
//                       [--viewports 375,1280] [--no-journeys] [--no-throttle]
//   --routes 는 경로("/procedures/쌍꺼풀-수술/") 또는 라우트 키(report.json 의 key, ASCII — 셸 인코딩 걱정 없음) 모두 받는다.
// 출력: reports/audit/<YYYYMMDD-HHmm>[-label]/{report.json, summary.md, screens/…}
//   reports/audit/LATEST.txt 는 전체 감사(--routes 없음)일 때만 갱신한다(부분 감사가 기준선을 덮지 않게).
// 종료 코드: 사이트를 서빙할 수 없을 때(빌드 실패로 out/ 없음·서버·브라우저 실행 실패)만 1. 문제를 찾아도 0.
// 로컬·샌드박스에서 Playwright 브라우저 대신 다른 Chromium 을 쓰려면 PW_CHROMIUM_PATH.
// 회귀 테스트: tests/unit/audit.test.ts (순수 함수)
import { execFileSync, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { OUT_DIR, startServer } from "./serve-out.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const AUDIT_DIR = path.join(ROOT, "reports", "audit");
export const NOT_FOUND_ROUTE = "/__audit-not-found/";
export const EXTRA_ROUTES = ["/consult/"];
export const LEAD_VALUE = 50000;

export const VIEWPORTS = {
  375: { viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  1280: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
};

/** 기준값 — docs/QUALITY.md 1절·docs/spec/screen-spec.md 6절·docs/design/asset-plan.md 10절 */
export const LIMITS = {
  lcpMs: 2000,
  cls: 0.05,
  jsKB: 150,
  imgKB: 600,
  titleMax: 60,
  descMin: 120,
  descMax: 150,
  wallMinChars: 120,
  minTarget: 44,
  iconMin: 24,
  contentImage: { w: 120, h: 80 },
  maxWallShots: 3,
};

/** 모바일 측정 조건(Lighthouse 모바일 근사). 판정 게이트는 여전히 `pnpm lh` 다. */
export const THROTTLE = { cpu: 4, latencyMs: 150, downKbps: 1638.4, upKbps: 750 };

const SEVERITY_WEIGHT = { critical: 3, major: 2, minor: 1 };
export const AREAS = {
  A: "첫인상·비주얼",
  B: "핵심 흐름",
  C: "콘텐츠 밀도·신뢰",
  D: "기술 SEO",
  E: "AEO",
  F: "측정",
  G: "성능·접근성",
  H: "법·의료광고 안전",
};

/* ───────────────────────── 순수 함수(단위 테스트 대상) ───────────────────────── */

/** "/procedures/쌍꺼풀-수술" · "procedures/%EC%8C%8D…/" · Git Bash 가 바꾼 "C:/Program Files/Git/clinics/" → "/procedures/쌍꺼풀-수술/" */
export function normalizeRoute(input) {
  let r = String(input ?? "").trim().replace(/\\/g, "/");
  // Git Bash(MSYS)는 "/foo" 인자를 "C:/Program Files/Git/foo" 로 바꾼다 → 원래 경로로 복구
  if (/^[A-Za-z]:\//.test(r)) r = r.replace(/^[A-Za-z]:\/(?:.*?\/)?Git(?:\/|$)/i, "/");
  if (/^https?:\/\//i.test(r)) r = new URL(r).pathname;
  try {
    r = decodeURI(r);
  } catch {
    /* 잘못된 % 인코딩은 그대로 */
  }
  if (!r.startsWith("/")) r = `/${r}`;
  r = r.replace(/\/{2,}/g, "/");
  if (!r.endsWith("/") && !path.posix.extname(r)) r = `${r}/`;
  return r;
}

/** sitemap.xml → basePath 를 뗀 사람이 읽는 경로 목록(사이트 URL 이 배포 주소여도 경로만 쓴다) */
export function routesFromSitemap(xml, basePath = "") {
  const out = [];
  for (const m of String(xml ?? "").matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)) {
    let p;
    try {
      p = new URL(m[1].replace(/&amp;/g, "&")).pathname;
    } catch {
      continue;
    }
    if (basePath && (p === basePath || p.startsWith(`${basePath}/`))) p = p.slice(basePath.length) || "/";
    out.push(normalizeRoute(p));
  }
  return [...new Set(out)];
}

/** sitemap 경로 + 추가 경로(/consult/) + 404 확인용 경로, 중복 없이 순서 유지 */
export function buildRouteList({ sitemapRoutes = [], extra = EXTRA_ROUTES, notFound = NOT_FOUND_ROUTE } = {}) {
  return [...new Set([...sitemapRoutes.map(normalizeRoute), ...extra.map(normalizeRoute), notFound])];
}

/** content.json → { "procedures/쌍꺼풀-수술": "double-eyelid", "clinics/…": id, "blog/…": id } */
export function slugMapFromContent(content) {
  const map = {};
  for (const [section, list] of [
    ["procedures", content?.procedures],
    ["clinics", content?.clinics],
    ["blog", content?.posts],
  ]) {
    for (const item of list ?? []) if (item?.slug && item?.id) map[`${section}/${item.slug}`] = item.id;
  }
  return map;
}

/** 파일 이름·--routes 에 쓰는 ASCII 키. "/" → home, "/procedures/쌍꺼풀-수술/" → procedures-double-eyelid, 404 → 404 */
export function routeKey(route, slugMap = {}) {
  if (route === NOT_FOUND_ROUTE) return "404";
  const segs = normalizeRoute(route).split("/").filter(Boolean);
  if (segs.length === 0) return "home";
  return segs
    .map((seg, i) => {
      const mapped = i > 0 ? slugMap[`${segs[i - 1]}/${seg}`] : undefined;
      const v = (mapped ?? seg).replace(/\./g, "-");
      if (/^[A-Za-z0-9_-]+$/.test(v)) return v.toLowerCase();
      const ascii = v
        .normalize("NFKD")
        .replace(/[^A-Za-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();
      const hash = crypto.createHash("sha1").update(v).digest("hex").slice(0, 8);
      return ascii ? `${ascii}-${hash}` : `x${hash}`;
    })
    .join("-");
}

/** --routes 값(경로 또는 키) → 실제 경로. 목록에 없는 경로도 그대로 감사한다(새 화면 확인용) */
export function selectRoutes(all, only, slugMap = {}) {
  const byKey = new Map(all.map((r) => [routeKey(r, slugMap), r]));
  const out = [];
  for (const raw of only ?? []) {
    const item = String(raw).trim();
    if (!item) continue;
    const route = byKey.get(item) ?? byKey.get(item.toLowerCase()) ?? (item === "404" ? NOT_FOUND_ROUTE : normalizeRoute(item));
    if (!out.includes(route)) out.push(route);
  }
  return out;
}

export function sanitizeLabel(label) {
  const s = String(label ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return s || null;
}

export function parseArgs(argv) {
  const opts = { build: true, routes: null, label: null, viewports: [375, 1280], journeys: true, throttle: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const [flag, inline] = a.startsWith("--") && a.includes("=") ? [a.slice(0, a.indexOf("=")), a.slice(a.indexOf("=") + 1)] : [a, undefined];
    const value = () => {
      if (inline !== undefined) return inline;
      const v = argv[i + 1];
      if (v === undefined || v.startsWith("--")) throw new Error(`${flag} 값이 없습니다`);
      i++;
      return v;
    };
    if (flag === "--no-build") opts.build = false;
    else if (flag === "--no-journeys") opts.journeys = false;
    else if (flag === "--no-throttle") opts.throttle = false;
    else if (flag === "--routes") opts.routes = value().split(",").map((s) => s.trim()).filter(Boolean);
    else if (flag === "--label") opts.label = sanitizeLabel(value());
    else if (flag === "--viewports") {
      const vps = value()
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => n in VIEWPORTS);
      if (vps.length === 0) throw new Error(`--viewports 는 ${Object.keys(VIEWPORTS).join(",")} 중에서`);
      opts.viewports = [...new Set(vps)];
    } else throw new Error(`알 수 없는 옵션: ${a}`);
  }
  if (opts.routes && opts.routes.length === 0) opts.routes = null;
  return opts;
}

const pad = (n) => String(n).padStart(2, "0");

/** 실행 폴더 이름: 로컬 시각 YYYYMMDD-HHmm[-label], 같은 이름이 있으면 -2, -3 … */
export function runFolderName(date, label = null, exists = () => false) {
  const base = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
  const name = label ? `${base}-${label}` : base;
  if (!exists(name)) return name;
  for (let n = 2; ; n++) if (!exists(`${name}-${n}`)) return `${name}-${n}`;
}

/** 리소스 URL → js / css / img / font / doc / rsc / other */
export function classifyResource(url, initiatorType = "") {
  let p = String(url);
  try {
    p = new URL(url).pathname;
  } catch {
    /* 상대 경로 */
  }
  const ext = path.posix.extname(p).toLowerCase();
  if (initiatorType === "navigation") return "doc";
  if (ext === ".js" || ext === ".mjs") return "js";
  if (ext === ".css") return "css";
  if ([".webp", ".avif", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico"].includes(ext)) return "img";
  if ([".woff2", ".woff", ".ttf", ".otf"].includes(ext)) return "font";
  if (ext === ".txt") return "rsc";
  if (ext === ".html" || ext === "" || p.endsWith("/")) return "doc";
  return "other";
}

/** [{name, initiatorType, size}] → 유형별 바이트 합계 */
export function sumBytes(entries) {
  const out = { js: 0, css: 0, img: 0, font: 0, doc: 0, rsc: 0, other: 0, total: 0 };
  for (const e of entries ?? []) {
    const type = classifyResource(e.name, e.initiatorType);
    const size = Math.max(0, Number(e.size) || 0);
    out[type] += size;
    out.total += size;
  }
  return out;
}

/** HTML 원문 → 그 문서가 직접 부르는 JS 경로(script src·modulepreload·preload as=script). next build 의 "First Load JS" 와 같은 범위 */
export function scriptPathsFromHtml(html) {
  const out = new Set();
  for (const m of String(html ?? "").matchAll(/(?:src|href)="([^"]+?\.m?js)(?:\?[^"]*)?"/g)) {
    let p = m[1].replace(/&amp;/g, "&");
    try {
      p = new URL(p, "http://localhost").pathname;
    } catch {
      continue;
    }
    out.add(p);
  }
  return out;
}

/** 첫 로드 JS = 문서가 직접 부른 스크립트의 전송량 합(링크 프리페치로 받은 다른 화면 청크 제외) */
export function firstLoadJsBytes(entries, scriptPaths) {
  let sum = 0;
  for (const e of entries ?? []) {
    if (classifyResource(e.name, e.initiatorType) !== "js") continue;
    let p = e.name;
    try {
      p = new URL(e.name).pathname;
    } catch {
      /* 상대 경로 */
    }
    if (scriptPaths.has(p)) sum += Math.max(0, Number(e.size) || 0);
  }
  return sum;
}

/** [[top, bottom], …] 겹치는 구간 합치기 */
export function mergeIntervals(list) {
  const sorted = (list ?? [])
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b) && b > a)
    .map(([a, b]) => [a, b])
    .sort((x, y) => x[0] - y[0]);
  const out = [];
  for (const [a, b] of sorted) {
    const last = out[out.length - 1];
    if (last && a <= last[1]) last[1] = Math.max(last[1], b);
    else out.push([a, b]);
  }
  return out;
}

/**
 * 텍스트 벽: [start, end](본문 영역) 안에서 시각 요소(이미지·아이콘·도표)가 하나도 없는 세로 구간이 1화면(screen) 이상이고,
 * 그 구간에 보이는 글자가 minChars 이상이면 벽으로 본다.
 * @param {{ visuals: [number, number][], texts: [number, number][], start: number, end: number, screen: number, minChars?: number }} p
 *   texts = [중심 y, 글자 수] 목록
 */
export function findTextWalls({ visuals, texts, start, end, screen, minChars = LIMITS.wallMinChars }) {
  if (!(end > start) || !(screen > 0)) return [];
  const merged = mergeIntervals((visuals ?? []).map(([a, b]) => [Math.max(a, start), Math.min(b, end)]));
  const gaps = [];
  let cursor = start;
  for (const [a, b] of merged) {
    if (a > cursor) gaps.push([cursor, a]);
    cursor = Math.max(cursor, b);
  }
  if (end > cursor) gaps.push([cursor, end]);
  return gaps
    .filter(([a, b]) => b - a >= screen)
    .map(([a, b]) => ({
      top: Math.round(a),
      bottom: Math.round(b),
      height: Math.round(b - a),
      screens: Math.round(((b - a) / screen) * 10) / 10,
      chars: Math.round((texts ?? []).reduce((sum, [y, n]) => (y >= a && y < b ? sum + n : sum), 0)),
    }))
    .filter((w) => w.chars >= minChars);
}

/** JSON-LD 원문 목록 → 최상위 @type(top)·전체 @type·금지 항목(AggregateRating·Review)·파싱 오류 수 */
export function jsonLdInfo(raws) {
  const types = new Set();
  const top = new Set();
  const forbidden = new Set();
  let parseErrors = 0;
  const addTop = (node) => {
    const t = node && typeof node === "object" ? node["@type"] : null;
    for (const type of Array.isArray(t) ? t : t ? [t] : []) top.add(String(type));
  };
  const visit = (node) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== "object") return;
    const t = node["@type"];
    for (const type of Array.isArray(t) ? t : t ? [t] : []) {
      types.add(String(type));
      if (/^(AggregateRating|Review|Rating)$/.test(String(type))) forbidden.add(String(type));
    }
    for (const [k, v] of Object.entries(node)) {
      if (/^(aggregateRating|review|reviews|reviewRating|ratingValue)$/.test(k)) forbidden.add(k);
      visit(v);
    }
  };
  for (const raw of raws ?? []) {
    let doc;
    try {
      doc = JSON.parse(raw);
    } catch {
      parseErrors++;
      continue;
    }
    for (const root of Array.isArray(doc) ? doc : [doc]) {
      addTop(root);
      if (Array.isArray(root?.["@graph"])) root["@graph"].forEach(addTop);
    }
    visit(doc);
  }
  return { top: [...top].sort(), types: [...types].sort(), forbidden: [...forbidden].sort(), parseErrors };
}

/** 경로 유형별로 있어야 하는 JSON-LD @type (대안은 배열 안 배열). docs/spec/screen-spec.md 6절 */
export function expectedJsonLd(route) {
  const r = normalizeRoute(route);
  if (r === "/") return [["Organization"], ["WebSite"]];
  if (/^\/procedures\/[^/]+\/$/.test(r)) return [["MedicalWebPage"], ["MedicalProcedure", "SurgicalProcedure", "TherapeuticProcedure"], ["FAQPage"], ["BreadcrumbList"]];
  if (/^\/clinics\/[^/]+\/$/.test(r)) return [["MedicalClinic", "MedicalBusiness"], ["BreadcrumbList"]];
  if (/^\/blog\/[^/]+\/$/.test(r)) return [["Article", "BlogPosting"]];
  return [];
}

/** 이미지가 없어도 되는 화면(법적 문서·폼·404) — asset-plan 4절 "약관·개인정보: 없음(의도적)" */
export function imageOptional(route) {
  return /^\/(terms|privacy|consult)(\/|$)/.test(normalizeRoute(route)) || route === NOT_FOUND_ROUTE;
}

const problem = (severity, area, code, entry, message) => ({
  severity,
  area,
  code,
  route: entry.route,
  key: entry.key,
  viewport: entry.viewport ?? null,
  message,
});

/** 라우트 × 뷰포트 1건의 측정값 → 문제 목록 */
export function evaluateRoute(entry, limits = LIMITS) {
  const { route, viewport, m } = entry;
  const out = [];
  const P = (sev, area, code, msg) => out.push(problem(sev, area, code, entry, msg));
  if (!m) return out;
  if (m.error) {
    P("major", "B", "audit-error", `측정 실패: ${m.error}`);
    return out;
  }
  const notFound = route === NOT_FOUND_ROUTE;
  const mobile = Number(viewport) < 768;
  if (notFound ? m.status !== 404 : m.status !== 200) P(notFound ? "major" : "critical", "B", "http-status", `HTTP ${m.status} (기대 ${notFound ? 404 : 200})`);
  const indexable = !notFound && !/noindex/i.test(m.meta?.robots ?? "");

  for (const c of m.console ?? []) P("major", "G", "console", c);
  for (const v of m.axe?.violations ?? []) {
    P(v.impact === "critical" ? "critical" : "major", "G", "axe", `${v.id} (${v.impact}, ${v.nodes}곳): ${v.help}`);
  }
  if (mobile && m.lcp?.ms > limits.lcpMs) P("major", "G", "lcp", `LCP ${Math.round(m.lcp.ms)}ms > ${limits.lcpMs}ms (${m.lcp.element ?? "요소 미상"})`);
  if (m.cls > limits.cls) P("major", "G", "cls", `CLS ${m.cls.toFixed(3)} > ${limits.cls}`);
  const jsKB = (m.bytes?.firstLoadJs ?? m.bytes?.initial?.js ?? 0) / 1024;
  if (jsKB > limits.jsKB) P("major", "G", "js-bytes", `첫 로드 JS ${jsKB.toFixed(0)}KB > ${limits.jsKB}KB`);
  const imgKB = (m.bytes?.full?.img ?? 0) / 1024;
  if (imgKB > limits.imgKB) P("minor", "G", "img-bytes", `이미지 전체 ${imgKB.toFixed(0)}KB > ${limits.imgKB}KB`);
  if (mobile && m.page?.overflowX > 0) P("major", "A", "overflow-x", `가로 스크롤 ${m.page.overflowX}px`);
  if (mobile && m.smallTargets?.length) P("minor", "G", "touch-target", `44px 미만 ${m.smallTargets.length}개: ${m.smallTargets.slice(0, 3).join(" / ")}`);
  if (m.images?.broken > 0) P("major", "A", "broken-image", `깨진 이미지 ${m.images.broken}장`);

  if (!imageOptional(route) && m.images?.contentImages === 0) P("minor", "A", "no-content-image", "콘텐츠 이미지(120×80 이상) 0장 — 아이콘·텍스트뿐");
  if (!notFound && m.images?.foldVisuals === 0) P("minor", "A", "fold-no-visual", "첫 화면에 시각 요소(40px 이상)가 없음");
  // 약관·개인정보처리방침은 의도적으로 텍스트 문서다(asset-plan 4절) → 벽은 기록만 하고 문제로 올리지 않는다
  for (const w of imageOptional(route) ? [] : (m.text?.walls ?? [])) {
    P("major", "C", "text-wall", `y=${w.top}–${w.bottom}px (${w.screens}화면, ${w.chars.toLocaleString("en-US")}자)에 시각 요소 없음`);
  }
  for (const g of m.glitches ?? []) P("major", "B", "render-glitch", `화면에 "${g}"`);
  for (const s of m.adSafety ?? []) P("minor", "H", "ad-safety", `의료광고 표현 확인 필요: "${s}"`);

  const meta = m.meta ?? {};
  if (meta.h1Count !== 1) P("major", "D", "h1", `H1 ${meta.h1Count ?? 0}개 (1개여야 함)`);
  if (!meta.title) P("major", "D", "title-missing", "title 없음");
  else if (meta.title.length > limits.titleMax) P("minor", "D", "title-length", `title ${meta.title.length}자 > ${limits.titleMax}자`);
  if (indexable) {
    const len = meta.description?.length ?? 0;
    if (!len) P("major", "D", "description-missing", "description 없음");
    else if (len < limits.descMin || len > limits.descMax) P("minor", "D", "description-length", `description ${len}자 (${limits.descMin}~${limits.descMax}자)`);
    if (!meta.canonical) P("major", "D", "canonical-missing", "canonical 없음");
    else {
      let cpath = meta.canonical;
      try {
        cpath = decodeURI(new URL(meta.canonical).pathname);
      } catch {
        /* 상대 경로 */
      }
      if (!cpath.endsWith(normalizeRoute(route))) P("minor", "D", "canonical-mismatch", `canonical ${cpath} ≠ ${route}`);
    }
    if (!meta.ogImage) P("minor", "D", "og-image", "og:image 없음");
    const types = new Set(m.jsonLd?.types ?? []);
    for (const alts of expectedJsonLd(route)) {
      if (!alts.some((t) => types.has(t))) P("major", alts.includes("FAQPage") ? "E" : "D", "jsonld-expected", `JSON-LD ${alts.join("|")} 없음`);
    }
  }
  if (m.jsonLd?.forbidden?.length) P("critical", "H", "jsonld-forbidden", `JSON-LD 금지 항목: ${m.jsonLd.forbidden.join(", ")}`);
  if (m.jsonLd?.parseErrors) P("major", "D", "jsonld-parse", `JSON-LD 파싱 오류 ${m.jsonLd.parseErrors}건`);
  if (meta.lang && !/^ko/i.test(meta.lang)) P("minor", "D", "lang", `html lang="${meta.lang}"`);
  return out;
}

/** 여정 결과 → 문제 목록 */
export function evaluateJourney(j) {
  const out = [];
  const entry = { route: `journey:${j.name}`, key: `journey-${j.name}`, viewport: j.viewport };
  for (const s of j.steps ?? []) if (!s.ok) out.push(problem("critical", "B", "journey-step", entry, `${j.title} — "${s.name}" 단계 실패: ${s.error ?? "원인 미상"}`));
  for (const a of j.assertions ?? []) {
    if (a.ok || a.info) continue;
    out.push(problem(a.severity ?? "critical", a.area ?? "F", a.code ?? "journey-assert", entry, `${j.title} — ${a.name}: ${a.detail ?? ""}`.trim()));
  }
  for (const c of j.console ?? []) out.push(problem("major", "G", "console", entry, c));
  return out;
}

/** 같은 code·심각도끼리 묶어 심각도 → 영향 경로 수 순으로 정렬 */
export function rankProblems(problems) {
  const groups = new Map();
  for (const p of problems ?? []) {
    const k = `${p.severity}|${p.code}`;
    if (!groups.has(k)) groups.set(k, { severity: p.severity, area: p.area, code: p.code, targets: new Set(), examples: [] });
    const g = groups.get(k);
    g.targets.add(`${p.route}${p.viewport ? `@${p.viewport}` : ""}`);
    if (g.examples.length < 3 && !g.examples.includes(p.message)) g.examples.push(p.message);
  }
  return [...groups.values()]
    .map((g) => ({ ...g, count: g.targets.size, targets: [...g.targets] }))
    .sort((a, b) => SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity] || b.count - a.count || a.code.localeCompare(b.code));
}

export const fmtKB = (bytes) => (bytes == null ? "—" : `${Math.round(bytes / 1024)}`);
export const fmtMs = (ms) => (ms == null ? "—" : ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`);
const fmtCls = (v) => (v == null ? "—" : v.toFixed(3));
const cell = (s) => String(s ?? "—").replace(/\|/g, "\\|").replace(/\n/g, " ");

/** report.json → summary.md (사람·auditor 가 읽는 요약) */
export function renderSummary(report) {
  const L = [];
  const vps = report.options?.viewports ?? [375, 1280];
  const [mvp, dvp] = [vps.find((v) => v < 768), vps.find((v) => v >= 768)];
  L.push(`# 사이트 감사 ${report.run}`);
  L.push("");
  L.push(
    `- 커밋 \`${report.git?.commit ?? "?"}\` (${report.git?.branch ?? "?"}${report.git?.dirty ? ", 커밋 안 된 변경 있음" : ""}) · ${report.startedAt} · ${Math.round((report.durationMs ?? 0) / 1000)}초`,
  );
  L.push(`- 대상 ${report.routes.length}개 경로 × ${vps.join("·")}px${report.options?.routes ? " (부분 감사)" : " (전체 감사)"} · basePath \`${report.basePath || "/"}\``);
  L.push(
    `- 모바일 측정 조건: ${report.options?.throttle ? `CPU ${THROTTLE.cpu}×, RTT ${THROTTLE.latencyMs}ms, ${(THROTTLE.downKbps / 1024).toFixed(1)}Mbps (Lighthouse 모바일 근사 — 게이트는 \`pnpm lh\`)` : "스로틀 없음"}`,
  );
  if (report.build && !report.build.ok) L.push(`- **빌드 경고**: ${report.build.message}`);
  L.push("");

  const totals = { critical: 0, major: 0, minor: 0 };
  for (const p of report.problems ?? []) totals[p.severity]++;
  L.push(`## 요약`);
  L.push("");
  L.push(`치명 ${totals.critical} · 주요 ${totals.major} · 경미 ${totals.minor}`);
  L.push("");
  L.push("| 영역 | 치명 | 주요 | 경미 |");
  L.push("| --- | --- | --- | --- |");
  for (const [k, name] of Object.entries(AREAS)) {
    const ps = (report.problems ?? []).filter((p) => p.area === k);
    const n = (s) => ps.filter((p) => p.severity === s).length;
    L.push(`| ${k} ${name} | ${n("critical")} | ${n("major")} | ${n("minor")} |`);
  }
  L.push("");

  L.push("## 주요 문제 (심각도 → 영향 경로 수)");
  L.push("");
  const ranked = rankProblems(report.problems ?? []);
  if (ranked.length === 0) L.push("자동으로 찾은 문제가 없습니다. 스크린샷으로 시각 판정을 하세요.");
  ranked.slice(0, 15).forEach((g, i) => {
    const where = g.targets.slice(0, 4).join(", ") + (g.targets.length > 4 ? ` 외 ${g.targets.length - 4}` : "");
    L.push(`${i + 1}. **[${g.severity}] ${g.area} \`${g.code}\`** — ${g.count}곳: ${where}`);
    for (const ex of g.examples) L.push(`   - ${ex}`);
  });
  L.push("");

  L.push("## 경로별");
  L.push("");
  const head = [
    "경로",
    "키",
    "HTTP",
    "H1",
    "title·desc",
    "JSON-LD",
    mvp ? `LCP ${mvp}` : null,
    `CLS ${vps.join("/")}`,
    `axe ${vps.join("/")}`,
    "콘솔",
    mvp ? `첫 로드 KB JS·CSS·IMG·FONT(${mvp})` : `첫 로드 KB JS·CSS·IMG·FONT`,
    "콘텐츠 이미지",
    "시각 면적%",
    `텍스트 벽 ${vps.join("/")}`,
  ].filter(Boolean);
  L.push(`| ${head.join(" | ")} |`);
  L.push(`| ${head.map(() => "---").join(" | ")} |`);
  for (const r of report.routes) {
    const v = (vp) => r.viewports?.[vp];
    const any = v(mvp) ?? v(dvp) ?? {};
    const meta = any.meta ?? {};
    const both = (f) => vps.map((vp) => f(v(vp))).join("/");
    const consoleN = vps.reduce((n, vp) => n + (v(vp)?.console?.length ?? 0), 0);
    const b = (v(mvp) ?? any).bytes?.initial;
    const row = [
      `\`${r.route}\``,
      r.key,
      any.status ?? (any.error ? "ERR" : "—"),
      meta.h1Count ?? "—",
      `${meta.title?.length ?? 0}·${meta.description?.length ?? 0}`,
      (any.jsonLd?.top ?? any.jsonLd?.types ?? []).join(", ") || "—",
      mvp ? fmtMs(v(mvp)?.lcp?.ms) : null,
      both((x) => fmtCls(x?.cls)),
      both((x) => (x?.axe ? x.axe.critical + x.axe.serious : "—")),
      consoleN,
      b ? `${fmtKB((v(mvp) ?? any).bytes?.firstLoadJs ?? b.js)}·${fmtKB(b.css)}·${fmtKB(b.img)}·${fmtKB(b.font)}` : "—",
      any.images?.contentImages ?? "—",
      any.images?.visualAreaPct ?? "—",
      both((x) => x?.text?.walls?.length ?? "—"),
    ].filter((c) => c !== null);
    L.push(`| ${row.map(cell).join(" | ")} |`);
  }
  L.push("");

  L.push("## 여정");
  L.push("");
  if (!report.journeys?.length) L.push("실행하지 않음(--no-journeys).");
  else {
    L.push("| 여정 | 뷰포트 | 결과 | 단계 | 확인 | dataLayer 이벤트 |");
    L.push("| --- | --- | --- | --- | --- | --- |");
    for (const j of report.journeys) {
      const steps = j.steps.map((s) => `${s.ok ? "✓" : "✗"} ${s.name}`).join(" → ");
      const checks = j.assertions.map((a) => `${a.ok ? "✓" : a.info ? "ℹ" : "✗"} ${a.name}${a.ok ? "" : `(${a.detail})`}`).join("; ");
      L.push(`| ${cell(j.title)} | ${j.viewport} | ${j.ok ? "통과" : "**실패**"} | ${cell(steps)} | ${cell(checks)} | ${cell(j.events.join(" → "))} |`);
    }
  }
  L.push("");
  L.push("## 스크린샷 (screens/, git 제외)");
  L.push("");
  L.push("- `<키>-<폭>-fold.png` 첫 방문 첫 화면(동의 배너 포함) · `-full.jpg` 전체(배너 닫음) · `-sheet<N>.jpg` 화면 단위로 잘라 붙인 시트(번호 = 위에서부터 화면 순서)");
  L.push("- `-wall<N>.jpg` 텍스트 벽 구간 · `journey-<여정>-<폭>-<순번>-<단계>.jpg` 여정 단계별 화면");
  L.push("- 숫자는 자동 신호일 뿐이다. 채점(docs/loop/GOAL.md)은 스크린샷을 Read 로 열어 눈으로 확인한 뒤 한다.");
  L.push("");
  return L.join("\n");
}

/* ───────────────────────── 브라우저 측정 ───────────────────────── */

/** 페이지 안에서 실행: LCP·CLS 관찰 시작 */
function initObservers() {
  const w = window;
  w.__audit = { lcp: null, cls: 0 };
  try {
    performance.setResourceTimingBufferSize(3000);
  } catch {
    /* 미지원 */
  }
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        const el = e.element;
        let desc = null;
        if (el) {
          const cls = typeof el.className === "string" ? el.className.split(/\s+/).filter(Boolean).slice(0, 2).join(".") : "";
          const text = (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 24);
          desc = `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${cls ? `.${cls}` : ""}${text ? ` "${text}"` : ""}`;
        }
        w.__audit.lcp = { ms: e.startTime, size: e.size, element: desc, url: e.url || null };
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) w.__audit.cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  } catch {
    /* 미지원 브라우저 */
  }
}

/** 페이지 안에서 실행: 전송량 원자료 */
function readResources() {
  const out = [];
  for (const e of performance.getEntriesByType("navigation")) out.push({ name: e.name, initiatorType: "navigation", size: e.transferSize || e.encodedBodySize || 0 });
  for (const e of performance.getEntriesByType("resource")) out.push({ name: e.name, initiatorType: e.initiatorType, size: e.transferSize || e.encodedBodySize || 0 });
  return out;
}

/** 페이지 안에서 실행: 배치·텍스트·시각 요소·메타 (문서 좌표, 맨 위로 스크롤한 상태) */
function analyzePage(opts) {
  const { iconMin, contentImage, minTarget, mobile } = opts;
  const sy = window.scrollY;
  const vh = window.innerHeight;
  const vw = document.documentElement.clientWidth;
  const doc = document.documentElement;
  const main = document.querySelector("main") ?? document.body;
  const mr = main.getBoundingClientRect();
  const visible = (el) => {
    if (typeof el.checkVisibility === "function") return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
    const s = getComputedStyle(el);
    return s.display !== "none" && s.visibility !== "hidden" && s.opacity !== "0";
  };

  // 시각 요소: 이미지·영상·캔버스·SVG(24px 이상 — 16~20px 조작 아이콘 제외)·role=img(가격 막대 포함)·data-visual·배경 이미지
  const VSEL = "img, svg, video, canvas, [role='img'], [data-visual]";
  const visuals = [];
  let visualArea = 0;
  let contentImages = 0;
  let foldVisuals = 0;
  const consider = (el, kind) => {
    const r = el.getBoundingClientRect();
    if (r.width <= 1 || r.height <= 1 || !visible(el)) return;
    const tag = el.tagName.toLowerCase();
    const isData = el.hasAttribute("data-visual");
    const bar = el.getAttribute("role") === "img" && r.width >= 96;
    if (!(isData || bar || (r.width >= iconMin && r.height >= iconMin))) return;
    const top = r.top + sy;
    const bottom = r.bottom + sy;
    const w = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0));
    const isPicture = kind === "bg" || ["img", "video", "canvas"].includes(tag);
    const content = isPicture && r.width >= contentImage.w && r.height >= contentImage.h;
    visuals.push([top, bottom]);
    visualArea += w * r.height;
    if (content) contentImages++;
    if (top < vh && bottom > 0 && r.width >= 40 && r.height >= 40) foldVisuals++;
  };
  for (const el of document.querySelectorAll(VSEL)) {
    if (el.parentElement?.closest(VSEL)) continue; // 중첩(role=img 안의 svg 등)은 한 번만
    consider(el);
  }
  for (const el of main.querySelectorAll("*")) {
    if (el.closest(VSEL)) continue;
    const bg = getComputedStyle(el).backgroundImage;
    if (bg && bg !== "none" && bg.includes("url(")) consider(el, "bg");
  }
  const imgs = [...document.querySelectorAll("img")].filter((img) => visible(img) && img.getBoundingClientRect().width > 1);
  const broken = imgs.filter((img) => img.complete && img.naturalWidth === 0).length;

  // 보이는 텍스트: 줄 단위 사각형 중심 y 로 40px 버킷에 글자 수(공백 제외)를 나눠 담는다
  const BUCKET = 40;
  const buckets = new Map();
  const skip = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"]);
  const visCache = new Map();
  const range = document.createRange();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let chars = 0;
  let mainChars = 0;
  const pieces = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const text = node.nodeValue ?? "";
    const n = text.replace(/\s+/g, "").length;
    if (!n) continue;
    const parent = node.parentElement;
    if (!parent || skip.has(parent.tagName)) continue;
    let vis = visCache.get(parent);
    if (vis === undefined) {
      vis = visible(parent);
      visCache.set(parent, vis);
    }
    if (!vis) continue;
    range.selectNodeContents(node);
    const rects = [...range.getClientRects()].filter((r) => r.width > 1 && r.height > 1);
    if (rects.length === 0) continue;
    chars += n;
    pieces.push(text);
    const per = n / rects.length;
    for (const r of rects) {
      const y = (r.top + r.bottom) / 2 + sy;
      if (y >= mr.top + sy && y < mr.bottom + sy) mainChars += per;
      const b = Math.floor(y / BUCKET);
      buckets.set(b, (buckets.get(b) ?? 0) + per);
    }
  }
  const texts = [...buckets.entries()].map(([b, n]) => [b * BUCKET + BUCKET / 2, Math.round(n * 10) / 10]);
  const bodyText = pieces.join(" ").replace(/\s+/g, " ");
  const snippets = (re, max = 5) => {
    const found = [];
    for (const m of bodyText.matchAll(re)) {
      const s = bodyText.slice(Math.max(0, m.index - 12), m.index + m[0].length + 12).trim();
      if (!found.includes(s)) found.push(s);
      if (found.length >= max) break;
    }
    return found;
  };

  // 터치 타겟(모바일): 문장 안 인라인 링크는 WCAG 2.5.8 예외라 뺀다
  const smallTargets = [];
  if (mobile) {
    const SEL =
      "a[href], button, input:not([type='hidden']), select, textarea, summary, [role='button'], [role='link'], [role='switch'], [role='checkbox'], [role='radio'], [role='tab'], [role='option'], [tabindex]:not([tabindex='-1'])";
    for (const el of document.querySelectorAll(SEL)) {
      const r = el.getBoundingClientRect();
      if (r.width <= 1 && r.height <= 1) continue;
      if (getComputedStyle(el).visibility === "hidden") continue;
      if (r.width >= minTarget && r.height >= minTarget) continue;
      const parent = el.parentElement;
      if (el.tagName === "A" && parent && ["P", "LI", "TD", "DD", "SPAN"].includes(parent.tagName)) {
        const own = (el.textContent ?? "").trim().length;
        if ((parent.textContent ?? "").trim().length > own + 10) continue;
      }
      // 화면에 그려지지 않는 실제 입력(라벨로 누르는 radio·checkbox)은 라벨이 타겟
      if (el.tagName === "INPUT" && (r.width <= 2 || r.height <= 2)) continue;
      const name = (el.getAttribute("aria-label") || el.textContent || el.getAttribute("placeholder") || "").replace(/\s+/g, " ").trim().slice(0, 24);
      const tid = el.closest("[data-testid]")?.getAttribute("data-testid");
      smallTargets.push(`${tid ? `[${tid}] ` : ""}${el.tagName.toLowerCase()} "${name}" ${Math.round(r.width)}×${Math.round(r.height)}`);
    }
  }

  const meta = (sel, attr = "content") => document.querySelector(sel)?.getAttribute(attr) ?? null;
  const h1s = [...document.querySelectorAll("h1")];
  return {
    page: { height: doc.scrollHeight, viewportHeight: vh, viewportWidth: vw, overflowX: Math.max(0, doc.scrollWidth - doc.clientWidth) },
    main: { top: mr.top + sy, bottom: mr.bottom + sy },
    visuals,
    texts,
    chars,
    mainChars: Math.round(mainChars),
    visualArea,
    contentImages,
    foldVisuals,
    imgTags: imgs.length,
    broken,
    meta: {
      title: document.title || null,
      description: meta('meta[name="description"]'),
      canonical: meta('link[rel="canonical"]', "href"),
      robots: meta('meta[name="robots"]'),
      ogTitle: meta('meta[property="og:title"]'),
      ogImage: meta('meta[property="og:image"]'),
      lang: doc.getAttribute("lang"),
      h1Count: h1s.length,
      h1: h1s.map((h) => (h.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 80)),
    },
    jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent ?? ""),
    smallTargets,
    glitches: snippets(/\b(undefined|NaN)\b|\[object Object\]|lorem ipsum|\{\{|\}\}/gi),
    adSafety: snippets(
      /부작용(이|은)?\s*(전혀\s*)?없(습니다|어요|음|는\s*(수술|시술)입)|100\s*%\s*(만족|효과|안전|성공)|효과(를)?\s*보장(?!하지|되지|할\s*수\s*없)|완벽(한|하게)\s*(결과|효과|교정)|전후\s*사진|비포\s*[&·]?\s*애프터|업계\s*최저가|국내\s*최고|무조건|부작용\s*0/g,
    ),
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function collectIssues(page, origin, ignoreUrl = null) {
  const issues = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") issues.push(`console.${msg.type()}: ${msg.text().slice(0, 300)}`);
  });
  page.on("pageerror", (err) => issues.push(`pageerror: ${String(err.message).slice(0, 300)}`));
  page.on("response", (res) => {
    if (res.url().startsWith(origin) && res.status() >= 400 && res.url() !== ignoreUrl) issues.push(`HTTP ${res.status()}: ${safeDecode(res.url().slice(origin.length))}`);
  });
  return issues;
}

function safeDecode(s) {
  try {
    return decodeURI(s);
  } catch {
    return s;
  }
}

async function dismissConsent(page) {
  const btn = page.getByTestId("consent-save");
  if (await btn.isVisible().catch(() => false)) {
    await btn.click().catch(() => {});
    await page
      .getByTestId("consent-banner")
      .waitFor({ state: "hidden", timeout: 5000 })
      .catch(() => {});
  }
}

async function throttle(cdp, on) {
  if (!cdp) return;
  await cdp.send("Network.enable").catch(() => {});
  await cdp
    .send("Network.emulateNetworkConditions", {
      offline: false,
      latency: on ? THROTTLE.latencyMs : 0,
      downloadThroughput: on ? (THROTTLE.downKbps * 1024) / 8 : -1,
      uploadThroughput: on ? (THROTTLE.upKbps * 1024) / 8 : -1,
    })
    .catch(() => {});
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: on ? THROTTLE.cpu : 1 }).catch(() => {});
}

/** 전체 화면 JPEG → 화면 높이 단위로 잘라 붙인 시트(모바일 4열×2행, 데스크톱 2열×2행) */
async function makeSheets(sharp, fullBuf, { segH, cols, rows, prefix, dir, maxSheets = 4 }) {
  const meta = await sharp(fullBuf).metadata();
  const total = meta.height ?? 0;
  const width = meta.width ?? 0;
  if (!total || !width) return [];
  const GAP = 16;
  const LABEL = 22;
  const perSheet = cols * rows;
  const segs = Math.ceil(total / segH);
  const scale = Math.min(1, (1600 - GAP * (cols + 1)) / (cols * width));
  const tileW = Math.round(width * scale);
  const tileH = Math.round(segH * scale);
  const files = [];
  for (let s = 0; s * perSheet < segs && s < maxSheets; s++) {
    const composites = [];
    const n = Math.min(perSheet, segs - s * perSheet);
    for (let k = 0; k < n; k++) {
      const i = s * perSheet + k;
      const top = i * segH;
      const h = Math.min(segH, total - top);
      const tile = await sharp(fullBuf).extract({ left: 0, top, width, height: h }).resize({ width: tileW }).toBuffer();
      const x = GAP + (k % cols) * (tileW + GAP);
      const y = GAP + Math.floor(k / cols) * (tileH + GAP + LABEL);
      const label = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileW}" height="${LABEL}"><text x="2" y="${LABEL - 6}" font-size="15" font-family="Arial, sans-serif" fill="#333D4B">#${i + 1}  y ${top}-${top + h}</text></svg>`;
      composites.push({ input: Buffer.from(label), left: x, top: y }, { input: tile, left: x, top: y + LABEL });
    }
    const usedRows = Math.ceil(n / cols);
    const file = `${prefix}-sheet${s + 1}.jpg`;
    await sharp({
      create: {
        width: GAP + cols * (tileW + GAP),
        height: GAP + usedRows * (tileH + GAP + LABEL),
        channels: 3,
        background: "#D1D6DB",
      },
    })
      .composite(composites)
      .jpeg({ quality: 74 })
      .toFile(path.join(dir, file));
    files.push(`screens/${file}`);
  }
  return files;
}

async function auditPage({ browser, AxeBuilder, sharp, base, origin, route, key, vp, opts, screensDir }) {
  const mobile = vp < 768;
  const context = await browser.newContext({ ...VIEWPORTS[vp], locale: "ko-KR", timezoneId: "Asia/Seoul" });
  const page = await context.newPage();
  const url = `${base}${encodeURI(route.slice(1))}`;
  const issues = collectIssues(page, origin, route === NOT_FOUND_ROUTE ? url : null);
  await page.addInitScript(initObservers);
  const cdp = mobile && opts.throttle ? await context.newCDPSession(page).catch(() => null) : null;
  const m = { status: null, ms: {}, shots: {} };
  const prefix = `${key}-${vp}`;
  try {
    await throttle(cdp, true);
    const t0 = Date.now();
    const res = await page.goto(url, { waitUntil: "load", timeout: 90_000 });
    m.status = res?.status() ?? null;
    const scripts = scriptPathsFromHtml(res ? await res.text().catch(() => "") : "");
    m.ms.load = Date.now() - t0;
    await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
    await sleep(600);
    const perf = await page.evaluate(() => window.__audit ?? { lcp: null, cls: 0 });
    m.lcp = perf.lcp;
    m.cls = Math.round((perf.cls ?? 0) * 10000) / 10000;
    const initial = await page.evaluate(readResources);
    await throttle(cdp, false);

    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(screensDir, `${prefix}-fold.png`), animations: "disabled" });
    m.shots.fold = `screens/${prefix}-fold.png`;

    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
    const blocking = axe.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    m.axe = {
      critical: blocking.filter((v) => v.impact === "critical").length,
      serious: blocking.filter((v) => v.impact === "serious").length,
      violations: blocking.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) })),
    };

    await dismissConsent(page);
    // 지연 로딩 이미지를 모두 불러오도록 끝까지 내렸다가 맨 위로
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    const vh = VIEWPORTS[vp].viewport.height;
    for (let y = 0; y < height; y += Math.round(vh * 0.8)) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await sleep(80);
    }
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await sleep(250);

    const a = await page.evaluate(analyzePage, { iconMin: LIMITS.iconMin, contentImage: LIMITS.contentImage, minTarget: LIMITS.minTarget, mobile });
    const full = await page.evaluate(readResources);
    const bytesInitial = sumBytes(initial);
    const bytesFull = sumBytes(full);
    const largest = full
      .filter((e) => e.size > 0)
      .sort((x, y) => y.size - x.size)
      .slice(0, 5)
      .map((e) => ({ name: safeDecode(e.name.startsWith(origin) ? e.name.slice(origin.length) : e.name), type: classifyResource(e.name, e.initiatorType), kb: Math.round(e.size / 1024) }));
    const walls = findTextWalls({ visuals: a.visuals, texts: a.texts, start: a.main.top, end: a.main.bottom, screen: a.page.viewportHeight });
    const mainHeight = Math.max(1, a.main.bottom - a.main.top);
    m.bytes = { firstLoadJs: firstLoadJsBytes(initial, scripts), initial: bytesInitial, full: bytesFull };
    m.requests = { initial: initial.length, full: full.length };
    m.largest = largest;
    m.page = { height: a.page.height, screens: Math.round((a.page.height / a.page.viewportHeight) * 10) / 10, overflowX: a.page.overflowX };
    m.images = {
      imgTags: a.imgTags,
      broken: a.broken,
      contentImages: a.contentImages,
      visuals: a.visuals.length,
      foldVisuals: a.foldVisuals,
      visualAreaPct: Math.round((a.visualArea / Math.max(1, a.page.viewportWidth * a.page.height)) * 1000) / 10,
    };
    m.text = {
      chars: a.chars,
      mainChars: a.mainChars,
      charsPerScreen: Math.round(a.mainChars / Math.max(0.1, mainHeight / a.page.viewportHeight)),
      walls,
    };
    m.meta = { ...a.meta, titleLength: a.meta.title?.length ?? 0, descriptionLength: a.meta.description?.length ?? 0 };
    m.jsonLd = jsonLdInfo(a.jsonLd);
    m.smallTargets = a.smallTargets.slice(0, 15);
    m.glitches = a.glitches;
    m.adSafety = a.adSafety;

    const fullBuf = await page.screenshot({ fullPage: true, type: "jpeg", quality: 72, scale: "css", animations: "disabled" });
    fs.writeFileSync(path.join(screensDir, `${prefix}-full.jpg`), fullBuf);
    m.shots.full = `screens/${prefix}-full.jpg`;
    if (sharp) {
      try {
        m.shots.sheets = await makeSheets(sharp, fullBuf, {
          segH: vh,
          cols: mobile ? 4 : 2,
          rows: 2,
          prefix,
          dir: screensDir,
        });
        m.shots.walls = [];
        const meta = await sharp(fullBuf).metadata();
        for (const [i, w] of walls.slice(0, LIMITS.maxWallShots).entries()) {
          const top = Math.min(w.top, (meta.height ?? 1) - 1);
          const h = Math.max(1, Math.min(w.height, vh * 2, (meta.height ?? 0) - top));
          const file = `${prefix}-wall${i + 1}.jpg`;
          await sharp(fullBuf).extract({ left: 0, top, width: meta.width ?? VIEWPORTS[vp].viewport.width, height: h }).jpeg({ quality: 74 }).toFile(path.join(screensDir, file));
          w.shot = `screens/${file}`;
          m.shots.walls.push(w.shot);
        }
      } catch (err) {
        m.shots.sheetError = String(err.message).slice(0, 200);
      }
    }
  } catch (err) {
    m.error = String(err.message).split("\n")[0].slice(0, 300);
  } finally {
    if (route === NOT_FOUND_ROUTE) {
      // 404 문서 자체에 대한 브라우저 로그 1건은 의도된 것
      const i = issues.findIndex((s) => /Failed to load resource: .*status of 404/.test(s));
      if (i > -1) issues.splice(i, 1);
    }
    m.console = [...new Set(issues)].slice(0, 20);
    await context.close().catch(() => {});
  }
  return m;
}

/* ───────────────────────── 여정 ───────────────────────── */

class StopJourney extends Error {}

const DL_EVENTS = () =>
  (window.dataLayer ?? [])
    .filter((e) => e && typeof e === "object" && !Array.isArray(e) && typeof e.event === "string" && !e.event.startsWith("gtm."))
    .map((e) => JSON.parse(JSON.stringify(e)));

async function journey({ name, title, browser, vp, origin, screensDir }, fn) {
  const context = await browser.newContext({ ...VIEWPORTS[vp], locale: "ko-KR", timezoneId: "Asia/Seoul" });
  const page = await context.newPage();
  const issues = collectIssues(page, origin);
  const result = { name, title, viewport: vp, ok: false, steps: [], assertions: [], events: [], console: [] };
  const step = async (label, f, { shot = true } = {}) => {
    const s = { name: label, ok: false, ms: 0, url: null, shot: null, error: null };
    result.steps.push(s);
    const t = Date.now();
    try {
      await f();
      s.ok = true;
    } catch (err) {
      s.error = String(err.message).split("\n")[0].slice(0, 300);
    }
    s.ms = Date.now() - t;
    try {
      const u = new URL(page.url());
      s.url = safeDecode(u.pathname + u.search);
    } catch {
      /* about:blank */
    }
    if (shot) {
      const file = `journey-${name}-${vp}-${result.steps.length}-${label}.jpg`;
      await page
        .screenshot({ path: path.join(screensDir, file), type: "jpeg", quality: 80, scale: "css", animations: "disabled" })
        .then(() => (s.shot = `screens/${file}`))
        .catch(() => {});
    }
    if (!s.ok) throw new StopJourney(label);
  };
  const check = (label, ok, detail, extra = {}) => result.assertions.push({ name: label, ok: Boolean(ok), detail, ...extra });
  const record = (evs) => (result.events = evs.map((e) => e.event));
  const events = () => page.evaluate(DL_EVENTS).catch(() => []);
  try {
    await fn({ page, step, check, events, record });
  } catch (err) {
    if (!(err instanceof StopJourney)) result.error = String(err.message).split("\n")[0].slice(0, 300);
  } finally {
    if (result.events.length === 0) result.events = (await events()).map((e) => e.event);
    result.console = [...new Set(issues)].slice(0, 20);
    result.ok = !result.error && result.steps.every((s) => s.ok) && result.assertions.every((a) => a.ok || a.info);
    await context.close().catch(() => {});
  }
  return result;
}

const waitEvent = (page, name, timeout = 6000) =>
  page.waitForFunction((n) => (window.dataLayer ?? []).some((e) => e && e.event === n), name, { timeout });

async function leadJourney(ctx) {
  return journey({ ...ctx, name: "lead", title: "검색→가이드→상담→완료" }, async ({ page, step, check, events, record }) => {
    await step("home", async () => {
      await page.goto(ctx.base, { waitUntil: "load" });
      await dismissConsent(page);
      await page.getByTestId("home-search").waitFor({ timeout: 10_000 });
    });
    await step("search-suggest", async () => {
      const input = page.getByTestId("home-search").locator("input");
      await input.click();
      await input.fill("쌍꺼풀");
      await page.getByTestId("home-search").getByRole("option").first().waitFor({ state: "visible", timeout: 5000 });
    });
    await step("guide", async () => {
      await page.getByTestId("home-search").getByRole("option").first().click();
      await page.waitForURL(/\/procedures\/[^/]+\/$/, { timeout: 15_000 });
      await page.getByRole("heading", { level: 1 }).waitFor({ timeout: 10_000 });
      await waitEvent(page, "view_procedure");
    });
    await step("guide-cta", async () => {
      const cta = page.getByTestId("consult-cta-mid");
      await cta.scrollIntoViewIfNeeded({ timeout: 10_000 });
      await sleep(200);
    });
    await step("consult-step1", async () => {
      await page.getByTestId("consult-cta-mid").getByRole("link").first().click();
      await page.waitForURL(/\/consult\/\?.*procedure_id=/, { timeout: 15_000 });
      await page.getByTestId("consult-step1").waitFor({ timeout: 10_000 });
      await dismissConsent(page);
      await page.getByTestId("consult-region").locator("label").first().click();
      await page.getByTestId("consult-timing").locator("label").first().click();
    });
    await step("consult-step2", async () => {
      await page.getByTestId("consult-submit").click();
      await page.getByTestId("consult-step2").waitFor({ timeout: 10_000 });
      await page.locator("#consult-name").fill("김지은");
      await page.locator("#consult-phone").fill("01012345678");
      await page.getByTestId("consult-contact-time").locator("label").first().click();
      await page.locator("label", { has: page.getByTestId("consent-all") }).first().click();
    });
    // live 모드(Supabase 키를 넣고 빌드)에서는 제출하면 실제 리드·알림·CAPI 가 나간다 → 시연 모드에서만 제출한다
    if ((await page.getByTestId("consult-demo-notice").count()) === 0) {
      const evs = await events();
      record(evs);
      check("완료·generate_lead 확인", false, "live 모드 — 실제 리드 생성을 막으려고 제출 생략(시연 모드 빌드에서만 확인)", { code: "lead-skipped", info: true });
      return;
    }
    await step("done", async () => {
      await page.getByTestId("consult-submit").click();
      await page.waitForURL(/\/consult\/done\/$/, { timeout: 20_000 });
      await page.getByRole("heading", { level: 1 }).waitFor({ timeout: 10_000 });
      await waitEvent(page, "generate_lead", 8000).catch(() => {});
    });
    const evs = await events();
    record(evs);
    // 새로고침 2회 동안 같은 리드로 다시 보내지 않아야 한다(tracking-plan 6절 계층 2)
    let afterReload = -1;
    await step(
      "reload",
      async () => {
        await page.reload({ waitUntil: "load" });
        await page.getByRole("heading", { level: 1 }).waitFor({ timeout: 10_000 });
        await sleep(800);
        afterReload = (await events()).filter((e) => e.event === "generate_lead").length;
      },
      { shot: false },
    );
    const leads = evs.filter((e) => e.event === "generate_lead");
    const lead = leads[0] ?? {};
    const count = (n) => evs.filter((e) => e.event === n).length;
    check("generate_lead 정확히 1회", leads.length === 1, `${leads.length}회`, { code: "lead-count" });
    check("value 50000 KRW", lead.value === LEAD_VALUE && lead.currency === "KRW", `value=${lead.value} currency=${lead.currency}`, { code: "lead-value" });
    check("lead_id 형식", /^[0-9a-f-]{36}$/.test(String(lead.lead_id ?? "")), String(lead.lead_id ?? "없음").slice(0, 8), { code: "lead-id" });
    check("procedure_id 전달", Boolean(lead.procedure_id), String(lead.procedure_id ?? "없음"), { code: "lead-param", severity: "major" });
    check("새로고침 후 재발화 0", afterReload === 0, `${afterReload}회`, { code: "lead-duplicate" });
    check("form_start 1회", count("form_start") === 1, `${count("form_start")}회`, { code: "funnel-event", severity: "major" });
    check("form_step2 1회", count("form_step2") === 1, `${count("form_step2")}회`, { code: "funnel-event", severity: "major" });
    check("view_procedure 1회", count("view_procedure") === 1, `${count("view_procedure")}회`, { code: "funnel-event", severity: "major" });
    check(
      "click_cta(mid)",
      evs.some((e) => e.event === "click_cta" && e.location === "mid"),
      evs.filter((e) => e.event === "click_cta").map((e) => e.location).join(",") || "없음",
      { code: "funnel-event", severity: "major" },
    );
    check("search 이벤트", count("search") >= 1, `${count("search")}회`, { code: "funnel-event", severity: "minor" });
  });
}

async function clinicJourney(ctx) {
  return journey({ ...ctx, name: "clinic", title: "홈→병원 목록→병원→상담" }, async ({ page, step, check, events, record }) => {
    await step("home", async () => {
      await page.goto(ctx.base, { waitUntil: "load" });
      await dismissConsent(page);
      await page.getByTestId("home-clinics").waitFor({ timeout: 10_000 });
    });
    await step("clinics", async () => {
      const more = page.getByTestId("home-clinics").locator('a[href$="/clinics/"]').first();
      if (await more.count()) {
        await more.scrollIntoViewIfNeeded();
        await more.click();
      } else await page.goto(`${ctx.base}clinics/`);
      await page.waitForURL(/\/clinics\/$/, { timeout: 15_000 });
      await page.getByTestId("clinic-card").first().waitFor({ timeout: 10_000 });
    });
    await step("clinic", async () => {
      await page.getByTestId("clinic-card-link").first().click();
      await page.waitForURL(/\/clinics\/[^/]+\/$/, { timeout: 15_000 });
      await page.getByRole("heading", { level: 1 }).waitFor({ timeout: 10_000 });
      await waitEvent(page, "view_clinic");
    });
    let contact = { phone: false, kakao: false };
    await step("clinic-cta", async () => {
      contact = {
        phone: (await page.getByTestId("clinic-phone").count()) > 0,
        kakao: (await page.getByTestId("clinic-kakao").count()) > 0,
      };
      await page.getByTestId("consult-cta-mid").scrollIntoViewIfNeeded({ timeout: 10_000 });
      await sleep(200);
    });
    await step("consult", async () => {
      await page.getByTestId("consult-cta-mid").getByRole("link").first().click();
      await page.waitForURL(/\/consult\/\?.*clinic_id=/, { timeout: 15_000 });
      await page.getByTestId("consult-clinic").waitFor({ timeout: 10_000 });
    });
    const evs = await events();
    record(evs);
    const count = (n) => evs.filter((e) => e.event === n).length;
    check("select_clinic", count("select_clinic") >= 1, `${count("select_clinic")}회`, { code: "funnel-event", severity: "major" });
    check("view_clinic 1회", count("view_clinic") === 1, `${count("view_clinic")}회`, { code: "funnel-event", severity: "major" });
    check(
      "click_cta(mid)",
      evs.some((e) => e.event === "click_cta" && e.location === "mid"),
      evs.filter((e) => e.event === "click_cta").map((e) => e.location).join(",") || "없음",
      { code: "funnel-event", severity: "major" },
    );
    check("폼 진입만으로 form_start 없음", count("form_start") === 0, `${count("form_start")}회`, { code: "funnel-event", severity: "major" });
    // 전화·카톡은 제휴 병원(is_partner)만 노출한다(TASKS T-006 가정) → 정보로만 기록
    check("전화·카톡 버튼", contact.phone || contact.kakao, `전화 ${contact.phone ? "있음" : "없음"} · 카톡 ${contact.kakao ? "있음" : "없음"}(제휴 병원만 노출)`, {
      code: "contact-buttons",
      info: true,
    });
  });
}

/* ───────────────────────── 실행 ───────────────────────── */

function git(args) {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

function fatal(message) {
  console.error(`[audit] 중단: ${message}`);
  process.exit(1);
}

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`[audit] ${err.message}`);
    console.error("사용: pnpm audit:site [--no-build] [--routes a,b] [--label 이름] [--viewports 375,1280] [--no-journeys] [--no-throttle]");
    process.exit(1);
  }
  const started = new Date();
  const indexHtml = path.join(OUT_DIR, "index.html");
  const build = { ran: opts.build, ok: true, message: null };
  if (opts.build) {
    console.log("[audit] pnpm build …");
    const t = Date.now();
    const r = spawnSync("pnpm build", { cwd: ROOT, stdio: "inherit", shell: true });
    if (r.status !== 0) {
      const fresh = fs.existsSync(indexHtml) && fs.statSync(indexHtml).mtimeMs >= t;
      if (!fresh) fatal("pnpm build 실패 — 새 out/ 이 없어 감사할 수 없습니다.");
      build.ok = false;
      build.message = "pnpm build 가 0 이 아닌 코드로 끝났습니다(next build 는 끝남 — check-out 등 후처리 실패). 빌드 로그를 확인하세요.";
    }
  }
  if (!fs.existsSync(indexHtml)) fatal("out/index.html 이 없습니다. 먼저 pnpm build (또는 --no-build 없이 실행).");

  let server;
  let port;
  let basePath;
  try {
    ({ server, port, basePath } = await startServer({ port: 0 }));
  } catch (err) {
    fatal(`정적 서버 실행 실패: ${err.message}`);
  }
  const origin = `http://localhost:${port}`;
  const base = `${origin}${basePath}/`;

  let content = null;
  try {
    content = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "generated", "content.json"), "utf8"));
  } catch {
    /* 키는 해시로 대체 */
  }
  const slugMap = slugMapFromContent(content);
  let sitemapXml = "";
  try {
    sitemapXml = fs.readFileSync(path.join(OUT_DIR, "sitemap.xml"), "utf8");
  } catch {
    console.warn("[audit] out/sitemap.xml 없음 — 추가 경로만 감사");
  }
  const all = buildRouteList({ sitemapRoutes: routesFromSitemap(sitemapXml, basePath) });
  const routes = opts.routes ? selectRoutes(all, opts.routes, slugMap) : all;

  fs.mkdirSync(AUDIT_DIR, { recursive: true });
  const run = runFolderName(started, opts.label, (n) => fs.existsSync(path.join(AUDIT_DIR, n)));
  const runDir = path.join(AUDIT_DIR, run);
  const screensDir = path.join(runDir, "screens");
  fs.mkdirSync(screensDir, { recursive: true });

  let browser;
  let AxeBuilder;
  let sharp = null;
  try {
    const { chromium } = await import("@playwright/test");
    const axeMod = await import("@axe-core/playwright");
    AxeBuilder = axeMod.default?.default ?? axeMod.default ?? axeMod.AxeBuilder;
    browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined });
  } catch (err) {
    server.close();
    fatal(`브라우저 실행 실패: ${String(err.message).split("\n")[0]} — pnpm exec playwright install chromium 을 실행하세요.`);
  }
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.warn("[audit] sharp 없음 — 시트·텍스트 벽 크롭 생략");
  }

  console.log(`[audit] ${base} · ${routes.length}개 경로 × ${opts.viewports.join("·")}px → reports/audit/${run}/`);
  const results = [];
  const journeys = [];
  try {
    let i = 0;
    for (const route of routes) {
      i++;
      const key = routeKey(route, slugMap);
      const entry = { route, key, viewports: {} };
      for (const vp of opts.viewports) {
        const t = Date.now();
        entry.viewports[vp] = await auditPage({ browser, AxeBuilder, sharp, base, origin, route, key, vp, opts, screensDir });
        const m = entry.viewports[vp];
        const flag = m.error ? `✗ ${m.error}` : `HTTP ${m.status} · LCP ${fmtMs(m.lcp?.ms)} · 벽 ${m.text?.walls?.length ?? 0}`;
        console.log(`  [${i}/${routes.length}] ${route} @${vp} ${flag} (${((Date.now() - t) / 1000).toFixed(1)}s)`);
      }
      results.push(entry);
    }
    if (opts.journeys) {
      for (const vp of opts.viewports) {
        for (const fn of [leadJourney, clinicJourney]) {
          const j = await fn({ browser, vp, base, origin, screensDir });
          console.log(`  [여정] ${j.title} @${vp} ${j.ok ? "통과" : "실패"}`);
          journeys.push(j);
        }
      }
    }
  } finally {
    await browser.close().catch(() => {});
    server.close();
  }

  const problems = [];
  if (!build.ok) problems.push({ severity: "critical", area: "G", code: "build", route: "(build)", key: "build", viewport: null, message: build.message });
  for (const r of results) for (const vp of opts.viewports) problems.push(...evaluateRoute({ route: r.route, key: r.key, viewport: vp, m: r.viewports[vp] }));
  for (const j of journeys) problems.push(...evaluateJourney(j));

  const finished = new Date();
  const report = {
    version: 1,
    run,
    startedAt: started.toISOString(),
    finishedAt: finished.toISOString(),
    durationMs: finished - started,
    git: {
      branch: git(["rev-parse", "--abbrev-ref", "HEAD"]),
      commit: git(["rev-parse", "--short", "HEAD"]),
      dirty: Boolean(git(["status", "--porcelain"])),
    },
    basePath,
    options: { ...opts, build: opts.build, chromium: process.env.PW_CHROMIUM_PATH ? "PW_CHROMIUM_PATH" : "playwright" },
    limits: LIMITS,
    throttle: opts.throttle ? THROTTLE : null,
    build,
    routes: results,
    journeys,
    problems,
    ranked: rankProblems(problems).map(({ examples, ...g }) => ({ ...g, example: examples[0] })),
  };
  fs.writeFileSync(path.join(runDir, "report.json"), `${JSON.stringify(report, null, 1)}\n`, "utf8");
  fs.writeFileSync(path.join(runDir, "summary.md"), renderSummary(report), "utf8");
  if (!opts.routes) fs.writeFileSync(path.join(AUDIT_DIR, "LATEST.txt"), `${run}\n`, "utf8");
  const sev = (s) => problems.filter((p) => p.severity === s).length;
  console.log(`[audit] 완료 — 치명 ${sev("critical")} · 주요 ${sev("major")} · 경미 ${sev("minor")} → reports/audit/${run}/summary.md`);
}

if (path.basename(process.argv[1] ?? "") === "audit.mjs") {
  main().catch((err) => {
    console.error(`[audit] 예기치 않은 오류: ${err.stack ?? err.message}`);
    process.exit(1);
  });
}
