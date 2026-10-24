export function externalizeRsc(html: string, src: string): { html: string; js: string; count: number };
export function externalizeAll(options?: { outDir?: string; buildId?: string }): { files: number; moved: number; before: number; after: number };
