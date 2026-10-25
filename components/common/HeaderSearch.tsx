"use client";

import { Search } from "lucide-react";
import { useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { SearchItem } from "@/lib/content";
import { procedurePath } from "@/lib/routes";
import { MAX_SUGGESTIONS, suggest } from "@/lib/search";
import { TrackedLink } from "./TrackedLink";

/**
 * 헤더 시술 검색 (screen-spec 3절: 시술명 자동완성 최대 5개 → P-03, 이벤트 search)
 * WAI-ARIA combobox(목록형 자동완성) 패턴: 입력창에 포커스를 둔 채 ↑↓ 로 이동, Enter 로 이동, Esc 로 닫기.
 */
export function HeaderSearch({
  items,
  testId,
  size = "md",
  placeholder = "시술명 검색 (예: 쌍꺼풀)",
}: {
  items: SearchItem[];
  testId?: string;
  /** md = 헤더, lg = 메인 히어로 */
  size?: "md" | "lg";
  placeholder?: string;
}) {
  const lg = size === "lg";
  const id = useId();
  const inputId = `${id}-input`;
  const listId = `${id}-list`;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const optionRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const results = useMemo(() => suggest(query, items, MAX_SUGGESTIONS), [query, items]);
  const term = query.trim();
  const expanded = open && term.length > 0;
  const noMatch = expanded && results.length === 0;

  const go = (index: number) => {
    const el = optionRefs.current[index];
    if (el) el.click();
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (results.length > 0) go(active >= 0 ? active : 0);
    else setOpen(true);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return; // 한글 조합 중 키는 IME 몫
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      if (results.length === 0) return;
      setActive((cur) => {
        if (e.key === "ArrowDown") return cur + 1 >= results.length ? 0 : cur + 1;
        return cur <= 0 ? results.length - 1 : cur - 1;
      });
    } else if (e.key === "Escape") {
      if (expanded) {
        e.preventDefault();
        setOpen(false);
        setActive(-1);
      } else if (query) {
        e.preventDefault();
        setQuery("");
      }
    }
  };

  return (
    <form role="search" aria-label="시술 검색" onSubmit={onSubmit} className="relative" data-testid={testId}>
      <label htmlFor={inputId} className="sr-only">
        시술 검색
      </label>
      <Search aria-hidden="true" className={`pointer-events-none absolute left-4 text-ink-subtle ${lg ? "top-4.5 size-6" : "top-3 size-5"}`} />
      <input
        id={inputId}
        type="search"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        enterKeyHint="search"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onKeyDown={onKeyDown}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          setActive(-1);
        }}
        className={`w-full border border-transparent bg-canvas pr-3 text-ink placeholder:text-ink-subtle focus:border-brand focus:bg-surface focus:outline-none ${lg ? "h-15 rounded-lg pl-13 text-lg" : "h-11 rounded-md pl-11 text-base"}`}
      />
      <div
        id={listId}
        role="listbox"
        aria-label="검색어와 일치하는 시술"
        hidden={!expanded || results.length === 0}
        className="absolute inset-x-0 top-full z-(--z-popover) mt-2 overflow-hidden rounded-md border border-line bg-surface py-1 shadow-lg"
      >
        {results.map((item, i) => (
          <TrackedLink
            key={item.id}
            ref={(el: HTMLAnchorElement | null) => {
              optionRefs.current[i] = el;
            }}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === active}
            tabIndex={-1}
            href={procedurePath(item.slug)}
            event="search"
            params={{ search_term: term }}
            // 클릭 중 입력창 blur 로 목록이 먼저 닫히지 않게
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => setActive(i)}
            onClick={() => {
              setOpen(false);
              setActive(-1);
            }}
            className={`flex h-12 items-center justify-between gap-3 px-4 ${i === active ? "bg-canvas" : ""}`}
          >
            <span className="font-semibold text-ink">{item.name}</span>
            <span className="text-sm text-ink-subtle">{item.category}</span>
          </TrackedLink>
        ))}
      </div>
      {/* 결과 0건 안내(빈 상태). 라이브 영역은 항상 DOM 에 두고 내용만 바꾼다 → 스크린 리더가 변화를 읽는다 */}
      <p
        role="status"
        className={
          noMatch
            ? "absolute inset-x-0 top-full z-(--z-popover) mt-2 rounded-md border border-line bg-surface px-4 py-3 text-sm text-ink-muted shadow-lg"
            : "sr-only"
        }
      >
        {noMatch ? `‘${term}’와 일치하는 시술이 없습니다. 시술명을 다시 확인해 주세요.` : ""}
      </p>
    </form>
  );
}
