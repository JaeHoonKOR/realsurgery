// 시술 가이드 출처 확인 (수동 도구, 네트워크 사용 — pnpm build·CI 게이트에 넣지 않는다)
// content/procedures/*.mdx 의 sources URL 전부 → HTTP 200 + 각주 문장·요약 박스 수치가 기대는 문구가 페이지에 그대로 있는지.
// - HTML 은 태그를 지우고 공백을 합친 글자에서, 법령 PDF(law.go.kr flDownload)는 FlateDecode 스트림 + ToUnicode 표로 뽑은 글자(공백 제거)에서 찾는다.
// - 새 출처·각주 문장을 넣으면 CHECK 에 URL 일부(키)와 확인 문구를 추가한다. 키가 없는 URL 은 문제로 센다.
// 사용: pnpm verify:sources   (문제가 있으면 exit 1)   규칙: docs/content/procedure-mdx.md 3절
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROCEDURES_DIR = path.join(ROOT, "content", "procedures");

/** URL 일부 → 페이지에 있어야 하는 문구(각주 문장·요약 박스 근거 문장이 기대는 원문) */
export const CHECK = {
  // 서울아산병원 검사·시술·수술정보
  "managementId=156": [
    "5% 이하의 환자에서 쌍꺼풀이 풀리는",
    "3~4일째 봉합실을 제거",
    "1주일 정도면 정상생활",
    "선천적으로 쌍꺼풀이 없거나 한쪽에만",
    "일반적으로 국소 마취로 수술하며 필요에 따라 진정제를 사용합니다",
  ],
  "managementId=155": [
    "재배치하고",
    "4일 전후로 봉합실",
    "2~3주 이상 지속",
    "피부 절개없이 눈 안쪽 절개선",
    "약 1주가 지나면 일상 생활과 사회 생활이 모두 가능",
    "일반적으로 국소 마취로 수술하며 필요에 따라 진정제를 사용합니다",
  ],
  "managementId=154": [
    "눈뜨는 근육의 힘이 약해져",
    "1~2mm",
    "6개월 정도 지나야 자연스러워",
    "인공 눈물",
    "1~2주 정도 후에 호전",
    "협조가 가능한 성인 환자의 경우에는 국소 마취 하에 수술할 수도 있고, 경우에 따라서는 전신 마취로 시행합니다",
    "소요 시간은 2시간 정도로 추정",
  ],
  "managementId=232": ["임신이나 체중 감소", "구형구축", "하루 입원", "3년마다 MRI", "자가지방 이식", "예상 소요 시간은 2시간으로 추정"],
  "managementId=234": ["5~6일 째 제거", "6주까지는", "실리콘 돌출", "가슴연골", "3주말 경부터 정상생활이 가능"],
  "managementId=235": ["코가 낮거나 변형", "고어텍스", "5~6개월 뒤", "8주 동안"],
  "managementId=237": ["턱뼈의 바깥층을 자르거나 깎아", "유동식", "1:0.8"],
  "managementId=537": [
    "진단명 및 피부 상태에 따라 결정",
    "10~30분",
    "찜질방",
    "홍반, 부종, 딱지",
    "시술 시간은 10~30분 정도로 시술 종류에 따라 다양",
    "시술 전 국소 마취나 마취 연고를 바릅니다",
  ],
  "managementId=539": ["6개월~1년", "일주일 동안 안경"],
  "managementId=153": ["측두부 헤어라인", "2~3주가 지나면 일상 생활", "엔도타인 리프트", "살이 아래로 처집니다"],
  // 서울대학교병원 의학정보
  "medid=BB000070": ["내안각 성형술", "1~2개월 정도의 기간 동안에는 흉이 붉게", "30분에서 1시간", "원칙적으로는 필요 없는 수술", "대개 1시간 정도 걸린다"],
  "medid=BB000066": ["광대뼈 축소술", "1~2주 정도 지나면 일반적인 생활", "대략 4시간 정도 걸린다", "하악지 신경 손상"],
  "medid=BB000023": ["1~2일간 입원", "7~10일 정도 지나야 일상적인 사회활동", "하치조 신경", "6개월 내지 1년 간격", "전신 마취하에 1시간가량 수술"],
  "medid=BB000069": ["유방 촬영술", "3주간 스포츠 브래지어", "재수술의 가장 흔한 원인", "기존 유방의 넓이", "보통 전신 마취로 시행", "과격한 운동은 수술 후 2~3주까지"],
  "medid=BB000166": ["결막", "아래 눈꺼풀이 뒤집어", "코를 풀거나 눈을 비비지", "외과적 시술의 경우는 40~60분", "레이저로 시술할 경우 약 30~40분"],
  "medid=BB000167": ["색소침착", "자외선 차단"],
  "medid=BB000158": ["상처 치유의 지연", "좌우 비대칭", "노화에 의해 주름"],
  // 한양대학교병원 Hihy건강백과
  "hydic/view002001001.do?no=1472": ["'토닝'이라 불리는 방식", "낮은 에너지의 레이저를 일정 주기로 반복 조사", "여성호르몬", "유전적 소인"],
  // 식품의약품안전처 의료기기안심책방
  "pstgSno=56": ["주로 거친 표면 제품에서 BIA-ALCL이 발생", "1년에 1회 정기적으로", "발생빈도가 낮은 암"],
  // 국민건강보험 요양급여의 기준에 관한 규칙 [별표 2] (PDF — 공백 제거 후 비교)
  "flSeq=163452831": [
    "쌍꺼풀수술(이중검수술),코성형수술(융비술),유방확대·축소술,지방흡인술,주름살제거술등미용목적의성형수술",
    "외모개선목적의턱얼굴(악안면)교정술",
    "<개정2026.4.15.>",
  ],
};

