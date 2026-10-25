import { ExternalLink } from "lucide-react";
import type { Source } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { josa } from "@/lib/procedure/josa";
import { PAGE_SECTION_IDS } from "@/lib/procedure/toc";

function host(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** 출처 (CLAUDE.md "시술 정보에는 출처 필수", 6절 E-E-A-T) — 외부 링크는 새 창 + noopener noreferrer */
export function SourceList({ sources, updatedAt, authorName }: { sources: Source[]; updatedAt: string; authorName: string }) {
  if (sources.length === 0) return null;
  return (
    <section id={PAGE_SECTION_IDS.sources} aria-labelledby="sources-title" data-testid="procedure-sources" className="scroll-mt-6">
      <h2 id="sources-title" className="text-h2 font-bold tracking-tight text-ink">
        참고한 자료
      </h2>
      <p className="mt-2 text-ink-muted">
        회복기간과 부작용 설명은 아래 학회·의료기관 자료를 바탕으로 {josa(authorName, "이/가")} 정리했고,{" "}
        {formatDate(updatedAt)}에 마지막으로 확인했습니다.
      </p>
      <ul className="mt-5 divide-y divide-line rounded-lg border border-line">
        {sources.map((s) => (
          <li key={s.url}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-14 items-center justify-between gap-4 px-5 py-3 md:min-h-16 transition-colors hover:bg-canvas-soft"
            >
              <span className="min-w-0">
                <span className="block font-semibold text-ink">{s.title}</span>
                <span className="block truncate text-sm text-ink-subtle">{host(s.url)}</span>
              </span>
              <ExternalLink aria-hidden="true" className="size-4 shrink-0 text-ink-subtle" />
              <span className="sr-only">(새 창)</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
