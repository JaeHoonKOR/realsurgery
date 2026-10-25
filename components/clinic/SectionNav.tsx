"use client";

import { useEffect, useState } from "react";
import { cx } from "@/lib/ui";

type Item = { id: string; label: string };

/** 섹션 머리가 이 높이(헤더 + 탭 바로 아래)를 지나면 현재 섹션으로 본다 */
const ACTIVE_OFFSET = 140;

/**
 * 병원 상세 섹션 탭 — 헤더 아래에 붙어 따라오고, 지금 보고 있는 섹션을 표시한다.
 * 링크는 일반 앵커(#id)라 JS 없이도 이동한다. 현재 섹션 = 머리가 화면 위쪽 기준선을 지난 마지막 섹션(스크롤 스파이).
 * 첫 섹션에 닿기 전(페이지 맨 위)에는 아무 탭도 강조하지 않는다.
 */
export function SectionNav({ items }: { items: Item[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current: string | null = null;
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top <= ACTIVE_OFFSET) current = item.id;
      }
      // 문서 끝에 닿으면 마지막 섹션(짧아서 기준선까지 못 올라오는 경우)
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atEnd && current) current = items.at(-1)?.id ?? current;
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [items]);

  return (
    <nav
      aria-label="병원 정보 바로가기"
      data-testid="clinic-section-nav"
      className="sticky top-14 z-(--z-raised) border-b border-line bg-surface md:top-16"
    >
      <ul className="mx-auto flex max-w-content gap-1 overflow-x-auto px-3 md:gap-2 md:px-8">
        {items.map((item) => {
          const on = item.id === active;
          return (
            <li key={item.id} className="shrink-0">
              <a
                href={`#${item.id}`}
                aria-current={on ? "location" : undefined}
                className={cx(
                  "relative inline-flex h-12 items-center px-2 text-base font-semibold transition-colors",
                  "after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full",
                  on ? "text-ink after:bg-ink" : "text-ink-subtle after:bg-transparent hover:text-ink",
                )}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
