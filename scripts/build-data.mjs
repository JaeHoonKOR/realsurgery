// 빌드 시 콘텐츠 JSON 생성 (screen-spec 8절 "콘텐츠: DB 메타는 빌드 스크립트가 Supabase에서 읽어 정적 JSON으로 포함")
// - Supabase 키(NEXT_PUBLIC_SUPABASE_URL·ANON_KEY)가 있으면 REST 로 콘텐츠 테이블을 읽는다.
// - 없으면 mock 모드: data/seed/*.json (실서비스형 더미 데이터)을 그대로 쓴다. (CLAUDE.md "외부 서비스 mock 모드")
// - 결과: data/generated/content.json (gitignore). lib/content.ts 가 빌드 중에 읽는다.
// - 시드 SQL: `node scripts/build-data.mjs --sql` → supabase/seed.sql (같은 data/seed 에서 생성, 직접 수정 금지)
//            `node scripts/build-data.mjs --check-sql` → seed.sql 이 data/seed 와 다르면 exit 1
// 회귀 테스트: tests/unit/build-data.test.ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const SEED_DIR = path.join(ROOT, "data", "seed");
export const GENERATED_FILE = path.join(ROOT, "data", "generated", "content.json");
export const SEED_SQL_FILE = path.join(ROOT, "supabase", "seed.sql");

/** 테이블별 컬럼과 SQL 타입. 순서 = 외래 키 의존 순서(supabase/migrations 와 같아야 한다). */
export const COLUMNS = {
  categories: { id: "text", name: "text", slug: "text", order: "int" },
  authors: { id: "text", name: "text", role: "text" },
  procedures: {
    id: "text",
    category_id: "text",
    name: "text",
    slug: "text",
    summary: "text",
    price_low: "int",
    price_high: "int",
    price_note: "text",
    duration_min: "int",
    recovery_days: "int",
    anesthesia: "text",
    content_mdx: "text",
    sources: "jsonb",
    updated_at: "date",
    view_count: "int",
  },
  procedure_faqs: { id: "text", procedure_id: "text", question: "text", answer: "text", order: "int" },
  clinics: {
    id: "text",
    name: "text",
    slug: "text",
    region: "text",
    address: "text",
    lat: "float",
    lng: "float",
    phone: "text",
    kakao_url: "text",
    hours: "jsonb",
    description: "text",
    specialties: "text[]",
    is_premium: "bool",
    is_partner: "bool",
    is_demo: "bool",
    ad_review_no: "text",
  },
  clinic_procedures: {
    clinic_id: "text",
    procedure_id: "text",
    price_low: "int",
    price_high: "int",
    price_note: "text",
    duration_min: "int",
    price_updated_at: "date",
  },
  posts: {
    id: "text",
    slug: "text",
    title: "text",
    summary: "text",
    content_mdx: "text",
    author_id: "text",
    published_at: "date",
    updated_at: "date",
  },
};
export const TABLES = Object.keys(COLUMNS);
const PRIMARY_KEY = { clinic_procedures: ["clinic_id", "procedure_id"] };
const pkOf = (table) => PRIMARY_KEY[table] ?? ["id"];

