import "@/styles/prose.css";
import { cx } from "@/lib/ui";

/**
 * 빌드 시 lib/procedure/markdown 이 만든 본문 HTML 을 그대로 꽂는다(서버 컴포넌트 — 클라이언트 JS 없음).
 * 원시 HTML 은 변환 단계에서 이스케이프되므로 여기 들어오는 것은 Markdown 에서 만든 태그뿐이다.
 */
export function ProseHtml({ html, variant = "body", className }: { html: string; variant?: "body" | "lead"; className?: string }) {
  if (!html) return null;
  return <div className={cx("prose-rs", variant === "lead" && "prose-lead", className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
