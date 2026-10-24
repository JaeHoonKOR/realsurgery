// 인라인 RSC 페이로드 외부화 (scripts/externalize-rsc.mjs) — 순서·내용 보존, 형식이 바뀌면 빌드 실패
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { externalizeAll, externalizeRsc } from "../../scripts/externalize-rsc.mjs";

const BOOT = "(self.__next_f=self.__next_f||[]).push([0])";
const DATA1 = 'self.__next_f.push([1,"0:{\\"a\\":\\"쌍꺼풀\\u003c/b\\u003e\\"}\\n"])';
const DATA2 = 'self.__next_f.push([1,"1:[\\"$\\",\\"p\\",null,{}]\\n"])';
const page = (body: string) =>
  `<!DOCTYPE html><html><head><script>window.dataLayer=[]</script><script type="application/ld+json">{"a":1}</script></head><body><main>본문</main>${body}</body></html>`;

const tmp: string[] = [];
afterEach(() => {
  for (const d of tmp.splice(0)) fs.rmSync(d, { recursive: true, force: true });
});

describe("externalizeRsc", () => {
  it("인라인 RSC 스크립트를 순서대로 모아 첫 위치에 <script src> 1개로 바꾸고, 다른 인라인 스크립트는 그대로 둔다", () => {
    const html = page(`<script>${BOOT}</script><script>${DATA1}</script><div>x</div><script>${DATA2}</script>`);
    const r = externalizeRsc(html, "/rs/index.rsc.js?v=1");
    expect(r.count).toBe(3);
    expect(r.js).toBe(`${BOOT};\n${DATA1};\n${DATA2};\n`);
    expect(r.html).toBe(page(`<script src="/rs/index.rsc.js?v=1"></script><div>x</div>`));
    expect(r.html).toContain("<script>window.dataLayer=[]</script>");
    expect(r.html).toContain('<script type="application/ld+json">');
    // 모은 JS 를 실행하면 원래 인라인 스크립트와 같은 순서로 push 된다
    const self: { __next_f?: unknown[] } = {};
    new Function("self", r.js)(self);
    expect(self.__next_f).toEqual([[0], [1, '0:{"a":"쌍꺼풀</b>"}\n'], [1, '1:["$","p",null,{}]\n']]);
  });

  it("인라인 RSC 가 없으면 그대로, 부트스트랩이 맨 앞이 아니면 실패", () => {
    expect(externalizeRsc(page(""), "x")).toEqual({ html: page(""), js: "", count: 0 });
    expect(() => externalizeRsc(page(`<script>${DATA1}</script>`), "x")).toThrow(/부트스트랩/);
  });

  it("out/ 전체: 한글 경로는 인코딩한 src, 빌드 ID 쿼리, _next 는 건너뜀, 두 번 돌려도 같다", () => {
    const out = fs.mkdtempSync(path.join(os.tmpdir(), "rsc-"));
    tmp.push(out);
    const html = (b: string) => page(`<script src="/realsurgery/_next/static/chunks/a.js"></script><script>${BOOT}</script><script>${b}</script>`);
    fs.writeFileSync(path.join(out, "index.html"), html(DATA1));
    fs.mkdirSync(path.join(out, "procedures", "쌍꺼풀-수술"), { recursive: true });
    fs.writeFileSync(path.join(out, "procedures", "쌍꺼풀-수술", "index.html"), html(DATA2));
    fs.mkdirSync(path.join(out, "_next"));
    fs.writeFileSync(path.join(out, "_next", "skip.html"), html(DATA2));

    const r = externalizeAll({ outDir: out, buildId: "B1" });
    expect(r).toMatchObject({ files: 2, moved: 2 });
    const p = fs.readFileSync(path.join(out, "procedures", "쌍꺼풀-수술", "index.html"), "utf8");
    expect(p).toContain(`<script src="/realsurgery/procedures/${encodeURIComponent("쌍꺼풀-수술")}/index.rsc.js?v=B1"></script>`);
    expect(fs.readFileSync(path.join(out, "procedures", "쌍꺼풀-수술", "index.rsc.js"), "utf8")).toContain(DATA2);
    expect(fs.readFileSync(path.join(out, "_next", "skip.html"), "utf8")).toContain(DATA2);
    expect(externalizeAll({ outDir: out, buildId: "B1" })).toMatchObject({ moved: 0 });
  });
});
