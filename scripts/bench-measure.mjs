// 벤치마크 실측 스크립트 (T-090 r2, r4 갱신) — 경쟁사·우리 사이트 공용. docs/BENCHMARK.md 1절의 "같은 스크립트".
//
// 사용:
//   node scripts/bench-measure.mjs <name>=<url> [<name>=<url> ...] [옵션]
// 옵션:
//   --widths 375,1280     측정 폭(375 → 375×812, 구간 667px / 1280 → 1280×800, 구간 800px). 기본 375,1280
//   --runs 3              폭마다 LCP 기록 회차 수. 결과에 LCP·CLS 중앙값을 함께 낸다. 기본 1.
//                         LCP 미기록(대기 시간 안에 항목 0) 회차는 중앙값에서 빼고, 기록이 runs 개가 될 때까지 추가 측정한다
//   --max-runs 5          폭마다 총 측정 상한(미기록 회차 포함). 기본 runs + 2. 상한 안에 runs 개를 못 채우면
//                         요약에 lcpShort=true, 화면에 "LCP 기록 n/runs 미달" 표시, 종료 코드 1.
//                         HTTP status ≥ 400 또는 null 회차(warm 예열 포함)가 나오면 재요청 없이 그 폭을 바로 멈춘다
//                         (요약 stoppedByStatus=true·statusFail 수, "재요청 없이 중단" 표시, 종료 코드 1). 재측정 사유는 LCP 0뿐
//   --cache cold|warm     cold = 측정마다 새 브라우저 프로세스 + 새 컨텍스트(HTTP 캐시·소켓·브라우저 DNS 캐시 빈 상태, OS DNS 캐시는 공유).
//                         warm = 같은 브라우저·컨텍스트에서
//                         기록하지 않는 예열 1회 뒤 측정(예열도 대상 서버에 1회 요청). 기본 cold
//   --wait 3500           load 이벤트 뒤 LCP·CLS를 읽기까지 대기(ms). 기본 3500
//   --rule bench|check-density
//                         밀도 규칙. bench(기본) = 아래 RULES.bench, check-density = scripts/check-density.mjs와 같은 규칙
//   --min 2               구간 최소 비텍스트 수. 어느 측정이든 미달 구간이 있으면 종료 코드 1(우리 사이트 검사용)
//   --shot <dir>          첫 측정의 뷰포트 스크린샷을 <dir>/<name>-<w>.png로 저장(경쟁사 캡처는 reports/benchmark/만)
//   --out <file.json>     결과 JSON 저장(utf8). 없으면 stdout만
//   --ssr                 렌더 대신 Node 기본 fetch(UA 변경 없음)로 SSR HTML 1회만 받아 정적 지표만 센다:
//                         JSON-LD(@type·Question 수·reviewedBy)·h1·a[href]·viewport·텍스트 신호,
//                         ariaExpanded(전체·button·값 true/false·header/nav 안팎·accordion/menu 속성 후보·aria-controls),
//                         refLinks(pubmed·pmc·ncbiBook·doi·europePmc href 수 + 고유 href 수). HTML 원문은 저장하지 않는다.
//                         렌더 측정(m.ariaExpanded)도 같은 분류로 [aria-expanded]를 센다(B-44 우리 화면 검사, 출력 ax=전체/헤더·nav 밖 button)
//   --robots-only         --robots 만 하고 페이지는 요청하지 않는다(호스트당 robots.txt 1회)
//   --robots              대상 호스트 /robots.txt를 받아 User-agent * 기준으로 해당 경로 허용 여부를 낸다
//   --probe <regex>       첫 측정(375 우선) 화면에서 innerText가 regex에 맞는 요소의 태그·href·target·role·onclick 유무를 기록(클릭 0)
//   --probe-click         --probe 첫 번째 보이는 요소를 1회 클릭하고 이동 URL·새 탭 URL·대화상자·보이는 입력 필드 수를 기록.
//                         입력·전송은 하지 않는다. 측정이 끝난 뒤에 실행한다
//
// 규칙: UA 위장 0(헤드리스 Chromium 기본 UA, Node fetch 기본 UA), 폼 입력·제출 0, 로그인 0, 캡차 풀이 0.
// 375는 뷰포트 폭만 바꾼다(isMobile·모바일 UA 미사용, deviceScaleFactor 1) — r1과 같은 조건.
// 네트워크·CPU 무쓰로틀. Lighthouse 모바일 값(scripts/lh.mjs)과 직접 비교하지 않는다.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const argv = process.argv.slice(2);
const opt = { widths: [375, 1280], runs: 1, cache: "cold", wait: 3500, rule: "bench", min: null, shot: null, out: null, ssr: false, robots: false, probe: null, probeClick: false };
const targets = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  const next = () => argv[++i];
  if (a === "--widths") opt.widths = next().split(",").map(Number);
  else if (a === "--runs") opt.runs = Number(next());
  else if (a === "--max-runs") opt.maxRuns = Number(next());
  else if (a === "--cache") opt.cache = next();
  else if (a === "--wait") opt.wait = Number(next());
  else if (a === "--rule") opt.rule = next();
  else if (a === "--min") opt.min = Number(next());
  else if (a === "--shot") opt.shot = next();
  else if (a === "--out") opt.out = next();
  else if (a === "--ssr") opt.ssr = true;
  else if (a === "--robots") opt.robots = true;
  else if (a === "--robots-only") { opt.robots = true; opt.robotsOnly = true; }
  else if (a === "--probe") opt.probe = next();
  else if (a === "--probe-click") opt.probeClick = true;
  else if (a.includes("=") && /^[a-z0-9-]+=/i.test(a)) { const k = a.indexOf("="); targets.push([a.slice(0, k), a.slice(k + 1)]); }
  else { console.error(`알 수 없는 인자: ${a}`); process.exit(2); }
}
if (!targets.length) { console.error("사용: node scripts/bench-measure.mjs <name>=<url> [--widths 375,1280] [--runs 3] [--cache cold|warm] [--ssr] [--robots]"); process.exit(2); }
if (!["cold", "warm"].includes(opt.cache)) { console.error("--cache 는 cold 또는 warm"); process.exit(2); }
if (!["bench", "check-density"].includes(opt.rule)) { console.error("--rule 은 bench 또는 check-density"); process.exit(2); }
for (const [name] of targets) if (!/^[a-z0-9-]+$/.test(name)) { console.error(`name은 ASCII 소문자·숫자·하이픈만: ${name}`); process.exit(2); }