// 실서비스형 더미 데이터 금칙어(QUALITY 3절·CLAUDE.md 절대 규칙·content 금칙어)
export const BANNED_WORDS = ["테스트", "샘플", "lorem", "ipsum", "병원1", "보장", "완치", "부작용 없", "100%", "최고", "1위", "전후 사진"];
// 평점(AggregateRating) 금지 → 평점성 키 자체를 허용하지 않는다
const BANNED_KEYS = /^(rating|ratings|rating_value|ratingvalue|aggregate_rating|aggregaterating|review_score|score|stars)$/i;
const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_RE = /^[0-9a-z가-힣]+(?:-[0-9a-z가-힣]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAYS = new Set(["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/** data/seed/*.json 원본(시술에 FAQ, 병원에 시술 가격이 중첩된 작성용 구조) */
export function readSeed(dir = SEED_DIR) {
  return {
    categories: readJson(path.join(dir, "categories.json")),
    authors: readJson(path.join(dir, "authors.json")),
    procedures: readJson(path.join(dir, "procedures.json")),
    clinics: readJson(path.join(dir, "clinics.json")),
    posts: readJson(path.join(dir, "posts.json")),
  };
}

/** 작성용 중첩 구조 → DB 테이블 행(8절 데이터 모델) */
export function flattenSeed(seed) {
  const procedure_faqs = [];
  const procedures = seed.procedures.map(({ faqs = [], ...p }) => {
    faqs.forEach((f, i) =>
      procedure_faqs.push({ id: `${p.id}-${i + 1}`, procedure_id: p.id, question: f.question, answer: f.answer, order: i + 1 }),
    );
    return p;
  });
  const clinic_procedures = [];
  const clinics = seed.clinics.map(({ procedures: offered = [], ...c }) => {
    for (const cp of offered) clinic_procedures.push({ clinic_id: c.id, ...cp });
    return c;
  });
  return {
    categories: seed.categories,
    authors: seed.authors,
    procedures,
    procedure_faqs,
    clinics,
    clinic_procedures,
    posts: seed.posts,
  };
}

function pick(row, table) {
  const out = {};
  for (const col of Object.keys(COLUMNS[table])) out[col] = row[col] ?? null;
  return out;
}

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);
const ko = (a, b) => a.localeCompare(b, "ko");

/** 테이블 행 → 화면이 쓰는 JSON(시술에 FAQ, 병원에 시술 가격을 다시 붙이고 정렬) */
export function assemble(tables, meta) {
  const categories = tables.categories.map((r) => pick(r, "categories")).sort(byOrder);
  const catOrder = new Map(categories.map((c) => [c.id, c.order]));
  const faqsBy = new Map();
  for (const f of tables.procedure_faqs.map((r) => pick(r, "procedure_faqs")).sort(byOrder)) {
    const { procedure_id, ...rest } = f;
    if (!faqsBy.has(procedure_id)) faqsBy.set(procedure_id, []);
    faqsBy.get(procedure_id).push(rest);
  }
  const procedures = tables.procedures
    .map((r) => ({ ...pick(r, "procedures"), faqs: faqsBy.get(r.id) ?? [] }))
    .sort((a, b) => (catOrder.get(a.category_id) ?? 0) - (catOrder.get(b.category_id) ?? 0) || ko(a.name, b.name));
  const procOrder = new Map(procedures.map((p, i) => [p.id, i]));
  const offeredBy = new Map();
  for (const cp of tables.clinic_procedures.map((r) => pick(r, "clinic_procedures"))) {
    const { clinic_id, ...rest } = cp;
    if (!offeredBy.has(clinic_id)) offeredBy.set(clinic_id, []);
    offeredBy.get(clinic_id).push(rest);
  }
  const clinics = tables.clinics
    .map((r) => ({
      ...pick(r, "clinics"),
      procedures: (offeredBy.get(r.id) ?? []).sort((a, b) => (procOrder.get(a.procedure_id) ?? 0) - (procOrder.get(b.procedure_id) ?? 0)),
    }))
    .sort((a, b) => ko(a.name, b.name));
  const posts = tables.posts
    .map((r) => pick(r, "posts"))
    .sort((a, b) => b.published_at.localeCompare(a.published_at) || ko(a.title, b.title));
  const authors = tables.authors.map((r) => pick(r, "authors"));
  return { meta, categories, authors, procedures, clinics, posts };
}

function* walkStrings(value, at) {
  if (typeof value === "string") yield [at, value];
  else if (Array.isArray(value)) for (const [i, v] of value.entries()) yield* walkStrings(v, `${at}[${i}]`);
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) yield* walkStrings(v, `${at}.${k}`);
}

function* walkKeys(value, at) {
  if (Array.isArray(value)) for (const [i, v] of value.entries()) yield* walkKeys(v, `${at}[${i}]`);
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      yield [`${at}.${k}`, k];
      yield* walkKeys(v, `${at}.${k}`);
    }
  }
}

const isInt = (v) => Number.isInteger(v) && v >= 0;
const isDate = (v) => typeof v === "string" && DATE_RE.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));

