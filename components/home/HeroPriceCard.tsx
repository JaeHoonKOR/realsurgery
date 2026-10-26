"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Icon3D, type IconName } from "@/components/ui/Icon3D";
import { PriceBar } from "@/components/ui/PriceBar";
import { formatPriceRange } from "@/lib/format";
import { chip, cx } from "@/lib/ui";

/** 서버에서 미리 계산해 넘기는 시술 1개의 비교 데이터(클라이언트로 필요한 값만) */
export type HeroShowcase = {
  id: string;
  name: string;
  shortName: string;
  category: string;
  icon: IconName;
  priceLow: number | null;
  priceHigh: number | null;
  scaleMin: number;
  scaleMax: number;
  rows: { clinic: string; low: number | null; high: number | null }[];
  /** 비교 병원이 모두 제휴 전 예시 데이터인지 */
  demo: boolean;
  facts: { term: string; value: string }[];
  updated: string;
  sourceCount: number;
  /** 시술 상세 경로(화면이 있을 때만) */
  href: string | null;
};

/**
 * 메인 히어로 오른쪽 — 실제 시술의 "병원별 공개가 비교"를 그대로 보여 주는 카드.
 * 탭으로 시술을 바꾸면 같은 눈금 위 막대가 움직인다 → 서비스가 하는 일을 설명 대신 실물로 보여 준다.
 */
export function HeroPriceCard({ items }: { items: HeroShowcase[] }) {
  const id = useId();
  const [index, setIndex] = useState(0);
  const item = items[index] ?? items[0];
  if (!item) return null;

  return (
    <div data-testid="hero-price-card" className="relative rounded-xl bg-surface p-6 shadow-lg md:p-8">
      {items.length > 1 && (
        <div role="tablist" aria-label="비교할 시술" className="-mx-1 mb-6 flex gap-1 rounded-md bg-canvas p-1">
          {items.map((it, i) => (
            <button
              key={it.id}
              type="button"
              role="tab"
              id={`${id}-tab-${i}`}
              aria-selected={i === index}
              aria-controls={`${id}-panel`}
              onClick={() => setIndex(i)}
              className={cx(
                "h-11 basis-0 grow rounded-sm text-sm font-semibold transition-colors",
                i === index ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink",
              )}
            >
              {it.shortName}
            </button>
          ))}
        </div>
      )}

      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${index}`}>
        <div className="flex items-center gap-4">
          <span className="flex size-16 items-center justify-center rounded-lg bg-canvas">
            <Icon3D key={item.icon} name={item.icon} size={48} priority />
          </span>
          <div>
            <span className={cx(chip.base, chip.brand, "h-7 text-xs")}>{item.category}</span>
            <p className="mt-1 text-h3 font-bold tracking-tight text-ink">{item.name}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-ink-subtle">병원 공개 가격</p>
          {item.demo && <span className={cx(chip.base, chip.outline, "h-7 text-xs")}>예시 병원 데이터</span>}
        </div>
        <p className="mt-1 text-h1 font-bold tracking-tighter text-ink tabular-nums" aria-live="polite">
          {formatPriceRange(item.priceLow, item.priceHigh)}
        </p>

        {item.rows.length > 0 && (
          <ul className="mt-6 space-y-4" aria-label="병원별 공개 가격">
            {item.rows.map((r, i) => (
              <li key={`${item.id}-${r.clinic}`}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate font-semibold text-ink">{r.clinic}</span>
                  <span className="shrink-0 text-ink-muted tabular-nums">{formatPriceRange(r.low, r.high)}</span>
                </div>
                <PriceBar
                  className="mt-2"
                  scaleMin={item.scaleMin}
                  scaleMax={item.scaleMax}
                  low={r.low}
                  high={r.high}
                  showScale={i === item.rows.length - 1}
                  animate
                  label={`${r.clinic} ${formatPriceRange(r.low, r.high)}`}
                />
              </li>
            ))}
          </ul>
        )}

        <dl className="mt-7 grid grid-cols-3 gap-2 text-center">
          {item.facts.map((f) => (
            <div key={f.term} className="rounded-md bg-canvas px-2 py-3">
              <dt className="text-xs text-ink-muted">{f.term}</dt>
              <dd className="mt-0.5 text-sm font-bold text-ink">{f.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-xs text-ink-subtle">
            {item.updated} 기준, 출처 {item.sourceCount}곳
          </p>
          {item.href && (
            <Link
              href={item.href}
              className="-mr-2 inline-flex h-11 items-center gap-0.5 px-2 text-sm font-semibold text-brand-strong hover:underline"
            >
              가이드 보기
              <ChevronRight aria-hidden="true" className="size-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
