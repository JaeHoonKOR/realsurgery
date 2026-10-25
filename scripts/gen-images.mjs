// AI 이미지 생성 (Gemini 이미지 모델) — content/images/prompts.json → public/images/gen/<id>.webp
// 비용이 드는 스크립트: 실행 전 장수·예상 비용을 출력하고 --max(기본 30장) 를 넘으면 멈춘다.
// 사용: GEMINI_API_KEY=... node scripts/gen-images.mjs [--ids a,b] [--variants 2] [--max 30] [--model ...] [--dry-run]
// 출력: 후보는 out-dir(기본 .gen-candidates/)에 <id>-v<n>.webp, --final 이면 public/images/gen/<id>.webp 로 바로 저장.
// GitHub Actions(.github/workflows/gen-images.yml)에서 실행하고, 결과를 검토용 브랜치에 커밋한다.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROMPTS = path.join(ROOT, "content", "images", "prompts.json");
/** 1장 단가(USD, 2K, 표준) — https://ai.google.dev/gemini-api/docs/pricing (2026-10 확인) */
const PRICE_PER_IMAGE = { "gemini-nano-banana-2.1": 0.0504, "gemini-3.1-flash-image": 0.101, "gemini-3-pro-image": 0.134 };

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = process.argv[i + 1];
  return v && !v.startsWith("--") ? v : true;
}

export function buildPrompt(style, prompt) {
  return `${prompt}\n\nStyle: ${style}`;
}

export function selectImages(all, ids) {
  if (!ids || ids === "all") return all;
  const want = new Set(String(ids).split(",").map((s) => s.trim()).filter(Boolean));
  const unknown = [...want].filter((id) => !all.some((x) => x.id === id));
  if (unknown.length) throw new Error(`prompts.json 에 없는 id: ${unknown.join(", ")}`);
  return all.filter((x) => want.has(x.id));
}

async function generate({ apiKey, model, text, aspect }) {
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`;
  const body = {
    contents: [{ parts: [{ text }] }],
    generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: aspect, imageSize: "2K" } },
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
      await new Promise((r) => setTimeout(r, 4000 * attempt));
      continue;
    }
    throw new Error(`HTTP ${res.status}: ${msg}`);
  }
  throw new Error("재시도 3회 실패");
}

async function main() {
  const apiKey = (process.env.GEMINI_API_KEY ?? "").trim();
  const model = String(arg("model", "gemini-nano-banana-2.1"));
  const variants = Number(arg("variants", 1));
  const max = Number(arg("max", 30));
  const dry = arg("dry-run", false) === true;
  const final = arg("final", false) === true;
  const outDir = path.resolve(ROOT, final ? "public/images/gen" : String(arg("out-dir", ".gen-candidates")));

  const { styles, images } = JSON.parse(fs.readFileSync(PROMPTS, "utf8"));
  const picked = selectImages(images, arg("ids", "all"));
  const total = picked.length * variants;
  const unit = PRICE_PER_IMAGE[model] ?? 0.15;
  console.log(`[gen-images] 모델 ${model} · ${picked.length}개 × 후보 ${variants} = ${total}장 · 예상 비용 약 $${(total * unit).toFixed(2)}`);
  if (total > max) throw new Error(`요청 ${total}장이 상한 --max ${max} 를 넘습니다. 범위를 줄이거나 --max 를 올리세요.`);
  if (dry) return;
  if (!apiKey) throw new Error("GEMINI_API_KEY 가 없습니다.");

  const sharp = (await import("sharp")).default;
  fs.mkdirSync(outDir, { recursive: true });
  let done = 0;
  const failed = [];
  for (const img of picked) {
    const style = styles[img.style];
    if (!style) throw new Error(`${img.id}: 알 수 없는 style ${img.style}`);
    for (let v = 1; v <= variants; v++) {
      const name = final ? `${img.id}.webp` : `${img.id}-v${v}.webp`;
      try {
        const png = await generate({ apiKey, model, text: buildPrompt(style, img.prompt), aspect: img.aspect });
        await sharp(png).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(outDir, name));
        done++;
        console.log(`  ✓ ${name}`);
      } catch (err) {
        failed.push(`${name}: ${err.message}`);
        console.error(`  ✗ ${name}: ${err.message}`);
      }
    }
  }
  console.log(`[gen-images] 완료 ${done}/${total}장 → ${path.relative(ROOT, outDir)}`);
  if (failed.length) process.exitCode = 1;
}

if (path.basename(process.argv[1] ?? "") === "gen-images.mjs") {
  main().catch((err) => {
    console.error(`[gen-images] ${err.message}`);
    process.exit(1);
  });
}
