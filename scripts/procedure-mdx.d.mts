export type GuideSection = { id: string; title: string };
export type Guide = {
  description: string;
  procedure_type: "surgical" | "noninvasive" | "percutaneous";
  body_location: string;
  preparation: string;
  author_id: string | null;
  medical_reviewer_id: string | null;
  unverified_facts: FactKey[];
  body: string;
  sections: GuideSection[];
};
export type FactKey = "price" | "duration" | "recovery" | "anesthesia";
export const FACT_KEYS: FactKey[];
export const PROCEDURES_DIR: string;
export const SECTIONS: { id: string; label: string; re: RegExp }[];
export const PROCEDURE_TYPES: Record<Guide["procedure_type"], string>;
export const SITE_NAME: string;
export const TITLE_MAX: number;
export const DESCRIPTION_RANGE: [number, number];
export const FAQ_RANGE: [number, number];
export const MIN_SOURCES: number;
export function splitFrontmatter(source: string): { yaml: string; body: string } | null;
export function parseProcedureMdx(source: string): {
  frontmatter: Record<string, unknown> | null;
  body: string;
  sections: GuideSection[];
  problems: string[];
};
export function lintProcedureMdx(source: string): string[];
export function compileError(body: string): Promise<string | null>;
export function readProcedureDocs(dir?: string): { id: string; file: string; source: string }[];
export function lintDocId(id: string): string[];
export function docToRows(
  doc: { id: string; source: string },
  viewCount?: number,
): { procedure: Record<string, unknown>; faqs: Record<string, unknown>[] } | null;
export function rowMismatches(row: Record<string, unknown>, faqRows: Record<string, unknown>[]): string[];
export function guideOf(contentMdx: string | null | undefined): Guide | null;