/** 테이블 행을 검사해 문제 목록을 돌려준다(빈 배열 = 통과). */
export function validateTables(tables) {
  const problems = [];
  const bad = (msg) => problems.push(msg);

  for (const table of TABLES) {
    if (!Array.isArray(tables[table])) {
      bad(`${table}: 배열이 아님`);
      return problems;
    }
  }

  // id·slug 형식과 중복
  for (const table of TABLES) {
    if (table === "clinic_procedures") continue;
    const seen = new Set();
    for (const row of tables[table]) {
      if (typeof row.id !== "string" || !ID_RE.test(row.id)) bad(`${table}.${row.id}: id 는 ASCII 소문자·숫자·하이픈`);
      if (seen.has(row.id)) bad(`${table}.${row.id}: id 중복`);
      seen.add(row.id);
    }
  }
  for (const table of ["categories", "procedures", "clinics", "posts"]) {
    const seen = new Set();
    for (const row of tables[table]) {
      if (typeof row.slug !== "string" || !SLUG_RE.test(row.slug)) bad(`${table}.${row.id}: slug 형식 오류 (${row.slug})`);
      if (seen.has(row.slug)) bad(`${table}.${row.id}: slug 중복 (${row.slug})`);
      seen.add(row.slug);
    }
  }

  const ids = (table) => new Set(tables[table].map((r) => r.id));
  const categoryIds = ids("categories");
  const procedureIds = ids("procedures");
  const clinicIds = ids("clinics");
  const authorIds = ids("authors");

  for (const c of tables.categories) {
    if (!c.name) bad(`categories.${c.id}: name 없음`);
    if (!isInt(c.order)) bad(`categories.${c.id}: order 는 0 이상 정수`);
  }

  for (const p of tables.procedures) {
    const at = `procedures.${p.id}`;
    if (!categoryIds.has(p.category_id)) bad(`${at}: category_id ${p.category_id} 없음`);
    for (const k of ["name", "summary", "anesthesia"]) if (typeof p[k] !== "string" || !p[k].trim()) bad(`${at}: ${k} 없음`);
    for (const k of ["price_low", "price_high", "duration_min", "recovery_days"]) {
      if (p[k] !== null && !isInt(p[k])) bad(`${at}: ${k} 는 0 이상 정수 또는 null`);
    }
    if (isInt(p.price_low) && isInt(p.price_high) && p.price_low > p.price_high) bad(`${at}: price_low > price_high`);
    if (!isInt(p.view_count)) bad(`${at}: view_count 는 0 이상 정수`);
    if (!isDate(p.updated_at)) bad(`${at}: updated_at 날짜 형식 오류`);
    if (!Array.isArray(p.sources) || p.sources.length === 0) bad(`${at}: 출처(sources) 필수`);
    else {
      for (const s of p.sources) {
        if (!s || typeof s.title !== "string" || !s.title.trim()) bad(`${at}: 출처 title 없음`);
        if (!s || typeof s.url !== "string" || !/^https:\/\/[^\s]+$/.test(s.url)) bad(`${at}: 출처 url 은 https (${s?.url})`);
      }
    }
  }

  for (const f of tables.procedure_faqs) {
    if (!procedureIds.has(f.procedure_id)) bad(`procedure_faqs.${f.id}: procedure_id ${f.procedure_id} 없음`);
    if (!f.question?.trim() || !f.answer?.trim()) bad(`procedure_faqs.${f.id}: 질문·답변 필수`);
    if (!isInt(f.order)) bad(`procedure_faqs.${f.id}: order 는 0 이상 정수`);
  }

  for (const c of tables.clinics) {
    const at = `clinics.${c.id}`;
    for (const k of ["name", "region", "address"]) if (typeof c[k] !== "string" || !c[k].trim()) bad(`${at}: ${k} 없음`);
    for (const k of ["is_premium", "is_partner", "is_demo"]) if (typeof c[k] !== "boolean") bad(`${at}: ${k} 는 boolean`);
    if (!(typeof c.lat === "number" && c.lat > 33 && c.lat < 39 && typeof c.lng === "number" && c.lng > 124 && c.lng < 132)) {
      bad(`${at}: lat/lng 가 국내 범위가 아님`);
    }
    // 8절 폴백: 제휴(is_partner) 전에는 전화·카톡을 노출하지 않으므로 값도 두지 않는다. 가상 병원은 is_demo 필수.
    if (!c.is_partner && (c.phone || c.kakao_url)) bad(`${at}: 비제휴 병원에 phone/kakao_url 값이 있음`);
    if (!c.is_partner && c.is_premium) bad(`${at}: 비제휴 병원은 is_premium 일 수 없음`);
    if (c.is_premium && !c.ad_review_no) bad(`${at}: 프리미엄 노출은 의료광고 심의번호(ad_review_no) 필수`);
    if (!Array.isArray(c.specialties) || c.specialties.length === 0) bad(`${at}: specialties(진료과목) 필수`);
    if (!Array.isArray(c.hours) || c.hours.length === 0) bad(`${at}: hours 필수`);
    else {
      for (const h of c.hours) {
        const ok =
          h &&
          typeof h.label === "string" &&
          Array.isArray(h.days) &&
          h.days.length > 0 &&
          h.days.every((d) => DAYS.has(d)) &&
          TIME_RE.test(h.open) &&
          TIME_RE.test(h.close) &&
          h.open < h.close;
        if (!ok) bad(`${at}: hours 항목 형식 오류 (${JSON.stringify(h)})`);
      }
    }
  }

  const pairs = new Set();
  for (const cp of tables.clinic_procedures) {
    const at = `clinic_procedures.${cp.clinic_id}/${cp.procedure_id}`;
    if (!clinicIds.has(cp.clinic_id)) bad(`${at}: clinic_id 없음`);
    if (!procedureIds.has(cp.procedure_id)) bad(`${at}: procedure_id 없음`);
    const key = `${cp.clinic_id}/${cp.procedure_id}`;
    if (pairs.has(key)) bad(`${at}: 중복`);
    pairs.add(key);
    for (const k of ["price_low", "price_high", "duration_min"]) if (cp[k] !== null && !isInt(cp[k])) bad(`${at}: ${k} 는 0 이상 정수 또는 null`);
    if (isInt(cp.price_low) && isInt(cp.price_high) && cp.price_low > cp.price_high) bad(`${at}: price_low > price_high`);
    if (!isDate(cp.price_updated_at)) bad(`${at}: price_updated_at(갱신일) 날짜 형식 오류`);
  }

  for (const a of tables.authors) if (!a.name?.trim()) bad(`authors.${a.id}: name 없음`);

  for (const p of tables.posts) {
    const at = `posts.${p.id}`;
    if (!authorIds.has(p.author_id)) bad(`${at}: author_id ${p.author_id} 없음`);
    for (const k of ["title", "summary"]) if (typeof p[k] !== "string" || !p[k].trim()) bad(`${at}: ${k} 없음`);
    if (!isDate(p.published_at) || !isDate(p.updated_at)) bad(`${at}: 날짜 형식 오류`);
    else if (p.updated_at < p.published_at) bad(`${at}: updated_at < published_at`);
  }

  for (const [at, s] of walkStrings(tables, "")) {
    const lower = s.toLowerCase();
    for (const w of BANNED_WORDS) if (lower.includes(w.toLowerCase())) bad(`${at.slice(1)}: 금칙어 "${w}"`);
  }
  for (const [at, k] of walkKeys(tables, "")) if (BANNED_KEYS.test(k)) bad(`${at.slice(1)}: 평점성 필드 금지`);

  return problems;
}

