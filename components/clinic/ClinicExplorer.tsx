"use client";

import { ChevronDown, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useReducer, useRef, useState } from "react";
import { Emoji3D } from "@/components/ui/Emoji3D";
import { INITIAL_COMPARE, compareReducer } from "@/lib/clinic/compare";
import type { ClinicCardData, ProcedureOption } from "@/lib/clinic/types";
import { EMPTY_FILTER, filterClinics, filterQuery, parseFilter, premiumFirst, type ClinicFilter } from "@/lib/clinic/view";
import { btn, cx } from "@/lib/ui";
import { ClinicCard } from "./ClinicCard";
import { ComparePanel } from "./ComparePanel";
import { CompareTray } from "./CompareTray";

type Props = {
  clinics: ClinicCardData[];
  procedures: ProcedureOption[];
  regions: { key: string; count: number }[];
};

/**
 * P-04 병원 목록 — 지역 칩·시술 선택 필터(클라이언트), 결과 수, 빈 상태, 비교 담기(최대 3곳)·비교함·비교 표.
 * 필터는 URL 쿼리(?region=…&procedure=…)와 동기화해 공유·뒤로 가기가 된다(정적 HTML 은 전체 목록으로 시작).
 */
export function ClinicExplorer({ clinics, procedures, regions }: Props) {
  const [filter, setFilter] = useState<ClinicFilter>(EMPTY_FILTER);
  const [compare, dispatch] = useReducer(compareReducer, INITIAL_COMPARE);
  const [panelOpen, setPanelOpen] = useState(false);
  const openerRef = useRef<HTMLElement | null>(null);
  const selectId = useId();

  const procById = useMemo(() => new Map(procedures.map((p) => [p.id, p])), [procedures]);
  const allowed = useMemo(
    () => ({ regions: regions.map((r) => r.key), procedures: procedures.map((p) => p.id) }),
    [regions, procedures],
  );

  // URL → 필터 (첫 진입·뒤로 가기)
  useEffect(() => {
    const read = () => setFilter(parseFilter(window.location.search, allowed));
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, [allowed]);

  const update = useCallback((next: ClinicFilter) => {
    setFilter(next);
    const url = `${window.location.pathname}${filterQuery(next)}${window.location.hash}`;
    window.history.replaceState(window.history.state, "", url);
  }, []);

  const visible = useMemo(() => premiumFirst(filterClinics(clinics, filter)), [clinics, filter]);
  const focus = filter.procedure ? (procById.get(filter.procedure) ?? null) : null;
  const filtered = filter.region != null || filter.procedure != null;

  // 시술을 고르면 그 시술을 하는 병원 수를 지역 칩에 반영한다
  const regionCounts = useMemo(() => {
    const base = filterClinics(clinics, { region: null, procedure: filter.procedure });
    const m = new Map<string, number>();
    for (const c of base) m.set(c.regionKey, (m.get(c.regionKey) ?? 0) + 1);
    return { total: base.length, by: m };
  }, [clinics, filter.procedure]);

  const selected = compare.ids
    .map((id) => clinics.find((c) => c.id === id))
    .filter((c): c is ClinicCardData => c != null);

  const onToggle = useCallback((id: string) => dispatch({ type: "toggle", id }), []);

  // 한도 안내는 몇 초 뒤 사라진다
  useEffect(() => {
    if (!compare.blocked) return;
    const t = window.setTimeout(() => dispatch({ type: "dismiss" }), 4000);
    return () => window.clearTimeout(t);
  }, [compare.blocked]);

  // 비교 표에서 병원을 2곳 미만으로 줄이면(트레이에서 빼기) 표를 닫는다
  useEffect(() => {
    if (panelOpen && selected.length < 2) setPanelOpen(false);
  }, [panelOpen, selected.length]);

  const openPanel = () => {
    openerRef.current = document.activeElement as HTMLElement | null;
    setPanelOpen(true);
  };
  const closePanel = () => {
    setPanelOpen(false);
    // 닫은 뒤 포커스를 연 버튼으로 돌려준다
    window.requestAnimationFrame(() => openerRef.current?.focus());
  };

  const chipClass = (on: boolean) =>
    cx(
      "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors",
      on ? "bg-ink text-surface" : "bg-surface text-ink-muted ring-1 ring-line ring-inset hover:bg-canvas-soft hover:text-ink",
    );

  return (
    <div data-testid="clinic-explorer" className={cx(selected.length > 0 && "pb-40 md:pb-32")}>
      {/* 필터 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8">
        <div className="min-w-0">
          <div role="group" aria-label="지역" data-testid="region-filter" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0">
            <button
              type="button"
              aria-pressed={filter.region == null}
              onClick={() => update({ ...filter, region: null })}
              className={chipClass(filter.region == null)}
            >
              전체 <span className="tabular-nums opacity-70">{regionCounts.total}</span>
            </button>
            {regions.map((r) => {
              const on = filter.region === r.key;
              const n = regionCounts.by.get(r.key) ?? 0;
              return (
                <button
                  key={r.key}
                  type="button"
                  aria-pressed={on}
                  data-region={r.key}
                  onClick={() => update({ ...filter, region: on ? null : r.key })}
                  className={chipClass(on)}
                >
                  {r.key} <span className="tabular-nums opacity-70">{n}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative shrink-0 md:w-64">
          <label htmlFor={selectId} className="sr-only">
            시술
          </label>
          <select
            id={selectId}
            data-testid="procedure-filter"
            value={filter.procedure ?? ""}
            onChange={(e) => update({ ...filter, procedure: e.target.value || null })}
            className={cx(
              "h-11 w-full cursor-pointer appearance-none rounded-full bg-surface pr-11 pl-4 text-sm font-semibold ring-1 ring-inset focus:outline-none focus-visible:ring-2 focus-visible:ring-brand",
              filter.procedure ? "text-ink ring-ink" : "text-ink-muted ring-line",
            )}
          >
            <option value="">모든 시술</option>
            {procedures.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.category})
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-3 right-4 size-5 text-ink-subtle" />
        </div>
      </div>

      {/* 결과 수 */}
      <div className="mt-6 flex min-h-11 items-center justify-between gap-4">
        <p role="status" aria-live="polite" data-testid="clinic-count" className="text-ink-muted">
          {focus ? (
            <>
              <strong className="font-bold text-ink">{focus.name}</strong> 가격을 공개한 병원{" "}
            </>
          ) : (
            "병원 "
          )}
          <strong className="font-bold text-ink tabular-nums">{visible.length}</strong>곳
        </p>
        {filtered && (
          <button
            type="button"
            onClick={() => update(EMPTY_FILTER)}
            className="inline-flex h-11 shrink-0 items-center gap-1.5 text-sm font-semibold whitespace-nowrap text-ink-muted hover:text-ink"
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            필터 초기화
          </button>
        )}
      </div>

      {/* 목록 */}
      {visible.length > 0 ? (
        <ul data-testid="clinic-list" className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((c) => (
            <li key={c.id}>
              <ClinicCard
                clinic={c}
                procedures={procById}
                focusProcedure={focus}
                selected={compare.ids.includes(c.id)}
                blocked={compare.blocked === c.id}
                onToggle={onToggle}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div data-testid="clinic-empty" className="mt-4 flex flex-col items-center rounded-lg bg-surface px-6 py-14 text-center">
          <Emoji3D name="search" size={64} />
          <p className="mt-5 text-h3 font-bold tracking-tight text-ink">조건에 맞는 병원이 없습니다</p>
          <p className="mt-2 max-w-text text-ink-muted">
            {focus && filter.region
              ? `${filter.region}에서 ${focus.name} 가격을 공개한 병원이 아직 없습니다. 지역을 넓혀 보세요.`
              : "지역이나 시술 조건을 바꿔 보세요."}
          </p>
          <button type="button" data-testid="clinic-empty-reset" onClick={() => update(EMPTY_FILTER)} className={cx(btn.primary, btn.md, "mt-6")}>
            <RotateCcw aria-hidden="true" className="size-4" />
            필터 초기화
          </button>
        </div>
      )}

      <CompareTray
        selected={selected.map((c) => ({ id: c.id, name: c.name }))}
        onRemove={(id) => dispatch({ type: "remove", id })}
        onClear={() => dispatch({ type: "clear" })}
        onOpen={openPanel}
      />
      <ComparePanel open={panelOpen} clinics={selected} procedures={procedures} onClose={closePanel} />
    </div>
  );
}
