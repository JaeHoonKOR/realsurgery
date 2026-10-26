// scripts/audit.mjs — 사이트 감사의 순수 함수(경로 목록·키, 텍스트 벽 계산, 문제 판정·순위, 요약 서식)
import { describe, expect, it } from "vitest";
import {
  LIMITS,
  NOT_FOUND_ROUTE,
  buildRouteList,
  classifyResource,
  evaluateJourney,
  evaluateRoute,
  expectedJsonLd,
  findTextWalls,
  firstLoadJsBytes,
  fmtKB,
  fmtMs,
  jsonLdInfo,
  mergeIntervals,
  normalizeRoute,
  parseArgs,
  rankProblems,
  renderSummary,
  routeKey,
  routesFromSitemap,
  runFolderName,
  sanitizeLabel,
  scriptPathsFromHtml,
  selectRoutes,
  slugMapFromContent,
  sumBytes,
  type AuditReport,
  type JourneyResult,
  type PageMetrics,
} from "../../scripts/audit.mjs";

const SLUGS = slugMapFromContent({
  procedures: [{ id: "double-eyelid", slug: "쌍꺼풀-수술" }],
  clinics: [{ id: "danhaneul", slug: "단하늘성형외과" }],
  posts: [{ id: "reading-surgery-quotes", slug: "성형-견적서-읽는-법" }],
});

describe("audit: 경로 목록", () => {
  it("경로 정규화: 앞뒤 슬래시, % 디코딩, Git Bash 경로 복구, 파일 경로 유지", () => {
    expect(normalizeRoute("procedures/쌍꺼풀-수술")).toBe("/procedures/쌍꺼풀-수술/");
    expect(normalizeRoute("/procedures/%EC%8C%8D%EA%BA%BC%ED%92%80-%EC%88%98%EC%88%A0/")).toBe("/procedures/쌍꺼풀-수술/");
    expect(normalizeRoute("C:/Program Files/Git/clinics/")).toBe("/clinics/");
    expect(normalizeRoute("C:/Program Files/Git/")).toBe("/");
    expect(normalizeRoute("/sitemap.xml")).toBe("/sitemap.xml");
    expect(normalizeRoute("https://example.com/realsurgery/blog/")).toBe("/realsurgery/blog/");
    expect(normalizeRoute("")).toBe("/");
  });

  it("sitemap.xml → basePath 를 뗀 경로(배포 주소여도 경로만)", () => {
    const xml = `<?xml version="1.0"?><urlset>
      <url><loc>https://jaehoonkor.github.io/realsurgery/</loc></url>
      <url><loc>https://jaehoonkor.github.io/realsurgery/procedures/%EC%8C%8D%EA%BA%BC%ED%92%80-%EC%88%98%EC%88%A0/</loc></url>
      <url><loc>https://jaehoonkor.github.io/realsurgery/clinics/</loc></url>
      <url><loc>https://jaehoonkor.github.io/realsurgery/clinics/</loc></url>
      <url><loc>not a url</loc></url></urlset>`;
    expect(routesFromSitemap(xml, "/realsurgery")).toEqual(["/", "/procedures/쌍꺼풀-수술/", "/clinics/"]);
    expect(routesFromSitemap("<loc>http://localhost:3000/terms/</loc>", "")).toEqual(["/terms/"]);
    expect(routesFromSitemap("", "")).toEqual([]);
  });

  it("sitemap + /consult/ + 404 확인 경로, 중복 없이", () => {
    expect(buildRouteList({ sitemapRoutes: ["/", "/consult/", "/terms"] })).toEqual(["/", "/consult/", "/terms/", NOT_FOUND_ROUTE]);
  });

  it("라우트 키는 ASCII: slug → id, 매핑이 없으면 해시", () => {
    expect(routeKey("/", SLUGS)).toBe("home");
    expect(routeKey("/procedures/쌍꺼풀-수술/", SLUGS)).toBe("procedures-double-eyelid");
    expect(routeKey("/clinics/단하늘성형외과/", SLUGS)).toBe("clinics-danhaneul");
    expect(routeKey("/blog/성형-견적서-읽는-법/", SLUGS)).toBe("blog-reading-surgery-quotes");
    expect(routeKey("/consult/", SLUGS)).toBe("consult");
    expect(routeKey(NOT_FOUND_ROUTE, SLUGS)).toBe("404");
    const unknown = routeKey("/procedures/모르는-시술/", SLUGS);
    expect(unknown).toMatch(/^procedures-x[0-9a-f]{8}$/);
    expect(routeKey("/procedures/모르는-시술/", SLUGS)).toBe(unknown); // 결정적
    expect(routeKey("/sitemap.xml")).toBe("sitemap-xml");
  });

  it("--routes 는 경로·키 모두, 목록에 없는 경로도 감사", () => {
    const all = buildRouteList({ sitemapRoutes: ["/", "/procedures/쌍꺼풀-수술/", "/clinics/"] });
    expect(selectRoutes(all, ["home", "procedures-double-eyelid", "/clinics", "404", "/new-page", "home"], SLUGS)).toEqual([
      "/",
      "/procedures/쌍꺼풀-수술/",
      "/clinics/",
      NOT_FOUND_ROUTE,
      "/new-page/",
    ]);
  });
});

