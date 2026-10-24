"use client";

import type { ProcedureFaq } from "@/lib/content";
import { track } from "@/lib/track";

/**
 * FAQ 아코디언 (4절 P-03: 질문 5~8개, FAQPage JSON-LD 와 같은 문구, 이벤트 expand_faq)
 * 네이티브 <details> — 답변은 처음부터 HTML 에 있어 검색·AI 크롤러가 읽고, JS 없이도 열린다.
 * 열 때만 expand_faq(procedure_id, question_index: 1부터)를 보낸다.
 * 펼침 표시(꺾쇠)는 SVG 대신 CSS(.faq-chevron, globals.css) — 반복 요소의 HTML 크기를 줄인다.
 */
export function FaqAccordion({ procedureId, faqs }: { procedureId: string; faqs: Pick<ProcedureFaq, "question" | "answer">[] }) {
  return (
    <ul className="faq-list">
      {faqs.map((f, i) => (
        <li key={i}>
          <details
            onToggle={(e) => {
              if (e.currentTarget.open) track("expand_faq", { procedure_id: procedureId, question_index: i + 1 });
            }}
          >
            <summary data-track="expand_faq">
              <span>{f.question}</span>
              <span aria-hidden="true" className="faq-chevron" />
            </summary>
            <p>{f.answer}</p>
          </details>
        </li>
      ))}
    </ul>
  );
}
