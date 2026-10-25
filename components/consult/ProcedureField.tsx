"use client";

import { Check, ChevronDown, Search, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type RefObject } from "react";
import { Icon3D, categoryIcon } from "@/components/ui/Icon3D";
import { PROCEDURE_UNDECIDED } from "@/lib/consult/validation";
import { normalizeQuery } from "@/lib/search";
import { chip, cx } from "@/lib/ui";
import { FieldError, describedBy } from "./FieldError";
import type { ProcedureOption } from "./types";

type Props = {
  procedures: readonly ProcedureOption[];
  value: string;
  onChange: (id: string) => void;
  error?: string | null;
  /** 오류 시 포커스 대상 */
  triggerRef: RefObject<HTMLButtonElement | null>;
  /** false = 아직 쿼리 선입력을 읽기 전(첫 페인트) → 자리만 잡는다 */
  ready: boolean;
};

const ALL = "all";

/**
 * 관심 시술 — 선택 상자(트리거) + 시트(모바일 하단, 데스크톱 가운데). 시트는 네이티브 <dialog> 로 포커스 가두기·Esc 를 맡긴다.
 * 트리거 높이는 선택 전후가 같아서 쿼리 선입력이 늦게 들어와도 레이아웃이 밀리지 않는다.
 */
export function ProcedureField({ procedures, value, onChange, error, triggerRef, ready }: Props) {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(ALL);

  const selected = procedures.find((p) => p.id === value) ?? null;
  const undecided = value === PROCEDURE_UNDECIDED;
  const labelId = `${id}-label`;
  const errorId = `${id}-error`;

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of procedures) if (!seen.has(p.category_id)) seen.set(p.category_id, p.category_name);
    return [...seen].map(([cid, name]) => ({ id: cid, name }));
  }, [procedures]);

  const term = normalizeQuery(query);
  const results = procedures.filter(
    (p) =>
      (category === ALL || p.category_id === category) &&
      (!term || normalizeQuery(p.name).includes(term) || normalizeQuery(p.category_name).includes(term)),
  );

  // 시트가 열린 동안 뒤 화면 스크롤을 막는다
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const root = document.documentElement;
    if (open) {
      if (!dialog.open) dialog.showModal();
      root.style.overflow = "hidden";
      // 모바일에서 키보드가 시트를 가리지 않게, 데스크톱에서만 검색창에 바로 포커스
      if (window.matchMedia("(min-width: 48rem)").matches) searchRef.current?.focus();
    } else {
      if (dialog.open) dialog.close();
      root.style.overflow = "";
    }
  }, [open]);
  useEffect(
    () => () => {
      document.documentElement.style.overflow = "";
    },
    [],
  );

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const choose = (pid: string) => {
    onChange(pid);
    setQuery("");
    setCategory(ALL);
    close();
  };

  return (
    <div data-testid="consult-procedure">
      <p id={labelId} className="text-lg font-bold tracking-tight text-ink">
        관심 시술
      </p>
      <p className="mt-1 text-sm text-ink-subtle">가이드에 담을 시술입니다. 상담에서 바꿀 수 있어요.</p>

      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-describedby={describedBy(error && errorId)}
        data-invalid={error ? "" : undefined}
        data-testid="consult-procedure-trigger"
        onClick={() => setOpen(true)}
        className={cx(
          "mt-4 flex min-h-20 w-full items-center gap-4 rounded-md border bg-surface p-3 pr-4 text-left transition-colors hover:bg-canvas-soft",
          error ? "border-danger" : "border-line-strong",
        )}
      >
        <span className="flex size-14 shrink-0 items-center justify-center rounded-sm bg-canvas">
          {ready && (selected ? <Icon3D name={categoryIcon(selected.category_id)} size={40} /> : <Icon3D name={undecided ? "ic-undecided" : "ic-search"} size={32} />)}
        </span>
        {/* 접근 가능한 이름 = "관심 시술:" + 보이는 글자 전부(label-content-name-mismatch 방지) */}
        <span className="sr-only">관심 시술: </span>
        <span className="min-w-0 flex-1">
          {!ready ? (
            <span aria-hidden="true" className="block h-5 w-32 rounded-sm bg-canvas" />
          ) : selected ? (
            <>
              <span className="block truncate text-lg font-bold text-ink">{selected.name}</span>
              <span className="mt-1 flex items-center gap-2 text-sm text-ink-muted">
                <span className={cx(chip.base, chip.neutral, "h-6 px-2 text-xs")}>{selected.category_name}</span>
                <span className="tabular-nums">{selected.price_label}</span>
              </span>
            </>
          ) : undecided ? (
            <>
              <span className="block text-lg font-bold text-ink">아직 정하지 못했어요</span>
              <span className="mt-0.5 block text-sm text-ink-muted">고민 중인 부위를 상담에서 함께 정리해 드려요</span>
            </>
          ) : (
            <span className="block text-lg font-semibold text-ink-subtle">시술을 선택해 주세요</span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-0.5 text-sm font-semibold text-brand-strong">
          {ready && (selected || undecided) ? "변경" : "선택"}
          <ChevronDown aria-hidden="true" className="size-4" />
        </span>
      </button>
      <FieldError id={errorId} message={error} />

      <dialog
        ref={dialogRef}
        aria-labelledby={`${id}-sheet-title`}
        data-testid="consult-procedure-sheet"
        onClose={() => {
          if (open) close();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        className="mx-0 mt-auto mb-0 flex max-h-5/6 w-full max-w-full flex-col overflow-hidden rounded-t-xl bg-surface p-0 text-ink shadow-lg backdrop:bg-ink/40 not-open:hidden md:m-auto md:max-h-4/5 md:max-w-form md:rounded-xl"
      >
        <div className="flex items-center justify-between gap-4 px-5 pt-4 md:px-6 md:pt-5">
          <h2 id={`${id}-sheet-title`} className="text-h3 font-bold tracking-tight">
            관심 시술 선택
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="닫기"
            className="-mr-2 inline-flex size-11 items-center justify-center rounded-sm text-ink-muted hover:bg-canvas"
          >
            <X aria-hidden="true" className="size-6" />
          </button>
        </div>

        <div className="px-5 pt-3 md:px-6">
          <label htmlFor={`${id}-search`} className="sr-only">
            시술 이름으로 찾기
          </label>
          <div className="relative">
            <Search aria-hidden="true" className="pointer-events-none absolute top-4 left-4 size-6 text-ink-subtle" />
            <input
              ref={searchRef}
              id={`${id}-search`}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="시술 이름으로 찾기"
              autoComplete="off"
              enterKeyHint="search"
              className="h-14 w-full rounded-md border border-transparent bg-canvas pr-4 pl-12 text-base text-ink placeholder:text-ink-muted focus:border-brand focus:bg-surface focus:outline-none"
            />
          </div>
          <div role="group" aria-label="부위" className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1 md:-mx-6 md:px-6">
            {[{ id: ALL, name: "전체" }, ...categories].map((c) => {
              const active = category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategory(c.id)}
                  className={cx(
                    chip.base,
                    "h-11 shrink-0 px-4",
                    active ? "bg-ink text-surface" : "bg-canvas text-ink-muted hover:bg-line",
                  )}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-safe-4 md:px-4">
          {results.length === 0 ? (
            <p role="status" className="px-2 py-8 text-center text-sm text-ink-muted">
              ‘{query.trim()}’와 일치하는 시술이 없습니다. 이름을 줄여 검색하거나 아래에서 ‘아직 정하지 못했어요’를 골라 주세요.
            </p>
          ) : (
            <ul aria-label="시술 목록">
              {results.map((p) => {
                const current = p.id === value;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      aria-current={current ? "true" : undefined}
                      data-procedure-id={p.id}
                      onClick={() => choose(p.id)}
                      className={cx(
                        "flex min-h-16 w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors",
                        current ? "bg-brand-weak" : "hover:bg-canvas-soft",
                      )}
                    >
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-sm bg-canvas">
                        <Icon3D name={categoryIcon(p.category_id)} size={32} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cx("block font-bold", current ? "text-brand-ink" : "text-ink")}>{p.name}</span>
                        <span className="block text-sm text-ink-muted">{p.category_name}</span>
                      </span>
                      <span className="shrink-0 text-sm text-ink-muted tabular-nums">{p.price_label}</span>
                      <Check
                        aria-hidden="true"
                        className={cx("size-5 shrink-0", current ? "text-brand-strong" : "text-transparent")}
                        strokeWidth={3}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-1 border-t border-line pt-1">
            <button
              type="button"
              aria-current={undecided ? "true" : undefined}
              onClick={() => choose(PROCEDURE_UNDECIDED)}
              className={cx(
                "flex min-h-16 w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors",
                undecided ? "bg-brand-weak" : "hover:bg-canvas-soft",
              )}
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-sm bg-canvas">
                <Icon3D name="ic-undecided" size={32} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={cx("block font-bold", undecided ? "text-brand-ink" : "text-ink")}>아직 정하지 못했어요</span>
                <span className="block text-sm text-ink-muted">고민 중인 부위를 상담에서 함께 정리해 드려요</span>
              </span>
              <Check aria-hidden="true" className={cx("size-5 shrink-0", undecided ? "text-brand-strong" : "text-transparent")} strokeWidth={3} />
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
