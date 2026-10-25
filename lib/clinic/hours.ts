/**
 * 병원 진료 시간 — 요일별 표, 오늘(서울 시각) 판정, 진료 중 여부, JSON-LD openingHoursSpecification.
 * 브라우저·서버 양쪽에서 쓰는 순수 함수만 둔다(Node 전용 import 금지).
 */
import type { ClinicHours, Weekday } from "@/lib/content";

export const WEEKDAYS: readonly Weekday[] = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export const WEEKDAY_LABEL: Record<Weekday, string> = {
  Mo: "월요일",
  Tu: "화요일",
  We: "수요일",
  Th: "목요일",
  Fr: "금요일",
  Sa: "토요일",
  Su: "일요일",
};

export const WEEKDAY_SHORT: Record<Weekday, string> = {
  Mo: "월",
  Tu: "화",
  We: "수",
  Th: "목",
  Fr: "금",
  Sa: "토",
  Su: "일",
};

const SCHEMA_DAY: Record<Weekday, string> = {
  Mo: "https://schema.org/Monday",
  Tu: "https://schema.org/Tuesday",
  We: "https://schema.org/Wednesday",
  Th: "https://schema.org/Thursday",
  Fr: "https://schema.org/Friday",
  Sa: "https://schema.org/Saturday",
  Su: "https://schema.org/Sunday",
};

/** 요일 1개의 진료 시간. open·close 가 null 이면 휴진 */
export type DayRow = { day: Weekday; open: string | null; close: string | null };

/** "10:00" → 600 */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** 월~일 7행. 같은 요일이 여러 항목에 있으면 가장 이른 시작·가장 늦은 종료로 합친다. */
export function dayRows(hours: readonly ClinicHours[]): DayRow[] {
  return WEEKDAYS.map((day) => {
    const entries = hours.filter((h) => h.days.includes(day));
    if (entries.length === 0) return { day, open: null, close: null };
    const open = entries.map((e) => e.open).sort()[0] ?? null;
    const close = entries.map((e) => e.close).sort().at(-1) ?? null;
    return { day, open, close };
  });
}

/** schema.org OpeningHoursSpecification 배열 (P-05 MedicalClinic JSON-LD) */
export function openingHoursSpecification(hours: readonly ClinicHours[]) {
  return hours.map((h) => ({
    "@type": "OpeningHoursSpecification" as const,
    dayOfWeek: h.days.map((d) => SCHEMA_DAY[d]),
    opens: h.open,
    closes: h.close,
  }));
}

const SEOUL = "Asia/Seoul";
const EN_WEEKDAY: Record<string, Weekday> = { Mon: "Mo", Tue: "Tu", Wed: "We", Thu: "Th", Fri: "Fr", Sat: "Sa", Sun: "Su" };

/** 서울 시각 기준 요일·분. 정적 빌드라 서버 시각이 아니라 방문 시점(브라우저)에서 계산한다. */
export function seoulClock(date: Date): { day: Weekday; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SEOUL,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const day = EN_WEEKDAY[get("weekday")] ?? "Mo";
  return { day, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

export type OpenStatus =
  | { kind: "open"; close: string }
  | { kind: "before"; open: string }
  | { kind: "after" }
  | { kind: "dayoff" };

/** 지금(서울 시각) 진료 중인가 — 진료 중·진료 전·진료 종료·오늘 휴진 */
export function openStatus(hours: readonly ClinicHours[], date: Date): { day: Weekday; status: OpenStatus } {
  const { day, minutes } = seoulClock(date);
  const row = dayRows(hours).find((r) => r.day === day);
  if (!row?.open || !row.close) return { day, status: { kind: "dayoff" } };
  if (minutes < toMinutes(row.open)) return { day, status: { kind: "before", open: row.open } };
  if (minutes < toMinutes(row.close)) return { day, status: { kind: "open", close: row.close } };
  return { day, status: { kind: "after" } };
}

/** 상태 문구 — "지금 진료 중 · 19:00 종료" 대신 짧은 2단 표기를 위해 제목·보조를 나눠 돌려준다 */
export function statusText(status: OpenStatus): { title: string; detail: string | null } {
  switch (status.kind) {
    case "open":
      return { title: "지금 진료 중", detail: `${status.close}에 진료 종료` };
    case "before":
      return { title: "진료 시작 전", detail: `오늘 ${status.open}에 진료 시작` };
    case "after":
      return { title: "오늘 진료 종료", detail: null };
    case "dayoff":
      return { title: "오늘은 휴진", detail: null };
  }
}

/** "10:00–19:00" / "휴진" */
export function formatRow(row: DayRow): string {
  return row.open && row.close ? `${row.open}–${row.close}` : "휴진";
}

/**
 * 비교표용 요약: 평일(월~금) 시간 묶음, 토요일, 일요일.
 * 평일은 같은 시간끼리 묶는다 → ["월·화·목·금 10:00–19:00", "수 10:00–21:00"]
 */
export function weekSummary(hours: readonly ClinicHours[]): { weekday: string[]; saturday: string; sunday: string } {
  const rows = dayRows(hours);
  const groups = new Map<string, Weekday[]>();
  for (const r of rows.slice(0, 5)) {
    const key = formatRow(r);
    groups.set(key, [...(groups.get(key) ?? []), r.day]);
  }
  const weekday = [...groups.entries()].map(([time, days]) => {
    const label = days.length === 5 ? "월–금" : days.map((d) => WEEKDAY_SHORT[d]).join("·");
    return `${label} ${time}`;
  });
  const sat = rows[5];
  const sun = rows[6];
  return { weekday, saturday: sat ? formatRow(sat) : "휴진", sunday: sun ? formatRow(sun) : "휴진" };
}