describe("audit: 인자·실행 폴더", () => {
  it("기본값과 플래그", () => {
    expect(parseArgs([])).toEqual({ build: true, routes: null, label: null, viewports: [375, 1280], journeys: true, throttle: true });
    expect(parseArgs(["--no-build", "--routes", "/,consult", "--label", "I-002 Before", "--viewports=375", "--no-journeys", "--no-throttle"])).toEqual({
      build: false,
      routes: ["/", "consult"],
      label: "i-002-before",
      viewports: [375],
      journeys: false,
      throttle: false,
    });
    expect(() => parseArgs(["--routes"])).toThrow(/값이 없습니다/);
    expect(() => parseArgs(["--viewports", "999"])).toThrow(/--viewports/);
    expect(() => parseArgs(["--bogus"])).toThrow(/알 수 없는 옵션/);
  });

  it("라벨은 ASCII 소문자·하이픈만", () => {
    expect(sanitizeLabel("After Fix #2")).toBe("after-fix-2");
    expect(sanitizeLabel("한글")).toBeNull();
  });

  it("폴더 이름: 로컬 시각 YYYYMMDD-HHmm[-label], 겹치면 -2", () => {
    const d = new Date(2026, 9, 27, 8, 5);
    expect(runFolderName(d)).toBe("20261027-0805");
    expect(runFolderName(d, "before")).toBe("20261027-0805-before");
    const taken = new Set(["20261027-0805", "20261027-0805-2"]);
    expect(runFolderName(d, null, (n) => taken.has(n))).toBe("20261027-0805-3");
  });
});

