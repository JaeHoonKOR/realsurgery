/**
 * 로딩 스켈레톤 (screen-spec 3절 "로딩·에러 상태: 스켈레톤 UI", QUALITY 2절 "로딩(스켈레톤)")
 * 클라이언트에서 데이터를 기다리는 화면(관리자 리드 목록 등)에서 쓴다. prefers-reduced-motion 이면 깜박임이 멈춘다(globals.css).
 */

export function Skeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`block animate-pulse rounded-sm bg-line ${className}`} />;
}

/** 카드 1장 모양(썸네일 3:2 + 제목·보조 2줄) — 시술·병원 카드와 같은 비율 */
export function SkeletonCard() {
  return (
    <div aria-hidden="true" className="rounded-lg border border-line bg-surface p-4">
      <Skeleton className="aspect-3/2 w-full" />
      <Skeleton className="mt-4 h-5 w-3/4" />
      <Skeleton className="mt-2 h-4 w-1/2" />
      <Skeleton className="mt-2 h-4 w-2/3" />
    </div>
  );
}

/** 목록 로딩 상태. 화면 읽기 프로그램에는 label 을 읽어 준다. */
export function SkeletonList({ count = 3, label = "목록을 불러오는 중입니다" }: { count?: number; label?: string }) {
  return (
    <div role="status" aria-busy="true" data-testid="skeleton-list" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <span className="sr-only">{label}</span>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/** 문단 로딩 상태(줄 수만큼, 마지막 줄은 짧게) */
export function SkeletonText({ lines = 3, label = "내용을 불러오는 중입니다" }: { lines?: number; label?: string }) {
  return (
    <div role="status" aria-busy="true" data-testid="skeleton-text" className="grid gap-2">
      <span className="sr-only">{label}</span>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={`h-4 ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}
