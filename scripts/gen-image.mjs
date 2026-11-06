// 시술 일러스트 생성 (docs/IMAGES.md "Gemini 생성 규칙")
//
// 사용:
//   node scripts/gen-image.mjs                    플레이스홀더 갱신 → (키 있으면) 아직 생성 이미지가 없는 시술마다 후보 3장 생성
//   node scripts/gen-image.mjs --only rhinoplasty,thread-lift   대상 시술 지정
//   node scripts/gen-image.mjs --force            이미 생성된 시술도 다시 후보 생성
//   node scripts/gen-image.mjs --select double-eyelid=2,rhinoplasty=1
//        → 에이전트가 test-results/gen-image/<id>-<n>.png 를 Read 로 열어 고른 번호. WebP 1200×800·600×400 변환,
//          매니페스트 갱신, 나머지 후보 삭제
//   node scripts/gen-image.mjs --placeholders-only
//
// 규칙
// - 키(GEMINI_API_KEY, lib/env.ts KEYS.GEMINI 와 같은 변수)가 없으면 API 를 부르지 않는다 → 플레이스홀더 + "needs-key".
// - API 가 결제·쿼터·권한 오류를 주면 즉시 멈추고 플레이스홀더를 유지한다. 결제 활성화·계정 설정 변경은 하지 않는다.
// - 키 값은 출력·저장하지 않는다(오류 본문에서도 가린다).
// - 하루 60장(요청 수 기준, 한국 시간) 한도. 넘으면 남은 시술은 다음 루프로 미룬다.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { ROOT, todayKst, writeText } from "./brand-kit.mjs";
import { PLACEHOLDER_DIR, writePlaceholders } from "./placeholders.mjs";

export const MODEL_DEFAULT = "gemini-2.5-flash-image";
export const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
/** lib/env.ts KEYS.GEMINI.vars 와 같아야 한다(tests/unit/gen-image.test.ts 가 고정) */
export const GEMINI_VARS = ["GEMINI_API_KEY"];
export const DAILY_CAP = 60;
export const CANDIDATES = 3;
export const SIZES = [
  { suffix: "", width: 1200, height: 800 },
  { suffix: "-sm", width: 600, height: 400 },
];

export const MANIFEST_FILE = path.join(ROOT, "public", "images", "manifest.json");
export const IMAGE_DIR = path.join(ROOT, "public", "images", "procedures");
export const IMAGE_URL = "/images/procedures";
/** 후보 PNG 임시 폴더(gitignore). 선택 후 삭제한다. */
export const CANDIDATE_DIR = path.join(ROOT, "test-results", "gen-image");
export const PROCEDURES_FILE = path.join(ROOT, "data", "seed", "procedures.json");

/** IMAGES.md 고정 접두사 — 모든 이미지 동일 */
export const STYLE_PREFIX =
  "Flat vector illustration, soft pastel palette (#F7F3EF background, accent #D97B66 and #2F6F6B), clean geometric shapes, no people, no faces, no text, no photorealism, medical-information mood, generous whitespace, centered composition, 3:2 aspect.";

/** 접두사 뒤에 붙는 금지 재강조(모든 이미지 동일) */
export const NEGATIVE_SUFFIX =
  "Do not draw letters, numbers, logos, people, skin, body parts, medical instruments, needles or blood.";