describe("audit: 전송량", () => {
  it("리소스 분류", () => {
    expect(classifyResource("http://localhost:4173/_next/static/chunks/app.js", "script")).toBe("js");
    expect(classifyResource("http://localhost:4173/_next/static/css/a.css", "link")).toBe("css");
    expect(classifyResource("http://localhost:4173/images/gen/ic-eye.webp", "img")).toBe("img");
    expect(classifyResource("http://localhost:4173/fonts/pretendard/x.woff2", "css")).toBe("font");
    expect(classifyResource("http://localhost:4173/procedures/index.txt?_rsc=1", "fetch")).toBe("rsc");
    expect(classifyResource("http://localhost:4173/", "navigation")).toBe("doc");
    expect(classifyResource("http://localhost:4173/clinics/", "fetch")).toBe("doc");
    expect(classifyResource("http://localhost:4173/data.json", "fetch")).toBe("other");
  });

  it("유형별 합계와 첫 로드 JS(문서가 직접 부른 스크립트만)", () => {
    const entries = [
      { name: "http://localhost/", initiatorType: "navigation", size: 20_000 },
      { name: "http://localhost/_next/static/chunks/main.js", initiatorType: "script", size: 50_000 },
      { name: "http://localhost/_next/static/chunks/page.js", initiatorType: "script", size: 10_000 },
      { name: "http://localhost/_next/static/chunks/prefetched-other-route.js", initiatorType: "script", size: 30_000 },
      { name: "http://localhost/fonts/a.woff2", initiatorType: "css", size: 40_000 },
      { name: "http://localhost/x.webp", initiatorType: "img", size: -5 },
    ];
    expect(sumBytes(entries)).toEqual({ js: 90_000, css: 0, img: 0, font: 40_000, doc: 20_000, rsc: 0, other: 0, total: 150_000 });
    const html = `<script src="/_next/static/chunks/main.js" async></script><link rel="preload" as="script" href="/_next/static/chunks/page.js?dpl=1"/><link rel="stylesheet" href="/a.css"/>`;
    const scripts = scriptPathsFromHtml(html);
    expect([...scripts].sort()).toEqual(["/_next/static/chunks/main.js", "/_next/static/chunks/page.js"]);
    expect(firstLoadJsBytes(entries, scripts)).toBe(60_000);
  });
});

describe("audit: 텍스트 벽", () => {
  it("겹치는 구간 합치기(잘못된 구간 제외)", () => {
    expect(
      mergeIntervals([
        [100, 200],
        [150, 300],
        [500, 600],
        [600, 650],
        [700, 690],
        [Number.NaN, 5],
      ]),
    ).toEqual([
      [100, 300],
      [500, 650],
    ]);
  });

  it("시각 요소 없는 1화면 이상 구간 중 글자가 충분한 곳만 벽", () => {
    const visuals: [number, number][] = [
      [0, 100],
      [2000, 2100],
      [2400, 2500],
    ];
    // 글자: 100~2000 사이에 줄마다 20자, 2100~2400(짧은 구간)에도 글자, 2500~4000 은 빈 공간에 가까움
    const texts: [number, number][] = [];
    for (let y = 120; y < 2000; y += 40) texts.push([y, 20]);
    for (let y = 2120; y < 2400; y += 40) texts.push([y, 20]);
    texts.push([3000, 30]);
    const walls = findTextWalls({ visuals, texts, start: 0, end: 4000, screen: 812 });
    expect(walls).toEqual([{ top: 100, bottom: 2000, height: 1900, screens: 2.3, chars: 940 }]);
    // 글자 기준을 낮추면 끝의 빈 구간(2500~4000, 30자)도 잡힌다
    expect(findTextWalls({ visuals, texts, start: 0, end: 4000, screen: 812, minChars: 10 }).map((w) => w.top)).toEqual([100, 2500]);
  });

  it("본문 범위 밖 시각 요소는 무시, 시각 요소가 없으면 본문 전체가 한 구간", () => {
    const texts: [number, number][] = [[500, 300]];
    expect(findTextWalls({ visuals: [[-500, -100]], texts, start: 0, end: 1000, screen: 800 })).toEqual([
      { top: 0, bottom: 1000, height: 1000, screens: 1.3, chars: 300 },
    ]);
    expect(findTextWalls({ visuals: [], texts, start: 0, end: 700, screen: 800 })).toEqual([]);
    expect(findTextWalls({ visuals: [], texts, start: 10, end: 0, screen: 800 })).toEqual([]);
  });
});

