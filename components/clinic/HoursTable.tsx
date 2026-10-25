"use client";

import type { ClinicHours } from "@/lib/content";
import { WEEKDAY_LABEL, dayRows, formatRow, seoulClock } from "@/lib/clinic/hours";
import { cx } from "@/lib/ui";
import { useNow } from "./useNow";

/**
 * 요일별 진료 시간표. 오늘(서울 시각) 행은 마운트 뒤 강조한다 — 정적 HTML 은 빌드 시각이라 서버에서 정하지 않는다.
 * 데이터에 없는 요일은 "휴진", 공휴일은 표 아래에 따로 적는다.
 */
export function HoursTable({ hours }: { hours: ClinicHours[] }) {
  const now = useNow();
  const today = now ? seoulClock(now).day : null;
  const rows = dayRows(hours);

  return (
    <table data-testid="clinic-hours" className="w-full border-separate border-spacing-0 text-base">
      <caption className="sr-only">요일별 진료 시간</caption>
      <tbody>
        {rows.map((r) => {
          const isToday = r.day === today;
          const closed = !r.open;
          return (
            <tr key={r.day} data-today={isToday || undefined} aria-current={isToday ? "date" : undefined}>
              <th
                scope="row"
                className={cx(
                  "rounded-l-sm py-2.5 pl-3 text-left font-semibold",
                  isToday ? "bg-brand-weak text-brand-ink" : "text-ink-muted",
                )}
              >
                {WEEKDAY_LABEL[r.day]}
                {isToday && <span className="ml-2 text-xs font-bold">오늘</span>}
              </th>
              <td
                className={cx(
                  "rounded-r-sm py-2.5 pr-3 text-right tabular-nums",
                  isToday ? "bg-brand-weak font-bold text-brand-ink" : closed ? "text-ink-subtle" : "font-semibold text-ink",
                )}
              >
                {formatRow(r)}
              </td>
            </tr>
          );
        })}
        <tr>
          <th scope="row" className="py-2.5 pl-3 text-left font-semibold text-ink-muted">
            공휴일
          </th>
          <td className="py-2.5 pr-3 text-right text-ink-subtle">휴진</td>
        </tr>
      </tbody>
    </table>
  );
}
