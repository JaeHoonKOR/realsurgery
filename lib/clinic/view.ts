/**
 * 병원 화면(P-04 목록·비교, P-05 상세) 계산 — 지역 묶음, 가격 요약, 필터, 비슷한 병원, JSON-LD.
 * 순수 함수만 둔다(파일 I/O 없음). 클라이언트 컴포넌트에서도 import 할 수 있다(타입만 lib/content 에서 가져온다).
 */
import type { Clinic, ClinicHours, ClinicProcedure, Procedure } from "@/lib/content";
import { openingHoursSpecification } from "./hours";

/* ───────────── 지역 ───────────── */

/** 시·도 표시 순서(수도권 먼저) */
const PROVINCE_ORDER = ["서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산", "세종"];

/** "서울 강남구" → "서울 강남구", "경기 성남시 분당구" → "경기 성남시" (필터 칩 단위: 시·도 + 시·군·구 1단계) */
export function regionKey(region: string): string {
  return region.trim().split(/\s+/).slice(0, 2).join(" ");
}

function provinceRank(key: string): number {
  const i = PROVINCE_ORDER.indexOf(key.split(" ")[0] ?? "");
  return i === -1 ? PROVINCE_ORDER.length : i;
}

/** 데이터에 있는 지역 칩 목록(병원 수 포함) — 수도권 먼저, 같은 시·도 안에서는 가나다순 */
export function regionOptions(regions: readonly string[]): { key: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const r of regions) {
    const k = regionKey(r);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => provinceRank(a.key) - provinceRank(b.key) || a.key.localeCompare(b.key, "ko"));
}

/* ───────────── 가격 ───────────── */

type Offer = Pick<ClinicProcedure, "procedure_id" | "price_low" | "price_high">;

/** 가장 낮은 시작가 시술(가격 미정 제외). 없으면 null */
export function lowestOffer<T extends Offer>(offers: readonly T[]): T | null {
  let best: T | null = null;
  for (const o of offers) {
    if (o.price_low == null) continue;
    if (!best || (best.price_low ?? Infinity) > o.price_low) best = o;
  }
  return best;
}

/** 병원 공개가 전체 범위(가장 낮은 시작가 ~ 가장 높은 상한) */
export function offerSpan(offers: readonly Offer[]): { low: number | null; high: number | null } {
  const lows = offers.map((o) => o.price_low).filter((v): v is number => v != null);
  const highs = offers.map((o) => o.price_high ?? o.price_low).filter((v): v is number => v != null);
  return { low: lows.length ? Math.min(...lows) : null, high: highs.length ? Math.max(...highs) : null };
}

/** 가장 최근 가격 갱신일(ISO). 없으면 null */
export function latestUpdate(offers: readonly Pick<ClinicProcedure, "price_updated_at">[]): string | null {
  return offers.map((o) => o.price_updated_at).sort().at(-1) ?? null;
}