describe("audit: JSON-LD", () => {
  it("@graph 를 펼쳐 @type 을 모으고, 평점·리뷰는 금지 항목", () => {
    const ok = JSON.stringify({ "@context": "https://schema.org", "@graph": [{ "@type": "MedicalWebPage" }, { "@type": ["FAQPage"], mainEntity: [{ "@type": "Question" }] }] });
    const bad = JSON.stringify({ "@type": "MedicalClinic", aggregateRating: { "@type": "AggregateRating", ratingValue: 4.8 } });
    expect(jsonLdInfo([ok])).toEqual({ top: ["FAQPage", "MedicalWebPage"], types: ["FAQPage", "MedicalWebPage", "Question"], forbidden: [], parseErrors: 0 });
    expect(jsonLdInfo([bad, "{oops"])).toEqual({
      top: ["MedicalClinic"],
      types: ["AggregateRating", "MedicalClinic"],
      forbidden: ["AggregateRating", "aggregateRating", "ratingValue"],
      parseErrors: 1,
    });
  });

  it("경로 유형별 기대 스키마", () => {
    expect(expectedJsonLd("/")).toEqual([["Organization"], ["WebSite"]]);
    expect(expectedJsonLd("/procedures/쌍꺼풀-수술/").flat()).toContain("FAQPage");
    expect(expectedJsonLd("/clinics/단하늘성형외과/")[0]).toContain("MedicalClinic");
    expect(expectedJsonLd("/blog/a/")).toEqual([["Article", "BlogPosting"]]);
    expect(expectedJsonLd("/procedures/")).toEqual([]);
  });
});

const goodPage = (over: Partial<PageMetrics> = {}): PageMetrics => ({
  status: 200,
  lcp: { ms: 900, element: "h1" },
  cls: 0,
  bytes: { firstLoadJs: 120 * 1024, initial: { js: 160 * 1024 }, full: { img: 100 * 1024 } },
  page: { overflowX: 0 },
  images: { broken: 0, contentImages: 3, foldVisuals: 2 },
  text: { walls: [] },
  meta: {
    title: "쌍꺼풀 수술 가격·회복기간·부작용 총정리 (2026) | 리얼성형",
    description: "가".repeat(130),
    canonical: "https://example.com/procedures/%EC%8C%8D%EA%BA%BC%ED%92%80-%EC%88%98%EC%88%A0/",
    robots: null,
    ogImage: "https://example.com/og.png",
    lang: "ko",
    h1Count: 1,
  },
  jsonLd: { types: ["BreadcrumbList", "FAQPage", "MedicalWebPage", "SurgicalProcedure"], forbidden: [], parseErrors: 0 },
  axe: { critical: 0, serious: 0, violations: [] },
  console: [],
  smallTargets: [],
  glitches: [],
  adSafety: [],
  ...over,
});
const ROUTE = "/procedures/쌍꺼풀-수술/";

