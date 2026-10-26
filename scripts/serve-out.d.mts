import type { Server } from "node:http";

export const OUT_DIR: string;
export const DEFAULT_PORT: number;
export function defaultPorts(cwd?: string): { serve: number; preview: number };
export function detectBasePath(outDir?: string): string;
export function startServer(options?: {
  port?: number;
  outDir?: string;
}): Promise<{ server: Server; port: number; basePath: string; url: string }>;
