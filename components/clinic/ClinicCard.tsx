"use client";

import { BadgeCheck, Check, MapPin } from "lucide-react";
import { TrackedLink } from "@/components/common/TrackedLink";
import { Emoji3D } from "@/components/ui/Emoji3D";
import { PriceBar } from "@/components/ui/PriceBar";
import { formatMonthDay, lowestOffer } from "@/lib/clinic/view";
import type { ClinicCardData, ProcedureOption } from "@/lib/clinic/types";
import { MAX_COMPARE } from "@/lib/clinic/compare";
import { formatManwon, formatPriceRange } from "@/lib/format";
import { chip, cx } from "@/lib/ui";

type Props = {
  clinic: ClinicCardData;
  procedures: Map<string, ProcedureOption>;
  /** 시술 필터가 걸려 있으면 그 시술 가격과 막대를 보여 준다 */
  focusProcedure: ProcedureOption | null;
  selected: boolean;
  blocked: boolean;
  onToggle: (id: string) => void;
};

const MAX_CHIPS = 3;

/**
 * P-04 병원 카드 — 메인 병원 카드와 같은 모양(병원 타일·이름·지역·시술 칩·시작가) + 비교 담기.
 * 카드 전체를 누르면 상세로 간다(제목 링크를 카드 크기로 늘림). 비교 체크박스는 그 위에 따로 눌린다.
 */
export function ClinicCard({ clinic, procedures, focusProcedure, selected, blocked, onToggle }: Props) {
  const focusOffer = focusProcedure ? clinic.offers.find((o) => o.procedure_id === focusProcedure.id) : undefined;
  const low = lowestOffer(clinic.offers);
  const lowName = low ? procedures.get(low.procedure_id)?.name : null;
  const names = clinic.offers
    .map((o) => ({ id: o.procedure_id, name: procedures.get(o.procedure_id)?.name }))
    .filter((p): p is { id: string; name: string } => Boolean(p.name));
  // 필터한 시술을 칩 맨 앞에
  const ordered = focusProcedure ? [...names.filter((n) => n.id === focusProcedure.id), ...names.filter((n) => n.id !== focusProcedure.id)] : names;
  const checkboxId = `compare-${clinic.id}`;
  const msgId = `compare-msg-${clinic.id}`;

  return (
    <article
      data-testid="clinic-card"
      data-clinic={clinic.id}
      data-selected={selected || undefined}
      className={cx(
        "relative flex h-full flex-col rounded-lg bg-surface p-6 ring-2 transition-shadow",
        selected ? "ring-brand" : "ring-transparent hover:shadow-lg",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex size-12 items-center justify-center rounded-md bg-canvas">
          <Emoji3D name="hospital" size={32} />
        </span>
        <div className="flex flex-wrap justify-end gap-1.5">
          {clinic.is_premium && (
            <span className={cx(chip.base, chip.brand, "h-7 text-xs")}>
              <BadgeCheck aria-hidden="true" className="size-4" />
              프리미엄
            </span>
          )}
          {clinic.is_demo && <span className={cx(chip.base, chip.outline, "h-7 text-xs")}>예시 데이터</span>}
        </div>
      </div>

      <h3 className="mt-4 text-h3 font-bold tracking-tight text-ink">
        {clinic.href ? (
          <TrackedLink
            href={clinic.href}
            event="select_clinic"
            params={{ clinic_id: clinic.id, from: "clinics" }}
            data-testid="clinic-card-link"
            className="-my-2 inline-flex min-h-11 items-center after:absolute after:inset-0 after:rounded-lg hover:text-brand-strong focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-brand"
          >
            {clinic.name}
          </TrackedLink>
        ) : (
          clinic.name
        )}
      </h3>
      <p className="mt-1 flex items-center gap-1 text-sm text-ink-muted">
        <MapPin aria-hidden="true" className="size-4" />
        {clinic.region}
      </p>

      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="공개 시술">
        {ordered.slice(0, MAX_CHIPS).map((p) => (
          <li
            key={p.id}
            className={cx(chip.base, "h-7 text-xs", p.id === focusProcedure?.id ? chip.brand : chip.neutral)}
          >
            {p.name}
          </li>
        ))}
        {ordered.length > MAX_CHIPS && (
          <li className={cx(chip.base, chip.neutral, "h-7 text-xs")}>
            <span className="sr-only">외 </span>+{ordered.length - MAX_CHIPS}
          </li>
        )}
      </ul>

      <div className="mt-auto pt-6">
        {focusProcedure && focusOffer ? (
          <div data-testid="clinic-card-focus">
            <p className="text-sm text-ink-muted">{focusProcedure.name}</p>
            <p className="mt-0.5 text-lg font-bold text-ink tabular-nums">
              {formatPriceRange(focusOffer.price_low, focusOffer.price_high)}
              {(focusOffer.price_note ?? focusProcedure.price_note) && (
                <span className="ml-1 text-sm font-medium text-ink-subtle">{focusOffer.price_note ?? focusProcedure.price_note}</span>
              )}
            </p>
            <PriceBar
              className="mt-3"
              scaleMin={focusProcedure.price_low ?? focusOffer.price_low ?? 0}
              scaleMax={focusProcedure.price_high ?? focusOffer.price_high ?? 0}
              low={focusOffer.price_low}
              high={focusOffer.price_high}
              showScale
              label={`${clinic.name} ${focusProcedure.name} ${formatPriceRange(focusOffer.price_low, focusOffer.price_high)}`}
            />
          </div>
        ) : (
          low &&
          lowName && (
            <p className="text-sm text-ink-muted">
              {lowName} <strong className="text-lg text-ink tabular-nums">{formatManwon(low.price_low as number)} 원</strong>부터
            </p>
          )
        )}

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
          <p className="text-xs text-ink-subtle">{clinic.updated ? `가격 갱신 ${formatMonthDay(clinic.updated)}` : "가격 갱신일 미공개"}</p>
          {/* 비교 담기 — 카드 링크(after:inset-0) 위에 올라오도록 relative + z */}
          <label
            htmlFor={checkboxId}
            className={cx(
              "relative z-(--z-raised) inline-flex h-11 cursor-pointer items-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors",
              "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand",
              selected ? "bg-brand-weak text-brand-ink" : "bg-canvas text-ink hover:bg-line",
            )}
          >
            <input
              id={checkboxId}
              type="checkbox"
              data-testid="compare-toggle"
              checked={selected}
              onChange={() => onToggle(clinic.id)}
              aria-describedby={blocked ? msgId : undefined}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className={cx(
                "flex size-5 items-center justify-center rounded-full border-2 transition-colors",
                selected ? "border-brand-strong bg-brand-strong text-surface" : "border-line-strong bg-surface text-transparent",
              )}
            >
              <Check className="size-3.5" strokeWidth={3} />
            </span>
            <span className="sr-only">{clinic.name} </span>
            {selected ? "비교함에 담음" : "비교 담기"}
          </label>
        </div>
        {blocked && (
          <p id={msgId} role="alert" data-testid="compare-limit" className="mt-3 rounded-sm bg-danger-weak px-3 py-2 text-sm text-danger">
            비교는 최대 {MAX_COMPARE}곳까지 담을 수 있습니다. 담은 병원을 하나 빼고 다시 담아 주세요.
          </p>
        )}
      </div>
    </article>
  );
}
