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
//
// 실패 안전(리뷰 T-103 r1 반려 1): 외부 파일을 못 받으면(abort·404·잘린 응답) 하이드레이션이 빈 스트림으로 시작되어
//     React 루트 오류로 문서 전체가 비워진다. 그래서 하이드레이션 시작 자체를 페이로드 도착에 묶는다.
//     - Next 는 하이드레이션 전에 appBootstrap → loadScriptsInSequence(self.__next_s, cb) 를 거치고, 스트림을 만들고
//       DOMContentLoaded 에 닫는 app-index 는 그 cb 안에서야 require 된다(next/dist/client/app-next.js, app-bootstrap.js).
//     - <head> 맨 앞(모든 Next 스크립트보다 먼저) 인라인 GATE 가 self.__next_s 를 "reduce 하면 페이로드 완료 Promise 를 돌려주는"
//       객체로 둔다. 외부 파일 끝의 표시(self.__rs_rsc_ok=1)를 바로 뒤 인라인 GUARD 가 확인해 Promise 를 푼다.
//     - 실패하면 GUARD 가 1회 다시 받는다(일시 장애). 그것도 실패하면 Promise 는 영영 안 풀리고 app-index 가 실행되지 않으므로
//       정적 HTML(본문·FAQ·링크·<details>)이 그대로 남는다. e2e: tests/e2e/procedure.spec.ts "RSC 페이로드 실패".
// 출력 형식 감시(리뷰 T-103 r1 반려 2): 조각을 하나도 못 찾은 App Router HTML, 처리 후에도 self.__next_f 가 남은 HTML,
//     부트스트랩이 첫 조각이 아닌 경우, Next 가 self.__next_s 를 쓰는 경우(beforeInteractive 스크립트) → 전부 throw = 빌드 실패.
// 캐시: GitHub Pages 는 HTML·JS 를 각각 10분 캐시하므로 빌드 ID 를 쿼리로 붙여 다른 빌드의 페이로드와 섞이지 않게 한다.
// 사용: pnpm build 가 next build 직후 실행.   회귀 테스트: tests/unit/externalize-rsc.test.ts, e2e 전체(하이드레이션 후 이벤트)
import fs from "node:fs";
import path from "node:path";
import { OUT_DIR, detectBasePath } from "./serve-out.mjs";

