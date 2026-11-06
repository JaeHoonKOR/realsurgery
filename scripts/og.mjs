// OG 이미지 빌드 시 생성 (docs/IMAGES.md "OG 이미지: 빌드 시 자동 생성, satori, 제목 + 브랜드 배경, 1200×630")
// - 대상: app/ 에 실제로 있는 경로만(lib/built-routes.ts 와 같은 규칙). 동적 경로는 data/generated/content.json 의 항목마다 1장.
// - 출력: public/og/<key>.png (빌드 산출물, gitignore). SNS 크롤러(카카오·페이스북·네이버)가 WebP 를 보장하지 않아 PNG 로 둔다
//   → scripts/check-out.mjs 가 out/og/*.png 만 예외로 허용하고, og:image 가 실제 파일을 가리키는지 확인한다.
// - 글자는 Pretendard(OTF)를 satori 가 윤곽선으로 그린다. 색은 styles/tokens.css 에서 읽는다.
// 사용: node scripts/og.mjs   (pnpm build 가 next build 전에 실행)
import fs from "node:fs";
import path from "node:path";
import satori from "satori";
import sharp from "sharp";
import { ROOT, fontFile, readTokenColors } from "./brand-kit.mjs";

export const OG_DIR = path.join(ROOT, "public", "og");
export const OG_URL = "/og";
export const WIDTH = 1200;
export const HEIGHT = 630;
export const TITLE_MAX = 30;
/** 모든 OG 하단 한 줄 */
export const SUBLINE = "가격 범위·소요시간·회복기간을 출처와 함께";

/** lib/site.ts 의 name·tagline (단일 소스) */
export function readSite(source = fs.readFileSync(path.join(ROOT, "lib", "site.ts"), "utf8")) {
  const pick = (k) => source.match(new RegExp(`\\b${k}:\\s*"([^"]+)"`))?.[1];
  const name = pick("name");
  const tagline = pick("tagline");
  if (!name || !tagline) throw new Error("[og] lib/site.ts 에서 SITE.name·tagline 을 읽지 못했습니다.");
  return { name, tagline };
}

/** app/ 의 page 파일 경로 패턴 (라우트 그룹·비공개·병렬 폴더 처리 = lib/built-routes.ts scanAppRoutes) */
export function scanAppRoutes(appDir = path.join(ROOT, "app")) {
  const routes = [];
  const walk = (dir, segs) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (e.name.startsWith("_") || e.name.startsWith("@")) continue;
        const group = e.name.startsWith("(") && e.name.endsWith(")");
        walk(path.join(dir, e.name), group ? segs : [...segs, e.name]);
      } else if (/^page\.(?:tsx|ts|jsx|js|mdx)$/.test(e.name)) {
        routes.push(segs.length ? `/${segs.join("/")}/` : "/");
      }
    }
  };
  if (fs.existsSync(appDir)) walk(appDir, []);
  return routes.sort();
}

const STATIC_TITLES = {
  "/procedures/": { eyebrow: "시술 가이드", title: "부위별 성형 시술 한눈에 보기" },
  "/clinics/": { eyebrow: "병원 찾기", title: "지역별 병원 공개 정보 비교" },
  "/prices/": { eyebrow: "가격 비교", title: "시술별 공개 가격 범위 비교" },
  "/blog/": { eyebrow: "칼럼", title: "시술 전에 알아두면 좋은 이야기" },
  "/consult/": { eyebrow: "무료 상담 예약", title: "관심 시술 상담 가이드 받기" },
  "/terms/": { eyebrow: "약관", title: "서비스 이용약관" },
  "/privacy/": { eyebrow: "개인정보", title: "개인정보처리방침" },
};

export function truncate(text, max = TITLE_MAX) {
  const chars = [...text];
  return chars.length > max ? `${chars.slice(0, max - 1).join("")}…` : text;
}

