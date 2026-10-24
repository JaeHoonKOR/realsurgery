// 인라인 RSC 페이로드 외부화 (scripts/externalize-rsc.mjs) — 순서·내용 보존, 실패 시 하이드레이션 보류, 형식이 바뀌면 빌드 실패
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { DONE_MARK, FAILED_ATTR, GATE, assertGateHook, externalizeAll, externalizeRsc, guardScript } from "../../scripts/externalize-rsc.mjs";

const BOOT = "(self.__next_f=self.__next_f||[]).push([0])";
const DATA1 = 'self.__next_f.push([1,"0:{\\"a\\":\\"쌍꺼풀\\u003c/b\\u003e\\"}\\n"])';
const DATA2 = 'self.__next_f.push([1,"1:[\\"$\\",\\"p\\",null,{}]\\n"])';
const MAIN_APP = '<script src="/realsurgery/_next/static/chunks/main-app-abc.js" async=""></script>';
// Next 15.5 next/dist/client/app-bootstrap.js 의 빌드 결과 형태(실제 청크 409-*.js 에서 발췌)
const HOOK_CHUNK = 'Object.defineProperty(t,"appBootstrap",{enumerable:!0,get:function(){return u}});function u(e){var t,r;t=self.__next_s,r=()=>{e()},t&&t.length?t.reduce(()=>{}):r()}';
const page = (body: string, head = "") =>
  `<!DOCTYPE html><html><head>${head}<script>window.dataLayer=[]</script><script type="application/ld+json">{"a":1}</script></head><body><main>본문</main>${body}</body></html>`;
const processed = (body: string) => page(body).replace("<head>", `<head>${GATE}`);

const tmp: string[] = [];
afterEach(() => {
  for (const d of tmp.splice(0)) fs.rmSync(d, { recursive: true, force: true });
});
const tmpOut = () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "rsc-"));
  tmp.push(out);
  return out;
};

/** GATE·GUARD 를 가짜 self/document 로 실행해 하이드레이션 시작 여부를 본다. */
function runtime() {
  const self: Record<string, unknown> = {};
  type El = { src: string; onload?: () => void; onerror?: () => void };
  const appended: El[] = [];
  const htmlAttrs: Record<string, string> = {};
  const document = {
    createElement: () => ({ src: "" }) as El,
    head: { appendChild: (el: El) => appended.push(el) },
    documentElement: { setAttribute: (k: string, v: string) => (htmlAttrs[k] = v) },
  };
  const run = (tag: string) => new Function("self", "document", tag.replace(/^<script>|<\/script>$/g, ""))(self, document);
  run(GATE);
  let hydrated = false;
  const nextS = self.__next_s as { length: number; reduce: () => Promise<void> };
  // Next(app-bootstrap.js) 가 하는 일: __next_s.length 가 있으면 reduce(...) 가 돌려준 Promise 뒤에 hydrate
  void nextS.reduce().then(() => (hydrated = true));
  const flush = () => new Promise((r) => setTimeout(r, 0));
  return { self, appended, htmlAttrs, run, flush, isHydrated: () => hydrated, nextS };
}

