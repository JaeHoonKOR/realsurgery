// out/ 정적 export를 GitHub Pages와 같은 방식으로 서빙한다(basePath 하위, gzip, 디렉터리 index.html, 404.html).
// 사용: node scripts/serve-out.mjs [--port 4173]
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import zlib from "node:zlib";

// playwright.config.ts 가 이 파일을 CJS로 변환해 불러오므로 import.meta 를 쓰지 않는다.
// 모든 pnpm 스크립트는 저장소 루트에서 실행된다.
export const OUT_DIR = path.join(process.cwd(), "out");
export const DEFAULT_PORT = 4173;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".map": "application/json; charset=utf-8",
};
const COMPRESSIBLE = new Set([".html", ".js", ".css", ".json", ".txt", ".xml", ".svg", ".map"]);

/**
 * Playwright·미리보기 기본 포트. 저장소 본체는 4173/4174, 에이전트 작업 트리(.claude/worktrees/<이름>)는 경로 해시로
 * 4200~4799 의 다른 짝을 쓴다 → /improve 가 구현 에이전트를 병렬로 돌려도 다른 작업 트리의 서버를 재사용(reuseExistingServer)하지 않는다.
 */
export function defaultPorts(cwd = process.cwd()) {
  const norm = String(cwd).replace(/\\/g, "/");
  if (!/\/\.claude\/worktrees\/[^/]+/.test(norm)) return { serve: DEFAULT_PORT, preview: DEFAULT_PORT + 1 };
  let h = 0x811c9dc5;
  for (const ch of norm.toLowerCase()) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  const serve = 4200 + (h % 300) * 2;
  return { serve, preview: serve + 1 };
}

/** 실제 빌드 산출물에서 basePath를 읽는다(빌드 설정과 항상 일치). */
export function detectBasePath(outDir = OUT_DIR) {
  const index = path.join(outDir, "index.html");
  if (!fs.existsSync(index)) {
    throw new Error(`out/index.html 이 없습니다. 먼저 \`pnpm build\` 를 실행하세요. (${index})`);
  }
  const html = fs.readFileSync(index, "utf8");
  const m = html.match(/(?:src|href)="([^"]*?)\/_next\/static\//);
  return m ? m[1] : "";
}

function resolveFile(outDir, urlPath) {
  let rel;
  try {
    rel = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  const candidate = path.normalize(path.join(outDir, rel));
  if (!candidate.startsWith(outDir)) return null;
  const tries = rel.endsWith("/")
    ? [path.join(candidate, "index.html")]
    : [candidate, `${candidate}.html`, path.join(candidate, "index.html")];
  for (const t of tries) {
    try {
      if (fs.statSync(t).isFile()) return t;
    } catch {
      /* 다음 후보 */
    }
  }
  return null;
}

function send(req, res, status, file) {
  const ext = path.extname(file).toLowerCase();
  const body = fs.readFileSync(file);
  const headers = {
    "Content-Type": TYPES[ext] ?? "application/octet-stream",
    "Cache-Control": file.includes(`${path.sep}_next${path.sep}static${path.sep}`)
      ? "public, max-age=31536000, immutable"
      : "public, max-age=600",
  };
  const acceptsGzip = /\bgzip\b/.test(req.headers["accept-encoding"] ?? "");
  if (acceptsGzip && COMPRESSIBLE.has(ext)) {
    const gz = zlib.gzipSync(body);
    res.writeHead(status, { ...headers, "Content-Encoding": "gzip", "Content-Length": gz.length, Vary: "Accept-Encoding" });
    res.end(req.method === "HEAD" ? undefined : gz);
    return;
  }
  res.writeHead(status, { ...headers, "Content-Length": body.length });
  res.end(req.method === "HEAD" ? undefined : body);
}

export function startServer({ port = DEFAULT_PORT, outDir = OUT_DIR } = {}) {
  const basePath = detectBasePath(outDir);
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    let p = url.pathname;
    if (basePath) {
      if (p === "/" || p === basePath) {
        res.writeHead(302, { Location: `${basePath}/` });
        res.end();
        return;
      }
      if (!p.startsWith(`${basePath}/`)) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Not Found");
        return;
      }
      p = p.slice(basePath.length);
    }
    const file = resolveFile(outDir, p);
    if (file) {
      // GitHub Pages 처럼 디렉터리 경로는 끝 슬래시로 리다이렉트
      if (!p.endsWith("/") && path.basename(file) === "index.html" && !p.endsWith("index.html")) {
        res.writeHead(301, { Location: `${basePath}${p}/` });
        res.end();
        return;
      }
      send(req, res, 200, file);
      return;
    }
    const notFound = path.join(outDir, "404.html");
    if (fs.existsSync(notFound)) send(req, res, 404, notFound);
    else {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not Found");
    }
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      const address = server.address();
      const actualPort = typeof address === "object" && address ? address.port : port;
      resolve({ server, port: actualPort, basePath, url: `http://localhost:${actualPort}${basePath}/` });
    });
  });
}

if (path.basename(process.argv[1] ?? "") === "serve-out.mjs") {
  const i = process.argv.indexOf("--port");
  const port = i > -1 ? Number(process.argv[i + 1]) : Number(process.env.PORT ?? DEFAULT_PORT);
  startServer({ port })
    .then(({ url }) => console.log(`[serve-out] ${url}`))
    .catch((err) => {
      console.error(`[serve-out] ${err.message}`);
      process.exit(1);
    });
}