/** route → 파일 키. "/" → default, "/consult/" → consult, "/procedures/x/" 는 동적 항목 키를 쓴다. */
export function routeKey(route) {
  const k = route.replace(/^\/|\/$/g, "").replace(/\//g, "-");
  return k || "default";
}

/**
 * 만들 OG 목록
 * @param {string[]} routes scanAppRoutes 결과
 * @param {{ procedures?: {id:string,name:string}[], clinics?: {id:string,name:string}[], posts?: {id:string,title:string}[] }} content
 * @param {{ name: string, tagline: string }} site
 */
export function ogTargets(routes, content, site) {
  const out = [];
  for (const r of routes) {
    if (r === "/") {
      out.push({ key: "default", route: r, eyebrow: "시술 가이드 · 병원 정보", title: "시술 가격·회복기간, 한 번에 비교" });
    } else if (r === "/procedures/[slug]/") {
      for (const p of content.procedures ?? []) out.push({ key: `procedure-${p.id}`, route: r, eyebrow: "시술 가이드", title: p.name });
    } else if (r === "/clinics/[slug]/") {
      for (const c of content.clinics ?? []) out.push({ key: `clinic-${c.id}`, route: r, eyebrow: "병원 정보", title: c.name });
    } else if (r === "/blog/[slug]/") {
      for (const p of content.posts ?? []) out.push({ key: `post-${p.id}`, route: r, eyebrow: "칼럼", title: p.title });
    } else if (!r.includes("[")) {
      const t = STATIC_TITLES[r];
      out.push({ key: routeKey(r), route: r, eyebrow: t?.eyebrow ?? site.name, title: t?.title ?? site.tagline });
    }
  }
  return out.map((t) => ({ ...t, title: truncate(t.title) }));
}

const h = (type, style, children) => ({ type, props: { style, children } });

/** satori 요소 트리 (React 없이 객체로) */
export function ogTree({ eyebrow, title }, site, c) {
  const bar = (top, from, to, color) =>
    h("div", { position: "absolute", left: 40, top, width: 280, height: 14, borderRadius: 7, backgroundColor: c.line, display: "flex" }, [
      h("div", { position: "absolute", left: 280 * from, width: 280 * (to - from), height: 14, borderRadius: 7, backgroundColor: color }, []),
    ]);
  return h(
    "div",
    {
      width: WIDTH,
      height: HEIGHT,
      display: "flex",
      position: "relative",
      backgroundColor: c.canvas,
      fontFamily: "Pretendard",
      overflow: "hidden",
    },
    [
      h("div", { position: "absolute", right: -120, top: -140, width: 520, height: 520, borderRadius: 260, backgroundColor: c.accent, opacity: 0.16 }, []),
      h("div", { position: "absolute", left: -110, bottom: -170, width: 380, height: 380, borderRadius: 190, backgroundColor: c.brand, opacity: 0.08 }, []),
      // 오른쪽 정보 카드(가격 범위 막대) 장식
      h(
        "div",
        { position: "absolute", right: 80, top: 170, width: 360, height: 260, borderRadius: 32, backgroundColor: c.surface, display: "flex" },
        [
          h("div", { position: "absolute", left: 40, top: 40, width: 44, height: 44, borderRadius: 22, backgroundColor: c.brand }, []),
          h("div", { position: "absolute", left: 100, top: 48, width: 150, height: 14, borderRadius: 7, backgroundColor: c.ink, opacity: 0.85 }, []),
          h("div", { position: "absolute", left: 100, top: 72, width: 100, height: 10, borderRadius: 5, backgroundColor: c.line }, []),
          bar(120, 0.1, 0.62, c.brand),
          bar(160, 0.3, 0.86, c.accent),
          bar(200, 0.05, 0.45, c.brand),
        ],
      ),
      h(
        "div",
        { display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px 100px 80px 80px", width: 680, height: HEIGHT, boxSizing: "border-box" },
        [
          h("div", { display: "flex", fontSize: 40, fontWeight: 700, color: c.brand, letterSpacing: -0.5 }, site.name),
          h("div", { display: "flex", flexDirection: "column" }, [
            h("div", { display: "flex", fontSize: 30, fontWeight: 600, color: c.accentStrong, marginBottom: 20 }, eyebrow),
            h("div", { display: "flex", fontSize: 60, fontWeight: 700, color: c.ink, lineHeight: 1.3, letterSpacing: -1, wordBreak: "keep-all" }, title),
          ]),
          h("div", { display: "flex", fontSize: 28, fontWeight: 400, color: c.inkMuted }, SUBLINE),
        ],
      ),
      h("div", { position: "absolute", left: 0, bottom: 0, width: WIDTH, height: 12, backgroundColor: c.brand }, []),
    ],
  );
}

let fontsCache = null;
function fonts() {
  fontsCache ??= [
    { name: "Pretendard", data: fs.readFileSync(fontFile("regular")), weight: 400, style: "normal" },
    { name: "Pretendard", data: fs.readFileSync(fontFile("semibold")), weight: 600, style: "normal" },
    { name: "Pretendard", data: fs.readFileSync(fontFile("bold")), weight: 700, style: "normal" },
  ];
  return fontsCache;
}

export async function renderOgSvg(target, site, colors = readTokenColors()) {
  return satori(ogTree(target, site, colors), { width: WIDTH, height: HEIGHT, fonts: fonts() });
}

export async function renderOgPng(target, site, colors) {
  const svg = await renderOgSvg(target, site, colors);
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

/** 전부 생성. 이전 실행의 남은 파일(경로가 사라진 항목)은 지운다. */
export async function generateOg({
  outDir = OG_DIR,
  routes = scanAppRoutes(),
  content = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "generated", "content.json"), "utf8")),
  site = readSite(),
  colors = readTokenColors(),
} = {}) {
  const targets = ogTargets(routes, content, site);
  fs.mkdirSync(outDir, { recursive: true });
  const keep = new Set(targets.map((t) => `${t.key}.png`));
  for (const f of fs.readdirSync(outDir)) if (f.endsWith(".png") && !keep.has(f)) fs.unlinkSync(path.join(outDir, f));
  for (const t of targets) fs.writeFileSync(path.join(outDir, `${t.key}.png`), await renderOgPng(t, site, colors));
  return targets;
}

if (path.basename(process.argv[1] ?? "") === "og.mjs") {
  generateOg()
    .then((targets) => console.log(`[og] ${targets.length}장 → public/og/ (${targets.map((t) => t.key).join(", ")})`))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
