export const AUDIT_DIR: string;
export const NOT_FOUND_ROUTE: string;
export const EXTRA_ROUTES: string[];
export const LEAD_VALUE: number;
export const VIEWPORTS: Record<
  number,
  { viewport: { width: number; height: number }; deviceScaleFactor: number; isMobile: boolean; hasTouch: boolean }
>;
export const LIMITS: {
  lcpMs: number;
  cls: number;
  jsKB: number;
  imgKB: number;
  titleMax: number;
  descMin: number;
  descMax: number;
  wallMinChars: number;
  minTarget: number;
  iconMin: number;
  contentImage: { w: number; h: number };
  maxWallShots: number;
};
export const THROTTLE: { cpu: number; latencyMs: number; downKbps: number; upKbps: number };
export const AREAS: Record<"A" | "B" | "C" | "D" | "E" | "F" | "G" | "H", string>;

export type Severity = "critical" | "major" | "minor";
export interface AuditOptions {
  build: boolean;
  routes: string[] | null;
  label: string | null;
  viewports: number[];
  journeys: boolean;
  throttle: boolean;
}
export interface TextWall {
  top: number;
  bottom: number;
  height: number;
  screens: number;
  chars: number;
  shot?: string;
}
export interface Bytes {
  js: number;
  css: number;
  img: number;
  font: number;
  doc: number;
  rsc: number;
  other: number;
  total: number;
}
export interface ResourceEntry {
  name: string;
  initiatorType?: string;
  size: number;
}
/** 라우트 × 뷰포트 측정값(report.json routes[].viewports[vp]) — 필요한 필드만 선택적으로 */
export interface PageMetrics {
  error?: string | null;
  status?: number | null;
  lcp?: { ms: number; size?: number; element?: string | null; url?: string | null } | null;
  cls?: number;
  bytes?: { firstLoadJs?: number; initial?: Partial<Bytes>; full?: Partial<Bytes> };
  page?: { height?: number; screens?: number; overflowX?: number };
  images?: { imgTags?: number; broken?: number; contentImages?: number; visuals?: number; foldVisuals?: number; visualAreaPct?: number };
  text?: { chars?: number; mainChars?: number; charsPerScreen?: number; walls?: TextWall[] };
  meta?: {
    title?: string | null;
    description?: string | null;
    canonical?: string | null;
    robots?: string | null;
    ogTitle?: string | null;
    ogImage?: string | null;
    lang?: string | null;
    h1Count?: number;
    h1?: string[];
  };
  jsonLd?: { top?: string[]; types: string[]; forbidden: string[]; parseErrors: number };
  axe?: { critical: number; serious: number; violations: { id: string; impact: string; nodes: number; help: string; targets?: string[] }[] };
  console?: string[];
  smallTargets?: string[];
  glitches?: string[];
  adSafety?: string[];
  shots?: Record<string, unknown>;
}
export interface Problem {
  severity: Severity;
  area: string;
  code: string;
  route: string;
  key: string;
  viewport: number | null;
  message: string;
}
export interface JourneyStep {
  name: string;
  ok: boolean;
  ms?: number;
  url?: string | null;
  shot?: string | null;
  error?: string | null;
}
export interface JourneyAssertion {
  name: string;
  ok: boolean;
  detail?: string;
  code?: string;
  severity?: Severity;
  area?: string;
  info?: boolean;
}
export interface JourneyResult {
  name: string;
  title: string;
  viewport: number;
  ok: boolean;
  steps: JourneyStep[];
  assertions: JourneyAssertion[];
  events: string[];
  console: string[];
  error?: string;
}
export interface RankedProblem {
  severity: Severity;
  area: string;
  code: string;
  count: number;
  targets: string[];
  examples: string[];
}
export interface AuditReport {
  run: string;
  startedAt: string;
  durationMs: number;
  git?: { branch: string | null; commit: string | null; dirty: boolean };
  basePath: string;
  options: Partial<AuditOptions>;
  build?: { ran: boolean; ok: boolean; message: string | null };
  routes: { route: string; key: string; viewports: Record<number, PageMetrics> }[];
  journeys: JourneyResult[];
  problems: Problem[];
}

export function normalizeRoute(input: string): string;
export function routesFromSitemap(xml: string, basePath?: string): string[];
export function buildRouteList(opts?: { sitemapRoutes?: string[]; extra?: string[]; notFound?: string }): string[];
export function slugMapFromContent(content: unknown): Record<string, string>;
export function routeKey(route: string, slugMap?: Record<string, string>): string;
export function selectRoutes(all: string[], only: string[] | null | undefined, slugMap?: Record<string, string>): string[];
export function sanitizeLabel(label: unknown): string | null;
export function parseArgs(argv: string[]): AuditOptions;
export function runFolderName(date: Date, label?: string | null, exists?: (name: string) => boolean): string;
export function classifyResource(url: string, initiatorType?: string): keyof Omit<Bytes, "total">;
export function sumBytes(entries: ResourceEntry[]): Bytes;
export function scriptPathsFromHtml(html: string): Set<string>;
export function firstLoadJsBytes(entries: ResourceEntry[], scriptPaths: Set<string>): number;
export function mergeIntervals(list: [number, number][]): [number, number][];
export function findTextWalls(p: {
  visuals: [number, number][];
  texts: [number, number][];
  start: number;
  end: number;
  screen: number;
  minChars?: number;
}): TextWall[];
export function jsonLdInfo(raws: string[]): { top: string[]; types: string[]; forbidden: string[]; parseErrors: number };
export function expectedJsonLd(route: string): string[][];
export function imageOptional(route: string): boolean;
export function evaluateRoute(entry: { route: string; key: string; viewport: number; m: PageMetrics | null | undefined }, limits?: typeof LIMITS): Problem[];
export function evaluateJourney(j: JourneyResult): Problem[];
export function rankProblems(problems: Problem[]): RankedProblem[];
export function fmtKB(bytes: number | null | undefined): string;
export function fmtMs(ms: number | null | undefined): string;
export function renderSummary(report: AuditReport): string;
