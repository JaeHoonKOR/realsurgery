import { useId } from "react";
import { wrapText } from "@/lib/svg-text";

/*
 * 시술 위치 다이어그램 (QUALITY 3-1 P-03 "절개/시술 위치 SVG", docs/IMAGES.md "에이전트가 SVG 직접 작성")
 * - 부위 기본 선화(region) 위에 번호 표식(marker)을 얹고, 아래 범례에 번호별 설명을 실제 <text> 로 쓴다.
 * - 얼굴 전체·이목구비 조합·신체 노출 없이 해당 부위 윤곽만 단순화한다.
 * - 색은 토큰 클래스(fill-*, stroke-*)만. 좌표계 320 폭(그림 320×180 + 범례).
 * - 접근성: role="img" + <title>/<desc>(범례 내용 포함). 캡션은 <figcaption>.
 */

export type DiagramRegion = "eye" | "nose" | "contour" | "lifting" | "skin" | "breast";

export type LocationMarker = {
  /** incision: 절개선(path 필수) · point: 고정·주입 지점 · area: 시술 범위 */
  kind: "incision" | "point" | "area";
  /** 번호 표식 위치(그림 좌표 0..320 × 0..180) */
  x: number;
  y: number;
  label: string;
  /** incision 선 경로(그림 좌표) */
  path?: string;
  /** area 반지름 (기본 18) */
  r?: number;
  /** point 를 여러 곳에 찍을 때 추가 좌표(번호 표식은 x,y 에 1개) */
  points?: readonly (readonly [number, number])[];
};

export type ProcedureLocationDiagramProps = {
  title: string;
  description: string;
  region: DiagramRegion;
  markers: readonly LocationMarker[];
  caption?: string;
  className?: string;
};

const W = 320;
/** 데스크톱 표시 배율(320 → 448px, 글자 13 → 18px). 좁은 화면에서는 max-w-full 로 줄어든다. */
const SCALE = 1.4;
const DRAW_H = 180;
const LEGEND_TOP = 196;
const LEGEND_FONT = 13;
const LEGEND_LINE = 19;
const LEGEND_GAP = 10;
const LEGEND_TEXT_X = 30;

/** 부위별 기본 선화 — 윤곽만(stroke-ink-muted / stroke-line) */
function RegionBase({ region }: { region: DiagramRegion }) {
  const outline = { className: "stroke-ink-muted", strokeWidth: 2.5, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const soft = { className: "stroke-line", strokeWidth: 6, fill: "none", strokeLinecap: "round" as const };
  switch (region) {
    case "eye":
      return (
        <g>
          <path d="M80 34Q160 2 240 34" {...soft} />
          <path d="M66 100Q160 36 254 100Q160 152 66 100Z" {...outline} />
          <circle cx="160" cy="98" r="27" className="fill-canvas stroke-ink-muted" strokeWidth={2.5} />
          <circle cx="160" cy="98" r="11" className="fill-ink-muted" />
        </g>
      );
    case "nose":
      return (
        <g>
          <path d="M136 8C140 52 154 92 182 126Q194 142 178 152Q162 160 146 152" {...outline} />
          <path d="M126 16Q112 10 96 14" {...soft} />
        </g>
      );
    case "contour":
      return (
        <g>
          <path d="M88 14V78Q94 142 160 172Q226 142 232 78V14" {...outline} />
          <path d="M70 70H88M232 70H250" {...soft} />
        </g>
      );
    case "lifting":
      return (
        <g>
          <path d="M98 26A86 86 0 0 0 84 74C84 128 118 172 160 172S236 128 236 74A86 86 0 0 0 222 26" {...outline} />
          <path d="M98 26Q160 4 222 26" {...soft} />
        </g>
      );
    case "skin":
      return (
        <g>
          <rect x="56" y="24" width="208" height="132" rx="16" {...outline} />
          {[0, 1, 2, 3].map((r) =>
            [0, 1, 2, 3, 4, 5].map((c) => <circle key={`${r}-${c}`} cx={86 + c * 30} cy={50 + r * 28} r="2.5" className="fill-line" />),
          )}
        </g>
      );
    case "breast":
      return (
        <g>
          <path d="M126 20C126 46 142 62 160 62S194 46 194 20" {...outline} />
          <path d="M126 20 82 46C70 54 64 66 64 80V176M194 20l44 26c12 8 18 20 18 34V176" {...outline} />
          <path d="M160 70V176" className="stroke-line" strokeWidth={2} strokeDasharray="3 6" fill="none" />
        </g>
      );
  }
}

function Marker({ m, n }: { m: LocationMarker; n: number }) {
  return (
    <g>
      {m.kind === "incision" && m.path ? (
        <path d={m.path} className="stroke-accent-strong" strokeWidth={3.5} fill="none" strokeLinecap="round" />
      ) : null}
      {m.kind === "area" ? (
        <circle cx={m.x} cy={m.y} r={m.r ?? 18} className="fill-accent stroke-accent-strong" fillOpacity={0.22} strokeWidth={1.5} strokeDasharray="4 3" />
      ) : null}
      {m.kind === "point"
        ? [[m.x, m.y] as const, ...(m.points ?? [])].map(([px, py]) => (
            <circle key={`${px}-${py}`} cx={px} cy={py} r={5} className="fill-accent-strong" />
          ))
        : null}
      <Badge x={m.kind === "point" ? m.x + 14 : m.x} y={m.kind === "point" ? m.y - 14 : m.y} n={n} />
    </g>
  );
}

function Badge({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={10} className="fill-brand stroke-surface" strokeWidth={2} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={11} fontWeight={700} className="fill-surface">
        {n}
      </text>
    </g>
  );
}

export function legendLayout(markers: readonly LocationMarker[]) {
  let y = LEGEND_TOP;
  const rows = markers.map((m) => {
    const lines = wrapText(m.label, W - LEGEND_TEXT_X - 4, LEGEND_FONT, 3);
    const row = { lines, y };
    y += lines.length * LEGEND_LINE + LEGEND_GAP;
    return row;
  });
  return { rows, height: y + 2 };
}

export function ProcedureLocationDiagram({ title, description, region, markers, caption, className }: ProcedureLocationDiagramProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;
  const { rows, height } = legendLayout(markers);
  const descText = `${description} ${markers.map((m, i) => `${i + 1}. ${m.label}`).join(" ")}`;
  return (
    <figure className={className} data-diagram="procedure-location">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
        width={W * SCALE}
        height={height * SCALE}
        className="block h-auto max-w-full"
        fontFamily="inherit"
      >
        <title id={titleId}>{title}</title>
        <desc id={descId}>{descText}</desc>
        <rect x="0" y="0" width={W} height={DRAW_H} rx="16" className="fill-surface" />
        <RegionBase region={region} />
        {markers.map((m, i) => (
          <Marker key={`${m.label}-${i}`} m={m} n={i + 1} />
        ))}
        {rows.map((row, i) => (
          <g key={`legend-${i}`}>
            <Badge x={12} y={row.y + 9} n={i + 1} />
            <text x={LEGEND_TEXT_X} y={row.y + 14} fontSize={LEGEND_FONT} className="fill-ink">
              {row.lines.map((line, j) => (
                <tspan key={j} x={LEGEND_TEXT_X} dy={j === 0 ? 0 : LEGEND_LINE}>
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        ))}
      </svg>
      {caption ? <figcaption className="mt-2 text-sm text-ink-muted">{caption}</figcaption> : null}
    </figure>
  );
}
