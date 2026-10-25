import { Info } from "lucide-react";
import { DEMO_NOTICE } from "@/lib/consult/mode";
import { cx } from "@/lib/ui";

/**
 * 시연 모드 안내 — Supabase 키 없이 배포한 정적 사이트에서만(lib/consult/mode.ts).
 * 접수가 서버로 가지 않는다는 사실을 제출 직전·완료 화면에서 분명히 알린다. 오류가 아니므로 회색 안내 상자로 차분하게.
 */
export function DemoNotice({ className, testId = "consult-demo-notice" }: { className?: string; testId?: string }) {
  return (
    <div role="note" data-testid={testId} className={cx("flex gap-3 rounded-md bg-canvas px-4 py-3.5", className)}>
      <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ink-muted" />
      <p className="min-w-0 text-sm text-ink-muted">
        <strong className="font-semibold text-ink">{DEMO_NOTICE.lead}</strong> {DEMO_NOTICE.body}
      </p>
    </div>
  );
}
