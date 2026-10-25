import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BANNED_WORDS,
  SEED_SQL_FILE,
  TABLES,
  assemble,
  buildData,
  fetchSupabaseTables,
  flattenSeed,
  readSeed,
  supabaseConfig,
  toSeedSql,
  validateTables,
  type Tables,
} from "../../scripts/build-data.mjs";

const seedTables = () => flattenSeed(readSeed());
const clone = (t: Tables): Tables => JSON.parse(JSON.stringify(t));
type Row = Record<string, unknown>;

const tmp: string[] = [];
afterEach(() => {
  for (const d of tmp.splice(0)) fs.rmSync(d, { recursive: true, force: true });
});

describe("data/seed — 실서비스형 더미 데이터 (QUALITY 3절)", () => {
  const t = seedTables();

  it("시술 10 · 병원 7 · 칼럼 3, 시술마다 FAQ 5개", () => {
    expect(t.procedures).toHaveLength(10);
    expect(t.clinics).toHaveLength(7);
    expect(t.posts).toHaveLength(3);
    for (const p of t.procedures) {
      expect(t.procedure_faqs.filter((f) => f.procedure_id === p.id), String(p.id)).toHaveLength(5);
    }
  });

  it("P-01 부위별 바로가기 6개(눈·코·윤곽·리프팅·피부·가슴)", () => {
    expect(t.categories.map((c) => c.name)).toEqual(["눈", "코", "윤곽", "리프팅", "피부", "가슴"]);
  });

  it("검증 규칙을 모두 통과한다", () => {
    expect(validateTables(t)).toEqual([]);
  });

  it("병원은 가상(is_demo) · 비제휴라 전화·카톡·프리미엄·심의번호가 없다(8절 폴백)", () => {
    for (const c of t.clinics) {
      expect(c).toMatchObject({ is_demo: true, is_partner: false, is_premium: false, phone: null, kakao_url: null });
    }
  });

  it("시술마다 https 출처가 있고 가격 범위가 올바르다", () => {
    for (const p of t.procedures) {
      const sources = p.sources as { url: string }[];
      expect(sources.length).toBeGreaterThanOrEqual(3);
      for (const s of sources) expect(s.url).toMatch(/^https:\/\//);
      expect(p.price_low as number).toBeLessThanOrEqual(p.price_high as number);
    }
  });

  it("병원 가격은 해당 시술의 전체 가격 범위 안에 있다", () => {
    const byId = new Map(t.procedures.map((p) => [p.id, p]));
    for (const cp of t.clinic_procedures) {
      const p = byId.get(cp.procedure_id)!;
      expect(cp.price_low as number, `${cp.clinic_id}/${cp.procedure_id}`).toBeGreaterThanOrEqual(p.price_low as number);
      expect(cp.price_high as number, `${cp.clinic_id}/${cp.procedure_id}`).toBeLessThanOrEqual(p.price_high as number);
    }
  });
});

describe("validateTables — 잘못된 데이터를 막는다", () => {
  const mutate = (fn: (t: Tables) => void) => {
    const t = clone(seedTables());
    fn(t);
    return validateTables(t);
  };
  const first = (t: Tables, table: keyof Tables) => t[table][0] as Row;

  it.each([
    ["금칙어(테스트)", (t: Tables) => (first(t, "posts").title = "테스트 칼럼"), /금칙어 "테스트"/],
    ["금칙어(샘플)", (t: Tables) => (first(t, "clinics").description = "샘플 병원"), /금칙어 "샘플"/],
    ["효과 보장 문구", (t: Tables) => (first(t, "procedure_faqs").answer = "효과를 보장합니다"), /금칙어 "보장"/],
    ["평점 필드", (t: Tables) => (first(t, "clinics").rating = 4.8), /평점성 필드 금지/],
    ["출처 없음", (t: Tables) => (first(t, "procedures").sources = []), /출처\(sources\) 필수/],
    ["http 출처", (t: Tables) => (first(t, "procedures").sources = [{ title: "x", url: "http://a.kr" }]), /https/],
    ["가격 역전", (t: Tables) => Object.assign(first(t, "procedures"), { price_low: 9, price_high: 1 }), /price_low > price_high/],
    ["음수 가격", (t: Tables) => (first(t, "procedures").price_low = -1), /0 이상 정수/],
    ["없는 카테고리", (t: Tables) => (first(t, "procedures").category_id = "hair"), /category_id hair 없음/],
    ["없는 시술 FAQ", (t: Tables) => (first(t, "procedure_faqs").procedure_id = "nope"), /procedure_id nope 없음/],
    ["없는 저자", (t: Tables) => (first(t, "posts").author_id = "nobody"), /author_id nobody 없음/],
    ["비ASCII id", (t: Tables) => (first(t, "clinics").id = "단하늘"), /id 는 ASCII/],
    ["slug 공백", (t: Tables) => (first(t, "procedures").slug = "쌍꺼풀 수술"), /slug 형식 오류/],
    ["slug 중복", (t: Tables) => ((t.procedures[1] as Row).slug = first(t, "procedures").slug), /slug 중복/],
    ["id 중복", (t: Tables) => ((t.categories[1] as Row).id = first(t, "categories").id), /id 중복/],
    ["비제휴 병원 전화번호", (t: Tables) => (first(t, "clinics").phone = "02-000-0000"), /비제휴 병원에 phone/],
    ["비제휴 프리미엄", (t: Tables) => (first(t, "clinics").is_premium = true), /is_premium/],
    ["좌표 범위", (t: Tables) => (first(t, "clinics").lat = 0), /lat\/lng/],
    ["운영시간 형식", (t: Tables) => ((first(t, "clinics").hours as Row[])[0]!.open = "25:00"), /hours 항목 형식 오류/],
    ["진료과목 없음", (t: Tables) => (first(t, "clinics").specialties = []), /specialties/],
    ["날짜 형식", (t: Tables) => (first(t, "procedures").updated_at = "2026/10/24"), /updated_at 날짜 형식/],
    ["칼럼 날짜 역전", (t: Tables) => Object.assign(first(t, "posts"), { published_at: "2026-10-20", updated_at: "2026-10-01" }), /updated_at < published_at/],
    ["병원 가격 중복", (t: Tables) => t.clinic_procedures.push({ ...(t.clinic_procedures[0] as Row) }), /중복/],
    ["갱신일 없음", (t: Tables) => (first(t, "clinic_procedures").price_updated_at = null), /갱신일/],
    ["테이블 누락", (t: Tables) => delete (t as Partial<Tables>).posts, /posts: 배열이 아님/],
  ])("%s", (_name, fn, expected) => {
    expect(mutate(fn).join("\n")).toMatch(expected);
  });

  it("프리미엄 노출은 심의번호가 있어야 한다", () => {
    const problems = mutate((t) => Object.assign(first(t, "clinics"), { is_partner: true, is_premium: true, ad_review_no: null }));
    expect(problems.join("\n")).toMatch(/심의번호/);
  });

  it("금칙어 목록에 더미 표기·효과 보장·순위 표현이 있다", () => {
    expect(BANNED_WORDS).toEqual(expect.arrayContaining(["테스트", "샘플", "보장", "100%", "최고", "1위"]));
  });
});

describe("assemble — 화면용 JSON", () => {
  const content = assemble(seedTables(), { mode: "mock", generated_at: "2026-10-25T00:00:00.000Z" }) as {
    categories: Row[];
    procedures: (Row & { faqs: Row[] })[];
    clinics: (Row & { procedures: Row[] })[];
    posts: Row[];
  };

  it("카테고리 순서, 시술은 카테고리 순서대로, FAQ 는 order 순", () => {
    expect(content.categories.map((c) => c.order)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(content.procedures[0]!.category_id).toBe("eye");
    expect(content.procedures.at(-1)!.category_id).toBe("breast");
    const faqs = content.procedures.find((p) => p.id === "double-eyelid")!.faqs;
    expect(faqs.map((f) => f.order)).toEqual([1, 2, 3, 4, 5]);
    expect(faqs[0]).not.toHaveProperty("procedure_id");
  });

  it("병원에 시술 가격이 붙고, 칼럼은 최신순", () => {
    const danhaneul = content.clinics.find((c) => c.id === "danhaneul")!;
    expect(danhaneul.procedures.map((p) => p.procedure_id)).toContain("double-eyelid");
    expect(danhaneul.procedures[0]).not.toHaveProperty("clinic_id");
    const dates = content.posts.map((p) => p.published_at as string);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it("DB 에 없는 필드는 null 로 채운다(스키마 고정)", () => {
    const t = seedTables();
    delete (t.posts[0] as Row).content_mdx;
    const out = assemble(t, {}) as { posts: Row[] };
    expect(out.posts.some((p) => p.content_mdx === null)).toBe(true);
  });
});

describe("seed.sql", () => {
  it("저장소의 supabase/seed.sql 이 data/seed 와 같다", () => {
    expect(fs.readFileSync(SEED_SQL_FILE, "utf8")).toBe(toSeedSql(seedTables()));
  });

  it("작은따옴표 이스케이프·jsonb·text[]·null·date·upsert", () => {
    const t = Object.fromEntries(TABLES.map((k) => [k, []])) as unknown as Tables;
    t.categories = [{ id: "eye", name: "눈's", slug: "눈", order: 1 }];
    t.clinics = [
      {
        id: "c1",
        name: "가",
        slug: "가",
        region: "서울",
        address: "서울",
        lat: 37.5,
        lng: 127,
        phone: null,
        kakao_url: null,
        hours: [{ label: "월" }],
        description: null,
        specialties: [],
        is_premium: false,
        is_partner: false,
        is_demo: true,
        ad_review_no: null,
      },
    ];
    t.clinic_procedures = [
      { clinic_id: "c1", procedure_id: "p1", price_low: 1, price_high: 2, price_note: null, duration_min: null, price_updated_at: "2026-10-01" },
    ];
    const sql = toSeedSql(t);
    expect(sql).toContain("('eye', '눈''s', '눈', 1)");
    expect(sql).toContain(`'[{"label":"월"}]'::jsonb`);
    expect(sql).toContain("'{}'::text[]");
    expect(sql).toContain("37.5, 127, null, null");
    expect(sql).toContain("'2026-10-01'::date");
    expect(sql).toContain('on conflict ("clinic_id", "procedure_id") do update set');
    expect(sql).not.toContain("public.posts");
    expect(() => toSeedSql({ ...t, categories: [{ id: "x", name: "x", slug: "x", order: "1" }] })).toThrow(/숫자가 아님/);
  });

  it("text[] 값은 array[...] 로 쓴다", () => {
    expect(toSeedSql(seedTables())).toContain("array['성형외과', '피부과']::text[]");
  });
});

describe("buildData — mock 모드와 Supabase 모드", () => {
  const outFile = () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "build-data-"));
    tmp.push(dir);
    return path.join(dir, "nested", "content.json");
  };

  it("supabaseConfig: URL·anon 키가 둘 다 있어야 실호출", () => {
    expect(supabaseConfig({})).toBeNull();
    expect(supabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co" })).toBeNull();
    expect(
      supabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: " https://x.supabase.co/ ", NEXT_PUBLIC_SUPABASE_ANON_KEY: " k " }),
    ).toEqual({ url: "https://x.supabase.co", anonKey: "k" });
  });

  it("키가 없으면 data/seed 로 JSON 을 만들고 'mock 모드로 통과'를 남긴다", async () => {
    const file = outFile();
    const log = vi.fn();
    const fetchImpl = vi.fn();
    const r = await buildData({ env: {}, outFile: file, fetchImpl, log, now: () => new Date("2026-10-25T00:00:00Z") });
    expect(r.mode).toBe("mock");
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(log.mock.calls[0]![0]).toMatch(/mock 모드로 통과/);
    const json = JSON.parse(fs.readFileSync(file, "utf8"));
    expect(json.meta).toEqual({ mode: "mock", generated_at: "2026-10-25T00:00:00.000Z" });
    expect(json.procedures).toHaveLength(10);
  });

  it("키가 있으면 Supabase REST 로 테이블을 읽는다(anon 키 헤더)", async () => {
    const t = seedTables();
    const fetchImpl = vi.fn(async (url: string) => {
      const table = new URL(url).pathname.split("/").pop() as keyof Tables;
      return new Response(JSON.stringify(t[table]), { status: 200 });
    });
    const r = await buildData({
      env: { NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon" },
      outFile: outFile(),
      fetchImpl: fetchImpl as unknown as typeof fetch,
      log: () => {},
    });
    expect(r.mode).toBe("supabase");
    expect(fetchImpl).toHaveBeenCalledTimes(TABLES.length);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://x.supabase.co/rest/v1/categories?select=*");
    expect(init.headers).toMatchObject({ apikey: "anon", Authorization: "Bearer anon" });
  });

  it("Supabase 오류·검증 실패는 빌드를 멈춘다", async () => {
    const cfg = { url: "https://x.supabase.co", anonKey: "anon" };
    await expect(
      fetchSupabaseTables(cfg, (async () => new Response("no", { status: 401 })) as typeof fetch),
    ).rejects.toThrow(/HTTP 401/);

    const bad = clone(seedTables());
    (bad.posts[0] as Row).title = "샘플 칼럼";
    const fetchImpl = (async (url: string) =>
      new Response(JSON.stringify(bad[new URL(url).pathname.split("/").pop() as keyof Tables]))) as typeof fetch;
    await expect(
      buildData({ env: { NEXT_PUBLIC_SUPABASE_URL: cfg.url, NEXT_PUBLIC_SUPABASE_ANON_KEY: "a" }, outFile: outFile(), fetchImpl, log: () => {} }),
    ).rejects.toThrow(/콘텐츠 검증 실패/);
  });
});
