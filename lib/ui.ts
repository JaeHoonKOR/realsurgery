/**
 * 공통 클래스 조합 — 버튼·칩·카드·섹션. 화면마다 같은 모양을 쓰도록 한 곳에 둔다.
 * 색·반경·그림자는 styles/tokens.css 토큰만 쓴다.
 */

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

const btnBase =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export const btn = {
  /** 주요 행동(상담 신청·다음 단계) */
  primary: `${btnBase} bg-brand-strong text-surface hover:bg-brand-ink`,
  /** 보조 행동 */
  secondary: `${btnBase} bg-brand-weak text-brand-ink hover:bg-line`,
  /** 중립 */
  neutral: `${btnBase} bg-canvas text-ink hover:bg-line`,
  /** 흰 테두리형(회색 밴드 위) */
  outline: `${btnBase} border border-line-strong bg-surface text-ink hover:bg-canvas-soft`,
  /** 크기 */
  lg: "h-14 px-6 text-lg",
  md: "h-12 px-5 text-base",
  sm: "h-11 px-4 text-sm",
} as const;

export const chip = {
  base: "inline-flex h-8 items-center gap-1 rounded-full px-3 text-sm font-semibold",
  brand: "bg-brand-weak text-brand-ink",
  neutral: "bg-canvas text-ink-muted",
  outline: "border border-line text-ink-muted",
} as const;

/** 콘텐츠 폭 컨테이너 */
export const container = "mx-auto w-full max-w-content px-5 md:px-10";

/** 섹션 세로 여백 */
export const section = "py-14 md:py-20";

/** 카드 — 흰 바탕(회색 밴드 위에서), 위계: lg 반경 */
export const card = "rounded-lg bg-surface";
/** 카드 — 흰 바탕 위에서는 회색 */
export const cardMuted = "rounded-lg bg-canvas";
/** 입력 필드 */
export const input =
  "h-14 w-full rounded-md border border-line-strong bg-surface px-4 text-base text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none aria-[invalid=true]:border-danger";
