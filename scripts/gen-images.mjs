// AI 이미지 생성 (Gemini 이미지 모델) — content/images/prompts.json(docs/design/asset-plan.md) → 후보 WebP
// 비용이 드는 스크립트: 실행 전 장수·예상 비용을 출력하고 --max 를 넘으면 멈춘다.
// 사용: GEMINI_API_KEY=... node scripts/gen-images.mjs --batch 1 [--ids a,b] [--variants N] [--max 60] [--out-dir .gen-candidates] [--dry-run]
// 출력: <out-dir>/<id>-v<n>.webp — 후처리까지 끝난 후보(아이콘 256px·히어로 컷아웃 384px 정사각, 그 밖은 폭 1600px).
//       채택은 scripts/finalize-images.mjs 가 public/images/gen/ 으로 옮기며 1024·640 변형을 만든다.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST = path.join(ROOT, "content", "images", "prompts.json");
/** 1장 단가(USD, 표준) — https://ai.google.dev/gemini-api/docs/pricing (2026-10 확인) */
export const PRICE = { "1K": 0.0336, "2K": 0.0504, "4K": 0.113 };

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = process.argv[i + 1];
  return v && !v.startsWith("--") ? v : true;
}

export function buildPrompt(styleSuffix, item) {
  const bg = item.background ? ` Background: perfectly flat solid ${item.background}.` : "";
  return `${item.prompt}${bg}\n\nStyle: ${styleSuffix}`;
}

/** 배치·id 로 고르고, 후보 수(variants)를 정한다. --variants 가 있으면 덮어쓴다. */
export function plan(manifest, { batch, ids, variants } = {}) {
  let items = manifest.images;
  if (ids && ids !== "all") {
    const want = new Set(String(ids).split(",").map((s) => s.trim()).filter(Boolean));
    const unknown = [...want].filter((id) => !items.some((x) => x.id === id));
    if (unknown.length) throw new Error(`prompts.json 에 없는 id: ${unknown.join(", ")}`);
    items = items.filter((x) => want.has(x.id));
  } else if (batch) {
    items = items.filter((x) => String(x.batch) === String(batch));
  }
  const jobs = items.flatMap((item) => {
    const n = Number(variants ?? item.variants ?? 1);
    return Array.from({ length: n }, (_, k) => ({ item, v: k + 1 }));
  });
  const cost = jobs.reduce((sum, j) => sum + (PRICE[j.item.size ?? "2K"] ?? 0.05), 0);
  return { items, jobs, cost };
}