describe("audit: 문제 판정", () => {
  it("기준을 모두 지키면 문제 없음(첫 로드 JS 는 프리페치 제외 값으로 판정)", () => {
    expect(evaluateRoute({ route: ROUTE, key: "procedures-double-eyelid", viewport: 375, m: goodPage() })).toEqual([]);
  });

  it("주요 위반을 영역·심각도와 함께", () => {
    const m = goodPage({
      lcp: { ms: 2600, element: "img.hero" },
      cls: 0.12,
      page: { overflowX: 12 },
      text: { walls: [{ top: 800, bottom: 3000, height: 2200, screens: 2.7, chars: 1500 }] },
      meta: { ...goodPage().meta, h1Count: 2, description: "짧음", canonical: null },
      jsonLd: { types: ["MedicalWebPage"], forbidden: ["AggregateRating"], parseErrors: 0 },
      axe: { critical: 1, serious: 0, violations: [{ id: "image-alt", impact: "critical", nodes: 2, help: "Images must have alternate text" }] },
      console: ["console.error: boom"],
      glitches: ["가격 undefined 원"],
    });
    const ps = evaluateRoute({ route: ROUTE, key: "k", viewport: 375, m });
    const codes = ps.map((p) => `${p.severity}:${p.area}:${p.code}`);
    expect(codes).toEqual(
      expect.arrayContaining([
        "major:G:lcp",
        "major:G:cls",
        "major:A:overflow-x",
        "major:C:text-wall",
        "major:D:h1",
        "minor:D:description-length",
        "major:D:canonical-missing",
        "critical:H:jsonld-forbidden",
        "major:E:jsonld-expected",
        "critical:G:axe",
        "major:G:console",
        "major:B:render-glitch",
      ]),
    );
    expect(ps.find((p) => p.code === "text-wall")?.message).toBe("y=800–3000px (2.7화면, 1,500자)에 시각 요소 없음");
    // 데스크톱은 LCP·가로 스크롤 게이트를 적용하지 않는다(모바일 기준)
    const desk = evaluateRoute({ route: ROUTE, key: "k", viewport: 1280, m }).map((p) => p.code);
    expect(desk).not.toContain("lcp");
    expect(desk).not.toContain("overflow-x");
  });

  it("약관·개인정보 화면의 텍스트 벽은 문제로 올리지 않는다(의도된 텍스트 문서)", () => {
    const walls = { walls: [{ top: 300, bottom: 3000, height: 2700, screens: 3.3, chars: 4000 }] };
    const legal = goodPage({ text: walls, meta: { ...goodPage().meta, canonical: "https://example.com/terms/" }, jsonLd: { types: [], forbidden: [], parseErrors: 0 } });
    expect(evaluateRoute({ route: "/terms/", key: "terms", viewport: 375, m: legal }).map((p) => p.code)).not.toContain("text-wall");
    const blog = goodPage({ text: walls, meta: { ...goodPage().meta, canonical: "https://example.com/blog/" } });
    expect(evaluateRoute({ route: "/blog/", key: "blog", viewport: 375, m: blog }).map((p) => p.code)).toContain("text-wall");
  });

  it("404 경로: 상태 404 가 정상, noindex 화면은 description·canonical 검사 생략", () => {
    const nf = goodPage({ status: 404, meta: { title: "페이지를 찾을 수 없습니다", h1Count: 1, robots: "noindex" }, jsonLd: { types: [], forbidden: [], parseErrors: 0 } });
    expect(evaluateRoute({ route: NOT_FOUND_ROUTE, key: "404", viewport: 375, m: nf })).toEqual([]);
    const wrong = evaluateRoute({ route: NOT_FOUND_ROUTE, key: "404", viewport: 375, m: { ...nf, status: 200 } });
    expect(wrong.map((p) => `${p.severity}:${p.code}`)).toEqual(["major:http-status"]);
    const consult = evaluateRoute({
      route: "/consult/",
      key: "consult",
      viewport: 375,
      m: goodPage({ images: { contentImages: 0, foldVisuals: 1 }, meta: { title: "상담", h1Count: 1, robots: "noindex, follow" }, jsonLd: { types: [], forbidden: [], parseErrors: 0 } }),
    });
    expect(consult).toEqual([]);
  });

  it("측정 실패는 audit-error 하나로", () => {
    expect(evaluateRoute({ route: "/", key: "home", viewport: 375, m: { error: "Timeout" } }).map((p) => p.code)).toEqual(["audit-error"]);
    expect(evaluateRoute({ route: "/", key: "home", viewport: 375, m: null })).toEqual([]);
  });

  it("여정: 실패 단계는 치명(B), 측정 확인 실패는 F, 정보 항목은 문제 아님", () => {
    const j: JourneyResult = {
      name: "lead",
      title: "검색→가이드→상담→완료",
      viewport: 375,
      ok: false,
      steps: [
        { name: "home", ok: true },
        { name: "done", ok: false, error: "Timeout 20000ms" },
      ],
      assertions: [
        { name: "generate_lead 정확히 1회", ok: false, detail: "2회", code: "lead-count" },
        { name: "form_start 1회", ok: false, detail: "0회", code: "funnel-event", severity: "major" },
        { name: "전화·카톡 버튼", ok: false, detail: "없음", code: "contact-buttons", info: true },
      ],
      events: [],
      console: [],
    };
    expect(evaluateJourney(j).map((p) => `${p.severity}:${p.area}:${p.code}`)).toEqual([
      "critical:B:journey-step",
      "critical:F:lead-count",
      "major:F:funnel-event",
    ]);
  });

  it("순위: 심각도 → 영향 경로 수", () => {
    const mk = (severity: "critical" | "major" | "minor", code: string, route: string, viewport = 375) => ({ severity, area: "A", code, route, key: route, viewport, message: `${code} ${route}` });
    const ranked = rankProblems([
      mk("minor", "fold-no-visual", "/a"),
      mk("major", "text-wall", "/a"),
      mk("major", "text-wall", "/a"), // 같은 경로·뷰포트는 한 번만 센다
      mk("major", "text-wall", "/b"),
      mk("major", "console", "/c"),
      mk("critical", "jsonld-forbidden", "/d"),
    ]);
    expect(ranked.map((g) => `${g.severity}:${g.code}:${g.count}`)).toEqual([
      "critical:jsonld-forbidden:1",
      "major:text-wall:2",
      "major:console:1",
      "minor:fold-no-visual:1",
    ]);
    expect(ranked[1]?.examples).toEqual(["text-wall /a", "text-wall /b"]);
  });
});

