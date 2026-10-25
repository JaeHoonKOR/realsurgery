import { ChevronDown } from "lucide-react";
import { ProseHtml } from "./ProseHtml";

/**
 * 본문 보조 설명 접기 — 네이티브 <details>(서버 컴포넌트, JS 없음). 접힌 내용도 처음부터 HTML 에 있어
 * 검색엔진·AI 크롤러가 읽고, 브라우저 찾기(Ctrl+F)·앵커 이동 때 저절로 열린다.
 * 같은 "자세히 보기"가 여러 개라 화면낭독기용으로 어느 섹션인지(topic)를 붙인다.
 */
export function ProseMore({ html, topic }: { html: string; topic: string }) {
  if (!html) return null;
  return (
    <details data-testid="prose-more" className="group/more mt-3 md:mt-4">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center gap-1 rounded-md bg-canvas px-4 font-semibold text-ink-muted transition-colors select-none hover:bg-line hover:text-ink [&::-webkit-details-marker]:hidden">
        <span className="group-open/more:hidden">자세히 보기</span>
        <span className="hidden group-open/more:inline">접기</span>
        <span className="sr-only">: {topic}</span>
        <ChevronDown aria-hidden="true" className="size-5 transition-transform group-open/more:rotate-180" />
      </summary>
      <ProseHtml html={html} className="mt-5" />
    </details>
  );
}
