/** 본문 바로가기 — 키보드 사용자가 고정 헤더를 건너뛴다. 포커스를 받을 때만 보인다. */
export function SkipLink({ targetId = "main" }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-(--z-skip-link) focus:inline-flex focus:h-11 focus:items-center focus:rounded-sm focus:bg-ink focus:px-4 focus:text-sm focus:font-semibold focus:text-surface"
    >
      본문 바로가기
    </a>
  );
}
