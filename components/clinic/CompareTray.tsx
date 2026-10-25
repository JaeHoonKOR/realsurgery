"use client";

import { X } from "lucide-react";
import { MAX_COMPARE, MIN_COMPARE } from "@/lib/clinic/compare";
import { btn, cx } from "@/lib/ui";

type Props = {
  selected: { id: string; name: string }[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onOpen: () => void;
};

/**
 * 비교함 — 화면 아래에 떠 있는 바. 담은 병원 이름(누르면 빼기) + 빈 자리 + "비교하기".
 * 2곳 이상 담아야 비교 표를 열 수 있다.
 */
export function CompareTray({ selected, onRemove, onClear, onOpen }: Props) {
  if (selected.length === 0) return null;
  const ready = selected.length >= MIN_COMPARE;
  const empty = Math.max(0, MAX_COMPARE - selected.length);

  return (
    <div
      role="region"
      aria-label="병원 비교함"
      data-testid="compare-tray"
      className="fixed inset-x-0 bottom-0 z-(--z-bottom-bar) md:bottom-6"
    >
      <div className="mx-auto max-w-content md:px-10">
        <div className="border-t border-line bg-surface px-4 pt-3 pb-safe-4 shadow-lg md:rounded-xl md:border md:px-5 md:py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-5">
            <div className="flex min-w-0 items-center gap-3 md:flex-1">
              <p className="shrink-0 text-sm font-bold text-ink">
                비교함 <span className="text-brand-strong tabular-nums">{selected.length}</span>
                <span className="text-ink-subtle tabular-nums">/{MAX_COMPARE}</span>
              </p>
              <ul className="-my-1 flex min-w-0 gap-2 overflow-x-auto py-1" aria-label="담은 병원">
                {selected.map((c) => (
                  <li key={c.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => onRemove(c.id)}
                      data-testid="compare-tray-item"
                      className="inline-flex h-11 items-center gap-1.5 rounded-full bg-brand-weak pr-3 pl-4 text-sm font-semibold text-brand-ink hover:bg-line"
                    >
                      {c.name}
                      <X aria-hidden="true" className="size-4" />
                      <span className="sr-only">비교함에서 빼기</span>
                    </button>
                  </li>
                ))}
                {Array.from({ length: empty }, (_, i) => (
                  <li
                    key={`empty-${i}`}
                    aria-hidden="true"
                    className="hidden h-11 w-28 shrink-0 items-center justify-center rounded-full border border-dashed border-line-strong text-xs text-ink-subtle sm:inline-flex"
                  >
                    병원 담기
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClear} className={cx(btn.neutral, btn.sm, "h-12")}>
                비우기
              </button>
              <button
                type="button"
                data-testid="compare-open"
                onClick={onOpen}
                disabled={!ready}
                aria-describedby={ready ? undefined : "compare-tray-hint"}
                className={cx(btn.primary, btn.md, "grow md:grow-0")}
              >
                {ready ? `${selected.length}곳 비교하기` : "비교하기"}
              </button>
            </div>
          </div>
          {!ready && (
            <p id="compare-tray-hint" className="mt-2 text-xs text-ink-subtle md:mt-1">
              한 곳 더 담으면 가격·진료 시간을 나란히 비교할 수 있습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
