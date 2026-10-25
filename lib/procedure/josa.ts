/**
 * 한국어 조사 — 시술명·작성자 이름 뒤에 받침에 맞는 조사를 붙인다("눈밑지방재배치를", "쌍꺼풀 수술을").
 * 한글이 아닌 글자로 끝나면 받침 없음으로 본다.
 */

type Pair = "을/를" | "이/가" | "은/는" | "과/와" | "으로/로";

export function hasBatchim(word: string): boolean {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0) - 0xac00;
  if (Number.isNaN(code) || code < 0 || code > 11171) return false;
  return code % 28 !== 0;
}

/** "으로/로"는 ㄹ 받침이면 "로" */
function endsWithRieul(word: string): boolean {
  const code = word.trim().slice(-1).charCodeAt(0) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 === 8;
}

export function josa(word: string, pair: Pair): string {
  const [withFinal, withoutFinal] = pair.split("/") as [string, string];
  if (pair === "으로/로" && endsWithRieul(word)) return `${word}${withoutFinal}`;
  return `${word}${hasBatchim(word) ? withFinal : withoutFinal}`;
}
