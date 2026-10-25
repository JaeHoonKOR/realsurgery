/**
 * 휴대폰 번호 — 입력 자동 하이픈, 형식 검증, 마스킹, 국제 형식(E.164).
 * 상담 폼은 휴대폰만 받는다(문자 안내·중복 확인 기준). 저장 시에는 숫자만 보낸다.
 */

/** 숫자만 남기고 최대 11자리 */
export function phoneDigits(input: string): string {
  return input.replace(/\D/g, "").slice(0, 11);
}

/**
 * 입력 중 자동 하이픈: 010-1234-5678.
 * 010 은 항상 11자리라 가운데 4자리, 그 밖(011·016~019 옛 번호)은 10자리면 3자리·11자리면 4자리.
 */
export function formatPhone(input: string): string {
  const d = phoneDigits(input);
  if (d.length <= 3) return d;
  const mid = d.startsWith("010") || d.length === 11 ? 4 : 3;
  if (d.length <= 3 + mid) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 3 + mid)}-${d.slice(3 + mid)}`;
}

/** 휴대폰 번호인가: 010-XXXX-XXXX, 또는 011·016·017·018·019 옛 번호(10~11자리) */
export function isValidMobile(input: string): boolean {
  const d = input.replace(/\D/g, "");
  return /^010\d{8}$/.test(d) || /^01[16789]\d{7,8}$/.test(d);
}

/** 01 로 시작하지 않는 번호(02-, 031- 등 일반 전화) */
export function isLandline(input: string): boolean {
  const d = input.replace(/\D/g, "");
  return d.length >= 2 && d.startsWith("0") && !d.startsWith("01");
}

/** 형식 바꾼 뒤 커서 위치: 앞에서 digitsBefore 개의 숫자 바로 뒤 */
export function caretAfterDigits(formatted: string, digitsBefore: number): number {
  if (digitsBefore <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i] as string)) seen++;
    if (seen === digitsBefore) return i + 1;
  }
  return formatted.length;
}

/** 01012345678 → +821012345678 */
export function toE164(input: string): string {
  const d = input.replace(/\D/g, "");
  return `+82${d.replace(/^0/, "")}`;
}

/** 010-****-5678 (관리자 목록·mock 저장용) */
export function maskPhone(input: string): string {
  const d = input.replace(/\D/g, "");
  if (d.length < 7) return "*".repeat(d.length);
  return `${d.slice(0, 3)}-${"*".repeat(d.length - 7)}-${d.slice(-4)}`;
}

/** 김지은 → 김*은, 이준 → 이*, Kim Jieun → K******n */
export function maskName(name: string): string {
  const chars = [...name.trim()];
  if (chars.length <= 1) return chars.length ? "*" : "";
  if (chars.length === 2) return `${chars[0]}*`;
  return `${chars[0]}${"*".repeat(chars.length - 2)}${chars[chars.length - 1]}`;
}