describe("audit: 요약 서식", () => {
  it("단위 표기", () => {
    expect(fmtKB(153_600)).toBe("150");
    expect(fmtKB(undefined)).toBe("—");
    expect(fmtMs(850.4)).toBe("850ms");
    expect(fmtMs(2345)).toBe("2.35s");
    expect(fmtMs(null)).toBe("—");
  });

  it("summary.md: 영역 집계·주요 문제·경로 표·여정 표", () => {
    const m375 = goodPage({ text: { walls: [{ top: 800, bottom: 3000, height: 2200, screens: 2.7, chars: 1500 }] } });
    const report: AuditReport = {
      run: "20261027-0805",
      startedAt: "2026-10-27T08:05:00.000Z",
      durationMs: 61_000,
      git: { branch: "feat/m1-flow", commit: "abc1234", dirty: false },
      basePath: "/realsurgery",
      options: { viewports: [375, 1280], routes: null, throttle: true },
      routes: [{ route: ROUTE, key: "procedures-double-eyelid", viewports: { 375: m375, 1280: goodPage() } }],
      journeys: [
        {
          name: "lead",
          title: "검색→가이드→상담→완료",
          viewport: 375,
          ok: true,
          steps: [{ name: "home", ok: true }, { name: "done", ok: true }],
          assertions: [{ name: "generate_lead 정확히 1회", ok: true, detail: "1회" }],
          events: ["search", "view_procedure", "click_cta", "form_start", "form_step2", "generate_lead"],
          console: [],
        },
      ],
      problems: evaluateRoute({ route: ROUTE, key: "procedures-double-eyelid", viewport: 375, m: m375 }),
    };
    const md = renderSummary(report);
    expect(md).toContain("# 사이트 감사 20261027-0805");
    expect(md).toContain("커밋 `abc1234` (feat/m1-flow)");
    expect(md).toContain("(전체 감사)");
    expect(md).toContain("| C 콘텐츠 밀도·신뢰 | 0 | 1 | 0 |");
    expect(md).toContain("1. **[major] C `text-wall`** — 1곳: /procedures/쌍꺼풀-수술/@375");
    expect(md).toMatch(/\| `\/procedures\/쌍꺼풀-수술\/` \| procedures-double-eyelid \| 200 \| 1 \| 36·130 \|/);
    expect(md).toContain("| 1/0 |"); // 텍스트 벽 375/1280
    expect(md).toContain("| 검색→가이드→상담→완료 | 375 | 통과 | ✓ home → ✓ done | ✓ generate_lead 정확히 1회 | search → view_procedure → click_cta → form_start → form_step2 → generate_lead |");
    expect(md.split("\n").every((line) => !line.includes("undefined"))).toBe(true);
  });

  it("LIMITS 는 QUALITY.md 1절 수치와 같다", () => {
    expect(LIMITS).toMatchObject({ lcpMs: 2000, cls: 0.05, jsKB: 150, titleMax: 60, descMin: 120, descMax: 150, minTarget: 44 });
  });
});
