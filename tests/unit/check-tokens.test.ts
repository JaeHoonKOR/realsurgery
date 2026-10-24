import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { DIRS, EXT, checkTokens, scanSource } from "../../scripts/check-tokens.mjs";

const rules = (text: string, file = "app/page.tsx") => scanSource(text, file).map((v) => `${v.rule} ${v.value}`);

describe("check-tokens: hex 색상", () => {
  // 2026-10-25 리뷰 반려 사유 1에서 놓쳤던 형태(a–f 문자로만 된 hex가 따옴표 뒤에 오는 경우)
  it.each([
    ['style={{ color: "#fff" }}', "#fff"],
    ['<path fill="#ffffff" />', "#ffffff"],
    ["const c = '#abc';", "#abc"],
    ['color: "#ABCDEF"', "#ABCDEF"],
    ['const c = "#fed";', "#fed"],
    ["const c = `#cafe`;", "#cafe"],
    ['<stop stopColor={"#fff"} />', "#fff"],
    ["background: url(#abc);", "#abc"],
  ])("%s → %s 검출", (src, hex) => {
    expect(rules(src)).toContain(`hex ${hex}`);
  });

  it.each([
    ['color: "#1f2a2e"', "#1f2a2e"],
    ["color: #fff;", "#fff"],
    ["border: 1px solid #000000aa;", "#000000aa"],
  ])("숫자 섞인 hex·CSS 값도 검출: %s", (src, hex) => {
    expect(rules(src, "styles/x.css")).toContain(`hex ${hex}`);
  });

  it("그라디언트 객체의 to: 값은 앵커로 보지 않는다", () => {
    expect(rules('const g = { from: "#fff", to: "#abc" };')).toEqual(["hex #fff", "hex #abc"]);
  });

  it("앵커 속성 뒤라도 같은 줄의 다른 속성 색은 검출한다", () => {
    expect(rules('<a href="#main" style={{ color: "#fff" }}>')).toEqual(["hex #fff"]);
  });

  it.each([
    '<a href="#main">본문 바로가기</a>',
    "<a href='#faded'>",
    '<a href="/guide#cafe">',
    '<Link href={"#bad"}>',
    "<Link href={`#face`}>",
    '<use xlink:href="#dead" />',
    '<Link to="#abc">',
    '<div id="#beef">',
    'const nav = [{ href: "#ace", label: "가격" }];',
    "&#123; &#x1F; 엔티티",
  ])("앵커·엔티티는 통과: %s", (src) => {
    expect(rules(src)).toEqual([]);
  });

  it("줄 번호를 정확히 보고한다", () => {
    expect(scanSource('a\nb\nconst c = "#fff";', "x.ts")).toEqual([{ line: 3, rule: "hex", value: "#fff" }]);
  });

  // 2026-10-25 T-100 r2 리뷰 권고 1: \b(?:href|id|to) 가 하이픈 뒤에서도 성립해 data-id 를 앵커로 오인
  it.each([
    ['<div data-id="#fff" />', "#fff"],
    ['<div aria-describedby-id="#abc" />', "#abc"],
    ['<a data-href="#cafe" />', "#cafe"],
    ['<g data-to="#bad" />', "#bad"],
    ['const o = { "data-href": "#fed" };', "#fed"],
    ['const o = { xhref: "#ace" };', "#ace"],
    ['<div gridid="#beef" />', "#beef"],
  ])("하이픈·글자 뒤 id/href/to 는 앵커가 아니다: %s", (src, hex) => {
    expect(rules(src)).toContain(`hex ${hex}`);
  });
});

