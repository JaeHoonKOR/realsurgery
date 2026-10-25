"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/procedure/toc";
import { cx } from "@/lib/ui";

/** 앵커 위치 판정: 고정 헤더(최대 64px) + 여유 */
const ACTIVE_OFFSET = 120;

/**
 * P-03 목차 (4절: H2 앵커 목록).
 * - 데스크톱: 오른쪽 고정(sticky) 사이드, 지금 읽는 섹션을 aria-current="location" 으로 표시.
 * - 모바일: 본문 위 접이식 카드(기본 접힘) — 긴 목록이 첫 화면을 밀어내지 않게. 링크는 HTML 에 그대로 있다.
 */
export function ProcedureToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const key = items.map((i) => i.id).join("|");

  useEffect(() => {
    const ids = key.split("|").filter(Boolean);
    let frame = 0;
    const update = () => {
      frame = 0;
      let current: string | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= ACTIVE_OFFSET) current = id;
      }
      setActive(current);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [key]);

  if (items.length === 0) return null;
  return (
    <nav aria-labelledby="toc-title" data-testid="procedure-toc" className="rounded-lg bg-canvas lg:bg-transparent">
      <p id="toc-title" className="hidden text-sm font-bold text-ink-subtle lg:block">
        이 글의 순서
      </p>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="toc-list"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-14 w-full items-center justify-between gap-3 px-5 text-left font-bold text-ink lg:hidden"
      >
        <span>
          이 글의 순서 <span className="ml-1 text-sm font-semibold text-ink-muted tabular-nums">{items.length}</span>
        </span>
        <ChevronDown aria-hidden="true" className={cx("size-5 text-ink-muted transition-transform", open && "rotate-180")} />
      </button>
      <ol
        id="toc-list"
        className={cx("px-5 pb-3 lg:mt-3 lg:block lg:border-l lg:border-line lg:p-0", open ? "block" : "hidden")}
      >
        {items.map((item, i) => {
          const isActive = active === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={isActive ? "location" : undefined}
                onClick={() => setOpen(false)}
                className={cx(
                  "flex min-h-11 items-center gap-3 py-2 text-base transition-colors lg:-ml-px lg:min-h-9 lg:border-l-2 lg:py-1.5 lg:pl-4 lg:text-sm",
                  isActive
                    ? "font-semibold text-ink lg:border-brand"
                    : "text-ink-muted hover:text-ink lg:border-transparent",
                )}
              >
                <span aria-hidden="true" className="w-4 shrink-0 text-sm font-semibold text-ink-faint tabular-nums lg:hidden">
                  {i + 1}
                </span>
                {item.label}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
