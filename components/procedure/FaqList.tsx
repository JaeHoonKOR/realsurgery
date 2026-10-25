"use client";

import { ChevronDown } from "lucide-react";
import { useRef, type SyntheticEvent } from "react";
import type { ProcedureFaq } from "@/lib/content";
import { track } from "@/lib/track";

type Props = { procedureId: string; items: ProcedureFaq[] };

/**
 * FAQ 아코디언 (4절 P-03: 질문 5~8개, expand_faq). 네이티브 <details> — 답변이 처음부터 HTML 에 있어
 * 검색엔진·AI 크롤러가 읽고(FAQPage JSON-LD 와 같은 문장), JS 없이도 열린다. 질문마다 처음 열 때 1회만 이벤트.
 */
export function FaqList({ procedureId, items }: Props) {
  const opened = useRef(new Set<string>());

  const onToggle = (faq: ProcedureFaq) => (e: SyntheticEvent<HTMLDetailsElement>) => {
    if (!e.currentTarget.open || opened.current.has(faq.id)) return;
    opened.current.add(faq.id);
    track("expand_faq", { procedure_id: procedureId, question_index: faq.order });
  };

  return (
    <div data-testid="faq-list" className="divide-y divide-line rounded-xl border border-line">
      {items.map((faq) => (
        <details key={faq.id} className="group" data-testid="faq-item" onToggle={onToggle(faq)}>
          <summary className="flex min-h-14 cursor-pointer list-none items-start gap-3 px-5 py-4 text-left md:px-6 md:py-5 [&::-webkit-details-marker]:hidden">
            <span aria-hidden="true" className="mt-px shrink-0 text-lg font-bold text-brand-strong">
              Q
            </span>
            <span className="flex-1 text-lg font-semibold tracking-tight text-ink">{faq.question}</span>
            <ChevronDown
              aria-hidden="true"
              className="mt-1 size-5 shrink-0 text-ink-subtle transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="flex gap-3 px-5 pb-5 md:px-6 md:pb-6">
            <span aria-hidden="true" className="shrink-0 text-lg font-bold text-ink-faint">
              A
            </span>
            <p className="text-base text-ink-muted">{faq.answer}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
