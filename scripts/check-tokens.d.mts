export interface TokenViolation {
  line: number;
  rule: "hex" | "color-fn" | "named-color" | "arbitrary" | "inline-style";
  value: string;
}
export const DIRS: string[];
export const EXT: string[];
export function scanSource(text: string, file: string): TokenViolation[];
export function checkTokens(root?: string): string[];