const VIEW = { 375: { width: 375, height: 812, segH: 667 }, 1280: { width: 1280, height: 800, segH: 800 } };
const MAX_H = 20000;
const median = (xs) => { const s = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b); if (!s.length) return null; const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

// ---------- 페이지 안에서 실행하는 측정 (문구는 저장하지 않는다: 개수·크기·타입명만) ----------
function measureInPage({ segH, maxH, rule }) {
  const vw = innerWidth;
  const vis = (e) => { const s = getComputedStyle(e); if (s.visibility === "hidden" || s.display === "none" || Number(s.opacity) === 0) return false; const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
  const types = []; let ldCount = 0, ldErr = 0, aggRating = 0, reviewedBy = 0;
  const walk = (o) => { if (!o || typeof o !== "object") return; if (Array.isArray(o)) return o.forEach(walk); if (o["@type"]) { (Array.isArray(o["@type"]) ? o["@type"] : [o["@type"]]).forEach((t) => types.push(t)); if (o["@type"] === "AggregateRating") aggRating++; } if (o.reviewedBy) reviewedBy++; for (const k in o) if (o[k] && typeof o[k] === "object") walk(o[k]); };
  document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => { ldCount++; try { walk(JSON.parse(s.textContent)); } catch { ldErr++; } });

  let all;
  if (rule === "check-density") {
    // scripts/check-density.mjs 와 같은 규칙: 선택자 5종, ≥ 24×24, 가시성·배경 이미지·중첩 제외 없음
    all = [...document.querySelectorAll("img,svg,canvas,video,[data-visual]")].filter((e) => { const b = e.getBoundingClientRect(); return b.width >= 24 && b.height >= 24; });
  } else {
    // bench 규칙(r1 bm-run과 같음): picture 포함, 중첩 svg·picture 안 img 제외, 가시성 필터, CSS 배경 이미지 요소 포함
    const nonText = [...document.querySelectorAll("img,svg,canvas,video,picture,[data-visual]")].filter((e) => { if (e.tagName.toLowerCase() === "svg" && e.parentElement && e.parentElement.closest("svg")) return false; if (e.tagName === "IMG" && e.closest("picture")) return false; const b = e.getBoundingClientRect(); return b.width >= 24 && b.height >= 24 && vis(e); });
    const bgEls = [...document.querySelectorAll("div,span,a,li,section,button,i")].filter((e) => { const s = getComputedStyle(e); if (!s.backgroundImage || !s.backgroundImage.includes("url(")) return false; const b = e.getBoundingClientRect(); return b.width >= 24 && b.height >= 24; });
    all = nonText.concat(bgEls);
  }
  const scrollers = [...document.querySelectorAll("div,main,section")].filter((e) => { const s = getComputedStyle(e); return (s.overflowY === "auto" || s.overflowY === "scroll") && e.scrollHeight > e.clientHeight + 50 && e.clientHeight > innerHeight * 0.6; }).sort((a, b) => b.scrollHeight - a.scrollHeight);
  const sc = rule === "check-density" ? null : scrollers[0];
  const H = Math.min(Math.max(document.documentElement.scrollHeight, sc ? sc.getBoundingClientRect().top + scrollY + sc.scrollHeight : 0), maxH);
  const tops = all.map((e) => e.getBoundingClientRect().top + scrollY);
  const segs = []; for (let y = 0; y < H; y += segH) segs.push(tops.filter((t) => t >= y && t < y + segH).length);
  const inFirst = (e) => { const b = e.getBoundingClientRect(); const t = b.top + scrollY; return t < innerHeight && t + b.height > 0 && b.left < vw && b.right > 0; };

  const imgLike = (e) => !!e.querySelector("img,svg,picture,video");
  const cardCands = [...document.querySelectorAll("a,li,article,[role=link]")].filter((e) => { const b = e.getBoundingClientRect(); return b.width >= 80 && b.height >= 80 && vis(e) && imgLike(e); });
  const cards = cardCands.filter((e) => !cardCands.some((o) => o !== e && o.contains(e)));
  const ctas = [...document.querySelectorAll("a,button,[role=button]")].filter((e) => { if (!vis(e)) return false; const b = e.getBoundingClientRect(); if (b.height < 36 || b.width < 80) return false; const bg = getComputedStyle(e).backgroundColor; const filled = bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent" && !/^rgba?\(25[0-5], 25[0-5], 25[0-5]/.test(bg); const n = (e.innerText || "").trim().length; return filled && n > 0 && n < 30; });
  const vp = ((document.querySelector("meta[name=viewport]") || {}).content || "").replace(/\s/g, "");
  // [aria-expanded] 개수(B-44 검사용, ssrOne의 ariaExpanded와 같은 분류). 렌더 DOM 기준, 숨김 포함
  const ax = [...document.querySelectorAll("[aria-expanded]")];
  const inHN = (e) => !!e.closest("header,nav");
  const attrHas = (e, re) => [...e.attributes].some((a) => (a.name === "class" || a.name.startsWith("data-")) && re.test(a.value));
  const ariaExpanded = { all: ax.length, button: ax.filter((e) => e.tagName === "BUTTON").length, valueTrue: ax.filter((e) => e.getAttribute("aria-expanded") === "true").length, inHeaderNav: ax.filter(inHN).length, buttonOutsideHeaderNav: ax.filter((e) => e.tagName === "BUTTON" && !inHN(e)).length, accordionAttr: ax.filter((e) => attrHas(e, /accordion/i)).length, menuAttr: ax.filter((e) => attrHas(e, /menu|nav|dropdown|hamburger/i)).length };
  return {
    H, innerScroller: !!sc, ariaExpanded,
    ld: { n: ldCount, err: ldErr, types: [...new Set(types)], agg: aggRating, reviewedBy },
    h1: document.querySelectorAll("h1").length, aHref: document.querySelectorAll("a[href]").length,
    viewport: vp, zoomLimited: /maximum-scale=1(\.0)?(,|$)|user-scalable=(no|0)/.test(vp),
    dens: { rule, segs, n: segs.length, min: segs.length ? Math.min(...segs) : 0, zero: segs.filter((n) => n === 0).length, lt2: segs.filter((n) => n < 2).length },
    first: { nonText: all.filter(inFirst).length, imageCards: cards.filter(inFirst).length, filledCta: ctas.filter(inFirst).length },
    skeleton: document.querySelectorAll('[class*=skeleton],[class*=Skeleton],[class*=shimmer]').length,
    fields: [...document.querySelectorAll("input,select,textarea")].filter((e) => e.type !== "hidden" && vis(e)).length,
  };
}

async function lazyScroll(page) {
  await page.evaluate(async (maxH) => {
    const sc = [...document.querySelectorAll("div,main,section")].filter((e) => { const s = getComputedStyle(e); return (s.overflowY === "auto" || s.overflowY === "scroll") && e.scrollHeight > e.clientHeight + 50 && e.clientHeight > innerHeight * 0.6; }).sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
    const H = Math.min(Math.max(document.documentElement.scrollHeight, sc ? sc.scrollHeight : 0), maxH);
    for (let y = 0; y < H; y += 500) { scrollTo(0, y); if (sc) sc.scrollTop = y; await new Promise((r) => setTimeout(r, 100)); }
    scrollTo(0, 0); if (sc) sc.scrollTop = 0; await new Promise((r) => setTimeout(r, 600));
  }, MAX_H).catch(() => {});
}

const INIT = () => {
  if (window.__bmObs) return; window.__bmObs = 1; window.__lcp = 0; window.__lcpEl = ""; window.__cls = 0;
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__lcp = e.startTime; window.__lcpEl = (e.element && e.element.tagName) || ""; } }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });
  } catch { /* 지원 안 함 */ }
};

