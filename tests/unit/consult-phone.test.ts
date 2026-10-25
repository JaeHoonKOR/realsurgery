import { describe, expect, it } from "vitest";
import {
  caretAfterDigits,
  formatPhone,
  isLandline,
  isValidMobile,
  maskName,
  maskPhone,
  phoneDigits,
  toE164,
} from "@/lib/consult/phone";

describe("휴대폰 자동 하이픈 formatPhone", () => {
  it.each([
    ["", ""],
    ["0", "0"],
    ["010", "010"],
    ["0101", "010-1"],
    ["0101234", "010-1234"],
    ["01012345", "010-1234-5"],
    ["01012345678", "010-1234-5678"],
    ["010-1234-5678", "010-1234-5678"],
    ["010 1234 5678", "010-1234-5678"],
    ["0101234567899", "010-1234-5678"], // 11자리 초과는 자른다
    ["0111234567", "011-123-4567"], // 옛 번호 10자리
    ["01112345678", "011-1234-5678"],
    ["abc010가1234", "010-1234"],
  ])("%s → %s", (input, expected) => {
    expect(formatPhone(input)).toBe(expected);
  });

  it("숫자만 최대 11자리", () => {
    expect(phoneDigits("+82 10-1234-5678")).toBe("82101234567");
  });
});

describe("휴대폰 형식 검증", () => {
  it.each(["010-1234-5678", "01012345678", "011-123-4567", "016-1234-5678", "019-123-4567"])("유효: %s", (v) => {
    expect(isValidMobile(v)).toBe(true);
  });
  it.each(["010-123-4567", "010-1234-567", "012-1234-5678", "02-123-4567", "", "010"])("무효: %s", (v) => {
    expect(isValidMobile(v)).toBe(false);
  });
  it("일반 전화(02·031)를 구분한다", () => {
    expect(isLandline("02-123-4567")).toBe(true);
    expect(isLandline("031-123-4567")).toBe(true);
    expect(isLandline("010-1234-5678")).toBe(false);
    expect(isLandline("0")).toBe(false);
  });
});

describe("커서 위치·변환·마스킹", () => {
  it("하이픈이 들어가도 입력한 숫자 바로 뒤에 커서를 둔다", () => {
    expect(caretAfterDigits("010-1234-5678", 0)).toBe(0);
    expect(caretAfterDigits("010-1234-5678", 3)).toBe(3);
    expect(caretAfterDigits("010-1234-5678", 4)).toBe(5);
    expect(caretAfterDigits("010-1234-5678", 7)).toBe(8);
    expect(caretAfterDigits("010-1234-5678", 8)).toBe(10);
    expect(caretAfterDigits("010-1234", 20)).toBe(8);
  });
  it("E.164", () => {
    expect(toE164("010-1234-5678")).toBe("+821012345678");
  });
  it("번호·이름 마스킹", () => {
    expect(maskPhone("010-1234-5678")).toBe("010-****-5678");
    expect(maskPhone("0111234567")).toBe("011-***-4567");
    expect(maskPhone("0101")).toBe("****");
    expect(maskName("김지은")).toBe("김*은");
    expect(maskName("이준")).toBe("이*");
    expect(maskName("남궁민수")).toBe("남**수");
    expect(maskName("김")).toBe("*");
    expect(maskName("  ")).toBe("");
  });
});
