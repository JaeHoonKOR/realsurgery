import { describe, expect, it } from "vitest";
import { charWidth, estimateTextWidth, truncateText, wrapText } from "@/lib/svg-text";

// fontSize 10 기준 어림값: 한글 9.2, 영숫자 5.8, 공백 2.8, 문장부호 3.6
const FS = 10;

describe("svg-text: charWidth 글자 폭 어림", () => {
  it.each([
    ["가", 9.2],
    ["힣", 9.2],
    ["ㄱ", 9.2],
    ["一", 9.2],
    ["Ａ", 9.2],
    ["　", 9.2],
    ["A", 5.8],
    ["7", 5.8],
    ["…", 5.8],
    [" ", 2.8],
    [".", 3.6],
    ["·", 3.6],
    ["~", 3.6],
    ["-", 3.6],
    ["—", 3.6],
    ["(", 3.6],
  ])("%s → %d (fontSize 10)", (ch, w) => {
    expect(charWidth(ch, FS)).toBeCloseTo(w, 10);
  });

  it("글자 크기에 비례한다", () => {
    expect(charWidth("가", 20)).toBeCloseTo(charWidth("가", 10) * 2, 10);
    expect(charWidth("A", 0)).toBe(0);
  });
});

describe("svg-text: estimateTextWidth", () => {
  it("빈 문자열은 0", () => {
    expect(estimateTextWidth("", FS)).toBe(0);
  });

  it("글자 폭의 합", () => {
    // 쌍(9.2) 꺼(9.2) 풀(9.2) 공백(2.8) A(5.8) .(3.6)
    expect(estimateTextWidth("쌍꺼풀 A.", FS)).toBeCloseTo(39.8, 10);
  });

  it("서로게이트 쌍은 한 글자로 센다", () => {
    expect(estimateTextWidth("😀", FS)).toBeCloseTo(5.8, 10);
  });
});

describe("svg-text: truncateText 말줄임", () => {
  it("폭 안에 들어오면 그대로", () => {
    expect(truncateText("코 성형", 100, FS)).toBe("코 성형");
  });

  it("폭과 정확히 같아도 그대로", () => {
    const w = estimateTextWidth("가나다", FS);
    expect(truncateText("가나다", w, FS)).toBe("가나다");
  });

  it("넘치면 잘라서 … 를 붙이고, 결과 폭이 maxWidth 를 넘지 않는다", () => {
    const out = truncateText("가나다라마", 30, FS);
    expect(out).toBe("가나…");
    expect(estimateTextWidth(out, FS)).toBeLessThanOrEqual(30);
  });

  it("잘린 자리 끝 공백은 지우고 … 를 붙인다", () => {
    expect(truncateText("가나 다라마바", 30, FS)).toBe("가나…");
  });

  it.each([20, 45, 61, 88])("maxWidth %d: 결과는 원문의 앞부분 + …", (max) => {
    const text = "광대 축소술 회복 기간 안내 Q&A";
    const out = truncateText(text, max, FS);
    expect(out.endsWith("…")).toBe(true);
    expect(text.startsWith(out.slice(0, -1))).toBe(true);
    expect(estimateTextWidth(out, FS)).toBeLessThanOrEqual(max);
  });
});

describe("svg-text: wrapText 어절 단위 줄바꿈", () => {
  it("빈 문자열·공백만 있으면 빈 배열", () => {
    expect(wrapText("", 100, FS)).toEqual([]);
    expect(wrapText("   \n\t ", 100, FS)).toEqual([]);
  });

  it("한 줄에 들어오면 한 줄, 연속 공백은 하나로 줄인다", () => {
    expect(wrapText("  눈  성형  ", 200, FS)).toEqual(["눈 성형"]);
  });

  it("어절을 쪼개지 않고 줄을 나눈다(keep-all)", () => {
    // 쌍꺼풀 27.6 / "수술 회복" 39.6 / "수술 회복 기간" 60.8
    expect(wrapText("쌍꺼풀 수술 회복 기간", 40, FS)).toEqual(["쌍꺼풀", "수술 회복", "기간"]);
  });

  it("모든 줄이 maxWidth 안에 들어온다", () => {
    const lines = wrapText("코끝 성형은 연골 이식 방식에 따라 회복 기간과 비용이 달라집니다", 70, FS);
    expect(lines.length).toBeGreaterThan(1);
    for (const l of lines) expect(estimateTextWidth(l, FS)).toBeLessThanOrEqual(70);
    expect(lines.join(" ")).toBe("코끝 성형은 연골 이식 방식에 따라 회복 기간과 비용이 달라집니다");
  });

  it("한 줄보다 긴 어절은 글자 단위로 끊는다", () => {
    expect(wrapText("가나다라마바", 20, FS)).toEqual(["가나", "다라", "마바"]);
  });

  it("앞 줄을 먼저 내보낸 뒤 긴 어절을 글자 단위로 끊는다", () => {
    expect(wrapText("AB 가나다라마바", 20, FS)).toEqual(["AB", "가나", "다라", "마바"]);
  });

  it("글자 하나가 maxWidth 보다 넓어도 빈 줄 없이 한 글자씩 낸다", () => {
    expect(wrapText("가나", 5, FS)).toEqual(["가", "나"]);
  });

  it("maxLines 를 넘으면 마지막 줄에 남은 내용을 이어 붙여 말줄임한다", () => {
    const lines = wrapText("쌍꺼풀 수술 회복 기간", 40, FS, 2);
    expect(lines).toEqual(["쌍꺼풀", "수술 회…"]);
    expect(estimateTextWidth(lines[1] ?? "", FS)).toBeLessThanOrEqual(40);
  });

  it("maxLines 이하면 말줄임하지 않는다", () => {
    expect(wrapText("쌍꺼풀 수술 회복 기간", 40, FS, 3)).toEqual(["쌍꺼풀", "수술 회복", "기간"]);
  });

  it("maxLines 1 이면 한 줄로 말줄임", () => {
    const lines = wrapText("쌍꺼풀 수술 회복 기간", 40, FS, 1);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe("쌍꺼풀…");
  });
});