async function probe(page, re, click) {
  const found = await page.evaluate((src) => {
    const rx = new RegExp(src);
    const vis = (e) => { const s = getComputedStyle(e); const b = e.getBoundingClientRect(); return s.display !== "none" && s.visibility !== "hidden" && b.width > 0 && b.height > 0; };
    const els = [...document.querySelectorAll("a,button,[role=button],div,span,li")].filter((e) => rx.test((e.innerText || "").trim()) && (e.innerText || "").trim().length <= 20);
    const leaf = els.filter((e) => !els.some((o) => o !== e && e.contains(o)));
    return { count: leaf.length, visible: leaf.filter(vis).length, items: leaf.slice(0, 5).map((e) => { const a = e.closest("a[href]"); const b = e.getBoundingClientRect(); return { tag: e.tagName.toLowerCase(), label: (e.innerText || "").trim().slice(0, 20), href: a ? a.getAttribute("href") : null, target: a ? a.getAttribute("target") : null, role: e.getAttribute("role"), onclickAttr: e.hasAttribute("onclick"), cursorPointer: getComputedStyle(e).cursor === "pointer", w: Math.round(b.width), h: Math.round(b.height), y: Math.round(b.top + scrollY) }; }) };
  }, re);
  if (!click || !found.visible) return found;
  const before = page.url(); const popups = []; const dialogs = [];
  const ctx = page.context();
  const onPage = (p) => popups.push(p);
  ctx.on("page", onPage);
  page.on("dialog", async (d) => { dialogs.push({ type: d.type(), len: d.message().length }); await d.dismiss().catch(() => {}); });
  const loc = page.locator("a,button,[role=button],div,span,li").filter({ hasText: new RegExp(re) }).filter({ visible: true });
  // 가장 안쪽(leaf) 요소 = 마지막 매치가 아닌 텍스트 길이가 가장 짧은 요소
  const n = await loc.count(); let best = null, bestLen = 1e9;
  for (let i = 0; i < Math.min(n, 40); i++) { const t = ((await loc.nth(i).innerText().catch(() => "")) || "").trim(); if (t.length && t.length < bestLen) { best = loc.nth(i); bestLen = t.length; } }
  if (best) await best.click({ timeout: 5000 }).catch((e) => dialogs.push({ clickError: String(e).slice(0, 80) }));
  await page.waitForTimeout(3000);
  const after = page.url();
  const popupUrls = [];
  for (const p of popups) { await p.waitForLoadState("domcontentloaded", { timeout: 8000 }).catch(() => {}); popupUrls.push(p.url()); }
  const afterState = await page.evaluate(() => ({ fields: [...document.querySelectorAll("input,select,textarea")].filter((e) => e.type !== "hidden" && e.getBoundingClientRect().width > 0).length, dialogs: document.querySelectorAll("[role=dialog],dialog[open],[aria-modal=true]").length })).catch(() => null);
  ctx.off("page", onPage);
  return { ...found, click: { before, after, navigated: before !== after, popupUrls, dialogs, afterState } };
}

