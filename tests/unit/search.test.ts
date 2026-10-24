import { describe, expect, it } from "vitest";
import { MAX_SUGGESTIONS, normalizeQuery, suggest } from "@/lib/search";

const items = [
  { name: "쌍꺼풀 수술", category: "눈" },
  { name: "앞트임", category: "눈" },
  { name: "눈매교정", category: "눈" },
  { name: "눈밑지방재배치", category: "눈" },
  { name: "코 성형", category: "코" },
  { name: "사각턱 수술", category: "윤곽" },
  { name: "광대 축소술", category: "윤곽" },
  { name: "가슴 확대 수술", category: "가슴" },
];

const names = (q: string, limit?: number) => suggest(q, items, limit).map((i) => i.name);

describe("시술 검색 자동완성", () => {
  it("최대 5개 (3절)", () => {
    expect(MAX_SUGGESTIONS).toBe(5);
    const many = Array.from({ length: 12 }, (_, i) => ({ name: `리프팅 ${i}` }));
    expect(suggest("리프팅", many)).toHaveLength(5);
  });

  it("공백·대소문자·조합형 차이를 무시한다", () => {
    expect(normalizeQuery(" 쌍꺼풀  수술 ")).toBe("쌍꺼풀수술");
    expect(normalizeQuery("ABC")).toBe("abc");
    expect(normalizeQuery("가")).toBe("가"); // 자모 → 완성형(NFC)
    expect(names("쌍꺼풀수술")).toEqual(["쌍꺼풀 수술"]);
    expect(names("코성형")).toEqual(["코 성형"]);
  });

  it("앞부분 일치 → 중간 일치 → 부위명 일치 순, 같은 순위는 짧은 이름 → 원래 순서", () => {
    expect(names("눈")).toEqual(["눈매교정", "눈밑지방재배치", "앞트임", "쌍꺼풀 수술"]);
    expect(names("수술")).toEqual(["쌍꺼풀 수술", "사각턱 수술", "가슴 확대 수술"]);
    expect(names("술")).toEqual(["쌍꺼풀 수술", "사각턱 수술", "광대 축소술", "가슴 확대 수술"]);
  });

  it("빈 검색어·일치 없음·limit 0 은 빈 목록", () => {
    expect(names("")).toEqual([]);
    expect(names("   ")).toEqual([]);
    expect(names("없는시술")).toEqual([]);
    expect(names("눈", 0)).toEqual([]);
  });

  it("부위명이 없는 항목도 다룬다", () => {
    expect(suggest("코", [{ name: "앞트임" }])).toEqual([]);
  });
});
