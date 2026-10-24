import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createRouteChecker,
  hrefPath,
  isPathBuilt,
  isPreviewMode,
  routePatternToRegExp,
  scanAppRoutes,
} from "@/lib/built-routes";
import { GNB, ROUTES, clinicPath, consultPath, postPath, procedurePath } from "@/lib/routes";

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
  vi.unstubAllEnvs();
});

function makeApp(files: string[]): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "app-"));
  dirs.push(root);
  for (const f of files) {
    const p = path.join(root, f);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, "export default function P() { return null }\n", "utf8");
  }
  return root;
}

describe("lib/routes — 화면 경로", () => {
  it("끝 슬래시 경로와 GNB 4개(3절)", () => {
    expect(GNB.map((g) => g.label)).toEqual(["시술 가이드", "병원 찾기", "가격 비교", "칼럼"]);
    expect(procedurePath("쌍꺼풀-수술")).toBe("/procedures/쌍꺼풀-수술/");
    expect(clinicPath("단하늘성형외과")).toBe("/clinics/단하늘성형외과/");
    expect(postPath("a")).toBe("/blog/a/");
  });

  it("상담 폼 경로는 procedure_id·clinic_id 를 쿼리로 넘긴다(P-06 선입력)", () => {
    expect(consultPath()).toBe(ROUTES.consult);
    expect(consultPath({ procedure_id: "double-eyelid" })).toBe("/consult/?procedure_id=double-eyelid");
    expect(consultPath({ procedure_id: "a", clinic_id: "b" })).toBe("/consult/?procedure_id=a&clinic_id=b");
    expect(consultPath({ clinic_id: "b" })).toBe("/consult/?clinic_id=b");
  });
});

describe("lib/built-routes — 만들어진 화면만 링크", () => {
  it("app 디렉터리의 page 파일을 URL 패턴으로 모은다(그룹·비공개·병렬 폴더 처리)", () => {
    const app = makeApp([
      "layout.tsx",
      "(site)/page.tsx",
      "(site)/procedures/[slug]/page.tsx",
      "(site)/preview/page.preview.tsx",
      "(site)/_parts/page.tsx",
      "@modal/x/page.tsx",
      "consult/page.tsx",
      "lp/[campaign]/page.mdx",
    ]);
    expect(scanAppRoutes(app)).toEqual(["/", "/consult/", "/lp/[campaign]/", "/procedures/[slug]/"]);
    expect(scanAppRoutes(path.join(app, "nope"))).toEqual([]);
  });

  it("동적 세그먼트·catch-all 패턴", () => {
    expect(routePatternToRegExp("/procedures/[slug]/").test("/procedures/쌍꺼풀-수술/")).toBe(true);
    expect(routePatternToRegExp("/procedures/[slug]/").test("/procedures/a/b/")).toBe(false);
    expect(routePatternToRegExp("/docs/[...rest]/").test("/docs/a/b/")).toBe(true);
    expect(routePatternToRegExp("/a.b/").test("/aXb/")).toBe(false);
  });

  it("href 경로 정규화: 쿼리·해시 제거, 끝 슬래시, 퍼센트 디코딩", () => {
    expect(hrefPath("/consult/?procedure_id=x#top")).toBe("/consult/");
    expect(hrefPath("/procedures/%EC%BD%94-%EC%84%B1%ED%98%95")).toBe("/procedures/코-성형/");
    expect(hrefPath("consult")).toBe("/consult/");
    expect(hrefPath("/bad/%E0%A4%A")).toBe("/bad/%E0%A4%A/");
  });

  it("패턴 목록으로 판정한다", () => {
    const built = createRouteChecker(["/", "/procedures/[slug]/"]);
    expect(built("/")).toBe(true);
    expect(built("/procedures/쌍꺼풀-수술/")).toBe(true);
    expect(built("/procedures/")).toBe(false);
    expect(built("/consult/?procedure_id=x")).toBe(false);
  });

  it("현재 저장소: 홈은 있고, 아직 만들지 않은 상담 폼·P1 목록은 없다(미리보기 화면은 제외)", () => {
    vi.stubEnv("RS_PREVIEW", "");
    const routes = scanAppRoutes();
    expect(routes).toContain("/");
    expect(routes).not.toContain("/preview/");
    expect(isPathBuilt("/")).toBe(true);
    for (const r of [ROUTES.procedures, ROUTES.clinics, ROUTES.prices, ROUTES.blog]) {
      expect(isPathBuilt(r)).toBe(routes.includes(r));
    }
  });

  it("외부·전화 링크는 항상 노출, 미리보기 모드는 모든 경로를 있음으로 본다", () => {
    expect(isPathBuilt("tel:0200000000")).toBe(true);
    expect(isPathBuilt("https://pf.kakao.com/")).toBe(true);
    expect(isPathBuilt("//cdn.example.com/x")).toBe(true);
    expect(isPreviewMode({})).toBe(false);
    expect(isPreviewMode({ RS_PREVIEW: "1" })).toBe(true);
    vi.stubEnv("RS_PREVIEW", "1");
    expect(isPathBuilt("/아직-없는-화면/")).toBe(true);
  });
});
