"use client";

import { useEffect, useState } from "react";
import { Emoji3D, type EmojiName } from "@/components/ui/Emoji3D";
import { track } from "@/lib/track";
import { cx } from "@/lib/ui";

export type CategoryChip = { id: string; slug: string; name: string; count: number; emoji: EmojiName };

/** 고정 헤더(최대 64px) + 칩 바(약 68px) 아래에 섹션 머리가 걸리면 "지금 보는 부위" */
const ACTIVE_OFFSET = 160;

/**
 * P-02 부위 칩 — 화면 위에 붙는(sticky) 앵커 링크. 누르면 select_category, 스크롤 위치에 따라 지금 부위를 표시한다.
 */
export function CategoryChips({ items }: { items: CategoryChip[] }) {
  const [active, setActive] = useState<string | null>(items[0]?.slug ?? null);
  const key = items.map((i) => i.slug).join("|");

  useEffect(() => {
    const slugs = key.split("|").filter(Boolean);
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = slugs[0] ?? null;
      for (const slug of slugs) {
        const el = document.getElementById(slug);
        if (el && el.getBoundingClientRect().top <= ACTIVE_OFFSET) current = slug;
      }
      setActive(current);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    schedule();
    return () => {
      window.removeEventListener("scroll", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [key]);

  return (
    <nav
      aria-label="부위 바로가기"
      data-testid="category-chips"
      className="sticky top-14 z-(--z-raised) border-b border-line bg-surface md:top-16"
    >
      <ul className="mx-auto flex max-w-content gap-2 overflow-x-auto px-5 py-3 md:px-10">
        {items.map((c) => {
          const isActive = active === c.slug;
          return (
            <li key={c.id} className="shrink-0">
              <a
                href={`#${c.slug}`}
                data-track="select_category"
                aria-current={isActive ? "location" : undefined}
                onClick={() => track("select_category", { category: c.id })}
                className={cx(
                  "inline-flex h-11 items-center gap-1.5 rounded-full pr-4 pl-2.5 font-semibold transition-colors",
                  isActive ? "bg-ink text-surface" : "bg-canvas text-ink hover:bg-line",
                )}
              >
                <Emoji3D name={c.emoji} size={24} />
                {c.name}
                <span className={cx("text-sm tabular-nums", isActive ? "text-line-strong" : "text-ink-muted")}>{c.count}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