async function renderOne(browser0, name, url, w, runIdx, ctxReuse) {
  const v = VIEW[w];
  const browser = ctxReuse ? browser0 : await chromium.launch();
  const ctx = ctxReuse || await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: 1 });
  await ctx.addInitScript(INIT);
  const page = await ctx.newPage();
  let status = null, err = null;
  try { const r = await page.goto(url, { waitUntil: "load", timeout: 45000 }); status = r && r.status(); } catch (e) { err = String(e).slice(0, 120); }
  await page.waitForTimeout(opt.wait);
  const perf = await page.evaluate(() => { const n = performance.getEntriesByType("navigation")[0]; return { lcp: Math.round(window.__lcp || 0), lcpEl: window.__lcpEl, cls: +(window.__cls || 0).toFixed(3), ttfb: n ? Math.round(n.responseStart) : null, load: n ? Math.round(n.loadEventEnd) : null, transfer: n ? n.transferSize : null }; }).catch(() => null);
  if (opt.shot && runIdx === 0) { fs.mkdirSync(opt.shot, { recursive: true }); await page.screenshot({ path: path.join(opt.shot, `${name}-${w}.png`) }).catch((e) => { err = (err || "") + " shot:" + String(e).slice(0, 60); }); }
  await lazyScroll(page);
  let m = null; try { m = await page.evaluate(measureInPage, { segH: v.segH, maxH: MAX_H, rule: opt.rule }); } catch (e) { err = (err || "") + " measure:" + String(e).slice(0, 80); }
  let pr = null;
  if (opt.probe && runIdx === 0 && w === opt.widths[0]) pr = await probe(page, opt.probe, opt.probeClick).catch((e) => ({ error: String(e).slice(0, 80) }));
  const ua = runIdx === 0 ? await page.evaluate(() => navigator.userAgent).catch(() => null) : undefined;
  await page.close();
  if (!ctxReuse) { await ctx.close(); await browser.close(); }
  return { run: runIdx + 1, status, err, final: page.url(), perf, m, probe: pr, ua };
}