describe("check-tokens: 색 함수·이름 색 (T-100 r2 리뷰 권고 2)", () => {
  it.each([
    ['style={{ background: "rgb(0 0 0)" }}', "color-fn rgb("],
    ["const c = 'rgba(31, 42, 46, .5)';", "color-fn rgba("],
    ['const c = "hsl(200 50% 40%)";', "color-fn hsl("],
    ["const c = `HSLA(1,2%,3%,.4)`;", "color-fn HSLA("],
    ['const c = "oklch(0.7 0.1 200)";', "color-fn oklch("],
    ['const c = "lab(50% 20 30)";', "color-fn lab("],
    ['const c = "hwb(12 10% 20%)";', "color-fn hwb("],
    ['const c = "color(display-p3 1 0 0)";', "color-fn color(display-p3"],
  ])("TS 문자열의 색 함수 검출: %s", (src, expected) => {
    expect(rules(src)).toContain(expected);
  });

  it.each([
    ["box-shadow: 0 1px 2px rgb(0 0 0 / 0.1);", "color-fn rgb("],
    ["color: hsl(0 0% 100%);", "color-fn hsl("],
    ["  --overlay: oklab(0.5 0 0);", "color-fn oklab("],
  ])("CSS 의 색 함수 검출: %s", (src, expected) => {
    expect(rules(src, "styles/x.css")).toContain(expected);
  });

  it("일반 함수 호출(color(x), toRgb(), rgbToHex())는 색 함수가 아니다", () => {
    expect(rules("const a = color(theme); const b = toRgb(x); const c = rgbToHex(v); obj.rgb(1);")).toEqual([]);
  });

  it.each([
    ['style={{ color: "white" }}', "named-color color: white"],
    ['style={{ backgroundColor: "Black" }}', "named-color backgroundColor: black"],
    ['style={{ border: "1px solid red" }}', "named-color border: red"],
    ['<path fill="white" />', "named-color fill=white"],
    ['<circle stroke={"tomato"} />', "named-color stroke=tomato"],
    ['<stop stopColor="navy" />', "named-color stopColor=navy"],
    ['const theme = { color: "rebeccapurple" };', "named-color color: rebeccapurple"],
  ])("TS·TSX 이름 색 검출: %s", (src, expected) => {
    expect(rules(src)).toContain(expected);
  });

  it.each([
    ["color: white;", "named-color color: white"],
    ["  background: #0000 linear-gradient(red, blue);", "named-color background: red"],
    ["border-bottom-color: Gray;", "named-color border-bottom-color: gray"],
    ["--ring: navy;", "named-color --ring: navy"],
    ["a { outline: 2px solid black }", "named-color outline: black"],
  ])("CSS 이름 색 검출: %s", (src, expected) => {
    expect(rules(src, "styles/x.css")).toContain(expected);
  });

  it.each([
    ['<svg fill="none" stroke="currentColor" />'],
    ['style={{ color: "inherit", background: "transparent" }}'],
    ['style={{ color: "var(--color-brand)" }}'],
    ['<p className="text-ink">흰색(white) 글자는 쓰지 않는다</p>'],
    ['const label = "white paper";'],
  ])("키워드·var(--토큰)·일반 문장은 통과: %s", (src) => {
    expect(rules(src)).toEqual([]);
  });

  it.each([
    ["color: currentColor;"],
    ["background-color: var(--color-canvas);"],
    ["outline: 2px solid var(--color-brand);"],
    ['font-family: "Pretendard Variable", system-ui;'],
    ["--z-header: 30;"],
  ])("CSS 키워드·var(--토큰)는 통과: %s", (src) => {
    expect(rules(src, "styles/x.css")).toEqual([]);
  });

  it.each([
    ['<p className="text-white" />', "named-color text-white"],
    ['<div className="bg-blue-500 hover:bg-blue-600/80" />', "named-color bg-blue-500"],
    ['<div className="md:border-t-gray-200" />', "named-color md:border-t-gray-200"],
    ['<div className="from-black to-white" />', "named-color from-black"],
  ])("토큰 밖 Tailwind 팔레트 색 클래스 검출: %s", (src, expected) => {
    expect(rules(src)).toContain(expected);
  });

  it("토큰 색 클래스·같은 접두사의 다른 유틸리티는 통과한다", () => {
    expect(
      rules('<a className="text-surface bg-accent-strong border-line text-sm text-ink-muted shadow-sm ring-brand" />'),
    ).toEqual([]);
  });
});

describe("check-tokens: 임의 값 클래스", () => {
  it("TSX의 Tailwind 임의 값 클래스를 검출한다", () => {
    expect(rules('<div className="p-[13px] md:max-w-[1120px]" />')).toEqual([
      "arbitrary p-[13px]",
      "arbitrary md:max-w-[1120px]",
    ]);
  });

  it("bg-[#fff]는 임의 값과 hex 둘 다로 잡힌다", () => {
    expect(rules('<div className="bg-[#fff]" />').sort()).toEqual(["arbitrary bg-[#fff]", "hex #fff"]);
  });

  it("토큰 클래스는 통과한다", () => {
    expect(rules('<div className="p-4 text-ink bg-surface rounded-lg shadow-sm max-w-container" />')).toEqual([]);
  });

  it("CSS 파일에는 임의 값 규칙을 적용하지 않는다(대괄호 선택자)", () => {
    expect(rules('[data-state="open"] { display: block; }', "styles/x.css")).toEqual([]);
  });
});