// Next 가 내보내는 두 형태: 부트스트랩 (self.__next_f=self.__next_f||[]).push([0]) 와 데이터 self.__next_f.push([1,"…"])
// 페이로드 문자열 안의 "<" 는 Next 가 < 로 이스케이프하므로 </script> 가 안에 나올 수 없다.
const RSC_SCRIPT = /<script>((?:\(self\.__next_f=self\.__next_f\|\|\[\]\)|self\.__next_f)\.push\([\s\S]*?\))<\/script>/g;
const BOOTSTRAP = /^\(self\.__next_f=self\.__next_f\|\|\[\]\)\.push\(\[0\]\)$/;
const APP_ROUTER = /\/_next\/static\/chunks\/main-app-[^"]*\.js"/;

/** 하이드레이션을 페이로드 완료까지 묶어 두는 인라인 스크립트(<head> 맨 앞). 이 문자열이 있으면 이미 처리된 HTML. */
export const GATE =
  "<script>(function(s){var d,p=new Promise(function(r){d=r});s.__rs_hydrate=d;s.__next_s={length:1,reduce:function(){return p}}})(self)</script>";
/** 외부 페이로드 끝에 붙는 완료 표시. 파일이 끝까지 실행되어야만 설정된다(잘린 응답·HTML 404 페이지는 문법 오류로 실행 안 됨). */
export const DONE_MARK = "self.__rs_rsc_ok=1";

/** 외부 <script src> 바로 뒤 인라인 확인: 완료면 하이드레이션 시작, 아니면 1회 재요청(성공 시에만 시작). */
export function guardScript(src) {
  const retry = `${src}${src.includes("?") ? "&" : "?"}retry=1`;
  return (
    "<script>(function(s,u){if(s.__rs_rsc_ok)return s.__rs_hydrate();s.__next_f=void 0;" +
    'var e=document.createElement("script");e.src=u;e.onload=function(){s.__rs_rsc_ok&&s.__rs_hydrate()};document.head.appendChild(e)})' +
    `(self,${JSON.stringify(retry)})</script>`
  );
}

/** GATE 를 <head> 의 첫 스크립트보다 앞(문자 집합 meta 바로 뒤)에 둔다. */
function insertGate(html) {
  const head = html.match(/<head[^>]*>(<meta charSet="utf-8"\/>|<meta charset="utf-8">)?/i);
  if (!head || head.index === undefined) throw new Error("<head> 를 찾지 못함 — Next 출력 형식 확인 필요");
  const at = head.index + head[0].length;
  const out = html.slice(0, at) + GATE + html.slice(at);
  if (out.indexOf("<script") !== at) throw new Error("GATE 앞에 다른 스크립트가 있음 — 하이드레이션을 막을 수 없다");
  return out;
}

/**
 * HTML 1개 → { html, js, count, already }. 인라인 RSC 스크립트를 전부 빼서 js 로 모으고, 첫 위치에 <script src> + GUARD 를 둔다.
 * App Router 가 아닌 HTML(인라인 RSC 도 main-app 청크도 없음)은 count 0, html 그대로. 이미 처리된 HTML 은 already.
 * 형식이 예상과 다르면 throw(조용히 깨진 빌드를 배포하는 것보다 빌드 실패가 낫다).
 */
export function externalizeRsc(html, src) {
  if (html.includes(GATE)) {
    if (html.includes("self.__next_f")) throw new Error("이미 처리된 HTML 에 인라인 RSC 가 다시 생김");
    return { html, js: "", count: 0, already: true };
  }
  if (html.includes("__next_s")) throw new Error("Next 가 self.__next_s(beforeInteractive 스크립트)를 씀 — GATE 와 충돌");
  const parts = [];
  let first = -1;
  const stripped = html.replace(RSC_SCRIPT, (_m, code, offset) => {
    if (first < 0) first = offset;
    parts.push(code);
    return "";
  });
  if (!parts.length) {
    if (html.includes("__next_f") || APP_ROUTER.test(html)) {
      throw new Error("App Router HTML 인데 인라인 RSC 조각을 하나도 못 찾음 — Next 출력 형식 확인 필요");
    }
    return { html, js: "", count: 0, already: false };
  }
  if (!BOOTSTRAP.test(parts[0])) {
    throw new Error("RSC 부트스트랩 스크립트가 첫 조각이 아님 — Next 출력 형식 확인 필요");
  }
  if (stripped.includes("self.__next_f")) {
    // 일부 조각만 다른 형식(속성 추가 등)이면 그 조각은 인라인에 남아 외부 파일보다 먼저 실행된다 → 순서가 깨진다
    throw new Error("처리 후에도 인라인 self.__next_f 가 남음(일부 조각의 형식이 다름) — Next 출력 형식 확인 필요");
  }
  const tag = `<script src="${src}"></script>${guardScript(src)}`;
  const withTag = stripped.slice(0, first) + tag + stripped.slice(first);
  return { html: insertGate(withTag), js: `${parts.join(";\n")};\n${DONE_MARK};\n`, count: parts.length, already: false };
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

/**
 * out/ 전체 처리 + 사후 조건(전 HTML 에 인라인 self.__next_f 0건). 위반하면 throw.
 * @returns {{ files: number, moved: number, already: number, before: number, after: number }}
 */
export function externalizeAll({ outDir = OUT_DIR, buildId } = {}) {
  const basePath = detectBasePath(outDir);
  const version = buildId ?? (fs.existsSync(".next/BUILD_ID") ? fs.readFileSync(".next/BUILD_ID", "utf8").trim() : "");
  const files = walk(outDir);
  let moved = 0;
  let already = 0;
  let before = 0;
  let after = 0;
  for (const file of files) {
    const html = fs.readFileSync(file, "utf8");
    const jsFile = file.replace(/\.html$/, ".rsc.js");
    const rel = path.relative(outDir, jsFile).split(path.sep).join("/");
    const src = `${basePath}/${encodeURI(rel)}${version ? `?v=${encodeURIComponent(version)}` : ""}`;
    let r;
    try {
      r = externalizeRsc(html, src);
    } catch (err) {
      throw new Error(`[externalize-rsc] ${path.relative(outDir, file)}: ${err.message}`);
    }
    if (r.already) {
      if (!fs.existsSync(jsFile)) throw new Error(`[externalize-rsc] ${path.relative(outDir, file)}: 처리된 HTML 인데 ${rel} 없음`);
      already++;
      continue;
    }
    if (!r.count) continue;
    fs.writeFileSync(jsFile, r.js, "utf8");
    fs.writeFileSync(file, r.html, "utf8");
    moved++;
    before += Buffer.byteLength(html);
    after += Buffer.byteLength(r.html);
  }
  // 사후 조건: 어떤 경로로든 인라인 페이로드가 남으면 실패
  const left = files.filter((f) => fs.readFileSync(f, "utf8").includes("self.__next_f")).map((f) => path.relative(outDir, f));
  if (left.length) throw new Error(`[externalize-rsc] 처리 후 인라인 self.__next_f 가 남은 HTML: ${left.join(", ")}`);
  return { files: files.length, moved, already, before, after };
}

if (path.basename(process.argv[1] ?? "") === "externalize-rsc.mjs") {
  const r = externalizeAll();
  console.log(
    `[externalize-rsc] HTML ${r.files}개 중 ${r.moved}개의 인라인 RSC 페이로드를 *.rsc.js 로 이동(이미 처리 ${r.already}) — HTML ${Math.round(r.before / 1024)}KB → ${Math.round(r.after / 1024)}KB`,
  );
}
