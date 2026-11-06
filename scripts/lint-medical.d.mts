export interface MedicalViolation {
  line: number;
  code: string;
  name: string;
  word: string;
  sentence: string;
}
export const DIRS: string[];
export const EXT: string[];
export function stripComments(text: string): string;
export function scanText(text: string, file: string): MedicalViolation[];
export function inScope(rel: string): boolean;
export function lintRepo(root?: string): string[];