/** "2026-10-01" → "10월 1일" (좁은 요약 칸용) */
export function formatMonthDay(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${m}월 ${d}일`;
}

/** 시술별 눈금(전체 공개가). 시술 데이터에 범위가 없으면 병원 값으로 대신한다 */
export function procedureScale(
  procedure: Pick<Procedure, "price_low" | "price_high"> | undefined,
  fallback: { low: number | null; high: number | null },
): { min: number; max: number } {
  const min = procedure?.price_low ?? fallback.low ?? 0;
  const max = procedure?.price_high ?? fallback.high ?? min;
  return { min, max: Math.max(min, max) };
}

/* ───────────── 필터 (P-04) ───────────── */

export type ClinicFilter = { region: string | null; procedure: string | null };

export const EMPTY_FILTER: ClinicFilter = { region: null, procedure: null };

type Filterable = { region: string; offers: readonly Pick<ClinicProcedure, "procedure_id">[] };

/** 지역(칩 단위)·시술 필터. null 은 "전체" */
export function filterClinics<T extends Filterable>(clinics: readonly T[], filter: ClinicFilter): T[] {
  return clinics.filter(
    (c) =>
      (!filter.region || regionKey(c.region) === filter.region) &&
      (!filter.procedure || c.offers.some((o) => o.procedure_id === filter.procedure)),
  );
}

/** 프리미엄 노출(광고)을 위에 고정하고, 나머지는 데이터 순서를 유지한다(수익 모델 1: 목록 상단 고정) */
export function premiumFirst<T extends { is_premium: boolean }>(clinics: readonly T[]): T[] {
  return [...clinics.filter((c) => c.is_premium), ...clinics.filter((c) => !c.is_premium)];
}

/** URL 쿼리 → 필터(알 수 없는 값은 버린다) */
export function parseFilter(
  search: string,
  allowed: { regions: readonly string[]; procedures: readonly string[] },
): ClinicFilter {
  const q = new URLSearchParams(search);
  const region = q.get("region");
  const procedure = q.get("procedure");
  return {
    region: region && allowed.regions.includes(region) ? region : null,
    procedure: procedure && allowed.procedures.includes(procedure) ? procedure : null,
  };
}

/** 필터 → URL 쿼리 문자열("" 또는 "?region=…") */
export function filterQuery(filter: ClinicFilter): string {
  const q = new URLSearchParams();
  if (filter.region) q.set("region", filter.region);
  if (filter.procedure) q.set("procedure", filter.procedure);
  const s = q.toString();
  return s ? `?${s}` : "";
}

/* ───────────── 거리·비슷한 병원 (P-05) ───────────── */

type Point = { lat: number | null; lng: number | null };

/** 두 좌표 사이 직선 거리(km, 하버사인). 좌표가 없으면 null */
export function distanceKm(a: Point, b: Point): number | null {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null;
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** 12.34 → "약 12km", 3.21 → "약 3.2km", 0.4 → "1km 이내" */
export function formatDistance(km: number): string {
  if (km < 1) return "1km 이내";
  if (km < 10) return `약 ${(Math.round(km * 10) / 10).toFixed(1)}km`;
  return `약 ${Math.round(km)}km`;
}

export type SimilarClinic<T> = {
  clinic: T;
  /** 겹치는 시술 id (기준 병원의 시술 순서) */
  shared: string[];
  /** 겹치는 시술 중 가장 낮은 시작가 */
  lowest: { procedure_id: string; price: number } | null;
  distance: number | null;
};

/**
 * 같은 시술을 하는 다른 병원 (4절 P-05 "같은 시술 가능 병원 3곳, 가격·거리 기준")
 * 정렬: 겹치는 시술 수 많은 순 → 겹치는 시술 최저 시작가 낮은 순 → 가까운 순.
 */
export function similarClinics<T extends Pick<Clinic, "id" | "lat" | "lng"> & { procedures: readonly Offer[] }>(
  base: T,
  all: readonly T[],
  limit = 3,
): SimilarClinic<T>[] {
  const baseIds = base.procedures.map((p) => p.procedure_id);
  return all
    .filter((c) => c.id !== base.id)
    .map((clinic) => {
      const shared = baseIds.filter((id) => clinic.procedures.some((p) => p.procedure_id === id));
      const low = lowestOffer(clinic.procedures.filter((p) => shared.includes(p.procedure_id)));
      return {
        clinic,
        shared,
        lowest: low && low.price_low != null ? { procedure_id: low.procedure_id, price: low.price_low } : null,
        distance: distanceKm(base, clinic),
      };
    })
    .filter((s) => s.shared.length > 0)
    .sort(
      (a, b) =>
        b.shared.length - a.shared.length ||
        (a.lowest?.price ?? Infinity) - (b.lowest?.price ?? Infinity) ||
        (a.distance ?? Infinity) - (b.distance ?? Infinity),
    )
    .slice(0, limit);
}

/* ───────────── 주소·JSON-LD (6절 P-05: MedicalClinic + BreadcrumbList) ───────────── */

/**
 * 주소를 PostalAddress 로 나눈다.
 * region "서울 강남구" + address "서울특별시 강남구 신사동" → 시·도 "서울특별시", 시·군·구 "강남구", 나머지 "신사동"
 */
export function addressParts(region: string, address: string) {
  const addr = address.trim().split(/\s+/);
  const locality = region.trim().split(/\s+/).slice(1);
  const addressRegion = addr[0] ?? region;
  const rest = addr.slice(1);
  const matches = locality.length > 0 && locality.every((t, i) => rest[i] === t);
  return {
    addressRegion,
    addressLocality: locality.join(" ") || addressRegion,
    streetAddress: matches ? rest.slice(locality.length).join(" ") || address : address,
  };
}

const SPECIALTY: Record<string, string> = { 성형외과: "PlasticSurgery", 피부과: "Dermatology" };

type JsonLdClinic = Pick<
  Clinic,
  "name" | "region" | "address" | "lat" | "lng" | "phone" | "description" | "specialties" | "is_partner"
> & { hours: readonly ClinicHours[] };

/**
 * schema.org MedicalClinic. 평점·후기(AggregateRating·Review)는 넣지 않는다(6절 주의, 의료광고 심의).
 * 전화번호는 값이 있고 제휴 병원일 때만(8절 폴백).
 */
export function clinicJsonLd(clinic: JsonLdClinic, url: string, services: readonly string[]) {
  const specialties = [...new Set(["PlasticSurgery", ...clinic.specialties.map((s) => SPECIALTY[s]).filter(Boolean)])];
  return {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    "@id": `${url}#clinic`,
    name: clinic.name,
    url,
    ...(clinic.description ? { description: clinic.description } : {}),
    address: { "@type": "PostalAddress", ...addressParts(clinic.region, clinic.address), addressCountry: "KR" },
    ...(clinic.lat != null && clinic.lng != null
      ? { geo: { "@type": "GeoCoordinates", latitude: clinic.lat, longitude: clinic.lng } }
      : {}),
    openingHoursSpecification: openingHoursSpecification(clinic.hours),
    medicalSpecialty: specialties.length === 1 ? specialties[0] : specialties,
    ...(clinic.is_partner && clinic.phone ? { telephone: clinic.phone } : {}),
    ...(services.length
      ? { availableService: services.map((name) => ({ "@type": "MedicalProcedure", name })) }
      : {}),
  };
}