async function generate({ apiKey, model, text, aspect, size }) {
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`;
  const body = {
    contents: [{ parts: [{ text }] }],
    generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: aspect, imageSize: size } },
  };
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const json = await res.json();
      const parts = json.candidates?.[0]?.content?.parts ?? [];
      const img = parts.find((p) => p.inlineData?.data || p.inline_data?.data);
      if (!img) throw new Error(`이미지 없음: ${JSON.stringify(json).slice(0, 300)}`);
      return Buffer.from((img.inlineData ?? img.inline_data).data, "base64");
    }
    const msg = (await res.text()).slice(0, 300);
    if (res.status === 429 || res.status >= 500) {
      console.warn(`  재시도 ${attempt}/3 (HTTP ${res.status})`);
      await new Promise((r) => setTimeout(r, 5000 * attempt));
      continue;
    }
    throw new Error(`HTTP ${res.status}: ${msg}`);
  }
  throw new Error("재시도 3회 실패");
}

/**
 * 후처리(asset-plan 10절): 아이콘·컷아웃은 흰점 정규화 → 여백 trim → 물체가 80%를 차지하도록 정사각 패딩 → 256/384px.
 * 그 밖(장면·스틸·공간)은 폭 1600px.
 */
export async function postProcess(sharp, png, item) {
  const square = item.family === "icon" || item.id.startsWith("hero-obj");
  if (!square) return sharp(png).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  const out = item.id.startsWith("hero-obj") ? 384 : 256;
  const leveled = await sharp(png).linear(255 / 247, 0).toBuffer();
  const trimmed = await sharp(leveled).trim({ background: "#ffffff", threshold: 5 }).toBuffer({ resolveWithObject: true });
  const side = Math.round(Math.max(trimmed.info.width, trimmed.info.height) / 0.8);
  const padX = Math.max(0, side - trimmed.info.width);
  const padY = Math.max(0, side - trimmed.info.height);
  // sharp 는 한 파이프라인 안에서 resize 를 extend 보다 먼저 적용하므로 패딩을 먼저 버퍼로 만든다
  const padded = await sharp(trimmed.data)
    .extend({
      top: Math.floor(padY / 2),
      bottom: Math.ceil(padY / 2),
      left: Math.floor(padX / 2),
      right: Math.ceil(padX / 2),
      background: "#ffffff",
    })
    .toBuffer();
  return sharp(padded).resize(out, out).webp({ quality: 86 }).toBuffer();
}

/** 로컬 실행용: .env.local → .env 순서로 읽는다(이미 있는 환경 변수가 우선, 키 값은 출력하지 않음) */
function loadLocalEnv() {
  for (const name of [".env.local", ".env"]) {
    const file = path.join(ROOT, name);
    if (fs.existsSync(file) && typeof process.loadEnvFile === "function") process.loadEnvFile(file);
  }
  if (!process.env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = process.env.GEMINI_KEY ?? process.env.GOOGLE_API_KEY ?? "";
}

async function main() {
  loadLocalEnv();
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const apiKey = (process.env.GEMINI_API_KEY ?? "").trim();
  const model = String(arg("model", manifest.model ?? "gemini-nano-banana-2.1"));
  const max = Number(arg("max", 60));
  const dry = arg("dry-run", false) === true;
  const outDir = path.resolve(ROOT, String(arg("out-dir", ".gen-candidates")));
  const variantsArg = arg("variants", undefined);
  const { jobs, cost } = plan(manifest, {
    batch: arg("batch", undefined),
    ids: arg("ids", undefined),
    variants: variantsArg === undefined || variantsArg === true || variantsArg === "" ? undefined : variantsArg,
  });

  console.log(`[gen-images] 모델 ${model} · ${jobs.length}장 · 예상 비용 약 $${cost.toFixed(2)}`);
  if (jobs.length === 0) throw new Error("생성할 항목이 없습니다(--batch 또는 --ids 확인).");
  if (jobs.length > max) throw new Error(`요청 ${jobs.length}장이 상한 --max ${max} 를 넘습니다.`);
  if (dry) {
    for (const j of jobs) console.log(`  · ${j.item.id}-v${j.v} (${j.item.family}, ${j.item.aspect}, ${j.item.size})`);
    return;
  }
  if (!apiKey) throw new Error("GEMINI_API_KEY 가 없습니다.");

  const sharp = (await import("sharp")).default;
  fs.mkdirSync(outDir, { recursive: true });
  let done = 0;
  const failed = [];
  for (const { item, v } of jobs) {
    const style = manifest.styles[item.family];
    if (!style) throw new Error(`${item.id}: 알 수 없는 family ${item.family}`);
    const name = `${item.id}-v${v}.webp`;
    try {
      const png = await generate({ apiKey, model, text: buildPrompt(style, item), aspect: item.aspect, size: item.size ?? "2K" });
      fs.writeFileSync(path.join(outDir, name), await postProcess(sharp, png, item));
      done++;
      console.log(`  ✓ ${name}`);
    } catch (err) {
      failed.push(name);
      console.error(`  ✗ ${name}: ${err.message}`);
    }
  }
  console.log(`[gen-images] 완료 ${done}/${jobs.length}장 → ${path.relative(ROOT, outDir)}${failed.length ? ` · 실패: ${failed.join(", ")}` : ""}`);
  if (failed.length) process.exitCode = 1;
}

if (path.basename(process.argv[1] ?? "") === "gen-images.mjs") {
  main().catch((err) => {
    console.error(`[gen-images] ${err.message}`);
    process.exit(1);
  });
}