describe("externalizeRsc", () => {
  it("인라인 RSC 스크립트를 순서대로 모아 첫 위치에 <script src> + 확인 스크립트로 바꾸고, <head> 맨 앞에 GATE 를 둔다", () => {
    const html = page(`<script>${BOOT}</script><script>${DATA1}</script><div>x</div><script>${DATA2}</script>`);
    const r = externalizeRsc(html, "/rs/index.rsc.js?v=1");
    expect(r.count).toBe(3);
    expect(r.js).toBe(`${BOOT};\n${DATA1};\n${DATA2};\n${DONE_MARK};\n`);
    expect(r.html).toBe(processed(`<script src="/rs/index.rsc.js?v=1"></script>${guardScript("/rs/index.rsc.js?v=1")}<div>x</div>`));
    expect(r.html).toContain("<script>window.dataLayer=[]</script>");
    expect(r.html).toContain('<script type="application/ld+json">');
    expect(r.html).not.toContain("self.__next_f");
    // 모은 JS 를 실행하면 원래 인라인 스크립트와 같은 순서로 push 되고, 끝에 완료 표시가 선다
    const self: { __next_f?: unknown[]; __rs_rsc_ok?: number } = {};
    new Function("self", r.js)(self);
    expect(self.__next_f).toEqual([[0], [1, '0:{"a":"쌍꺼풀</b>"}\n'], [1, '1:["$","p",null,{}]\n']]);
    expect(self.__rs_rsc_ok).toBe(1);
  });

  it("GATE 는 charset meta 바로 뒤, 모든 스크립트보다 앞", () => {
    const html = page(`<script>${BOOT}</script>`, '<meta charSet="utf-8"/>' + MAIN_APP);
    const r = externalizeRsc(html, "/x.rsc.js");
    expect(r.html.indexOf(`<head><meta charSet="utf-8"/>${GATE}${MAIN_APP}`)).toBeGreaterThan(0);
    expect(r.html.indexOf("<script")).toBe(r.html.indexOf(GATE));
  });

  it("App Router 가 아닌 HTML 은 그대로, 이미 처리된 HTML 은 already, 부트스트랩이 맨 앞이 아니면 실패", () => {
    expect(externalizeRsc(page(""), "x")).toEqual({ html: page(""), js: "", count: 0, already: false });
    const done = processed(`<script src="/x.rsc.js"></script>${guardScript("/x.rsc.js")}`);
    expect(externalizeRsc(done, "/x.rsc.js")).toMatchObject({ html: done, count: 0, already: true });
    expect(() => externalizeRsc(page(`<script>${DATA1}</script>`), "x")).toThrow(/부트스트랩/);
  });

  it("매칭 0건: App Router HTML(main-app 청크) 인데 인라인 RSC 를 하나도 못 찾으면 실패", () => {
    expect(() => externalizeRsc(page("", MAIN_APP), "x")).toThrow(/하나도 못 찾음/);
    // 모든 조각의 형식이 바뀐 경우(예: nonce 속성) — 정규식 0매치지만 __next_f 가 있으므로 실패
    const nonce = page(`<script nonce="n1">${BOOT}</script><script nonce="n1">${DATA1}</script>`);
    expect(() => externalizeRsc(nonce, "x")).toThrow(/하나도 못 찾음/);
  });

  it("일부 조각만 다른 형식(<script nonce=…>)이면 실패 — 남은 인라인 조각이 외부 파일보다 먼저 실행돼 순서가 깨지므로", () => {
    const partial = page(`<script>${BOOT}</script><script nonce="n1">${DATA1}</script><script>${DATA2}</script>`);
    expect(() => externalizeRsc(partial, "x")).toThrow(/남음/);
  });

  it("Next 가 self.__next_s(beforeInteractive)를 쓰면 GATE 와 충돌하므로 실패, 처리된 HTML 에 인라인 RSC 가 다시 생겨도 실패", () => {
    expect(() => externalizeRsc(page(`<script>(self.__next_s=self.__next_s||[]).push(["/a.js",{}])</script><script>${BOOT}</script>`), "x")).toThrow(
      /__next_s/,
    );
    expect(() => externalizeRsc(processed(`<script>${DATA1}</script>`), "x")).toThrow(/다시 생김/);
  });
});

describe("GATE·GUARD — 페이로드가 끝까지 실행됐을 때만 하이드레이션", () => {
  const SRC = "/rs/p/index.rsc.js?v=B1";

  it("정상: 외부 파일 실행 후 확인 스크립트가 하이드레이션을 연다(재요청 없음)", async () => {
    const rt = runtime();
    expect(rt.nextS.length).toBe(1);
    await rt.flush();
    expect(rt.isHydrated()).toBe(false); // 페이로드 전에는 시작하지 않음
    const r = externalizeRsc(page(`<script>${BOOT}</script><script>${DATA1}</script>`), SRC);
    new Function("self", r.js)(rt.self);
    rt.run(guardScript(SRC));
    await rt.flush();
    expect(rt.isHydrated()).toBe(true);
    expect(rt.appended).toEqual([]);
    expect(rt.htmlAttrs).toEqual({});
  });

  it("실패(abort·404): 1회 재요청 — 재요청 성공이면 하이드레이션, 재요청도 실패·잘린 응답이면 영영 보류(정적 HTML 유지)", async () => {
    const ok = runtime();
    ok.self.__next_f = [[0]]; // 앞 시도가 일부라도 실행됐다면 버린다
    ok.run(guardScript(SRC));
    expect(ok.self.__next_f).toBeUndefined();
    expect(ok.appended.map((e) => e.src)).toEqual([`${SRC}&retry=1`]);
    ok.self.__rs_rsc_ok = 1; // 재요청 파일이 끝까지 실행됨
    ok.appended[0]!.onload!();
    await ok.flush();
    expect(ok.isHydrated()).toBe(true);
    expect(ok.htmlAttrs).toEqual({}); // 재요청 성공 — 동의 배너는 그대로

    // 재요청이 200 이지만 끝까지 실행되지 않은 응답(완료 표시 없음): 하이드레이션 보류 + <html data-rsc-failed> (배너 숨김, r2 권고 R2)
    const truncated = runtime();
    truncated.run(guardScript("/x.rsc.js"));
    expect(truncated.appended.map((e) => e.src)).toEqual(["/x.rsc.js?retry=1"]);
    truncated.appended[0]!.onload!();
    await truncated.flush();
    expect(truncated.isHydrated()).toBe(false);
    expect(truncated.htmlAttrs).toEqual({ [FAILED_ATTR]: "" });

    // 재요청도 네트워크 실패(onerror): 같은 결과
    const aborted = runtime();
    aborted.run(guardScript("/x.rsc.js"));
    aborted.appended[0]!.onerror!();
    await aborted.flush();
    expect(aborted.isHydrated()).toBe(false);
    expect(aborted.htmlAttrs).toEqual({ [FAILED_ATTR]: "" });
  });
});

