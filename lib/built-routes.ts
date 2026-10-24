/**
 * "이 링크의 화면이 이미 만들어졌는가" — Node 전용(빌드·서버 컴포넌트·테스트).
 *
 * 공통 컴포넌트(헤더 GNB·CTA·푸터 링크·검색 자동완성)는 아직 구현되지 않은 화면(P1 목록 화면, T-101 상담 폼 등)을
 * 가리킨다. 그대로 링크하면 깨진 내부 링크(QUALITY 1절 "깨진 내부 링크 0, 모든 CTA가 실제 경로로 이동")가 배포된다.
 * 그래서 app/ 의 page 파일을 훑어 실제로 있는 경로만 링크로 노출한다 → 해당 화면 작업이 page 를 추가하면 자동으로 나타난다.
 *
 * 미리보기(RS_PREVIEW=1, next dev 전용 컴포넌트 화면)에서는 모든 경로를 있는 것으로 본다.
 */
import fs from "node:fs";
import path from "node:path";

const PAGE_FILE = /^page\.(?:tsx|ts|jsx|js|mdx)$/;

/** app 디렉터리에서 page 파일이 있는 경로 패턴 목록. 라우트 그룹 (x)·비공개 _x·병렬 @x 는 URL 에서 뺀다. */
export function scanAppRoutes(appDir: string = path.join(process.cwd(), "app")): string[] {
  const routes: string[] = [];
  const walk = (dir: string, segments: string[]) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const name = entry.name;
      if (entry.isDirectory()) {
        if (name.startsWith("_") || name.startsWith("@")) continue;
        const isGroup = name.startsWith("(") && name.endsWith(")");
        walk(path.join(dir, name), isGroup ? segments : [...segments, name]);
      } else if (PAGE_FILE.test(name)) {
        routes.push(segments.length ? `/${segments.join("/")}/` : "/");
      }
    }
  };
  if (fs.existsSync(appDir)) walk(appDir, []);
  return routes.sort();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** "/procedures/[slug]/" → /^\/procedures\/[^/]+\/$/ ([...x] catch-all 은 여러 세그먼트) */
export function routePatternToRegExp(pattern: string): RegExp {
  const parts = pattern.split("/").map((seg) => {
    if (/^\[\[?\.\.\..+\]\]?$/.test(seg)) return ".+";
    if (/^\[.+\]$/.test(seg)) return "[^/]+";
    return escapeRegExp(seg);
  });
  return new RegExp(`^${parts.join("/")}$`);
}

/** href 의 경로 부분(쿼리·해시 제외, 끝 슬래시 보정, 퍼센트 디코딩) */
export function hrefPath(href: string): string {
  let p = href.split(/[?#]/)[0] ?? "/";
  try {
    p = decodeURIComponent(p);
  } catch {
    /* 잘못된 인코딩은 그대로 비교 */
  }
  if (!p.startsWith("/")) p = `/${p}`;
  if (!p.endsWith("/")) p = `${p}/`;
  return p;
}

/** 경로 패턴 목록으로 판정 함수를 만든다(테스트용으로 분리). */
export function createRouteChecker(patterns: readonly string[]): (href: string) => boolean {
  const regs = patterns.map(routePatternToRegExp);
  return (href: string) => {
    const p = hrefPath(href);
    return regs.some((r) => r.test(p));
  };
}

export function isPreviewMode(env: Record<string, string | undefined> = process.env): boolean {
  return env.RS_PREVIEW === "1";
}

let checker: ((href: string) => boolean) | null = null;

/** 이 내부 링크를 노출해도 되는가(대상 화면의 page 가 있는가). 외부·tel:·mailto: 링크는 항상 true. */
export function isPathBuilt(href: string): boolean {
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) return true;
  if (isPreviewMode()) return true;
  checker ??= createRouteChecker(scanAppRoutes());
  return checker(href);
}
