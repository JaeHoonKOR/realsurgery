import type { Author, Source } from "@/lib/content";

/**
 * 메타 (4절 P-03: 작성자(의료 자문 포함)·최종 수정일, E-E-A-T) + 출처 목록.
 * 본문 각주 [n] 번호 = 이 목록 번호(frontmatter sources 순서).
 * 의료 자문의가 정해지기 전에는 이름을 지어내지 않고 "검토 전"으로 밝힌다(spec-question T-009).
 */
export function GuideMeta({
  author,
  reviewer,
  updatedLabel,
  updatedIso,
  sources,
}: {
  author: Author | undefined;
  reviewer: Author | undefined;
  updatedLabel: string;
  updatedIso: string;
  sources: Source[];
}) {
  return (
    <section aria-labelledby="meta-title" data-testid="procedure-meta" className="mt-14 border-t border-line pt-8">
      <h2 id="meta-title" className="text-h3 font-bold text-ink">
        작성·검토 정보와 출처
      </h2>
      <dl className="mt-4 grid gap-2 text-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
          <dt className="shrink-0 font-semibold text-ink sm:w-24">작성</dt>
          <dd className="text-ink-muted">{author ? `${author.name}${author.role ? ` (${author.role})` : ""}` : "리얼성형"}</dd>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
          <dt className="shrink-0 font-semibold text-ink sm:w-24">의료 자문</dt>
          <dd data-testid="procedure-reviewer" className="text-ink-muted">
            {reviewer ? `${reviewer.name}${reviewer.role ? ` (${reviewer.role})` : ""}` : "자문의 검토 전입니다. 공개 자료를 바탕으로 편집팀이 작성했습니다."}
          </dd>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
          <dt className="shrink-0 font-semibold text-ink sm:w-24">최종 수정일</dt>
          <dd className="text-ink-muted">
            <time dateTime={updatedIso}>{updatedLabel}</time>
          </dd>
        </div>
      </dl>
      <p className="mt-6 text-sm font-semibold text-ink">출처</p>
      <ol data-testid="procedure-sources" className="mt-1">
        {sources.map((s, i) => (
          <li key={s.url} id={`source-${i + 1}`} className="flex gap-2 text-sm">
            <span aria-hidden="true" className="inline-flex min-h-11 w-6 shrink-0 items-center font-semibold text-brand">
              [{i + 1}]
            </span>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center text-ink-muted underline underline-offset-4 hover:text-ink"
            >
              <span className="sr-only">출처 {i + 1}: </span>
              {s.title}
              <span className="sr-only">(새 창)</span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