/** 시술별 추상 주제 + 한글 alt. 신체 노출·수술 도구·혈액 묘사 금지(IMAGES.md). */
export const SUBJECTS = {
  "double-eyelid": {
    subject: "stylized eye outline with a gentle fold line and small sparkle",
    alt: "쌍꺼풀 수술을 상징하는 접힘 선이 있는 눈 일러스트",
  },
  epicanthoplasty: {
    subject: "stylized almond eye outline with a soft curved accent at the inner corner",
    alt: "앞트임을 상징하는 눈 앞머리 곡선 일러스트",
  },
  "ptosis-correction": {
    subject: "stylized open eye outline with a small gentle upward arrow arc above it",
    alt: "눈매교정을 상징하는 또렷하게 뜬 눈 일러스트",
  },
  "lower-fat-repositioning": {
    subject: "stylized eye outline with a smooth soft crescent curve beneath it",
    alt: "눈밑지방재배치를 상징하는 눈 아래 부드러운 곡선 일러스트",
  },
  rhinoplasty: {
    subject: "abstract profile curve with a smooth bridge line and a dotted guide line",
    alt: "코 성형을 상징하는 옆모습 곡선 일러스트",
  },
  "square-jaw-reduction": {
    subject: "soft geometric jawline curve with rounded corners",
    alt: "사각턱 수술을 상징하는 부드러운 턱선 곡선 일러스트",
  },
  "zygoma-reduction": {
    subject: "soft geometric oval with gentle inward arcs at the cheek level",
    alt: "광대 축소술을 상징하는 안쪽으로 모이는 곡선 일러스트",
  },
  "thread-lift": {
    subject: "three flowing upward curved lines with small rounded arrow tips",
    alt: "실리프팅을 상징하는 위로 향하는 곡선 일러스트",
  },
  "laser-toning": {
    subject: "soft concentric light circles over a smooth even surface pattern",
    alt: "레이저 토닝을 상징하는 동심원 빛 일러스트",
  },
  "breast-augmentation": {
    subject: "abstract symmetric flowing ribbon curves mirrored around a dotted vertical axis",
    alt: "가슴 확대 수술을 상징하는 좌우 대칭 곡선 일러스트",
  },
};

export function buildPrompt(id) {
  const s = SUBJECTS[id];
  if (!s) throw new Error(`[gen-image] ${id} 주제가 없습니다. SUBJECTS 에 추가하세요.`);
  return `${STYLE_PREFIX} Subject: ${s.subject}. ${NEGATIVE_SUFFIX}`;
}

/** 키 가드 — 값은 돌려주지 않는다 */
export function geminiKeyStatus(env = process.env) {
  const missing = GEMINI_VARS.filter((v) => (env[v] ?? "").trim() === "");
  return { ok: missing.length === 0, missing };
}

/** API 오류 분류. billing·quota·permission 은 "멈추고 needs-key" 대상. */
export function classifyApiError(status, body) {
  const text = String(body ?? "").toLowerCase();
  if (/billing|billed|payment|prepay|free tier is not available/.test(text)) return "billing";
  if (status === 429 || /resource_exhausted|quota|rate limit/.test(text)) return "quota";
  if (
    status === 401 ||
    status === 403 ||
    /permission_denied|unauthenticated|api key not valid|api_key_invalid|not available in your country|user location is not supported/.test(text)
  )
    return "permission";
  return "other";
}
export const STOP_KINDS = new Set(["billing", "quota", "permission"]);

export class GeminiError extends Error {
  constructor(kind, status, message) {
    super(message);
    this.name = "GeminiError";
    this.kind = kind;
    this.status = status;
  }
}

export function redact(text, secret) {
  const s = String(text ?? "");
  return secret ? s.split(secret).join("[REDACTED]") : s;
}

