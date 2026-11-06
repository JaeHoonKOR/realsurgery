import { describe, expect, it } from "vitest";
import { formatManwon, formatRange, maxOf, niceTicks } from "@/lib/price-scale";

describe("price-scale: formatManwon 만 원 표기", () => {
  it.each([
    [700_000, "70만"],
    [15_000, "1.5만"],
    [40_000, "4만"],
    [2_200_000, "220만"],
    [10_000_000, "1,000만"],
    [125_000_000, "1억 2,500만"],
    [100_000_000, "1억"],
    [1_234_567_890, "12억 3,457만"],
  ])("%d원 → %s", (won, text) => {
    expect(formatManwon(won)).toBe(text);
  });

  it("10만 미만은 소수 첫째 자리까지, 10만 이상은 정수로 반올림한다", () => {
    expect(formatManwon(95_000)).toBe("9.5만");
    expect(formatManwon(12_345)).toBe("1.2만");
    expect(formatManwon(5_000)).toBe("0.5만");
    expect(formatManwon(123_456)).toBe("12만");
    expect(formatManwon(125_000)).toBe("13만");
  });

  it("반올림 올림이 다음 자리로 넘어가면 단위도 바뀐다", () => {
    expect(formatManwon(99_999)).toBe("10만");
    // 억 경계: "10,000만"·"1억 10,000만"이 아니라 억으로 올라가야 한다
    expect(formatManwon(99_995_000)).toBe("1억");
    expect(formatManwon(99_999_999)).toBe("1억");
    expect(formatManwon(199_995_000)).toBe("2억");
    expect(formatManwon(100_004_999)).toBe("1억");
    expect(formatManwon(100_005_000)).toBe("1억 1만");
  });

  it("0원은 0만", () => {
    expect(formatManwon(0)).toBe("0만");
  });
});

describe("price-scale: formatRange 범위 문구", () => {
  it("양쪽 다 있으면 물결로 잇는다", () => {
    expect(formatRange({ min: 700_000, max: 2_200_000 })).toBe("70만~220만 원");
  });

  it("최솟값과 최댓값이 같으면 한 값만 쓴다", () => {
    expect(formatRange({ min: 1_500_000, max: 1_500_000 })).toBe("150만 원");
  });

  it("한쪽만 있으면 부터/까지", () => {
    expect(formatRange({ min: 700_000, max: null })).toBe("70만 원부터");
    expect(formatRange({ min: null, max: 2_200_000 })).toBe("220만 원까지");
  });

  it("둘 다 없으면 가격 미정", () => {
    expect(formatRange({ min: null, max: null })).toBe("가격 미정");
  });

  it("0원은 미정이 아니라 값으로 다룬다", () => {
    expect(formatRange({ min: 0, max: 300_000 })).toBe("0만~30만 원");
    expect(formatRange({ min: 0, max: null })).toBe("0만 원부터");
  });
});

describe("price-scale: niceTicks 눈금", () => {
  it.each([0, -100, Number.NaN])("최댓값이 양수가 아니면(%d) [0]", (max) => {
    expect(niceTicks(max)).toEqual([0]);
  });

  it.each([
    [100, [0, 25, 50, 75, 100]],
    [1_000_000, [0, 250_000, 500_000, 750_000, 1_000_000]],
    [2_200_000, [0, 1_000_000, 2_000_000, 3_000_000]],
    [3_000_000, [0, 1_000_000, 2_000_000, 3_000_000]],
    [700_000, [0, 200_000, 400_000, 600_000, 800_000]],
  ])("최댓값 %d → %j", (max, ticks) => {
    expect(niceTicks(max)).toEqual(ticks);
  });

  it("target 칸 수를 바꾸면 간격이 바뀐다", () => {
    expect(niceTicks(1_000_000, 2)).toEqual([0, 500_000, 1_000_000]);
    expect(niceTicks(1_000_000, 10)).toEqual([0, 100_000, 200_000, 300_000, 400_000, 500_000, 600_000, 700_000, 800_000, 900_000, 1_000_000]);
  });

  // 가격(원 단위) 범위. 눈금은 원 단위 정수로 반올림하므로 10원 미만 최댓값은 대상이 아니다
  it.each([10_000, 50_000, 333_333, 1_500_000, 4_990_000, 12_000_000, 250_000_000])(
    "최댓값 %d: 0에서 시작, 같은 간격(1·2·2.5·5×10^n), 마지막 눈금이 최댓값을 덮는다",
    (max) => {
      const ticks = niceTicks(max);
      expect(ticks[0]).toBe(0);
      const at = (i: number) => ticks[i] ?? Number.NaN;
      const step = at(1) - at(0);
      const mantissa = step / 10 ** Math.floor(Math.log10(step));
      expect([1, 2, 2.5, 5]).toContain(mantissa);
      for (let i = 1; i < ticks.length; i++) expect(at(i) - at(i - 1)).toBe(step);
      const last = at(ticks.length - 1);
      expect(last).toBeGreaterThanOrEqual(max);
      expect(last - step).toBeLessThan(max);
      expect(ticks.length).toBeGreaterThanOrEqual(3);
      expect(ticks.length).toBeLessThanOrEqual(6);
    },
  );
});

describe("price-scale: maxOf", () => {
  it("빈 목록은 0", () => {
    expect(maxOf([])).toBe(0);
  });

  it("min·max 를 모두 보고 null 은 건너뛴다", () => {
    expect(
      maxOf([
        { min: 700_000, max: 2_200_000 },
        { min: 3_000_000, max: null },
        { min: null, max: null },
        { min: null, max: 1_000_000 },
      ]),
    ).toBe(3_000_000);
  });

  it("전부 미정이면 0 → niceTicks 는 [0]", () => {
    const m = maxOf([{ min: null, max: null }]);
    expect(m).toBe(0);
    expect(niceTicks(m)).toEqual([0]);
  });
});
