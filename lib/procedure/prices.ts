/**
 * P-03 "병원별 공개 가격 비교"(4절: 병원별 최저~최고가 5곳) — 정렬·눈금 계산.
 * 순서는 공개 최저가 오름차순(같으면 최고가, 이름). 광고·후기와 무관한 사실 기준(1절 법적 고려).
 */
import type { Clinic, ClinicProcedure, Procedure } from "@/lib/content";

export type ClinicPriceRow = { clinic: Clinic; offer: ClinicProcedure };

export type PriceComparison = {
  rows: ClinicPriceRow[];
  /** 이 시술을 공개한 병원 수(상위 limit 개만 rows 에 담는다) */
  total: number;
  /** 모든 막대가 함께 쓰는 눈금(원) — 시술 전체 공개가 범위와 병원 가격을 모두 포함 */
  scaleMin: number;
  scaleMax: number;
  /** 가장 최근 가격 갱신일(ISO) — 없으면 null */
  latestUpdate: string | null;
};

const sortKey = (o: ClinicProcedure) => o.price_low ?? o.price_high ?? Number.POSITIVE_INFINITY;

export function comparePrices(procedure: Procedure, clinics: readonly Clinic[], limit = 5): PriceComparison {
  const all: ClinicPriceRow[] = [];
  for (const clinic of clinics) {
    const offer = clinic.procedures.find((o) => o.procedure_id === procedure.id);
    if (offer) all.push({ clinic, offer });
  }
  all.sort(
    (a, b) =>
      sortKey(a.offer) - sortKey(b.offer) ||
      (a.offer.price_high ?? Number.POSITIVE_INFINITY) - (b.offer.price_high ?? Number.POSITIVE_INFINITY) ||
      a.clinic.name.localeCompare(b.clinic.name, "ko"),
  );
  const rows = all.slice(0, Math.max(0, limit));

  const values = [
    procedure.price_low,
    procedure.price_high,
    ...rows.flatMap((r) => [r.offer.price_low, r.offer.price_high]),
  ].filter((v): v is number => typeof v === "number");
  const scaleMin = values.length ? Math.min(...values) : 0;
  const scaleMax = values.length ? Math.max(...values) : 0;
  const latestUpdate = rows.reduce<string | null>(
    (latest, r) => (latest == null || r.offer.price_updated_at > latest ? r.offer.price_updated_at : latest),
    null,
  );
  return { rows, total: all.length, scaleMin, scaleMax, latestUpdate };
}

/** 병원별 시술 공개 수(목록 카드 "병원 n곳") */
export function clinicCountByProcedure(clinics: readonly Clinic[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const c of clinics) for (const o of c.procedures) counts.set(o.procedure_id, (counts.get(o.procedure_id) ?? 0) + 1);
  return counts;
}
