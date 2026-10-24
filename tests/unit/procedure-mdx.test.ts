// 시술 가이드 MDX 템플릿·린트 (docs/content/procedure-mdx.md) — content lane 이 1편씩 추가할 때의 안전망
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PROCEDURES_DIR,
  compileError,
  docToRows,
  guideOf,
  lintDocId,
  lintProcedureMdx,
  parseProcedureMdx,
  readProcedureDocs,
  rowMismatches,
  splitFrontmatter,
} from "../../scripts/procedure-mdx.mjs";
import { bannedWordsIn, lintFiles } from "../../scripts/lint-medical.mjs";

const valid = fs.readFileSync(path.join(PROCEDURES_DIR, "double-eyelid.mdx"), "utf8");
const template = fs.readFileSync(path.join(PROCEDURES_DIR, "_template.mdx"), "utf8");
const lint = (src: string) => lintProcedureMdx(src).join("\n");
const fmReplace = (key: string, value: string) => valid.replace(new RegExp(`^${key}: .*$`, "m"), `${key}: ${value}`);

describe("parseProcedureMdx", () => {
  it("프런트매터·본문·H2 5개(id 고정)를 나눈다, CRLF·BOM 도 처리", () => {
    const r = parseProcedureMdx(`﻿${valid.replace(/\n/g, "\r\n")}`);
    expect(r.problems).toEqual([]);
    expect(r.frontmatter?.name).toBe("쌍꺼풀 수술");
    expect(r.sections.map((s) => s.id)).toEqual(["who", "cost", "recovery", "risks", "compare"]);
    expect(r.body.startsWith("\n## ")).toBe(true);
  });

  it("프런트매터가 없거나 YAML 이 깨지면 문제로 알린다", () => {
    expect(splitFrontmatter("본문")).toBeNull();
    expect(parseProcedureMdx("본문").problems[0]).toMatch(/프런트매터/);
    expect(parseProcedureMdx("---\nname: [a\n---\n").problems[0]).toMatch(/YAML 오류/);
    expect(parseProcedureMdx("---\n- a\n---\n").problems[0]).toMatch(/객체가 아님/);
  });
});

