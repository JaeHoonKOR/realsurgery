export type Tables = Record<
  | "categories"
  | "authors"
  | "procedures"
  | "procedure_faqs"
  | "clinics"
  | "clinic_procedures"
  | "posts"
  | "affiliate_items",
  Record<string, unknown>[]
>;
export interface Seed {
  categories: Record<string, unknown>[];
  authors: Record<string, unknown>[];
  procedures: Record<string, unknown>[];
  clinics: Record<string, unknown>[];
  posts: Record<string, unknown>[];
  affiliate_items: Record<string, unknown>[];
}
export type ProcedureDoc = { id: string; file: string; source: string };
export const SEED_DIR: string;
export const PROCEDURES_DIR: string;
export const GENERATED_FILE: string;
export const SEED_SQL_FILE: string;
export const COLUMNS: Record<keyof Tables, Record<string, string>>;
export const TABLES: (keyof Tables)[];
export const BANNED_WORDS: string[];
export const AFFILIATE_MAX: number;
export const SEED_PROCEDURE_KEYS: string[];
export function readSeed(dir?: string): Seed;
export function flattenSeed(seed: Seed): Tables;
export function applyProcedureDocs(tables: Tables, docs: ProcedureDoc[]): Tables;
export function mdxProblems(docs: ProcedureDoc[]): string[];
export function seedProcedureProblems(seedProcedures: Record<string, unknown>[], docs: ProcedureDoc[]): string[];
export function seedTablesWithContent(
  seedDir?: string,
  proceduresDir?: string,
): { tables: Tables; docs: ProcedureDoc[]; problems: string[] };
export function assemble(tables: Tables, meta: Record<string, unknown>): Record<string, unknown>;
export function validateTables(tables: Tables): string[];
export function toSeedSql(tables: Tables): string;
export function supabaseConfig(env?: Record<string, string | undefined>): { url: string; anonKey: string } | null;
export function fetchSupabaseTables(
  cfg: { url: string; anonKey: string },
  fetchImpl?: (url: string, init?: RequestInit) => Promise<Response>,
): Promise<Tables>;
export function buildData(options?: {
  env?: Record<string, string | undefined>;
  seedDir?: string;
  proceduresDir?: string;
  outFile?: string;
  fetchImpl?: (url: string, init?: RequestInit) => Promise<Response>;
  now?: () => Date;
  log?: (msg: string) => void;
}): Promise<{ mode: "supabase" | "mock"; file: string; content: Record<string, unknown> }>;
