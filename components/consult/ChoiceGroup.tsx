"use client";

import { Check } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { cx } from "@/lib/ui";
import { FieldError, describedBy } from "./FieldError";

export type Choice = { value: string; label: string; hint?: string; icon?: ReactNode };

type Props = {
  /** radio name — 같은 화면에서 유일 */
  name: string;
  legend: string;
  /** 질문 아래 보조 설명 */
  description?: string;
  options: readonly Choice[];
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  /** chip = 짧은 선택지(지역·시간), card = 설명이 붙는 선택지(시기) */
  variant?: "chip" | "card";
  /** chip 배치 그리드 클래스(예: "grid grid-cols-2 sm:grid-cols-3"). 없으면 줄바꿈 흐름 */
  gridClass?: string;
  /** 선택지 위에 끼우는 요소(검색창 등) */
  before?: ReactNode;
  /** 선택지가 하나도 없을 때 */
  empty?: ReactNode;
  groupRef?: RefObject<HTMLFieldSetElement | null>;
  testId?: string;
  /** 비활성 표시(legend 크기) — 질문형 lg, 필드형 base */
  size?: "lg" | "base";
};

/**
 * 한 질문 = 한 묶음(fieldset + legend) 의 단일 선택. 실제 입력은 네이티브 radio(화면 밖) → 방향키·스크린 리더가 그대로 동작한다.
 * 보이는 칩·카드는 44px 이상 터치 영역. 오류는 radiogroup 의 aria-invalid·aria-describedby 로 연결한다.
 */
export function ChoiceGroup({
  name,
  legend,
  description,
  options,
  value,
  onChange,
  error,
  variant = "chip",
  gridClass,
  before,
  empty,
  groupRef,
  testId,
  size = "lg",
}: Props) {
  const errorId = `${name}-error`;
  const descId = description ? `${name}-desc` : null;
  return (
    <fieldset
      ref={groupRef}
      role="radiogroup"
      aria-required="true"
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(descId, error && errorId)}
      data-testid={testId}
      className="min-w-0"
    >
      <legend className={cx("font-bold tracking-tight text-ink", size === "lg" ? "text-lg" : "text-base")}>{legend}</legend>
      {description && (
        <p id={descId ?? undefined} className="mt-1 text-sm text-ink-subtle">
          {description}
        </p>
      )}
      {before}
      {options.length === 0 && empty}
      <div
        className={cx(
          size === "lg" ? "mt-4" : "mt-3",
          variant === "card" ? "grid gap-2" : cx(gridClass ?? "flex flex-wrap", "gap-2"),
        )}
      >
        {options.map((o) => {
          const checked = value === o.value;
          const id = `${name}-${o.value}`;
          return (
            <label key={o.value} htmlFor={id} className="relative block cursor-pointer">
              <input
                id={id}
                type="radio"
                name={name}
                value={o.value}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="peer sr-only"
              />
              {variant === "card" ? (
                <span
                  className={cx(
                    "flex min-h-16 items-center gap-4 rounded-md border px-4 py-3 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand",
                    checked ? "border-brand bg-brand-weak" : "border-line-strong bg-surface hover:bg-canvas-soft",
                    error && !checked && "border-danger",
                  )}
                >
                  {o.icon}
                  <span className="min-w-0 flex-1">
                    <span className={cx("block font-bold", checked ? "text-brand-ink" : "text-ink")}>{o.label}</span>
                    {o.hint && <span className="block text-sm text-ink-muted">{o.hint}</span>}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cx(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      checked ? "border-brand-strong bg-brand-strong text-surface" : "border-line-strong bg-surface text-surface",
                    )}
                  >
                    <Check className="size-4" strokeWidth={3} />
                  </span>
                </span>
              ) : (
                <span
                  className={cx(
                    "flex h-12 items-center justify-center gap-1.5 rounded-sm px-4 text-center font-semibold transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand",
                    checked
                      ? "bg-brand-weak text-brand-ink ring-2 ring-brand ring-inset"
                      : "bg-canvas text-ink hover:bg-line",
                    error && !checked && "ring-1 ring-danger ring-inset",
                  )}
                >
                  {o.icon}
                  {o.label}
                </span>
              )}
            </label>
          );
        })}
      </div>
      <FieldError id={errorId} message={error} />
    </fieldset>
  );
}
