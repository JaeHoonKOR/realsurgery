"use client";

import type { ClinicHours } from "@/lib/content";
import { openStatus, statusText } from "@/lib/clinic/hours";
import { cx } from "@/lib/ui";
import { useNow } from "./useNow";

/**
 * 오늘 진료 상태(서울 시각) — "지금 진료 중 / 19:00에 진료 종료".
 * 빌드 HTML 에는 같은 높이의 자리만 두고 마운트 뒤 채운다(하이드레이션 불일치·레이아웃 이동 없음).
 */
export function OpenStatus({ hours, className }: { hours: ClinicHours[]; className?: string }) {
  const now = useNow();
  const result = now ? openStatus(hours, now) : null;
  const text = result ? statusText(result.status) : null;
  const open = result?.status.kind === "open";

  return (
    <span data-testid="clinic-open-status" aria-live="polite" className={cx("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden="true"
        className={cx("size-2 shrink-0 rounded-full", !text ? "bg-line" : open ? "bg-success" : "bg-ink-faint")}
      />
      {text ? (
        <span>
          <span className={cx("font-bold", open ? "text-success" : "text-ink")}>{text.title}</span>
          {text.detail && <span className="ml-1.5 text-ink-muted">{text.detail}</span>}
        </span>
      ) : (
        <span className="text-ink-subtle">진료 시간 확인 중</span>
      )}
    </span>
  );
}
