/**
 * SVG <text> 는 자동 줄바꿈이 없다. 다이어그램·차트(components/diagrams, components/charts)가 글자 폭을 어림해
 * 줄을 나누고 넘치면 말줄임한다. Pretendard 기준 어림값(한글 0.92em, 영숫자 0.58em, 공백 0.28em, 문장부호 0.36em).
 */

const WIDE = /[ᄀ-ᇿ㄰-㆏가-힣　-〿＀-￯一-鿿]/;
const NARROW_PUNCT = /[.,·:;'"!|()[\]{}~\-–—/]/;

export function charWidth(ch: string, fontSize: number): number {
  if (ch === " ") return fontSize * 0.28;
  if (WIDE.test(ch)) return fontSize * 0.92;
  if (NARROW_PUNCT.test(ch)) return fontSize * 0.36;
  return fontSize * 0.58;
}

export function estimateTextWidth(text: string, fontSize: number): number {
  let w = 0;
  for (const ch of text) w += charWidth(ch, fontSize);
  return w;
}

/** maxWidth 를 넘지 않게 자른다. 잘리면 끝에 "…" */
export function truncateText(text: string, maxWidth: number, fontSize: number): string {
  if (estimateTextWidth(text, fontSize) <= maxWidth) return text;
  const ellipsis = charWidth("…", fontSize);
  let out = "";
  let w = 0;
  for (const ch of text) {
    const cw = charWidth(ch, fontSize);
    if (w + cw + ellipsis > maxWidth) break;
    out += ch;
    w += cw;
  }
  return `${out.trimEnd()}…`;
}

/**
 * 어절(공백) 단위로 줄을 나눈다(word-break: keep-all 과 같은 원칙). 한 어절이 한 줄보다 길면 글자 단위로 끊는다.
 * maxLines 를 넘으면 마지막 줄을 말줄임한다.
 */
export function wrapText(text: string, maxWidth: number, fontSize: number, maxLines = Infinity): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  const push = () => {
    if (line) lines.push(line);
    line = "";
  };
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (estimateTextWidth(candidate, fontSize) <= maxWidth) {
      line = candidate;
      continue;
    }
    push();
    if (estimateTextWidth(word, fontSize) <= maxWidth) {
      line = word;
      continue;
    }
    // 긴 어절: 글자 단위
    for (const ch of word) {
      if (estimateTextWidth(line + ch, fontSize) > maxWidth) push();
      line += ch;
    }
  }
  push();
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = truncateText(`${kept[maxLines - 1]} ${lines.slice(maxLines).join(" ")}`, maxWidth, fontSize);
    return kept;
  }
  return lines;
}
