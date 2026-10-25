/**
 * P-03·P-02 구조화 데이터 (6절 JSON-LD 표).
 * - P-03: MedicalWebPage + MedicalProcedure(수술은 SurgicalProcedure) + FAQPage 를 @graph 하나로. BreadcrumbList 는 Breadcrumb 컴포넌트가 출력.
 * - 값은 요약 박스(procedureFacts)와 같은 문자열을 그대로 쓴다(요약 박스 = JSON-LD = FAQ).
 * - 평점(AggregateRating)·후기(Review)는 절대 넣지 않는다(6절 "주의", CLAUDE.md 절대 규칙).
 */
import type { Author, Category, Procedure } from "@/lib/content";
import { procedurePath } from "@/lib/routes";
import { SITE } from "@/lib/site";
import { procedureClass, procedureDescription, procedureFacts, procedureTitle } from "./facts";

export function absoluteUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}${encodeURI(path)}`;
}

/** schema.org MedicalProcedureType 열거값(수술은 열거값이 아니라 SurgicalProcedure 타입으로 표현) */
const PROCEDURE_TYPE = {
  noninvasive: "https://schema.org/NoninvasiveProcedure",
  percutaneous: "https://schema.org/PercutaneousProcedure",
} as const;

export function procedureJsonLd({
  procedure: p,
  category,
  author,
  base,
}: {
  procedure: Procedure;
  category: Category | undefined;
  author: Author | undefined;
  base: string;
}) {
  const url = absoluteUrl(base, procedurePath(p.slug));
  const facts = new Map(procedureFacts(p).map((f) => [f.key, f]));
  const cls = procedureClass(p);
  const timeline = p.extras?.timeline ?? [];
  const followup = [
    `회복기간: ${facts.get("recovery")?.text}.`,
    timeline.length ? `회복 일정: ${timeline.map((t) => `${t.day} ${t.label}`).join(", ")}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const procedureNode = {
    "@type": cls === "surgical" ? "SurgicalProcedure" : "MedicalProcedure",
    "@id": `${url}#procedure`,
    name: p.name,
    description: p.summary,
    ...(category ? { bodyLocation: category.name } : {}),
    ...(cls === "surgical" ? {} : { procedureType: PROCEDURE_TYPE[cls] }),
    howPerformed: `마취: ${facts.get("anesthesia")?.text}. 소요시간: ${facts.get("duration")?.text}.`,
    followup,
  };

  const page = {
    "@type": "MedicalWebPage",
    "@id": `${url}#webpage`,
    url,
    name: procedureTitle(p),
    description: procedureDescription(p),
    inLanguage: "ko-KR",
    dateModified: p.updated_at,
    about: { "@id": `${url}#procedure` },
    audience: { "@type": "MedicalAudience", audienceType: "Patient" },
    author: { "@type": "Organization", name: author?.name ?? `${SITE.name} 편집팀` },
    publisher: { "@type": "Organization", name: SITE.name, url: `${base.replace(/\/+$/, "")}/` },
    citation: p.sources.map((s) => ({ "@type": "CreativeWork", name: s.title, url: s.url })),
  };

  const graph: Record<string, unknown>[] = [page, procedureNode];
  if (p.faqs.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      url,
      mainEntity: [...p.faqs]
        .sort((a, b) => a.order - b.order)
        .map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

/** P-02 목록: CollectionPage + ItemList(시술 상세 링크) */
export function procedureListJsonLd({
  procedures,
  base,
  name,
  description,
  path,
}: {
  procedures: readonly Pick<Procedure, "name" | "slug">[];
  base: string;
  name: string;
  description: string;
  path: string;
}) {
  const url = absoluteUrl(base, path);
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: "ko-KR",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: procedures.length,
      itemListElement: procedures.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: p.name,
        url: absoluteUrl(base, procedurePath(p.slug)),
      })),
    },
  };
}

/** <script type="application/ld+json"> 본문 — "</script>" 조기 종료 방지 */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
