/**
 * 빌드 시 생성된 콘텐츠 JSON(data/generated/content.json) 로더 — Node 전용(빌드·서버 컴포넌트·테스트).
 * JSON 은 scripts/build-data.mjs 가 만든다(Supabase 키가 있으면 DB, 없으면 data/seed mock).
 * 클라이언트 컴포넌트는 이 파일을 import 하지 말고 서버 컴포넌트에서 필요한 값만 props 로 받는다.
 */
import fs from "node:fs";
import path from "node:path";

export type Weekday = "Mo" | "Tu" | "We" | "Th" | "Fr" | "Sa" | "Su";

export type Category = { id: string; name: string; slug: string; order: number };
export type Source = { title: string; url: string };
export type ProcedureFaq = { id: string; question: string; answer: string; order: number };
export type Procedure = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  summary: string;
  price_low: number | null;
  price_high: number | null;
  /** 가격 단위 보충("1회 기준" 등). 없으면 1회 수술 총액 */
  price_note: string | null;
  duration_min: number | null;
  recovery_days: number | null;
  anesthesia: string | null;
  content_mdx: string | null;
  sources: Source[];
  updated_at: string;
  view_count: number;
  faqs: ProcedureFaq[];
  /** 구조화 보조 데이터(data/seed/procedure-extras.json). 없으면 null */
  extras: ProcedureExtras | null;
};
/** 회복 타임라인·대상·주의·비슷한 시술 — P-03 카드 UI용 */
export type ProcedureExtras = {
  /** 한 줄 소개(카드·메타용, 30자 내외) */
  tagline: string;
  timeline: { day: string; label: string; detail: string }[];
  good_for: string[];
  cautions: string[];
  similar: string[];
};
export type ClinicHours = { label: string; days: Weekday[]; open: string; close: string };
export type ClinicProcedure = {
  procedure_id: string;
  price_low: number | null;
  price_high: number | null;
  price_note: string | null;
  duration_min: number | null;
  price_updated_at: string;
};
export type Clinic = {
  id: string;
  name: string;
  slug: string;
  region: string;
  address: string;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  kakao_url: string | null;
  hours: ClinicHours[];
  description: string | null;
  specialties: string[];
  is_premium: boolean;
  is_partner: boolean;
  /** 가상 병원(제휴 전 예시 데이터) — 병원 상세 상단에 "예시 데이터" 표기 */
  is_demo: boolean;
  ad_review_no: string | null;
  procedures: ClinicProcedure[];
};
export type Author = { id: string; name: string; role: string | null };
export type Post = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content_mdx: string | null;
  author_id: string | null;
  published_at: string;
  updated_at: string;
};
export type Content = {
  meta: { mode: "mock" | "supabase"; generated_at: string };
  categories: Category[];
  authors: Author[];
  procedures: Procedure[];
  clinics: Clinic[];
  posts: Post[];
};

export const CONTENT_FILE = path.join(process.cwd(), "data", "generated", "content.json");

let cache: { file: string; content: Content } | null = null;

/** 콘텐츠 JSON 을 읽는다(같은 파일은 1회만 읽음). 파일이 없으면 생성 방법을 알려 주는 오류. */
export function loadContent(file: string = CONTENT_FILE): Content {
  if (cache?.file === file) return cache.content;
  if (!fs.existsSync(file)) {
    throw new Error(`${file} 이 없습니다. \`node scripts/build-data.mjs\` 를 먼저 실행하세요(pnpm build·dev 가 자동 실행).`);
  }
  const content = JSON.parse(fs.readFileSync(file, "utf8")) as Content;
  cache = { file, content };
  return content;
}

/** 헤더 검색 자동완성용 최소 필드(클라이언트로 넘기는 값) */
export type SearchItem = { id: string; name: string; slug: string; category: string };

export function getSearchItems(content: Content = loadContent()): SearchItem[] {
  const categoryName = new Map(content.categories.map((c) => [c.id, c.name]));
  return content.procedures.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: categoryName.get(p.category_id) ?? "",
  }));
}
