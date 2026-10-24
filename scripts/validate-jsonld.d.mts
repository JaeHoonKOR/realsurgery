export type JsonLdBlock = { data?: Record<string, unknown>; error?: string; raw: string };
export function extractJsonLd(html: string): JsonLdBlock[];
export function jsonLdNodes(blocks: JsonLdBlock[]): Record<string, unknown>[];
export function validateJsonLdHtml(html: string, options?: { procedurePage?: boolean }): string[];
export function procedurePages(outDir?: string): string[];