// ---------- SQL ----------
function sqlLiteral(value, type) {
  if (value === null || value === undefined) return "null";
  switch (type) {
    case "int":
    case "float":
      if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`숫자가 아님: ${value}`);
      return String(value);
    case "bool":
      return value ? "true" : "false";
    case "jsonb":
      return `${sqlString(JSON.stringify(value))}::jsonb`;
    case "text[]":
      return value.length ? `array[${value.map(sqlString).join(", ")}]::text[]` : "'{}'::text[]";
    case "date":
      return `${sqlString(value)}::date`;
    default:
      return sqlString(String(value));
  }
}
function sqlString(s) {
  return `'${s.replace(/'/g, "''")}'`;
}

/** 테이블 행 → supabase/seed.sql (upsert, 결정적 출력) */
export function toSeedSql(tables) {
  const lines = [
    "-- 생성 파일 — 직접 수정하지 마세요.",
    "-- 원본: data/seed/*.json → `node scripts/build-data.mjs --sql`",
    "-- 실서비스형 더미 데이터. 병원은 가상(is_demo=true)이며 제휴 병원이 들어오면 교체합니다.",
    "",
  ];
  for (const table of TABLES) {
    const rows = tables[table];
    if (!rows.length) continue;
    const cols = Object.keys(COLUMNS[table]);
    const pk = pkOf(table);
    lines.push(`insert into public.${table} (${cols.map((c) => `"${c}"`).join(", ")}) values`);
    rows.forEach((row, i) => {
      const values = cols.map((c) => sqlLiteral(row[c], COLUMNS[table][c])).join(", ");
      lines.push(`  (${values})${i === rows.length - 1 ? "" : ","}`);
    });
    const updates = cols.filter((c) => !pk.includes(c)).map((c) => `"${c}" = excluded."${c}"`);
    lines.push(`on conflict (${pk.map((c) => `"${c}"`).join(", ")}) do update set ${updates.join(", ")};`, "");
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

// ---------- Supabase ----------
/** 브라우저 공개 키(anon)만 쓴다. 둘 다 있어야 실호출, 아니면 null → mock 모드. */
export function supabaseConfig(env = process.env) {
  const url = (env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
  const anonKey = (env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  return url && anonKey ? { url, anonKey } : null;
}

export async function fetchSupabaseTables({ url, anonKey }, fetchImpl = fetch) {
  const tables = {};
  for (const table of TABLES) {
    const res = await fetchImpl(`${url}/rest/v1/${table}?select=*`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Supabase ${table} 조회 실패: HTTP ${res.status}`);
    tables[table] = await res.json();
  }
  return tables;
}

/**
 * 콘텐츠 JSON 을 만든다. 키가 있으면 Supabase, 없으면 data/seed (mock).
 * @returns {Promise<{ mode: "supabase" | "mock", file: string, content: object }>}
 */
export async function buildData({
  env = process.env,
  seedDir = SEED_DIR,
  outFile = GENERATED_FILE,
  fetchImpl = fetch,
  now = () => new Date(),
  log = console.log,
} = {}) {
  const cfg = supabaseConfig(env);
  const mode = cfg ? "supabase" : "mock";
  const tables = cfg ? await fetchSupabaseTables(cfg, fetchImpl) : flattenSeed(readSeed(seedDir));
  const problems = validateTables(tables);
  if (problems.length) throw new Error(`콘텐츠 검증 실패 ${problems.length}건\n${problems.join("\n")}`);
  const content = assemble(tables, { mode, generated_at: now().toISOString() });
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, `${JSON.stringify(content, null, 2)}\n`, "utf8");
  const counts = `시술 ${content.procedures.length} · 병원 ${content.clinics.length} · 칼럼 ${content.posts.length} · 카테고리 ${content.categories.length}`;
  const rel = path.relative(ROOT, outFile).split(path.sep).join("/");
  log(
    mode === "mock"
      ? `[build-data] mock 모드로 통과 (SUPABASE 키 없음) — data/seed → ${rel} (${counts})`
      : `[build-data] Supabase → ${rel} (${counts})`,
  );
  return { mode, file: outFile, content };
}

if (path.basename(process.argv[1] ?? "") === "build-data.mjs") {
  const args = process.argv.slice(2);
  try {
    if (args.includes("--sql") || args.includes("--check-sql")) {
      const tables = flattenSeed(readSeed());
      const problems = validateTables(tables);
      if (problems.length) throw new Error(`시드 검증 실패 ${problems.length}건\n${problems.join("\n")}`);
      const sql = toSeedSql(tables);
      if (args.includes("--check-sql")) {
        const current = fs.existsSync(SEED_SQL_FILE) ? fs.readFileSync(SEED_SQL_FILE, "utf8") : "";
        if (current !== sql) throw new Error("supabase/seed.sql 이 data/seed 와 다릅니다 → node scripts/build-data.mjs --sql");
        console.log("[build-data] supabase/seed.sql 최신");
      } else {
        fs.mkdirSync(path.dirname(SEED_SQL_FILE), { recursive: true });
        fs.writeFileSync(SEED_SQL_FILE, sql, "utf8");
        console.log(`[build-data] ${path.relative(ROOT, SEED_SQL_FILE)} 생성`);
      }
    } else {
      // pnpm 스크립트는 .env.local 을 자동으로 읽지 않는다(next build 만 읽음) → 있으면 읽는다. 이미 있는 환경 변수가 우선.
      const envFile = path.join(ROOT, ".env.local");
      if (fs.existsSync(envFile) && typeof process.loadEnvFile === "function") process.loadEnvFile(envFile);
      await buildData();
    }
  } catch (err) {
    console.error(`[build-data] ${err.message}`);
    process.exit(1);
  }
}
