export interface TokenViolation {
  line: number;
  rule: "hex" | "arbitrary" | "inline-style";
  value: string;
}
export function scanSource(text: string, file: string): TokenViolation[];
export function checkTokens(root?: string): string[];
