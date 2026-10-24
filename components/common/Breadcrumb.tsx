import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { isPathBuilt } from "@/lib/built-routes";
import { siteUrl } from "@/lib/env.public";

export type Crumb = { name: string; href?: string };

/** BreadcrumbList JSON-LD (6절). 링크가 있는 단계만 item URL 을 넣는다. */
export function breadcrumbJsonLd(items: Crumb[], base: string = siteUrl()) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      ...(c.href ? { item: `${base}${encodeURI(c.href)}` } : {}),
    })),
  };
}

/**
 * 브레드크럼 (screen-spec 3절: 홈 › 시술 가이드 › 눈 › 쌍꺼풀 수술, BreadcrumbList JSON-LD 동시 출력)
 * 마지막 단계는 현재 페이지(aria-current). 아직 없는 화면은 링크 없이 이름만 표시한다.
 */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  const last = items.length - 1;
  const resolved = items.map((c, i) => ({ name: c.name, href: i < last && c.href && isPathBuilt(c.href) ? c.href : undefined }));
  const json = JSON.stringify(breadcrumbJsonLd(resolved)).replace(/</g, "\\u003c");
  return (
    <nav aria-label="현재 위치" data-testid="breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-ink-muted">
        {resolved.map((c, i) => (
          <li key={`${i}-${c.name}`} className="flex items-center gap-1">
            {i > 0 && <ChevronRight aria-hidden="true" className="size-4" />}
            {c.href ? (
              <Link href={c.href} className="inline-flex min-h-11 items-center hover:text-ink hover:underline">
                {c.name}
              </Link>
            ) : (
              <span aria-current={i === last ? "page" : undefined} className={i === last ? "font-semibold text-ink" : undefined}>
                {c.name}
              </span>
            )}
          </li>
        ))}
      </ol>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
    </nav>
  );
}