/** PDF 글자 추출: FlateDecode 스트림을 풀고 글꼴의 ToUnicode(bfchar·bfrange)로 2바이트 글리프를 바꾼다. 공백은 지운다. */
export function pdfText(buf) {
  const s = buf.toString("latin1");
  const objs = new Map();
  for (const m of s.matchAll(/(\d+) 0 obj([\s\S]*?)endobj/g)) objs.set(Number(m[1]), m[2]);
  const stream = (b) => {
    const i = b.indexOf("stream");
    if (i < 0) return null;
    let a = i + 6;
    if (b[a] === "\r") a++;
    if (b[a] === "\n") a++;
    const raw = Buffer.from(b.slice(a, b.lastIndexOf("endstream")), "latin1");
    try {
      return /FlateDecode/.test(b.slice(0, i)) ? zlib.inflateSync(raw).toString("latin1") : raw.toString("latin1");
    } catch {
      return null;
    }
  };
  const fontMap = new Map();
  for (const [id, b] of objs) {
    const tu = b.match(/\/ToUnicode (\d+) 0 R/);
    if (!tu || !/\/Type\s*\/Font/.test(b)) continue;
    const cmap = stream(objs.get(Number(tu[1])) ?? "") ?? "";
    const map = new Map();
    for (const x of cmap.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
      for (const m of x[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) map.set(parseInt(m[1], 16), Buffer.from(m[2], "hex").swap16().toString("utf16le"));
    }
    for (const x of cmap.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
      for (const m of x[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
        for (let k = parseInt(m[1], 16); k <= parseInt(m[2], 16); k++) map.set(k, String.fromCodePoint(parseInt(m[3], 16) + k - parseInt(m[1], 16)));
      }
    }
    fontMap.set(id, map);
  }
  const names = new Map();
  for (const b of objs.values()) {
    for (const f of b.matchAll(/\/Font\s*<<([\s\S]*?)>>/g)) for (const m of f[1].matchAll(/\/([\w.+-]+)\s+(\d+) 0 R/g)) names.set(m[1], Number(m[2]));
  }
  let out = "";
  for (const b of objs.values()) {
    if (/\/Type\s*\/(Font|XObject|FontDescriptor)/.test(b)) continue;
    const c = stream(b);
    if (!c || !/BT[\s\S]*ET/.test(c)) continue;
    let map = null;
    for (const t of c.matchAll(/\/([\w.+-]+)\s+[\d.]+\s+Tf|<([0-9A-Fa-f\s]+)>/g)) {
      if (t[1]) map = fontMap.get(names.get(t[1])) ?? null;
      else if (t[2] && map) {
        const h = t[2].replace(/\s/g, "");
        for (let i = 0; i + 4 <= h.length; i += 4) out += map.get(parseInt(h.slice(i, i + 4), 16)) ?? "";
      }
    }
  }
  return out.replace(/\s+/g, "");
}

/** HTML → 비교용 글자(태그 제거, 엔티티 일부 복원, 공백 합침) */
export function htmlText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

/** content/procedures/*.mdx 의 sources URL (중복 제거) */
export function sourceUrls(dir = PROCEDURES_DIR) {
  const urls = new Set();
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".mdx") && !x.startsWith("_"))) {
    for (const m of fs.readFileSync(path.join(dir, f), "utf8").matchAll(/^\s+url: "([^"]+)"/gm)) urls.add(m[1]);
  }
  return [...urls];
}

async function main() {
  const urls = sourceUrls();
  let bad = 0;
  for (const url of urls) {
    const key = Object.keys(CHECK).find((k) => url.includes(k));
    let status = 0;
    let missing = [];
    try {
      const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
      status = res.status;
      const buf = Buffer.from(await res.arrayBuffer());
      const text = url.includes("flSeq=") ? pdfText(buf) : htmlText(buf.toString("utf8"));
      missing = (key ? CHECK[key] : []).filter((p) => !text.includes(p));
    } catch (err) {
      missing = [`요청 실패: ${err.message}`];
    }
    const ok = status === 200 && key && !missing.length;
    if (!ok) bad++;
    console.log(`${status} ${!key ? "NO-CHECK(확인 문구 없음)" : missing.length ? `MISSING ${JSON.stringify(missing)}` : `OK(${CHECK[key].length})`} ${url}`);
  }
  console.log(`[verify-sources] ${urls.length} URL, 문제 ${bad}건 (${new Date().toLocaleDateString("sv-SE")} 현지 날짜)`);
  if (bad) process.exit(1);
}

if (path.basename(process.argv[1] ?? "") === "verify-sources.mjs") await main();