/** Gemini generateContent 1회 → PNG(또는 응답 형식) Buffer */
export async function requestImage({ key, model = MODEL_DEFAULT, prompt, fetchImpl = fetch }) {
  const res = await fetchImpl(`${API_BASE}/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "3:2" } },
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new GeminiError(classifyApiError(res.status, text), res.status, redact(text.slice(0, 400), key));
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new GeminiError("other", res.status, "응답이 JSON 이 아닙니다");
  }
  const cand = json?.candidates?.[0];
  const part = (cand?.content?.parts ?? []).find((p) => p?.inlineData?.data || p?.inline_data?.data);
  if (!part) throw new GeminiError("no-image", res.status, `응답에 이미지가 없습니다 (finishReason: ${cand?.finishReason ?? "없음"})`);
  return Buffer.from((part.inlineData ?? part.inline_data).data, "base64");
}

// ── 매니페스트 ──────────────────────────────────────────────

export function emptyManifest() {
  return { version: 1, generator: "scripts/gen-image.mjs", stylePrefix: STYLE_PREFIX, dailyCap: DAILY_CAP, usage: {}, procedures: [], slots: [] };
}

export function readManifest(file = MANIFEST_FILE) {
  if (!fs.existsSync(file)) return emptyManifest();
  return { ...emptyManifest(), ...JSON.parse(fs.readFileSync(file, "utf8")) };
}

/** 최근 7일 사용량만 남긴다 */
export function writeManifest(manifest, file = MANIFEST_FILE) {
  const dates = Object.keys(manifest.usage ?? {}).sort().slice(-7);
  const usage = Object.fromEntries(dates.map((d) => [d, manifest.usage[d]]));
  writeText(file, JSON.stringify({ ...manifest, usage }, null, 2));
}

export function remainingToday(manifest, date, cap = DAILY_CAP) {
  return Math.max(0, cap - (manifest.usage?.[date] ?? 0));
}

export function recordUsage(manifest, date, n = 1) {
  return { ...manifest, usage: { ...manifest.usage, [date]: (manifest.usage?.[date] ?? 0) + n } };
}

/** 시술당 후보 perTarget 장이 다 들어가는 만큼만 오늘 실행, 나머지는 다음 루프 */
export function planBatch(ids, remaining, perTarget = CANDIDATES) {
  const fit = Math.max(0, Math.floor(remaining / perTarget));
  return { run: ids.slice(0, fit), deferred: ids.slice(fit) };
}

/**
 * 플레이스홀더 항목과 기존 매니페스트를 합친다.
 * 생성 이미지가 있고 파일도 실제로 있으면 그대로 두고, 없으면 플레이스홀더 항목으로 채운다(자리 비움 금지).
 */
export function mergeEntries(manifest, placeholders, { date, fileExists }) {
  const prev = new Map((manifest.procedures ?? []).map((e) => [e.slug, e]));
  const procedures = placeholders.procedures.map((ph) => {
    const old = prev.get(ph.slug);
    if (old?.kind === "generated" && fileExists(old.file) && fileExists(old.fileSm)) return { ...old, placeholder: ph.file };
    const keepDate = old?.kind === "placeholder" && old.file === ph.file ? old.date : date;
    return {
      slug: ph.slug,
      kind: "placeholder",
      file: ph.file,
      fileSm: ph.file,
      width: ph.width,
      height: ph.height,
      alt: ph.alt,
      prompt: SUBJECTS[ph.slug] ? buildPrompt(ph.slug) : null,
      date: keepDate,
      model: null,
      placeholder: ph.file,
    };
  });
  return { ...manifest, stylePrefix: STYLE_PREFIX, dailyCap: DAILY_CAP, procedures, slots: placeholders.slots };
}

/** PNG → WebP 2종 */
export async function toWebp(input, outDir, id) {
  fs.mkdirSync(outDir, { recursive: true });
  const files = [];
  for (const s of SIZES) {
    const out = path.join(outDir, `${id}${s.suffix}.webp`);
    await sharp(input).resize(s.width, s.height, { fit: "cover", position: "centre" }).webp({ quality: 82 }).toFile(out);
    files.push(out);
  }
  return files;
}

function candidateFiles(dir, id) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.startsWith(`${id}-`) && /^\d+\.png$/.test(f.slice(id.length + 1)))
    .map((f) => path.join(dir, f));
}

export function parseArgs(argv) {
  const value = (flag) => {
    const i = argv.indexOf(flag);
    return i > -1 ? (argv[i + 1] ?? "") : undefined;
  };
  const list = (s) => (s ? s.split(",").map((x) => x.trim()).filter(Boolean) : []);
  const select = list(value("--select")).map((pair) => {
    const [id, n] = pair.split("=");
    if (!id || !/^\d+$/.test(n ?? "")) throw new Error(`--select 형식: <id>=<번호> (받은 값: ${pair})`);
    return { id, n: Number(n) };
  });
  return { only: list(value("--only")), select, force: argv.includes("--force"), placeholdersOnly: argv.includes("--placeholders-only") };
}

/**
 * 실행 본체(테스트에서 경로·fetch·env 를 바꿔 끼운다).
 * @returns {Promise<{ status: "placeholders" | "needs-key" | "candidates" | "selected" | "deferred", needsKey?: string, candidates?: string[], selected?: string[], deferred?: string[] }>}
 */
export async function run({
  argv = [],
  env = process.env,
  fetchImpl = fetch,
  procedures = JSON.parse(fs.readFileSync(PROCEDURES_FILE, "utf8")),
  date = todayKst(),
  manifestFile = MANIFEST_FILE,
  imageDir = IMAGE_DIR,
  imageUrl = IMAGE_URL,
  candidateDir = CANDIDATE_DIR,
  placeholderDir = PLACEHOLDER_DIR,
  publicDir = path.join(ROOT, "public"),
  colors,
  log = console.log,
} = {}) {
  const args = parseArgs(argv);
  const model = (env.GEMINI_IMAGE_MODEL ?? "").trim() || MODEL_DEFAULT;
  const placeholders = writePlaceholders(procedures, { outDir: placeholderDir, ...(colors ? { colors } : {}) });
  const fileExists = (url) => typeof url === "string" && fs.existsSync(path.join(publicDir, url));
  let manifest = mergeEntries(readManifest(manifestFile), placeholders, { date, fileExists });
  log(`[gen-image] 플레이스홀더 ${placeholders.procedures.length + placeholders.slots.length}개 갱신 → ${path.relative(ROOT, placeholderDir) || placeholderDir}`);

  // 1) 후보 선택 → WebP 변환
  if (args.select.length) {
    const selected = [];
    for (const { id, n } of args.select) {
      const src = path.join(candidateDir, `${id}-${n}.png`);
      if (!fs.existsSync(src)) throw new Error(`[gen-image] 후보 없음: ${path.relative(ROOT, src)}`);
      const metaFile = path.join(candidateDir, `${id}.json`);
      const meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, "utf8")) : {};
      await toWebp(src, imageDir, id);
      const ph = placeholders.procedures.find((p) => p.slug === id);
      manifest = {
        ...manifest,
        procedures: manifest.procedures.map((e) =>
          e.slug !== id
            ? e
            : {
                slug: id,
                kind: "generated",
                file: `${imageUrl}/${id}.webp`,
                fileSm: `${imageUrl}/${id}-sm.webp`,
                width: 1200,
                height: 800,
                alt: SUBJECTS[id]?.alt ?? ph?.alt ?? "",
                prompt: meta.prompt ?? buildPrompt(id),
                date: meta.date ?? date,
                model: meta.model ?? model,
                placeholder: ph?.file ?? e.placeholder,
              },
        ),
      };
      for (const f of [...candidateFiles(candidateDir, id), metaFile]) if (fs.existsSync(f)) fs.unlinkSync(f);
      selected.push(id);
      log(`[gen-image] ${id}: 후보 ${n} 선택 → ${imageUrl}/${id}.webp, ${id}-sm.webp (나머지 후보 삭제)`);
    }
    writeManifest(manifest, manifestFile);
    return { status: "selected", selected };
  }

  if (args.placeholdersOnly) {
    writeManifest(manifest, manifestFile);
    return { status: "placeholders" };
  }

  // 2) 키 가드
  const key = geminiKeyStatus(env);
  if (!key.ok) {
    writeManifest(manifest, manifestFile);
    const needsKey = `${key.missing.join(", ")} 없음`;
    log(`[gen-image] mock 모드로 통과: ${needsKey} → API 호출 없이 플레이스홀더 사용 (needs-key)`);
    return { status: "needs-key", needsKey };
  }
  const secret = env.GEMINI_API_KEY.trim();

  // 3) 대상·한도
  const known = new Set(procedures.map((p) => p.id));
  const wanted = (args.only.length ? args.only : procedures.map((p) => p.id)).filter((id) => {
    if (!known.has(id)) throw new Error(`[gen-image] 알 수 없는 시술 ID: ${id}`);
    const e = manifest.procedures.find((x) => x.slug === id);
    return args.force || e?.kind !== "generated";
  });
  const plan = planBatch(wanted, remainingToday(manifest, date));
  if (plan.deferred.length) log(`[gen-image] 일일 한도(${DAILY_CAP}장) 때문에 다음 루프로 미룸: ${plan.deferred.join(", ")}`);

  // 4) 후보 생성
  fs.mkdirSync(candidateDir, { recursive: true });
  const candidates = [];
  for (const id of plan.run) {
    const prompt = buildPrompt(id);
    for (const old of candidateFiles(candidateDir, id)) fs.unlinkSync(old);
    let made = 0;
    for (let i = 1; i <= CANDIDATES; i++) {
      manifest = recordUsage(manifest, date, 1);
      writeManifest(manifest, manifestFile); // 중간에 죽어도 사용량은 남긴다
      try {
        const png = await requestImage({ key: secret, model, prompt, fetchImpl });
        const out = path.join(candidateDir, `${id}-${i}.png`);
        fs.writeFileSync(out, png);
        candidates.push(out);
        made++;
      } catch (err) {
        if (err instanceof GeminiError && STOP_KINDS.has(err.kind)) {
          const needsKey = `Gemini API ${err.kind} 오류 (HTTP ${err.status}) — 결제·쿼터·권한 설정은 변경하지 않음`;
          log(`[gen-image] 중단: ${needsKey}. 플레이스홀더 유지 (needs-key). 응답 요약: ${redact(err.message, secret).slice(0, 200)}`);
          return { status: "needs-key", needsKey, candidates };
        }
        log(`[gen-image] ${id} 후보 ${i} 실패(${err instanceof GeminiError ? err.kind : "error"}): ${redact(err.message, secret).slice(0, 200)}`);
      }
    }
    if (made) writeText(path.join(candidateDir, `${id}.json`), JSON.stringify({ prompt, model, date }, null, 2));
  }
  writeManifest(manifest, manifestFile);
  if (candidates.length) {
    log(`[gen-image] 후보 ${candidates.length}장 → Read 로 열어 팔레트·얼굴 없음·글자 없음·여백 기준으로 1장씩 고른 뒤:`);
    log(`  node scripts/gen-image.mjs --select ${plan.run.map((id) => `${id}=<번호>`).join(",")}`);
    for (const c of candidates) log(`  ${path.relative(ROOT, c)}`);
    return { status: "candidates", candidates, deferred: plan.deferred };
  }
  return { status: plan.deferred.length ? "deferred" : "placeholders", deferred: plan.deferred, candidates };
}

if (path.basename(process.argv[1] ?? "") === "gen-image.mjs") {
  // pnpm 스크립트는 .env.local 을 자동으로 읽지 않는다 → 있으면 읽는다(이미 있는 환경 변수가 우선)
  const envFile = path.join(ROOT, ".env.local");
  if (fs.existsSync(envFile) && typeof process.loadEnvFile === "function") process.loadEnvFile(envFile);
  run({ argv: process.argv.slice(2) }).catch((err) => {
    console.error(redact(err instanceof Error ? err.message : String(err), (process.env.GEMINI_API_KEY ?? "").trim()));
    process.exit(1);
  });
}