describe("externalizeAll", () => {
  it("out/ 전체: 한글 경로는 인코딩한 src, 빌드 ID 쿼리, _next 는 건너뜀, 두 번 돌려도 같다", () => {
    const out = tmpOut();
    const html = (b: string) => page(`<script src="/realsurgery/_next/static/chunks/a.js"></script><script>${BOOT}</script><script>${b}</script>`);
    fs.writeFileSync(path.join(out, "index.html"), html(DATA1));
    fs.mkdirSync(path.join(out, "procedures", "쌍꺼풀-수술"), { recursive: true });
    fs.writeFileSync(path.join(out, "procedures", "쌍꺼풀-수술", "index.html"), html(DATA2));
    fs.mkdirSync(path.join(out, "_next", "static", "chunks"), { recursive: true });
    fs.writeFileSync(path.join(out, "_next", "skip.html"), html(DATA2));
    fs.writeFileSync(path.join(out, "_next", "static", "chunks", "a.js"), HOOK_CHUNK);

    const r = externalizeAll({ outDir: out, buildId: "B1" });
    expect(r).toMatchObject({ files: 2, moved: 2, already: 0 });
    const p = fs.readFileSync(path.join(out, "procedures", "쌍꺼풀-수술", "index.html"), "utf8");
    expect(p).toContain(`<script src="/realsurgery/procedures/${encodeURIComponent("쌍꺼풀-수술")}/index.rsc.js?v=B1"></script>`);
    expect(fs.readFileSync(path.join(out, "procedures", "쌍꺼풀-수술", "index.rsc.js"), "utf8")).toContain(DATA2);
    expect(fs.readFileSync(path.join(out, "_next", "skip.html"), "utf8")).toContain(DATA2);
    const again = externalizeAll({ outDir: out, buildId: "B1" });
    expect(again).toMatchObject({ moved: 0, already: 2 });
    expect(fs.readFileSync(path.join(out, "procedures", "쌍꺼풀-수술", "index.html"), "utf8")).toBe(p);
  });

  it("매칭 0건인 App Router HTML 이 하나라도 있으면 파일 이름과 함께 실패(빌드 실패)", () => {
    const out = tmpOut();
    fs.writeFileSync(path.join(out, "index.html"), page(`${MAIN_APP}<script>${BOOT}</script><script>${DATA1}</script>`));
    fs.mkdirSync(path.join(out, "a"));
    fs.writeFileSync(path.join(out, "a", "index.html"), page(MAIN_APP));
    expect(() => externalizeAll({ outDir: out, buildId: "B1" })).toThrow(/a[\\/]index\.html: App Router HTML 인데/);
  });

  it("일부 조각만 다른 형식인 HTML 이 있으면 실패", () => {
    const out = tmpOut();
    fs.writeFileSync(path.join(out, "index.html"), page(`${MAIN_APP}<script>${BOOT}</script><script nonce="n">${DATA1}</script>`));
    expect(() => externalizeAll({ outDir: out, buildId: "B1" })).toThrow(/index\.html: 처리 후에도 인라인 self\.__next_f 가 남음/);
  });

  it("처리된 HTML 인데 외부 파일이 없으면 실패", () => {
    const out = tmpOut();
    fs.writeFileSync(path.join(out, "index.html"), processed(`<script src="/index.rsc.js"></script>`));
    expect(() => externalizeAll({ outDir: out, buildId: "B1" })).toThrow(/index\.rsc\.js 없음/);
  });

  it("GATE 훅(r2 권고 R1): HTML 이 불러오는 Next 청크에 appBootstrap 의 self.__next_s 읽기가 없으면 실패", () => {
    const out = tmpOut();
    const chunks = path.join(out, "_next", "static", "chunks");
    fs.mkdirSync(chunks, { recursive: true });
    const html = page(`<script src="/realsurgery/_next/static/chunks/b.js" async=""></script><script>${BOOT}</script><script>${DATA1}</script>`);
    fs.writeFileSync(path.join(out, "index.html"), html);
    // Next 가 더 이상 __next_s 를 읽지 않는 버전이라고 가정한 청크
    fs.writeFileSync(path.join(chunks, "b.js"), "function appBootstrap(e){e()}");
    expect(() => externalizeAll({ outDir: out, buildId: "B1" })).toThrow(/appBootstrap 의 self\.__next_s 읽기를 찾지 못함/);
    // 청크 파일이 없어도 실패(조용히 통과하지 않음)
    expect(() => assertGateHook(out, "/realsurgery", html.replace("b.js", "missing.js"))).toThrow(/찾지 못함/);
    // 실제 Next 15.5 형태(쿼리 붙은 src 포함)는 통과
    fs.writeFileSync(path.join(chunks, "b.js"), HOOK_CHUNK);
    expect(() => assertGateHook(out, "/realsurgery", html.replace("b.js", "b.js?dpl=1"))).not.toThrow();
  });
});