describe("check-tokens: 인라인 style 값", () => {
  it.each([
    ["<div style={{ padding: 13 }} />", "padding: 13"],
    ["<div style={{ marginTop: -4 }} />", "marginTop: -4"],
    ["<p style={{ lineHeight: 1.5 }} />", "lineHeight: 1.5"],
    ['<div style={{ width: "13px" }} />', 'width: "13px"'],
    ["<div style={{ gap: '1.25rem' }} />", "gap: '1.25rem'"],
    ['<div style={{ margin: "0 2em" }} />', 'margin: "0 2em"'],
    ['<div style={{ "--pad": "12px" }} />', '"--pad": "12px"'],
  ])("%s 검출", (src, value) => {
    expect(rules(src)).toEqual([`inline-style ${value}`]);
  });

  it("여러 줄에 걸친 style 객체도 해당 줄 번호로 검출한다", () => {
    const src = ["<div", "  style={{", "    display: 'flex',", "    padding: 13,", "  }}", "/>"].join("\n");
    expect(scanSource(src, "components/x.tsx")).toEqual([{ line: 4, rule: "inline-style", value: "padding: 13" }]);
  });

  it.each([
    ["<div style={{ zIndex: 10 }} />", "zIndex: 10"],
    ["<div style={{ opacity: 0.5 }} />", "opacity: 0.5"],
  ])("zIndex·opacity 숫자도 검출한다(토큰 var 로 써야 함): %s", (src, value) => {
    expect(rules(src)).toEqual([`inline-style ${value}`]);
  });

  it("zIndex·opacity 를 토큰 var 로 쓰면 통과한다", () => {
    expect(rules('<div style={{ zIndex: "var(--z-header)", opacity: "var(--opacity-muted)" }} />')).toEqual([]);
  });

  it("0·CSS 변수·키워드 값은 통과한다", () => {
    expect(
      rules(
        '<div style={{ margin: 0, padding: "var(--spacing)", display: "grid", paddingBottom: "env(safe-area-inset-bottom)" }} />',
      ),
    ).toEqual([]);
  });

  it(".ts·.css 파일에는 인라인 style 규칙을 적용하지 않는다", () => {
    expect(rules("const style = { padding: 13 };", "lib/x.ts")).toEqual([]);
  });
});

describe("check-tokens: 저장소 검사", () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
  });

  it("styles/tokens.css 는 건너뛰고 나머지 위반을 '파일:줄 규칙 값' 형식으로 보고한다", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "check-tokens-"));
    dirs.push(root);
    fs.mkdirSync(path.join(root, "styles"));
    fs.mkdirSync(path.join(root, "app"));
    fs.writeFileSync(path.join(root, "styles", "tokens.css"), "@theme { --color-ink: #1f2a2e; }\n", "utf8");
    fs.writeFileSync(path.join(root, "app", "page.tsx"), '<a href="#main" />\n<p style={{ color: "#fff" }} />\n', "utf8");
    fs.writeFileSync(path.join(root, "app", "note.md"), "#fff 는 검사 대상 확장자가 아니다\n", "utf8");
    expect(checkTokens(root)).toEqual([`${path.join("app", "page.tsx")}:2 토큰 밖 색상 #fff`]);
  });

  it("lib·content(MDX)·.js/.jsx 도 검사한다 (T-100 r2 리뷰 권고 3)", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "check-tokens-"));
    dirs.push(root);
    for (const d of ["lib", path.join("content", "procedures"), "components"]) fs.mkdirSync(path.join(root, d), { recursive: true });
    fs.writeFileSync(path.join(root, "lib", "theme.ts"), 'export const c = "rgb(0 0 0)";\n', "utf8");
    fs.writeFileSync(path.join(root, "content", "procedures", "double-eyelid.mdx"), '<span style={{ color: "#fff" }} />\n', "utf8");
    fs.writeFileSync(path.join(root, "components", "legacy.jsx"), '<p className="text-white" />\n', "utf8");
    expect(checkTokens(root).sort()).toEqual(
      [
        `${path.join("components", "legacy.jsx")}:1 토큰 밖 이름 색 text-white`,
        `${path.join("content", "procedures", "double-eyelid.mdx")}:1 토큰 밖 색상 #fff`,
        `${path.join("lib", "theme.ts")}:1 토큰 밖 색 함수 rgb(`,
      ].sort(),
    );
  });

  it("검사 범위에 app·components·lib·styles·content 가 있다", () => {
    expect(DIRS).toEqual(expect.arrayContaining(["app", "components", "lib", "styles", "content"]));
    expect(EXT).toEqual(expect.arrayContaining([".ts", ".tsx", ".js", ".jsx", ".css", ".mdx"]));
  });

  it("현재 저장소(app·components·lib·styles·content)는 위반 0건이다", () => {
    expect(checkTokens()).toEqual([]);
  });
});
