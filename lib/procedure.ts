/**
 * P-03 시술 상세 가이드 — 화면·JSON-LD 가 같은 값을 쓰도록 계산을 한 곳에 둔다
 * (screen-spec 4절 P-03 "요약 박스 = FAQPage·MedicalProcedure JSON-LD와 동일 값", 6절 JSON-LD·AEO).
 * Node·브라우저 공용 순수 함수(파일 I/O 없음). 데이터는 lib/content.ts 의 Content.
 */
import { formatDate, formatDuration, formatPriceRange, formatRecovery, procedureTitle } from "./format.mjs";
import type { Author, Clinic, Content, Procedure } from "./content";
import { procedurePath } from "./routes";

export { procedureTitle };

/** URL 세그먼트(퍼센트 인코딩일 수도 있음) → slug */
export function decodeSlug(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function findProcedureBySlug(content: Content, rawSlug: string): Procedure | undefined {
  const slug = decodeSlug(rawSlug).normalize("NFC");
  return content.procedures.find((p) => p.slug.normalize("NFC") === slug);
}

export type SummaryCell = { key: "price" | "duration" | "recovery" | "anesthesia"; label: string; value: string; note?: string };

/** 값이 없을 때 표기(QUALITY 2절 경계값: 가격 미정 null 등) */
export const UNKNOWN = { price: "병원 상담 후 안내", other: "진료 후 안내" } as const;

/** 요약 박스 4칸: 가격 범위·소요시간·회복기간·마취 방식 */
export function summaryCells(p: Pick<Procedure, "price_low" | "price_high" | "price_note" | "duration_min" | "recovery_days" | "anesthesia">): SummaryCell[] {
  return [
    {
      key: "price",
      label: "가격 범위",
      value: formatPriceRange(p.price_low, p.price_high) ?? UNKNOWN.price,
      ...(p.price_note ? { note: p.price_note } : {}),
    },
    { key: "duration", label: "소요시간", value: formatDuration(p.duration_min) ?? UNKNOWN.other },
    { key: "recovery", label: "회복기간", value: formatRecovery(p.recovery_days) ?? UNKNOWN.other },
    { key: "anesthesia", label: "마취 방식", value: p.anesthesia?.trim() || UNKNOWN.other },
  ];
}

const cellValue = (cells: SummaryCell[], key: SummaryCell["key"]) => cells.find((c) => c.key === key)?.value ?? "";

/** MedicalProcedure.howPerformed — 요약 박스의 마취 방식·소요시간 값을 그대로 */
export function howPerformedText(cells: SummaryCell[]): string {
  return `마취 방식: ${cellValue(cells, "anesthesia")} · 소요시간: ${cellValue(cells, "duration")}`;
}

/** MedicalProcedure.followup — 요약 박스의 회복기간 값을 그대로 */
export function followupText(cells: SummaryCell[]): string {
  return `회복기간: ${cellValue(cells, "recovery")}`;
}

const PROCEDURE_TYPE_URL = {
  surgical: "https://schema.org/SurgicalProcedure",
  noninvasive: "https://schema.org/NoninvasiveProcedure",
  percutaneous: "https://schema.org/PercutaneousProcedure",
} as const;

/** 정규 URL(퍼센트 인코딩된 한글 slug, 끝 슬래시) — canonical·JSON-LD·sitemap 공통 */
export function procedureUrl(base: string, slug: string): string {
  return `${base.replace(/\/+$/, "")}${encodeURI(procedurePath(slug))}`;
}

/**
 * P-03 JSON-LD (6절): MedicalWebPage(mainEntity = MedicalProcedure) + FAQPage (BreadcrumbList 는 공통 Breadcrumb 컴포넌트가 따로 출력).
 * AggregateRating·review 류는 넣지 않는다(의료광고 심의·YMYL).
 */
export function procedureJsonLd({
  procedure: p,
  author,
  reviewer,
  siteName,
  base,
}: {
  procedure: Procedure;
  author: Author | undefined;
  reviewer?: Author | undefined;
  siteName: string;
  base: string;
}) {
  const url = procedureUrl(base, p.slug);
  const cells = summaryCells(p);
  const guide = p.guide;
  // 문서 크기(첫 HTML 이 TCP 첫 왕복 안에 들어오게 — 로그 T-103 LCP 참고)를 위해 @id 참조 대신 중첩하고, 화면에 이미 있는
  // 선택 속성(description·citation·keywords)은 넣지 않는다. 출처는 화면 하단 "출처" 목록이 원본이다.
  const procedure: Record<string, unknown> = {
    "@type": "MedicalProcedure",
    name: p.name,
    description: p.summary,
    procedureType: PROCEDURE_TYPE_URL[guide?.procedure_type ?? "surgical"],
    ...(guide?.body_location ? { bodyLocation: guide.body_location } : {}),
    howPerformed: howPerformedText(cells),
    ...(guide?.preparation ? { preparation: guide.preparation } : {}),
    followup: followupText(cells),
  };
  const webpage: Record<string, unknown> = {
    "@type": "MedicalWebPage",
    url,
    name: procedureTitle(p.name, p.updated_at),
    inLanguage: "ko-KR",
    dateModified: p.updated_at,
    ...(author ? { author: { "@type": "Organization", name: author.name } } : {}),
    ...(reviewer ? { reviewedBy: { "@type": "Person", name: reviewer.name }, lastReviewed: p.updated_at } : {}),
    publisher: { "@type": "Organization", name: siteName },
    mainEntity: procedure,
  };
  const faq = {
    "@type": "FAQPage",
    mainEntity: p.faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };
  return { "@context": "https://schema.org", "@graph": [webpage, faq] };
}

/** <script type="application/ld+json"> 안에 안전하게 넣을 문자열 */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export type ClinicPriceRow = {
  clinic: Pick<Clinic, "id" | "name" | "slug" | "region" | "is_demo">;
  price: string;
  note: string | null;
  updated: string;
};

/** 가격 비교 표(4절: 병원별 최저~최고가 5곳) — 최저가 낮은 순, 가격 미정은 뒤로 */
export function clinicPriceRows(clinics: Clinic[], procedureId: string, limit = 5): ClinicPriceRow[] {
  const rows = clinics.flatMap((c) =>
    c.procedures
      .filter((cp) => cp.procedure_id === procedureId)
      .map((cp) => ({ c, cp })),
  );
  rows.sort((a, b) => {
    const la = a.cp.price_low ?? Number.POSITIVE_INFINITY;
    const lb = b.cp.price_low ?? Number.POSITIVE_INFINITY;
    return la - lb || (a.cp.price_high ?? 0) - (b.cp.price_high ?? 0) || a.c.name.localeCompare(b.c.name, "ko");
  });
  return rows.slice(0, limit).map(({ c, cp }) => ({
    clinic: { id: c.id, name: c.name, slug: c.slug, region: c.region, is_demo: c.is_demo },
    price: formatPriceRange(cp.price_low, cp.price_high) ?? "병원 문의",
    note: cp.price_note,
    updated: formatDate(cp.price_updated_at),
  }));
}

/** 관련 시술 카드(4절: 카드 4개) — 같은 부위 먼저(조회수 순), 모자라면 다른 부위 조회수 순 */
export function relatedProcedures(all: Procedure[], current: Procedure, count = 4): Procedure[] {
  const others = all.filter((p) => p.id !== current.id);
  const byViews = (a: Procedure, b: Procedure) => b.view_count - a.view_count || a.name.localeCompare(b.name, "ko");
  const same = others.filter((p) => p.category_id === current.category_id).sort(byViews);
  const rest = others.filter((p) => p.category_id !== current.category_id).sort(byViews);
  return [...same, ...rest].slice(0, count);
}

export type TocItem = { href: string; label: string };

/** 목차(4절: H2 앵커 목록) — 본문 H2 5개 + 가격 비교 표·FAQ */
export function tocItems(p: Procedure, extra: { prices: boolean; faq: boolean }): TocItem[] {
  const items: TocItem[] = (p.guide?.sections ?? []).map((s) => ({ href: `#${sectionAnchor(s.id)}`, label: s.title }));
  if (extra.prices) items.push({ href: `#${ANCHORS.prices}`, label: `${p.name} 병원별 가격 비교` });
  if (extra.faq) items.push({ href: `#${ANCHORS.faq}`, label: "자주 묻는 질문" });
  return items;
}

export const ANCHORS = { prices: "prices", faq: "faq" } as const;
export const sectionAnchor = (id: string) => `guide-${id}`;

/** 저자 id → 저자 */
export function authorById(authors: Author[], id: string | null | undefined): Author | undefined {
  return id ? authors.find((a) => a.id === id) : undefined;
}
