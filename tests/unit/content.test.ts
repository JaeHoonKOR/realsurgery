import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildData } from "../../scripts/build-data.mjs";
import { CONTENT_FILE, getSearchItems, loadContent } from "@/lib/content";

let dir = "";
let file = "";

beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "content-"));
  file = path.join(dir, "content.json");
  await buildData({ env: {}, outFile: file, log: () => {} });
});
afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

describe("lib/content — 빌드 시 생성 JSON 로더", () => {
  it("기본 경로는 data/generated/content.json", () => {
    expect(path.relative(process.cwd(), CONTENT_FILE).split(path.sep).join("/")).toBe("data/generated/content.json");
  });

  it("JSON 을 읽고 같은 파일은 캐시한다", () => {
    const a = loadContent(file);
    expect(a.meta.mode).toBe("mock");
    expect(a.procedures).toHaveLength(10);
    expect(loadContent(file)).toBe(a);
  });

  it("파일이 없으면 생성 방법을 알려 준다", () => {
    expect(() => loadContent(path.join(dir, "missing.json"))).toThrow(/build-data\.mjs/);
  });

  it("검색 항목: 시술명·slug·부위명만 넘긴다", () => {
    const items = getSearchItems(loadContent(file));
    expect(items).toHaveLength(10);
    expect(items.find((i) => i.id === "double-eyelid")).toEqual({
      id: "double-eyelid",
      name: "쌍꺼풀 수술",
      slug: "쌍꺼풀-수술",
      category: "눈",
    });
  });

  it("카테고리를 못 찾으면 부위명은 빈 문자열", () => {
    const c = loadContent(file);
    const items = getSearchItems({ ...c, categories: [] });
    expect(items.every((i) => i.category === "")).toBe(true);
  });
});
