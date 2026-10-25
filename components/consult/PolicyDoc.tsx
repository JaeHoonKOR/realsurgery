import Link from "next/link";
import type { ReactNode } from "react";
import { ROUTES } from "@/lib/routes";
import { container, cx } from "@/lib/ui";

export type PolicySection = { id: string; title: string; body: ReactNode };

type Props = {
  kind: "terms" | "privacy";
  title: string;
  /** "2026년 11월 1일" */
  effectiveLabel: string;
  intro: ReactNode;
  sections: PolicySection[];
  /** 본문 끝(부칙 등) */
  footer?: ReactNode;
};

const TABS = [
  { kind: "terms", label: "이용약관", href: ROUTES.terms },
  { kind: "privacy", label: "개인정보처리방침", href: ROUTES.privacy },
] as const;

/**
 * 약관·개인정보처리방침 공통 틀 (screen-spec 4절 C-01).
 * 조항은 순서가 있으므로 "제n조"로 번호를 매긴다. 모바일은 본문 위 목차, 데스크톱은 왼쪽 고정 목차.
 */
export function PolicyDoc({ kind, title, effectiveLabel, intro, sections, footer }: Props) {
  const toc = (
    <ol className="grid gap-0.5 text-sm">
      {sections.map((s, i) => (
        <li key={s.id}>
          <a
            href={`#${s.id}`}
            className="flex min-h-11 items-center gap-2 rounded-sm px-3 text-ink-muted hover:bg-canvas hover:text-ink lg:min-h-9"
          >
            <span className="w-11 shrink-0 text-ink-muted tabular-nums">제{i + 1}조</span>
            <span className="min-w-0">{s.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <div className={cx(container, "pt-8 pb-16 md:pt-12 md:pb-24")} data-testid={`policy-${kind}`}>
      <nav aria-label="약관 및 정책" className="inline-flex rounded-md bg-canvas p-1">
        {TABS.map((t) => {
          const active = t.kind === kind;
          return (
            <Link
              key={t.kind}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "inline-flex h-11 items-center rounded-sm px-4 text-sm font-semibold transition-colors",
                active ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 lg:grid lg:grid-cols-12 lg:gap-10">
        <aside className="hidden lg:col-span-4 lg:block xl:col-span-3">
          <div className="sticky top-24">
            <p className="px-3 text-sm font-bold text-ink">목차</p>
            <div className="mt-2">{toc}</div>
          </div>
        </aside>

        <article className="min-w-0 lg:col-span-8 xl:col-span-8" aria-labelledby="policy-title">
          <header className="border-b border-line pb-8">
            <h1 id="policy-title" className="text-h1 font-bold tracking-tighter text-ink">
              {title}
            </h1>
            <p className="mt-2 text-sm text-ink-subtle">시행일 {effectiveLabel}</p>
            <div className="mt-5 grid gap-3 text-ink-muted">{intro}</div>
          </header>

          <nav aria-label="목차" className="mt-8 rounded-lg bg-canvas-soft p-3 lg:hidden">
            <p className="px-3 pt-1 pb-1 text-sm font-bold text-ink">목차</p>
            {toc}
          </nav>

          <div className="mt-4">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="border-b border-line py-8 last:border-0">
                <h2 id={`${s.id}-title`} className="text-h3 font-bold tracking-tight text-ink">
                  <span className="mr-2 text-brand-strong tabular-nums">제{i + 1}조</span>
                  {s.title}
                </h2>
                <div className="mt-4 grid gap-4 text-ink-muted">{s.body}</div>
              </section>
            ))}
          </div>

          {footer && <footer className="mt-4 rounded-lg bg-canvas-soft p-5 text-sm text-ink-muted md:p-6">{footer}</footer>}
        </article>
      </div>
    </div>
  );
}

/** 번호 목록(항·호) */
export function Clauses({ items }: { items: ReactNode[] }) {
  return (
    <ol className="grid gap-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="w-5 shrink-0 font-semibold text-ink tabular-nums">{i + 1}.</span>
          <div className="min-w-0">{item}</div>
        </li>
      ))}
    </ol>
  );
}

/** 표: 데스크톱은 table, 모바일은 카드(가로 스크롤 없이 읽히게) */
export function PolicyTable({ caption, columns, rows }: { caption: string; columns: string[]; rows: ReactNode[][] }) {
  return (
    <div>
      <table className="hidden w-full border-collapse overflow-hidden rounded-md text-sm md:table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="bg-canvas">
            {columns.map((c) => (
              <th key={c} scope="col" className="px-4 py-3 text-left font-semibold text-ink first:rounded-l-sm last:rounded-r-sm">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line align-top">
              {r.map((cell, j) => (
                <td key={j} className={cx("px-4 py-3", j === 0 ? "font-semibold text-ink" : "text-ink-muted")}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="grid gap-3 md:hidden" aria-label={caption}>
        {rows.map((r, i) => (
          <li key={i} className="rounded-md bg-canvas-soft p-4 text-sm">
            <p className="font-bold text-ink">{r[0]}</p>
            <dl className="mt-2 grid gap-1.5">
              {r.slice(1).map((cell, j) => (
                <div key={j} className="grid grid-cols-3 gap-2">
                  <dt className="text-ink-muted">{columns[j + 1]}</dt>
                  <dd className="col-span-2 text-ink">{cell}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
