export interface CandidateItem {
  id?: string;
  family: string;
  background?: string;
  [key: string]: unknown;
}
export type Rgb = { r: number; g: number; b: number };

export function parseCandidateName(name: string): { id: string; variant: string } | null;
export function isCutout(item: CandidateItem | null | undefined): boolean;
export function backgroundVerdict(item: CandidateItem | null | undefined, corners: Rgb[]): { ok: boolean | null; note: string };
