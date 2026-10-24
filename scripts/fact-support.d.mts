export type FactUnit = { text: string; ctx?: "duration" | "recovery" | null };
export const ANESTHESIA_KINDS: { kind: string; re: RegExp }[];
export function durationValues(text: string, opts?: { lengthOnly?: boolean }): number[];
export function dayValues(text: string): number[];
export function anesthesiaKinds(text: string): string[];
export function clauses(text: string): string[];
export function unsupportedFacts(
  facts: { duration?: string | null; recovery?: string | null; anesthesia?: string | null },
  units: FactUnit[],
): string[];
export function faqContext(question: string): "duration" | "recovery" | null;
