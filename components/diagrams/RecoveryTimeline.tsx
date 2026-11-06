import { useId } from "react";
import { wrapText } from "@/lib/svg-text";

/*
 * 회복 타임라인 다이어그램 (QUALITY 3-1 P-03 "회복 타임라인 SVG")
 * - steps 를 받아 그린다(시술마다 P-03 이 출처 있는 값만 넘긴다).
 * - SVG 는 줄바꿈이 없어 화면 폭에 따라 두 벌을 그린다: 모바일 세로형(md 미만) / 데스크톱 가로형(md 이상).
 *   숨은 쪽은 display:none 이라 보조기기에는 한 벌만 읽힌다.
 * - 색은 토큰 클래스만, 글자는 실제 <text>. role="img" + <title>/<desc>(단계 전체 문장).
 */

export type RecoveryStep = {
  /** 시점: "당일", "5~7일", "2~3주" … */
  when: string;
  /** 한 줄 요약: "실밥 제거" */
  label: string;
  /** 보충 설명(선택) */
  detail?: string;
};

export type RecoveryTimelineProps = {
  title: string;
  description: string;
  steps: readonly RecoveryStep[];
  caption?: string;
  className?: string;
};

const V_W = 320;
const H_W = 640;

type Line = { text: string; y: number; size: number; weight: number; tone: "brand" | "ink" | "muted" };
type Row = { x: number; dotY: number; lines: Line[] };

const TONE = { brand: "fill-brand", ink: "fill-ink", muted: "fill-ink-muted" } as const;

/** 세로형 배치(모바일) */
export function verticalLayout(steps: readonly RecoveryStep[]) {
  const textX = 44;
  const maxW = V_W - textX - 4;
  let y = 8;
  const rows: Row[] = steps.map((s) => {
    const lines: Line[] = [];
    let ly = y + 14;
    lines.push({ text: s.when, y: ly, size: 13, weight: 700, tone: "brand" });
    for (const t of wrapText(s.label, maxW, 15, 2)) {
      ly += 22;
      lines.push({ text: t, y: ly, size: 15, weight: 700, tone: "ink" });
    }
    if (s.detail) {
      ly += 4;
      for (const t of wrapText(s.detail, maxW, 13, 4)) {
        ly += 20;
        lines.push({ text: t, y: ly, size: 13, weight: 400, tone: "muted" });
      }
    }
    const row = { x: textX, dotY: y + 10, lines };
    y = ly + 22;
    return row;
  });
  return { rows, height: y - 8 };
}

/** 가로형 배치(데스크톱) */
export function horizontalLayout(steps: readonly RecoveryStep[]) {
  const n = Math.max(1, steps.length);
  const colW = H_W / n;
  let height = 0;
  const rows: Row[] = steps.map((s, i) => {
    const cx = colW * (i + 0.5);
    const maxW = colW - 16;
    const lines: Line[] = [{ text: s.when, y: 62, size: 14, weight: 700, tone: "brand" }];
    let ly = 62;
    for (const t of wrapText(s.label, maxW, 15, 2)) {
      ly += 24;
      lines.push({ text: t, y: ly, size: 15, weight: 700, tone: "ink" });
    }
    if (s.detail) {
      ly += 4;
      for (const t of wrapText(s.detail, maxW, 13, 4)) {
        ly += 20;
        lines.push({ text: t, y: ly, size: 13, weight: 400, tone: "muted" });
      }
    }
    height = Math.max(height, ly + 12);
    return { x: cx, dotY: 26, lines };
  });
  return { rows, height, colW };
}

function Dot({ x, y, last }: { x: number; y: number; last: boolean }) {
  return last ? (
    <circle cx={x} cy={y} r={8} className="fill-surface stroke-brand" strokeWidth={3} />
  ) : (
    <circle cx={x} cy={y} r={8} className="fill-brand" />
  );
}

function Lines({ lines, x, anchor }: { lines: Line[]; x: number; anchor: "start" | "middle" }) {
  return (
    <>
      {lines.map((l, i) => (
        <text key={i} x={x} y={l.y} fontSize={l.size} fontWeight={l.weight} textAnchor={anchor} className={TONE[l.tone]}>
          {l.text}
        </text>
      ))}
    </>
  );
}

export function RecoveryTimeline({ title, description, steps, caption, className }: RecoveryTimelineProps) {
  const id = useId();
  const v = verticalLayout(steps);
  const h = horizontalLayout(steps);
  const descText = `${description} ${steps.map((s) => `${s.when}: ${s.label}${s.detail ? ` — ${s.detail}` : ""}`).join(" / ")}`;
  const last = steps.length - 1;
  return (
    <figure className={className} data-diagram="recovery-timeline">
      <svg
        viewBox={`0 0 ${V_W} ${v.height}`}
        role="img"
        aria-labelledby={`${id}-vt ${id}-vd`}
        className="block h-auto w-full md:hidden"
        data-orientation="vertical"
      >
        <title id={`${id}-vt`}>{title}</title>
        <desc id={`${id}-vd`}>{descText}</desc>
        {v.rows.length > 1 ? (
          <path d={`M20 ${v.rows[0]!.dotY}V${v.rows[last]!.dotY}`} className="stroke-line" strokeWidth={4} strokeLinecap="round" />
        ) : null}
        {v.rows.map((r, i) => (
          <g key={i}>
            <Dot x={20} y={r.dotY} last={i === last && last > 0} />
            <Lines lines={r.lines} x={r.x} anchor="start" />
          </g>
        ))}
      </svg>
      <svg
        viewBox={`0 0 ${H_W} ${h.height}`}
        role="img"
        aria-labelledby={`${id}-ht ${id}-hd`}
        className="hidden h-auto w-full md:block"
        data-orientation="horizontal"
      >
        <title id={`${id}-ht`}>{title}</title>
        <desc id={`${id}-hd`}>{descText}</desc>
        {h.rows.length > 1 ? (
          <path d={`M${h.rows[0]!.x} 26H${h.rows[last]!.x}`} className="stroke-line" strokeWidth={4} strokeLinecap="round" />
        ) : null}
        {h.rows.map((r, i) => (
          <g key={i}>
            <Dot x={r.x} y={r.dotY} last={i === last && last > 0} />
            <Lines lines={r.lines} x={r.x} anchor="middle" />
          </g>
        ))}
      </svg>
      {caption ? <figcaption className="mt-2 text-sm text-ink-muted">{caption}</figcaption> : null}
    </figure>
  );
}
