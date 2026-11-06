import { useId } from "react";
import { formatManwon, formatRange, maxOf, niceTicks } from "@/lib/price-scale";
import { estimateTextWidth, truncateText } from "@/lib/svg-text";

/*
 * 가격 범위 가로 막대 차트 (QUALITY 3-1 P-03 "가격 비교는 막대 바 차트(표만 금지)", P-05 "시술 가격표에 범위 바")
 * - 항목마다 최저~최고가를 막대로, 값이 하나뿐이면 점으로, 둘 다 없으면 "가격 미정"(점선 자리)으로 그린다.
 * - 모바일(md 미만)은 이름 위·막대 아래 2줄형, 데스크톱은 이름|막대|값 1줄형. 숨은 쪽은 display:none.
 * - 접근성: role="img" + <title>/<desc> 요약, 그리고 같은 값의 표(sr-only)를 함께 둔다.
 * - 색은 토큰 클래스만. tone="reference"(예: 전체 공개 가격 범위)는 코랄로 구분한다.
 */

export type PriceRangeItem = {
  label: string;
  /** 원 단위. null 이면 미정 */
  min: number | null;
  max: number | null;
  tone?: "default" | "reference";
};

export type PriceRangeChartProps = {
  title: string;
  description?: string;
  items: readonly PriceRangeItem[];
  caption?: string;
  className?: string;
};

const V_W = 320;
const V_ROW = 56;
const H_W = 640;
const H_ROW = 44;
const H_LABEL_W = 168;
const H_PLOT_X = 180;
const H_PLOT_W = 340;
const AXIS_H = 28;

type Geometry = { x0: number; w: number; max: number };
const xOf = (g: Geometry, v: number) => g.x0 + (g.max > 0 ? (v / g.max) * g.w : 0);

function Bar({ item, g, y, h }: { item: PriceRangeItem; g: Geometry; y: number; h: number }) {
  const fill = item.tone === "reference" ? "fill-accent" : "fill-brand";
  const { min, max } = item;
  if (min == null && max == null) {
    return <rect x={g.x0} y={y} width={g.w} height={h} rx={h / 2} className="fill-surface stroke-line" strokeWidth={1.5} strokeDasharray="4 4" />;
  }
  const track = <rect x={g.x0} y={y} width={g.w} height={h} rx={h / 2} className="fill-line" />;
  if (min != null && max != null && max > min) {
    const x1 = xOf(g, min);
    const x2 = xOf(g, max);
    return (
      <>
        {track}
        <rect x={x1} y={y} width={Math.max(h, x2 - x1)} height={h} rx={h / 2} className={fill} />
      </>
    );
  }
  const v = (min ?? max) as number;
  return (
    <>
      {track}
      <circle cx={xOf(g, v)} cy={y + h / 2} r={h * 0.75} className={fill} />
    </>
  );
}

function Axis({ g, ticks, y, gridTop }: { g: Geometry; ticks: number[]; y: number; gridTop: number }) {
  return (
    <g>
      {ticks.map((t) => {
        const x = xOf(g, t);
        return (
          <g key={t}>
            <path d={`M${x} ${gridTop}V${y - 6}`} className="stroke-line" strokeWidth={1} strokeDasharray="2 4" />
            <text x={x} y={y + 8} fontSize={11} textAnchor={t === 0 ? "start" : "middle"} className="fill-ink-muted">
              {t === 0 ? "0" : formatManwon(t)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function valueTone(item: PriceRangeItem) {
  if (item.min == null && item.max == null) return "fill-ink-muted";
  return item.tone === "reference" ? "fill-accent-strong" : "fill-brand";
}

export function chartScale(items: readonly PriceRangeItem[]) {
  const ticks = niceTicks(maxOf(items));
  return { ticks, max: ticks[ticks.length - 1] ?? 0 };
}

export function PriceRangeChart({ title, description, items, caption, className }: PriceRangeChartProps) {
  const id = useId();
  const { ticks, max } = chartScale(items);
  const summary =
    description ??
    `${items.length}개 항목의 가격 범위입니다. ${items.map((it) => `${it.label} ${formatRange(it)}`).join(", ")}.`;

  const vG: Geometry = { x0: 0, w: V_W, max };
  const vH = items.length * V_ROW + AXIS_H;
  const hG: Geometry = { x0: H_PLOT_X, w: H_PLOT_W, max };
  const hH = items.length * H_ROW + AXIS_H;

  return (
    <figure className={className} data-chart="price-range">
      <svg viewBox={`0 0 ${V_W} ${vH}`} role="img" aria-labelledby={`${id}-vt ${id}-vd`} className="block h-auto w-full md:hidden">
        <title id={`${id}-vt`}>{title}</title>
        <desc id={`${id}-vd`}>{summary}</desc>
        <Axis g={vG} ticks={ticks} y={vH - 12} gridTop={0} />
        {items.map((it, i) => {
          const y = i * V_ROW;
          const value = formatRange(it);
          const valueW = estimateTextWidth(value, 13);
          return (
            <g key={`${it.label}-${i}`}>
              <text x={0} y={y + 16} fontSize={14} fontWeight={600} className="fill-ink">
                {truncateText(it.label, V_W - valueW - 12, 14)}
              </text>
              <text x={V_W} y={y + 16} fontSize={13} fontWeight={700} textAnchor="end" className={valueTone(it)}>
                {value}
              </text>
              <Bar item={it} g={vG} y={y + 26} h={10} />
            </g>
          );
        })}
      </svg>
      <svg viewBox={`0 0 ${H_W} ${hH}`} role="img" aria-labelledby={`${id}-ht ${id}-hd`} className="hidden h-auto w-full md:block">
        <title id={`${id}-ht`}>{title}</title>
        <desc id={`${id}-hd`}>{summary}</desc>
        <Axis g={hG} ticks={ticks} y={hH - 12} gridTop={0} />
        {items.map((it, i) => {
          const y = i * H_ROW;
          return (
            <g key={`${it.label}-${i}`}>
              <text x={0} y={y + 26} fontSize={14} fontWeight={600} className="fill-ink">
                {truncateText(it.label, H_LABEL_W - 4, 14)}
              </text>
              <Bar item={it} g={hG} y={y + 15} h={12} />
              <text x={H_W} y={y + 26} fontSize={14} fontWeight={700} textAnchor="end" className={valueTone(it)}>
                {formatRange(it)}
              </text>
            </g>
          );
        })}
      </svg>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">항목</th>
            <th scope="col">가격 하한</th>
            <th scope="col">가격 상한</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={`${it.label}-${i}`}>
              <th scope="row">{it.label}</th>
              <td>{it.min == null ? "미정" : `${formatManwon(it.min)} 원`}</td>
              <td>{it.max == null ? "미정" : `${formatManwon(it.max)} 원`}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {caption ? <figcaption className="mt-2 text-sm text-ink-muted">{caption}</figcaption> : null}
    </figure>
  );
}
