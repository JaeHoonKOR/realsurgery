import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { checkTokens, scanSource } from "../../scripts/check-tokens.mjs";

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

  it("현재 저장소(app·components·styles)는 위반 0건이다", () => {
    expect(checkTokens()).toEqual([]);
  });
});