/**
 * P-05 meta description — 병원명·지역 + 공개 시술(최대 3개 이름) + 가격 범위 + 진료 시간·위치.
 * 6절 description 규칙(120~150자)에 맞추되, 넘치면 꼬리 문장을 줄인다.
 */
export function clinicDescription(
  clinic: Pick<Clinic, "name" | "region">,
  procedureNames: readonly string[],
  span: { low: number | null; high: number | null },
  formatRange: (low: number | null, high: number | null) => string,
): string {
  const names = procedureNames.slice(0, 3).join("·");
  const more = procedureNames.length > 3 ? ` 등 ${procedureNames.length}개` : "";
  const price = span.low != null || span.high != null ? `(${formatRange(span.low, span.high)})` : "";
  const head = `${clinic.name}(${clinic.region})이 공개한 ${names}${more} 시술 가격${price}과 요일별 진료 시간, 위치를 정리했습니다.`;
  const tails = [
    " 같은 시술을 하는 다른 병원과 가격을 비교하고 상담 전에 확인하세요.",
    " 다른 병원과 같은 기준으로 비교해 보세요.",
    "",
  ];
  for (const tail of tails) if ((head + tail).length <= 150) return head + tail;
  return head.slice(0, 149) + "…";
}

/** JSON 을 <script> 안에 안전하게 넣는다 */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** 네이버 지도 검색 링크(지도 키 없이 쓰는 길찾기 진입점) */
export function naverMapUrl(query: string): string {
  return `https://map.naver.com/p/search/${encodeURIComponent(query)}`;
}

/** 라우트 params 의 slug — 한글 slug 가 인코딩된 채로 올 때도 원래 값으로 비교한다 */
export function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}
