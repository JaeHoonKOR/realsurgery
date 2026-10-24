export function bannedWordsIn(source: string): string[];
export function lintFiles(docs: { id: string; file: string; source: string }[]): Promise<string[]>;
