import { TrackedLink } from "@/components/common/TrackedLink";
import { Emoji3D, categoryEmoji } from "@/components/ui/Emoji3D";
import { isPathBuilt } from "@/lib/built-routes";
import type { Category, Procedure } from "@/lib/content";
import { formatDuration, formatPriceRange, formatRecovery } from "@/lib/format";
import { procedurePath } from "@/lib/routes";
import { chip, cx } from "@/lib/ui";

type Props = {
  procedure: Procedure;
  /** 카드에 부위 칩을 붙일 때(부위가 섞인 목록) */
  category?: Category;
  /** 이 시술의 공개 가격이 있는 병원 수 */
  clinicCount?: number;
  /** select_procedure 의 from_page */
  fromPage: "procedures" | "procedure" | "blog";
  /** 부위 일러스트를 카드에 그릴지 — 부위 제목 아래 목록(P-02)처럼 이미 부위가 보이면 끈다 */
  showEmoji?: boolean;
};

/** 시술 카드 — 메인 "이번 주 많이 본 시술"과 같은 모양(흰 카드, 회색 밴드 위). P-02 목록·P-03 비슷한 시술에서 쓴다. */
export function ProcedureCard({ procedure: p, category, clinicCount, fromPage, showEmoji = true }: Props) {
  const href = procedurePath(p.slug);
  const count = clinicCount ? <span className="shrink-0 pt-1 text-sm text-ink-subtle tabular-nums">병원 {clinicCount}곳 공개가</span> : null;
  const title = (
    <div className={cx("flex flex-wrap items-center gap-2", showEmoji && "mt-4")}>
      <h3 className="text-h3 font-bold tracking-tight text-ink">{p.name}</h3>
      {category && <span className={cx(chip.base, chip.neutral, "h-6 px-2 text-xs")}>{category.name}</span>}
    </div>
  );
  const body = (
    <>
      {showEmoji ? (
        <>
          <div className="flex items-start justify-between gap-3">
            <span className="flex size-14 items-center justify-center rounded-md bg-canvas">
              <Emoji3D name={categoryEmoji(p.category_id)} size={40} />
            </span>
            {count}
          </div>
          {title}
        </>
      ) : (
        <div className="flex items-start justify-between gap-3">
          {title}
          {count}
        </div>
      )}
      <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{p.extras?.tagline ?? p.summary}</p>
      <p className="mt-auto pt-5 text-lg font-bold text-ink tabular-nums">
        {formatPriceRange(p.price_low, p.price_high)}
        {p.price_note && <span className="ml-1 text-sm font-medium text-ink-subtle">{p.price_note}</span>}
      </p>
      <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-3 text-sm">
        <div className="flex gap-1.5">
          <dt className="text-ink-subtle">회복</dt>
          <dd className="font-semibold text-ink">{formatRecovery(p.recovery_days)}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-ink-subtle">소요</dt>
          <dd className="font-semibold text-ink">{formatDuration(p.duration_min)}</dd>
        </div>
      </dl>
    </>
  );
  const cardClass = "flex h-full flex-col rounded-lg bg-surface p-6";
  return isPathBuilt(href) ? (
    <TrackedLink
      href={href}
      event="select_procedure"
      params={{ procedure_id: p.id, from_page: fromPage }}
      data-testid="procedure-card"
      className={cx(cardClass, "transition-shadow hover:shadow-lg")}
    >
      {body}
    </TrackedLink>
  ) : (
    <div className={cardClass} data-testid="procedure-card">
      {body}
    </div>
  );
}
