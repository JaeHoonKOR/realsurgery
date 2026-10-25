"use client";

import { Check, ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState, type RefObject } from "react";
import { CONSENT_DETAILS, type ConsentKey } from "@/lib/consult/policy";
import { cx } from "@/lib/ui";
import { FieldError, describedBy } from "./FieldError";

type Values = Record<ConsentKey, boolean>;

type Props = {
  values: Values;
  onChange: (next: Partial<Values>) => void;
  errors: Partial<Record<ConsentKey, string>>;
  /** 오류 시 포커스 대상(첫 필수 동의) */
  firstRef: RefObject<HTMLInputElement | null>;
  /** 개인정보처리방침 링크(화면이 빌드됐을 때만 넘긴다) */
  privacyHref?: string;
};

function Checkbox({ checked, size = "md" }: { checked: boolean; size?: "md" | "lg" }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "flex shrink-0 items-center justify-center rounded-full border-2 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand",
        size === "lg" ? "size-7" : "size-6",
        checked ? "border-brand-strong bg-brand-strong text-surface" : "border-line-strong bg-surface text-line-strong",
      )}
    >
      <Check className={size === "lg" ? "size-4.5" : "size-4"} strokeWidth={3} />
    </span>
  );
}

/**
 * 동의 3종(screen-spec 4절 P-06, 1절 법적 고려): 개인정보 수집·이용(필수, 민감정보 안내), 제3자 제공(필수), 마케팅 수신(선택).
 * "전체 동의"는 세 항목을 한 번에 켜고 끈다. 항목마다 "내용 보기"로 항목·목적·보유 기간을 펼친다.
 */
export function ConsentFields({ values, onChange, errors, firstRef, privacyHref }: Props) {
  const [openKey, setOpenKey] = useState<ConsentKey | null>(null);
  const all = values.consent_privacy && values.consent_3rd && values.consent_marketing;

  return (
    <fieldset data-testid="consult-consents" className="min-w-0">
      <legend className="sr-only">개인정보 동의</legend>
      <div className="rounded-lg border border-line-strong">
        <label className="flex min-h-16 cursor-pointer items-center gap-3 rounded-t-lg px-4 hover:bg-canvas-soft">
          <input
            type="checkbox"
            checked={all}
            onChange={(e) =>
              onChange({ consent_privacy: e.target.checked, consent_3rd: e.target.checked, consent_marketing: e.target.checked })
            }
            data-testid="consent-all"
            className="peer sr-only"
          />
          <Checkbox checked={all} size="lg" />
          <span className="text-lg font-bold text-ink">약관 전체 동의</span>
          <span className="ml-auto text-sm text-ink-subtle">선택 항목 포함</span>
        </label>

        <ul className="border-t border-line py-1 pr-1">
          {CONSENT_DETAILS.map((c, i) => {
            const checked = values[c.key];
            const error = errors[c.key];
            const errorId = `${c.key}-error`;
            const panelId = `${c.key}-detail`;
            const expanded = openKey === c.key;
            return (
              <li key={c.key}>
                <div className="flex items-center">
                  <label className="flex min-h-12 min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-sm pr-2 pl-4 hover:bg-canvas-soft">
                    <input
                      ref={i === 0 ? firstRef : undefined}
                      type="checkbox"
                      checked={checked}
                      required={c.required}
                      aria-required={c.required}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={describedBy(error && errorId)}
                      onChange={(e) => onChange({ [c.key]: e.target.checked })}
                      data-testid={c.key}
                      className="peer sr-only"
                    />
                    <Checkbox checked={checked} />
                    <span className="min-w-0 py-2 text-sm font-medium text-ink">
                      <span className={cx("mr-1 font-semibold", c.required ? "text-brand-strong" : "text-ink-subtle")}>
                        [{c.required ? "필수" : "선택"}]
                      </span>
                      {c.title}
                    </span>
                  </label>
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    aria-label={`${c.title} 내용 보기`}
                    onClick={() => setOpenKey(expanded ? null : c.key)}
                    className="inline-flex size-12 shrink-0 items-center justify-center rounded-sm text-ink-subtle hover:bg-canvas hover:text-ink"
                  >
                    <ChevronDown aria-hidden="true" className={cx("size-5 transition-transform", expanded && "rotate-180")} />
                  </button>
                </div>
                <div id={panelId} hidden={!expanded} className="mx-3 mb-2 rounded-md bg-canvas-soft p-4 text-sm">
                  <dl className="grid gap-2">
                    {c.rows.map((r) => (
                      <div key={r.label} className="grid gap-0.5 sm:grid-cols-4 sm:gap-3">
                        <dt className="font-semibold text-ink">{r.label}</dt>
                        <dd className="text-ink-muted sm:col-span-3">{r.value}</dd>
                      </div>
                    ))}
                  </dl>
                  {c.notice && <p className="mt-3 rounded-sm bg-brand-weak px-3 py-2 text-brand-ink">{c.notice}</p>}
                  <p className="mt-3 text-ink-muted">{c.refusal}</p>
                </div>
                {error && (
                  <div className="px-3 pb-2">
                    <FieldError id={errorId} message={error} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      {privacyHref && (
        <Link
          href={privacyHref}
          target="_blank"
          rel="noopener"
          className="mt-1 -ml-1 inline-flex h-11 items-center gap-0.5 px-1 text-sm font-semibold text-ink-subtle underline-offset-2 hover:text-ink hover:underline"
        >
          개인정보처리방침 전체 보기
          <span className="sr-only">(새 창)</span>
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      )}
    </fieldset>
  );
}