describe("lintProcedureMdx — 템플릿 규칙", () => {
  it("저장소의 MDX 10편은 통과한다", async () => {
    const docs = readProcedureDocs();
    expect(docs).toHaveLength(10);
    for (const d of docs) expect(lintProcedureMdx(d.source), d.id).toEqual([]);
    expect(await lintFiles(docs)).toEqual([]);
  });

  it("밑줄 템플릿(_template.mdx)은 빌드 대상이 아니다", () => {
    expect(readProcedureDocs().some((d) => d.id.startsWith("_"))).toBe(false);
    expect(parseProcedureMdx(template).sections).toHaveLength(5);
  });

  it.each([
    ["알 수 없는 키", valid.replace("author:", "writer: \"x\"\nauthor:"), /알 수 없는 프런트매터 키 "writer"/],
    ["필수 키 누락", valid.replace(/^preparation: .*\n/m, ""), /"preparation" 없음/],
    ["가격 문자열", fmReplace("price_low", '"50만"'), /price_low 는 0 이상 정수/],
    ["가격 역전", fmReplace("price_low", "9000000"), /price_low > price_high/],
    ["procedure_type", fmReplace("procedure_type", '"laser"'), /procedure_type 은/],
    ["날짜 형식", fmReplace("updated_at", '"2026/10/24"'), /updated_at/],
    ["slug 공백", fmReplace("slug", '"쌍꺼풀 수술"'), /slug 형식 오류/],
    ["category 한글", fmReplace("category", '"눈"'), /category 는 카테고리 id/],
    ["description 짧음", fmReplace("description", '"짧은 설명"'), /description \d+자 — 120~150자/],
    ["summary 1문장", fmReplace("summary", '"쌍꺼풀 수술은 50만~250만 원입니다."'), /2~3문장/],
    ["summary 에 가격 없음", fmReplace("summary", '"쌍꺼풀 수술은 라인을 만드는 수술입니다. 가격은 병원마다 다릅니다."'), /가격 범위 "50만~250만 원"/],
    ["title 60자 초과", fmReplace("name", `"${"아주 긴 시술 이름".repeat(4)}"`), /title \d+자 > 60자/],
    ["출처 2개", valid.replace(/  - title: "국민건강보험[^\n]*\n[^\n]*\n/, ""), /출처\(sources\) 3개 이상/],
    ["http 출처", valid.replace("https://www.law.go.kr/", "http://www.law.go.kr/"), /url 은 https/],
    ["기관 첫 화면 출처", valid.replace(/url: "https:\/\/www\.law\.go\.kr\/[^"]*"/, 'url: "https://www.hira.or.kr/"'), /사이트 첫 화면/],
    ["FAQ 물음표 없음", valid.replace("쌍꺼풀 수술 회복기간은 얼마나 걸리나요?", "쌍꺼풀 수술 회복기간"), /물음표로 끝남/],
    ["가격 FAQ 값 불일치", valid.replace("절개법은 100만~250만 원 선", "절개법은 100만~200만 원 선"), /가격 FAQ 답변에 "250만"/],
    ["H1 금지", valid.replace("## 쌍꺼풀 수술은 누가", "# 제목\n\n## 쌍꺼풀 수술은 누가"), /H1/],
    ["H2 순서", valid.replace("## 쌍꺼풀 수술은 누가 받나요?", "## 쌍꺼풀 수술은 어떤 분께 맞나요?"), /1번째는 "누가 받나"/],
    ["H2 질문형", valid.replace("## 쌍꺼풀 수술 비용은 얼마인가요?", "## 쌍꺼풀 수술 비용"), /물음표로 끝남/],
    ["H2 바로 아래 표", valid.replace(/쌍꺼풀 수술의 참고 가격은[^\n]*\n\n\{\/\* MD-REVIEW[^\n]*\*\/\}\n\n/, ""), /바로 아래는 직답 문단/],
    ["각주 없는 섹션", valid.replace("받는 수술입니다.[1]", "받는 수술입니다.").replace("만들 수 있습니다.[1]", "만들 수 있습니다.").replace("상담해야 합니다.[1]", "상담해야 합니다."), /"쌍꺼풀 수술은 누가 받나요\?" 에 출처 각주/],
    ["범위 밖 각주", valid.replace("받는 수술입니다.[1]", "받는 수술입니다.[4]"), /\[4\] — sources 는 3개/],
    ["GFM 각주 문법", valid.replace("받는 수술입니다.[1]", "받는 수술입니다.[^1]"), /\[\^1\] 대신 \[1\]/],
    ["본문 링크", valid.replace("받는 수술입니다.[1]", "받는 [수술](https://a.kr)입니다.[1]"), /본문 링크·URL 금지/],
    ["HTML 주석", valid.replace("받는 수술입니다.[1]", "받는 수술입니다.[1] <!-- 메모 -->"), /HTML·JSX 태그 금지/],
    ["MDX 표현식", valid.replace("받는 수술입니다.[1]", "받는 수술입니다.[1] {1+1}"), /\{ \} 금지/],
    ["이미지", valid.replace("받는 수술입니다.[1]", "받는 수술입니다.[1] ![a](b.png)"), /이미지 금지/],
    ["import", valid.replace("## 쌍꺼풀 수술은 누가", "import X from 'x'\n\n## 쌍꺼풀 수술은 누가"), /import·export 금지/],
    ["코드 블록", valid.replace("받는 수술입니다.[1]", "받는 수술입니다.[1]\n\n```\ncode\n```"), /코드 블록 금지/],
    ["unverified_facts 모르는 칸", fmReplace("unverified_facts", '["price", "cost"]'), /unverified_facts 는 price \| duration \| recovery \| anesthesia/],
    ["unverified_facts 중복", fmReplace("unverified_facts", '["price", "price"]'), /중복 없는 배열/],
    ["unverified_facts 문자열", fmReplace("unverified_facts", '"price"'), /중복 없는 배열/],
    ["unverified_facts 값 없는 칸", fmReplace("duration_min", "null").replace('unverified_facts: ["price"]', 'unverified_facts: ["price", "duration"]'), /"duration" — 값이 없는 칸/],
    ["unverified_facts 검토 메모 없음", fmReplace("unverified_facts", '["price", "recovery"]'), /\{\/\* MD-REVIEW: 요약 박스 … \*\/\} 메모/],
  ])("%s", (_name, source, expected) => {
    expect(lint(source)).toMatch(expected);
  });

  it("검토 메모 {/* MD-REVIEW */} 는 허용한다", () => {
    expect(lintProcedureMdx(valid.replace("받는 수술입니다.[1]", "받는 수술입니다.[1] {/* MD-REVIEW: 표현 확인 */}"))).toEqual([]);
  });

  it("unverified_facts: 요약 박스 메모가 있으면 가격 외 칸도 허용, 키 자체는 선택", () => {
    const withMemo = fmReplace("unverified_facts", '["price", "recovery"]').replace(
      "받는 수술입니다.[1]",
      "받는 수술입니다.[1]\n\n{/* MD-REVIEW: 요약 박스 회복기간은 출처 검증 전 */}\n",
    );
    expect(lintProcedureMdx(withMemo)).toEqual([]);
    expect(lintProcedureMdx(valid.replace(/^unverified_facts: .*\n/m, ""))).toEqual([]);
    expect(guideOf(valid.replace(/^unverified_facts: .*\n/m, ""))!.unverified_facts).toEqual([]);
  });

  it("인용되지 않은 출처를 잡는다", () => {
    const src = valid.replace(/\[3\]/g, "[1]");
    expect(lint(src)).toMatch(/sources\[2\] 이 본문에서 \[3\] 로 인용되지 않음/);
  });

  it("파일 이름은 ASCII 시술 id", () => {
    expect(lintDocId("double-eyelid")).toEqual([]);
    expect(lintDocId("쌍꺼풀")[0]).toMatch(/ASCII/);
  });

  it("금칙어·컴파일 오류(CLI)", async () => {
    expect(bannedWordsIn("효과를 보장합니다. 업계 최고")).toEqual(expect.arrayContaining(["보장", "최고"]));
    expect(await compileError("## 제목\n\n본문 <div")).toMatch(/.+/);
    expect(await compileError("## 제목\n\n본문")).toBeNull();
    const bad = await lintFiles([{ id: "x", file: path.join(PROCEDURES_DIR, "x.mdx"), source: valid.replace("받는 수술입니다.", "완치를 보장합니다.") }]);
    expect(bad.join("\n")).toMatch(/금칙어 "보장"/);
  });
});

describe("docToRows · rowMismatches · guideOf", () => {
  it("MDX → procedures 1행 + FAQ 행, content_mdx 는 파일 전체", () => {
    const rows = docToRows({ id: "double-eyelid", source: valid }, 10)!;
    expect(rows.procedure).toMatchObject({ id: "double-eyelid", category_id: "eye", price_low: 500000, view_count: 10, price_note: null });
    expect(rows.procedure.content_mdx).toBe(valid);
    expect(rows.faqs.map((f) => f.id)).toEqual([1, 2, 3, 4, 5].map((n) => `double-eyelid-${n}`));
    expect(rowMismatches(rows.procedure, rows.faqs)).toEqual([]);
    expect(rowMismatches({ ...rows.procedure, name: "다른 이름" }, rows.faqs)[0]).toMatch(/name 가 MDX/);
    expect(docToRows({ id: "x", source: "본문" })).toBeNull();
  });

  it("guideOf: 화면용 필드", () => {
    const g = guideOf(valid)!;
    expect(g).toMatchObject({ procedure_type: "surgical", body_location: "윗눈꺼풀", author_id: "editorial", medical_reviewer_id: null, unverified_facts: ["price"] });
    expect(g.sections).toHaveLength(5);
    expect(guideOf(null)).toBeNull();
  });
});
