"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Emoji3D, categoryEmoji } from "@/components/ui/Emoji3D";
import { PriceBar } from "@/components/ui/PriceBar";
import { compareRows, lowestStart } from "@/lib/clinic/compare";
import type { ClinicCardData, ProcedureOption } from "@/lib/clinic/types";
import { formatMonthDay } from "@/lib/clinic/view";
import { formatPriceRange } from "@/lib/format";
import { chip, cx } from "@/lib/ui";

type Props = {
  open: boolean;
  clinics: ClinicCardData[];
  procedures: ProcedureOption[];
  onClose: () => void;
};

/**
 * 비교 표 — 네이티브 <dialog>(showModal: 포커스 가두기·Esc 닫기·배경 비활성은 브라우저가 처리).
 * 행 = 시술, 열 = 병원. 칸마다 가격 + 그 시술 전체 공개가 눈금 위 PriceBar, 공개하지 않은 시술은 "—".
 * 모바일은 아래에서 올라오는 시트, 데스크톱은 가운데 패널.
 */
export function ComparePanel({ open, clinics, procedures, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  // 열려 있는 동안 뒤 문서 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [open]);

  const rows = compareRows(procedures, clinics);
  const cols = clinics.length;

  return (
    <dialog
      ref={ref}
      aria-labelledby="compare-title"
      data-testid="compare-panel"
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // 바깥(::backdrop) 클릭 닫기 — dialog 자신이 클릭 대상일 때만
        if (e.target === e.currentTarget) onClose();
      }}
      // dialog 자체는 투명한 전체 화면(바깥 여백 = 닫기 영역), 안쪽 div 가 시트·패널
      className="m-0 size-full max-h-none max-w-none bg-transparent p-0 pt-12 backdrop:bg-ink/50 open:flex open:items-end md:p-8 md:open:items-center md:open:justify-center"
    >
      {open && (
        <div className="flex max-h-full w-full flex-col overflow-hidden rounded-t-xl bg-surface text-ink shadow-lg md:max-w-content md:rounded-xl">
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 pt-5 pb-4 md:px-8 md:pt-7 md:pb-5">
            <div>
              <h2 id="compare-title" className="text-h2 font-bold tracking-tight text-ink">
                병원 {cols}곳 비교
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                막대는 시술마다 전체 공개 가격 범위 안의 위치입니다. 공개하지 않은 시술은 —로 표시합니다.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              data-testid="compare-close"
              className="-mt-1 -mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-canvas hover:text-ink"
            >
              <X aria-hidden="true" className="size-6" />
              <span className="sr-only">비교 닫기</span>
            </button>
          </header>

          {/* 데스크톱: 시술×병원 표 / 모바일(md 미만): 같은 표를 시술별 블록으로 쌓는다(가로 스크롤 없이 병원 3곳이 다 보이게) */}
          <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
            <table data-testid="compare-table" className="w-full border-separate border-spacing-0 text-left max-md:block md:table-fixed">
              <caption className="sr-only">시술별 병원 공개 가격 비교</caption>
              <thead className="max-md:sr-only">
                <tr>
                  <th
                    scope="col"
                    className="sticky top-0 left-0 z-(--z-raised) w-56 border-b border-line bg-surface px-8 py-4 align-bottom text-sm font-semibold text-ink-subtle"
                  >
                    시술
                  </th>
                  {clinics.map((c) => (
                    <th key={c.id} scope="col" className="sticky top-0 border-b border-line bg-surface px-5 py-4 align-bottom">
                      <span className="flex items-center gap-2.5">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-canvas">
                          <Emoji3D name="hospital" size={24} />
                        </span>
                        <span className="min-w-0">
                          {c.href ? (
                            <Link href={c.href} className="block text-base font-bold text-ink hover:text-brand-strong hover:underline">
                              {c.name}
                            </Link>
                          ) : (
                            <span className="block text-base font-bold text-ink">{c.name}</span>
                          )}
                          <span className="block text-xs font-medium text-ink-subtle">{c.region}</span>
                        </span>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="max-md:block">
                {rows.map((p) => {
                  const cells = clinics.map((c) => ({ clinic: c, offer: c.offers.find((o) => o.procedure_id === p.id) }));
                  const best = lowestStart(cells.map(({ clinic, offer }) => ({ id: clinic.id, price_low: offer?.price_low ?? null })));
                  const scaleMin = p.price_low ?? 0;
                  const scaleMax = p.price_high ?? scaleMin;
                  return (
                    <tr key={p.id} data-procedure={p.id} className="max-md:block max-md:border-b max-md:border-line max-md:px-5 max-md:py-5">
                      <th scope="row" className="border-line bg-surface align-top max-md:block md:sticky md:left-0 md:z-(--z-raised) md:border-b md:px-8 md:py-4">
                        <span className="flex items-center gap-2.5 md:items-start">
                          <Emoji3D name={categoryEmoji(p.category_id)} size={24} className="md:mt-0.5" />
                          <span className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3 md:block">
                            <span className="block font-bold text-ink">{p.name}</span>
                            <span className="block text-xs font-medium text-ink-subtle tabular-nums">
                              전체 {formatPriceRange(p.price_low, p.price_high)}
                            </span>
                          </span>
                        </span>
                      </th>
                      {cells.map(({ clinic, offer }) => (
                        <td key={clinic.id} className="align-top max-md:mt-3 max-md:block md:border-b md:border-line md:px-5 md:py-4">
                          <span className="mb-1 block text-sm font-semibold text-ink-muted md:hidden">{clinic.name}</span>
                          {offer ? (
                            <>
                              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-bold text-ink tabular-nums">
                                <span className="whitespace-nowrap">{formatPriceRange(offer.price_low, offer.price_high)}</span>
                                {best === clinic.id && (
                                  <span className={cx(chip.base, chip.brand, "h-6 px-2 text-xs whitespace-nowrap")}>시작가 최저</span>
                                )}
                              </p>
                              <PriceBar
                                className="mt-2"
                                scaleMin={scaleMin}
                                scaleMax={scaleMax}
                                low={offer.price_low}
                                high={offer.price_high}
                                emphasis={best === clinic.id}
                                label={`${clinic.name} ${p.name} ${formatPriceRange(offer.price_low, offer.price_high)}`}
                              />
                            </>
                          ) : (
                            <p className="text-ink-faint">
                              <span aria-hidden="true">—</span>
                              <span className="sr-only">공개하지 않음</span>
                            </p>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                <tr className="max-md:block max-md:border-b max-md:border-line max-md:px-5 max-md:py-5">
                  <th scope="row" className="bg-surface align-top font-bold text-ink max-md:block md:sticky md:left-0 md:z-(--z-raised) md:border-b md:border-line md:px-8 md:py-4">
                    진료 시간
                  </th>
                  {clinics.map((c) => (
                    <td key={c.id} className="align-top text-sm text-ink-muted tabular-nums max-md:mt-3 max-md:block md:border-b md:border-line md:px-5 md:py-4">
                      <span className="mb-0.5 block font-semibold text-ink md:hidden">{c.name}</span>
                      {c.week.weekday.map((w) => (
                        <span key={w} className="block whitespace-nowrap">
                          {w}
                        </span>
                      ))}
                      <span className="block whitespace-nowrap">토 {c.week.saturday}</span>
                      <span className="block whitespace-nowrap text-ink-subtle">일 {c.week.sunday}</span>
                    </td>
                  ))}
                </tr>
                <tr className="max-md:block max-md:px-5 max-md:py-5">
                  <th scope="row" className="bg-surface align-top font-bold text-ink max-md:block md:sticky md:left-0 md:z-(--z-raised) md:px-8 md:py-4">
                    가격 갱신
                  </th>
                  {clinics.map((c) => (
                    <td key={c.id} className="align-top text-sm text-ink-muted tabular-nums max-md:mt-1 max-md:flex max-md:justify-between md:px-5 md:py-4">
                      <span className="font-semibold md:hidden">{c.name}</span>
                      {c.updated ? formatMonthDay(c.updated) : "—"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <footer className="shrink-0 border-t border-line bg-canvas-soft px-5 py-3 pb-safe-4 text-xs text-ink-muted md:px-8 md:py-4">
            병원이 공개한 가격이며 상담 후 달라질 수 있습니다. 순서는 담은 순서이며 광고와 무관합니다.
          </footer>
        </div>
      )}
    </dialog>
  );
}