// SSR HTML의 [aria-expanded] 요소를 태그·값·위치로 나눠 센다(문구·클래스명은 저장하지 않고 개수만).
// header/nav 안 = 헤더 메뉴 후보, class/data 속성에 accordion 포함 = 아코디언 후보, menu|nav|dropdown|hamburger 포함 = 메뉴 후보.
function countAriaExpanded(body) {
  const ranges = [];
  for (const m of body.matchAll(/<(header|nav)[\s>][\s\S]*?<\/\1>/gi)) ranges.push([m.index, m.index + m[0].length]);
  const inHdr = (i) => ranges.some(([a, b]) => i >= a && i < b);
  const r = { all: 0, button: 0, otherTag: 0, valueTrue: 0, valueFalse: 0, inHeaderNav: 0, outsideHeaderNav: 0, accordionAttr: 0, menuAttr: 0, buttonOutsideHeaderNav: 0, withAriaControls: 0 };
  for (const m of body.matchAll(/<([a-zA-Z][\w-]*)\b([^>]*\saria-expanded=("|')?([^"'\s>]*)[^>]*)>/g)) {
    const tag = m[1].toLowerCase(), attrs = m[2], val = (m[4] || "").toLowerCase();
    r.all++;
    if (tag === "button") r.button++; else r.otherTag++;
    if (val === "true") r.valueTrue++; else if (val === "false") r.valueFalse++;
    const h = inHdr(m.index);
    if (h) r.inHeaderNav++; else r.outsideHeaderNav++;
    if (tag === "button" && !h) r.buttonOutsideHeaderNav++;
    if (/(class|data-[\w-]+)=("[^"]*accordion[^"]*"|'[^']*accordion[^']*')/i.test(attrs)) r.accordionAttr++;
    if (/(class|data-[\w-]+)=("[^"]*(menu|nav|dropdown|hamburger)[^"]*"|'[^']*(menu|nav|dropdown|hamburger)[^']*')/i.test(attrs)) r.menuAttr++;
    if (/\saria-controls=/i.test(attrs)) r.withAriaControls++;
  }
  // 정규식 교차 확인: 속성 문자열 단순 출현 수(태그 파싱 누락 감지용)
  r.rawAttr = (body.match(/aria-expanded=/g) || []).length;
  return r;
}

// 학술 참고문헌 링크: href 호스트·경로 패턴별 개수(전체 출현 / 고유 href)
function countRefLinks(body) {
  const hrefs = [...body.matchAll(/<a\b[^>]*\shref=("([^"]*)"|'([^']*)')/gi)].map((m) => (m[2] ?? m[3] ?? "").replace(/&amp;/g, "&"));
  const pat = {
    pubmed: /^(https?:)?\/\/(pubmed\.ncbi\.nlm\.nih\.gov\/|(www\.)?ncbi\.nlm\.nih\.gov\/pubmed\/)/i,
    pmc: /^(https?:)?\/\/(pmc\.ncbi\.nlm\.nih\.gov\/|(www\.)?ncbi\.nlm\.nih\.gov\/pmc\/)/i,
    ncbiBook: /^(https?:)?\/\/(www\.)?ncbi\.nlm\.nih\.gov\/books\//i,
    doi: /^(https?:)?\/\/(dx\.)?doi\.org\/10\./i,
    europePmc: /^(https?:)?\/\/(www\.)?europepmc\.org\//i,
  };
  const out = {}; const uniq = {}; const all = new Set();
  for (const [k, re] of Object.entries(pat)) { const hit = hrefs.filter((h) => re.test(h)); out[k] = hit.length; uniq[k] = new Set(hit).size; hit.forEach((h) => all.add(h)); }
  return { ...out, unique: { ...uniq, total: all.size } };
}

async function ssrOne(url) {
  const t0 = Date.now();
  const r = await fetch(url, { redirect: "follow" });
  const html = await r.text();
  const types = []; let agg = 0, ldN = 0, ldErr = 0, reviewedBy = 0, question = 0;
  const walk = (o) => { if (!o || typeof o !== "object") return; if (Array.isArray(o)) return o.forEach(walk); if (o["@type"]) { const ts = Array.isArray(o["@type"]) ? o["@type"] : [o["@type"]]; ts.forEach((t) => types.push(t)); if (ts.includes("AggregateRating")) agg++; if (ts.includes("Question")) question++; } if (o.reviewedBy) reviewedBy++; for (const k in o) if (o[k] && typeof o[k] === "object") walk(o[k]); };
  for (const mm of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) { ldN++; try { walk(JSON.parse(mm[1])); } catch { ldErr++; } }
  const body = (html.split(/<body[^>]*>/)[1] || html).replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ");
  const text = body.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
  const c = (re) => (text.match(re) || []).length;
  const vpm = html.match(/<meta[^>]+name="viewport"[^>]*content="([^"]*)"/i) || html.match(/<meta[^>]+content="([^"]*)"[^>]+name="viewport"/i);
  const vp = vpm ? vpm[1].replace(/\s/g, "") : "";
  return {
    status: r.status, final: r.url, bytes: html.length, totalMs: Date.now() - t0,
    ld: { n: ldN, err: ldErr, types: [...new Set(types)], agg, reviewedBy, question },
    ariaExpanded: countAriaExpanded(body),
    refLinks: countRefLinks(body),
    h1: (body.match(/<h1[\s>]/g) || []).length, aHref: (body.match(/<a[^>]+href="/g) || []).length,
    viewport: vp, zoomLimited: /maximum-scale=1(\.0)?(,|$)|user-scalable=(no|0)/.test(vp),
    sig: { src: c(/출처|참고문헌|인용한 자료|References|Sources|Medically reviewed|Reviewed by|Citations/gi), upd: c(/업데이트|수정일|최종\s?수정|Updated|Last updated|Last reviewed/gi), faq: c(/FAQ|자주\s?묻는|Frequently asked/gi), review: c(/후기|리뷰|reviews?/gi), won: c(/\d{1,3}(,\d{3})+\s?원/g), man: c(/\d+(\.\d+)?\s?만\s?원/g), sup: (body.match(/<sup[\s>]/g) || []).length, textLen: text.length },
  };
}

function robotsAllowed(txt, p) {
  const lines = txt.split(/\r?\n/).map((l) => l.replace(/#.*/, "").trim()).filter(Boolean);
  const groups = []; let cur = null, lastUA = false;
  for (const l of lines) {
    const k = l.slice(0, l.indexOf(":")).trim().toLowerCase(); const v = l.slice(l.indexOf(":") + 1).trim();
    if (k === "user-agent") { if (!lastUA) { cur = { agents: [], rules: [] }; groups.push(cur); } cur.agents.push(v.toLowerCase()); lastUA = true; }
    else { lastUA = false; if (cur && (k === "allow" || k === "disallow")) cur.rules.push({ allow: k === "allow", pat: v }); }
  }
  const g = groups.filter((x) => x.agents.includes("*"));
  const rules = g.flatMap((x) => x.rules).filter((r) => r.pat !== "");
  let best = null;
  for (const r of rules) {
    const anchored = r.pat.endsWith("$"); const pat = anchored ? r.pat.slice(0, -1) : r.pat;
    const rx = new RegExp("^" + pat.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + (anchored ? "$" : ""));
    if (rx.test(p) && (!best || r.pat.length > best.pat.length || (r.pat.length === best.pat.length && r.allow))) best = r;
  }
  return { starGroup: g.length > 0, matched: best ? `${best.allow ? "Allow" : "Disallow"}: ${best.pat}` : null, allowed: best ? best.allow : true };
}

const robotsCache = new Map(); // 호스트당 robots.txt 1회만 요청
async function robotsOne(url) {
  const u = new URL(url);
  try {
    if (!robotsCache.has(u.origin)) { const rr = await fetch(`${u.origin}/robots.txt`, { redirect: "follow" }); robotsCache.set(u.origin, { status: rr.status, txt: rr.status < 400 ? await rr.text() : "" }); }
    const r = robotsCache.get(u.origin);
    if (r.status >= 400) return { status: r.status, allowed: null, note: "robots.txt 응답 실패" };
    const txt = r.txt;
    return { status: r.status, path: u.pathname + u.search, ...robotsAllowed(txt, u.pathname + u.search) };
  } catch (e) { return { status: null, error: String(e).slice(0, 80) }; }
}

// ---------- 실행 ----------
const out = { measuredAt: new Date().toISOString(), options: { ...opt, targets: undefined }, results: {} };
let failMin = 0;
let lcpShort = 0;
let statusFail = 0;
const browser = opt.ssr || opt.robotsOnly ? null : await chromium.launch();
for (const [name, url] of targets) {
  const res = { url };
  if (opt.robots) res.robots = await robotsOne(url);
  if (opt.robotsOnly) { out.results[name] = res; continue; }
  if (opt.ssr) res.ssr = await ssrOne(url).catch((e) => ({ error: String(e).slice(0, 120) }));
  else {
    res.render = {};
    for (const w of opt.widths) {
      if (!VIEW[w]) { console.error(`지원 폭: 375, 1280 (받음 ${w})`); process.exit(2); }
      const runs = [];
      let shared = null, warmStatus;
      // status ≥ 400 또는 null(응답 없음·탐색 실패·data: URL 등) = 차단·오류 응답 → 재요청 없이 이 폭 측정을 즉시 멈춘다
      // (403·캡차 페이지 반복 요청 = 회피 시도로 보일 수 있음, BENCHMARK.md 0절·1-2 Zocdoc 사유).
      const statusOk = (s) => s != null && s < 400;
      if (opt.cache === "warm") {
        shared = await browser.newContext({ viewport: { width: VIEW[w].width, height: VIEW[w].height }, deviceScaleFactor: 1 });
        const pp = await shared.newPage(); const wr = await pp.goto(url, { waitUntil: "load", timeout: 45000 }).catch(() => null); warmStatus = wr ? wr.status() : null; await pp.waitForTimeout(1000); await pp.close();
      }
      // LCP 0 = 대기 시간 안에 LCP 항목 미기록 → 중앙값에서 제외하고 lcpMissing으로 센다.
      // 기록 회차가 --runs 개가 될 때까지 추가 측정한다(총 --max-runs 회까지, 기본 runs + 2). 재측정 사유는 LCP 0 하나뿐이다. BENCHMARK.md 1절 "LCP 미기록" 규칙.
      const isOk = (r) => r.perf && statusOk(r.status) && r.perf.lcp > 0;
      const maxRuns = Math.max(opt.runs, opt.maxRuns ?? opt.runs + 2);
      let stoppedByStatus = opt.cache === "warm" && !statusOk(warmStatus);
      for (let i = 0; !stoppedByStatus && i < maxRuns && runs.filter(isOk).length < opt.runs; i++) {
        const r = await renderOne(browser, name, url, w, i, shared);
        runs.push(r);
        if (!statusOk(r.status)) stoppedByStatus = true;
      }
      if (shared) await shared.close();
      const ok = runs.filter(isOk);
      const short = !stoppedByStatus && ok.length < opt.runs;
      if (short) lcpShort++;
      if (stoppedByStatus) statusFail++;
      res.render[w] = { runs, summary: { okRuns: ok.length, totalRuns: runs.length, lcpShort: short, stoppedByStatus, warmStatus, lcpMedian: median(ok.map((r) => r.perf.lcp)), lcpAll: ok.map((r) => r.perf.lcp), clsMedian: median(ok.map((r) => r.perf.cls)), clsAll: ok.map((r) => r.perf.cls), statuses: runs.map((r) => r.status), lcpMissing: runs.filter((r) => statusOk(r.status) && r.perf && r.perf.lcp === 0).length, statusFail: runs.filter((r) => !statusOk(r.status)).length + (opt.cache === "warm" && !statusOk(warmStatus) ? 1 : 0) } };
      if (opt.min != null) for (const r of runs) if (r.m && r.m.dens.segs.some((n) => n < opt.min)) failMin++;
    }
  }
  out.results[name] = res;
}
if (browser) await browser.close();
const json = JSON.stringify(out, null, 2);
if (opt.out) {
  // --out 이면 전체 JSON은 파일로, 화면에는 1줄 요약만
  fs.mkdirSync(path.dirname(opt.out), { recursive: true }); fs.writeFileSync(opt.out, json, "utf8");
  for (const [name, r] of Object.entries(out.results)) {
    if (r.robots) console.log(`${name} robots ${r.robots.status} allowed=${r.robots.allowed} ${r.robots.matched || ""}`);
    if (r.ssr) console.log(`${name} ssr ${r.ssr.status} h1=${r.ssr.h1} a=${r.ssr.aHref} vp=${r.ssr.viewport} zoomLimited=${r.ssr.zoomLimited} ld=${(r.ssr.ld && r.ssr.ld.types.join("|")) || ""} ldTypes=${r.ssr.ld && r.ssr.ld.types.length} question=${r.ssr.ld && r.ssr.ld.question} reviewedBy=${r.ssr.ld && r.ssr.ld.reviewedBy} ariaExpanded=${JSON.stringify(r.ssr.ariaExpanded)} refLinks=${JSON.stringify(r.ssr.refLinks)} sig=${JSON.stringify(r.ssr.sig)}${r.ssr.error ? " err=" + r.ssr.error : ""}`);
    for (const [w, x] of Object.entries(r.render || {})) {
      console.log(`${name} ${w} runs=${x.summary.totalRuns} status=${x.summary.statuses.join("/")}${x.summary.warmStatus !== undefined ? " warmStatus=" + x.summary.warmStatus : ""} LCP=${x.summary.lcpAll.join("/")} med=${x.summary.lcpMedian} lcpMissing=${x.summary.lcpMissing} statusFail=${x.summary.statusFail} CLS=${x.summary.clsAll.join("/")} med=${x.summary.clsMedian}`);
      for (const run of x.runs) if (run.m) console.log(`  run${run.run} first=${JSON.stringify(run.m.first)} dens=[${run.m.dens.segs.join(",")}] min=${run.m.dens.min} zero=${run.m.dens.zero} h1=${run.m.h1} a=${run.m.aHref} vp=${run.m.viewport} ld=${run.m.ld.types.join("|")} ax=${run.m.ariaExpanded.all}/${run.m.ariaExpanded.buttonOutsideHeaderNav} ttfb=${run.perf && run.perf.ttfb} el=${run.perf && run.perf.lcpEl}${run.err ? " err=" + run.err : ""}`);
      for (const run of x.runs) if (run.probe) console.log(`  probe ${JSON.stringify(run.probe)}`);
    }
  }
} else console.log(json);
for (const [name, r] of Object.entries(out.results)) for (const [w, x] of Object.entries(r.render || {})) {
  if (x.summary.lcpShort) console.error(`${name} ${w} LCP 기록 ${x.summary.okRuns}/${opt.runs} 미달 (총 ${x.summary.totalRuns}회 측정, lcpMissing ${x.summary.lcpMissing})`);
  if (x.summary.stoppedByStatus) console.error(`${name} ${w} HTTP status ${x.summary.warmStatus !== undefined && !(x.summary.warmStatus != null && x.summary.warmStatus < 400) ? "warm 예열 " + x.summary.warmStatus : x.summary.statuses[x.summary.statuses.length - 1]} → 재요청 없이 중단 (총 ${x.summary.totalRuns}회 측정, statusFail ${x.summary.statusFail})`);
}
if (opt.min != null) console.error(failMin ? `FAIL 최소 ${opt.min} 미달 측정 ${failMin}건` : `OK 전 구간 ≥ ${opt.min}`);
if (failMin || lcpShort || statusFail) process.exit(1);
