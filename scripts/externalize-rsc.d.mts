export const GATE: string;
export const DONE_MARK: string;
export const FAILED_ATTR: string;
export function guardScript(src: string): string;
export function assertGateHook(outDir: string, basePath: string, html: string): void;
export function externalizeRsc(html: string, src: string): { html: string; js: string; count: number; already: boolean };
export function externalizeAll(options?: { outDir?: string; buildId?: string }): {
  files: number;
  moved: number;
  already: number;
  before: number;
  after: number;
};
