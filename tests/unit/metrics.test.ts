import { describe, expect, it } from "vitest";
import { byRange } from "../../scripts/metrics.mjs";

describe("metrics: GA4 runReport 응답 읽기", () => {
  it("이름 붙인 날짜 범위별로 값을 꺼낸다", () => {
    const report = {
      rows: [
        { dimensionValues: [{ value: "this_week" }], metricValues: [{ value: "120" }, { value: "80" }] },
        { dimensionValues: [{ value: "last_week" }], metricValues: [{ value: "100" }, { value: "70" }] },
      ],
    };
    expect(byRange(report, 0)).toEqual({ this_week: 120, last_week: 100 });
    expect(byRange(report, 1)).toEqual({ this_week: 80, last_week: 70 });
  });

  it("행이 없거나 한쪽 범위만 있으면 빈 쪽은 0", () => {
    expect(byRange({}, 0)).toEqual({ this_week: 0, last_week: 0 });
    expect(byRange({ rows: [{ dimensionValues: [{ value: "this_week" }], metricValues: [{ value: "3" }] }] }, 0)).toEqual({
      this_week: 3,
      last_week: 0,
    });
  });

  it("모르는 범위 이름은 무시한다", () => {
    expect(byRange({ rows: [{ dimensionValues: [{ value: "date_range_0" }], metricValues: [{ value: "9" }] }] }, 0)).toEqual({
      this_week: 0,
      last_week: 0,
    });
  });
});
