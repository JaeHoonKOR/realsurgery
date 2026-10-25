import { SITE } from "@/lib/site";

/**
 * 로고 — 마크(가격 범위 바 두 줄 = 같은 눈금 위 비교) + 워드마크.
 * 마크는 장식이므로 aria-hidden, 이름은 텍스트로 읽힌다.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <svg viewBox="0 0 28 28" aria-hidden="true" className="size-7 shrink-0">
        <rect width="28" height="28" rx="8" className="fill-brand" />
        <rect x="6" y="9" width="16" height="3.5" rx="1.75" className="fill-surface" />
        <rect x="11" y="15.5" width="11" height="3.5" rx="1.75" className="fill-surface" opacity="0.7" />
      </svg>
      <span className="text-lg font-bold tracking-tighter text-ink">{SITE.name}</span>
    </span>
  );
}
