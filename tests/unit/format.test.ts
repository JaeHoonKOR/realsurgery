import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatDuration,
  formatManwon,
  formatPriceRange,
  formatRecovery,
  formatWon,
  percentOnScale,
} from "@/lib/format";

describe("formatManwon", () => {
  it.each([
    [500000, "50만"],
    [2500000, "250만"],
    [12000000, "1,200만"],
    [35000, "3만 5천"],
    [1500000, "150만"],
    [9000, "9천"],
    [800, "800"],
  ])("%d → %s", (won, out) => expect(formatManwon(won)).toBe(out));
});

describe("formatPriceRange", () => {
  it("범위·단일·한쪽만·없음", () => {
    expect(formatPriceRange(500000, 2500000)).toBe("50만~250만 원");
    expect(formatPriceRange(700000, 700000)).toBe("70만 원");
    expect(formatPriceRange(700000, null)).toBe("70만 원부터");
    expect(formatPriceRange(null, 900000)).toBe("최대 90만 원");
    expect(formatPriceRange(null, null)).toBe("상담 후 안내");
  });
  it("원 단위 전체 표기", () => expect(formatWon(500000)).toBe("500,000원"));
});

describe("기간·날짜", () => {
  it("회복기간", () => {
    expect(formatRecovery(null)).toBe("개인차 있음");
    expect(formatRecovery(0)).toBe("당일 일상 가능");
    expect(formatRecovery(7)).toBe("약 7일");
    expect(formatRecovery(28)).toBe("약 4주");
    expect(formatRecovery(30)).toBe("약 30일");
  });
  it("소요시간", () => {
    expect(formatDuration(null)).toBe("상담 후 안내");
    expect(formatDuration(40)).toBe("약 40분");
    expect(formatDuration(60)).toBe("약 1시간");
    expect(formatDuration(90)).toBe("약 1시간 30분");
  });
  it("날짜", () => expect(formatDate("2026-10-24T00:00:00Z")).toBe("2026.10.24"));
});

describe("percentOnScale", () => {
  it("눈금 위 위치(0~100, 범위 밖은 잘라냄)", () => {
    expect(percentOnScale(500000, 500000, 2500000)).toBe(0);
    expect(percentOnScale(1500000, 500000, 2500000)).toBe(50);
    expect(percentOnScale(3000000, 500000, 2500000)).toBe(100);
    expect(percentOnScale(100, 0, 0)).toBe(0);
  });
});
