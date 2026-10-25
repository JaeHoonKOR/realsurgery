export interface ManifestItem {
  id: string;
  family: string;
  [key: string]: unknown;
}
export interface Manifest {
  images: ManifestItem[];
  [key: string]: unknown;
}
export interface Selection {
  id: string;
  variant: string;
  item: ManifestItem;
}
export interface FinalizeOp {
  id: string;
  src: string;
  dest: string;
  quality: number;
  variants: { width: number; dest: string }[];
}
export interface RegistryResult {
  ids: string[];
  incomplete: string[];
  unknown: string[];
}

export const GEN_DIR: string;
export const REGISTRY: string;
export const MANIFEST: string;
export const VARIANT_WIDTHS: number[];
export function isFixedSize(item: Pick<ManifestItem, "id" | "family">): boolean;
export function qualityFor(item: Pick<ManifestItem, "family">): number;
export function parseSelection(raw: unknown, manifest: Manifest): Selection[];
export function planFinalize(selection: Selection[], candidatesDir: string, genDir?: string): FinalizeOp[];
export function baseIdsFromFiles(names: readonly string[]): string[];
export function registryFromFiles(names: readonly string[], manifest: Manifest): RegistryResult;
export function serializeRegistry(ids: readonly string[]): string;
export function syncRegistry(opts: { manifest: Manifest; genDir?: string; registryPath?: string }): RegistryResult;
export function finalize(opts: {
  candidatesDir: string;
  selection: unknown;
  manifest: Manifest;
  sharp: typeof import("sharp").default;
  genDir?: string;
  registryPath?: string;
}): Promise<RegistryResult & { ops: FinalizeOp[] }>;
