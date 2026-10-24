// 정적 export HTML 의 인라인 RSC 페이로드(self.__next_f.push(...) 스크립트들)를 페이지별 외부 파일로 옮긴다.
//
// 왜: App Router 정적 HTML 에는 화면 HTML 과 같은 내용이 RSC 페이로드로 한 번 더 인라인된다. 긴 콘텐츠 화면(P-03)은
//     문서가 gzip 14KB(TCP 첫 전송 창)를 넘어 첫 HTML 이 한 왕복 늦게 끝나고, 그 뒤에 시작하는 JS 까지 밀려
//     Lighthouse 모바일 LCP 가 약 150ms 늦어진다(로그 2026-10-25-builder-T-103 "LCP" — 2.10s → 기준 2.0s 초과).
//     페이로드를 외부 <script src> 로 빼면 문서는 화면 HTML 만 남아 첫 왕복에 끝나고, 페이로드는 JS 청크와 병렬로 받는다.
// 동작 근거: Next 클라이언트(next/dist/client/app-index.js)는 self.__next_f 에 쌓인 조각을 받아 하이드레이션 스트림에 넣고,
//     문서 파싱이 끝나면(readyState 가 loading 이 아니면) 스트림을 닫는다. 그래서 defer·async 가 아니라 원래 인라인 위치의
//     일반(파서 차단) <script src> 로 둔다 — 인라인일 때와 같이 파싱 중에 실행되어 조각 순서·시점이 그대로다.
//     (defer 는 파싱 완료 후 실행이라 Next 가 먼저 스트림을 닫는 경쟁이 생긴다 — e2e 로 확인.) 클라이언트 이동용 index.txt 는 그대로.
// 캐시: GitHub Pages 는 HTML·JS 를 각각 10분 캐시하므로 빌드 ID 를 쿼리로 붙여 다른 빌드의 페이로드와 섞이지 않게 한다.
// 사용: pnpm build 가 next build 직후 실행.   회귀 테스트: tests/unit/externalize-rsc.test.ts, e2e 전체(하이드레이션 후 이벤트)
import fs from "node:fs";
import path from "node:path";
import { OUT_DIR, detectBasePath } from "./serve-out.mjs";

// Next 가 내보내는 두 형태: 부트스트랩 (self.__next_f=self.__next_f||[]).push([0]) 와 데이터 self.__next_f.push([1,"…"])
// 페이로드 문자열 안의 "<" 는 Next 가 < 로 이스케이프하므로 </script> 가 안에 나올 수 없다.
const RSC_SCRIPT = /<script>((?:\(self\.__next_f=self\.__next_f\|\|\[\]\)|self\.__next_f)\.push\([\s\S]*?\))<\/script>/g;

/**
 * HTML 1개 → { html, js, count }. 인라인 RSC 스크립트를 전부 빼서 js 로 모으고, 첫 위치에 <script src> 1개를 둔다.
 * 인라인 RSC 가 없으면 count 0, html 그대로.
 */
export function externalizeRsc(html, src) {
  const parts = [];
  let first = -1;
  const stripped = html.replace(RSC_SCRIPT, (_m, code, offset) => {
    if (first < 0) first = offset;
    parts.push(code);
    return "";
  });
  if (!parts.length) return { html, js: "", count: 0 };
  if (!/^\(self\.__next_f=self\.__next_f\|\|\[\]\)\.push\(\[0\]\)$/.test(parts[0])) {
    // 부트스트랩이 맨 앞이 아니면 형식이 바뀐 것 — 옮기지 않는다(조용히 깨지는 것보다 빌드 실패가 낫다)
    throw new Error("RSC 부트스트랩 스크립트가 첫 조각이 아님 — Next 출력 형식 확인 필요");
  }
  const tag = `<script src="${src}"></script>`;
  return { html: stripped.slice(0, first) + tag + stripped.slice(first), js: `${parts.join(";\n")};\n`, count: parts.length };
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== "_next") walk(p, out);
    } else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

/** out/ 전체 처리. @returns {{ files: number, moved: number, before: number, after: number }} */
export function externalizeAll({ outDir = OUT_DIR, buildId } = {}) {
  const basePath = detectBasePath(outDir);
  const version = buildId ?? (fs.existsSync(".next/BUILD_ID") ? fs.readFileSync(".next/BUILD_ID", "utf8").trim() : "");
  let files = 0;
  let moved = 0;
  let before = 0;
  let after = 0;
  for (const file of walk(outDir)) {
    const html = fs.readFileSync(file, "utf8");
    const jsFile = file.replace(/\.html$/, ".rsc.js");
    const rel = path.relative(outDir, jsFile).split(path.sep).join("/");
    const src = `${basePath}/${encodeURI(rel)}${version ? `?v=${encodeURIComponent(version)}` : ""}`;
    const r = externalizeRsc(html, src);
    files++;
    if (!r.count) continue;
    fs.writeFileSync(jsFile, r.js, "utf8");
    fs.writeFileSync(file, r.html, "utf8");
    moved++;
    before += Buffer.byteLength(html);
    after += Buffer.byteLength(r.html);
  }
  return { files, moved, before, after };
}

if (path.basename(process.argv[1] ?? "") === "externalize-rsc.mjs") {
  const r = externalizeAll();
  console.log(
    `[externalize-rsc] HTML ${r.files}개 중 ${r.moved}개의 인라인 RSC 페이로드를 *.rsc.js 로 이동 — HTML ${Math.round(r.before / 1024)}KB → ${Math.round(r.after / 1024)}KB`,
  );
}
