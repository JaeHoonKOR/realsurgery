import { describe, expect, it } from "vitest";
import {
  INITIAL_COMPARE,
  MAX_COMPARE,
  canCompare,
  compareReducer,
  compareRows,
  lowestStart,
  type CompareState,
} from "@/lib/clinic/compare";
import {
  dayRows,
  formatRow,
  openStatus,
  openingHoursSpecification,
  seoulClock,
  statusText,
  toMinutes,
  weekSummary,
} from "@/lib/clinic/hours";
import { slugParams } from "@/lib/clinic/static-params";
import {
  EMPTY_FILTER,
  addressParts,
  clinicDescription,
  clinicJsonLd,
  decodeSlug,
  distanceKm,
  filterClinics,
  filterQuery,
  formatDistance,
  formatMonthDay,
  jsonLdScript,
  latestUpdate,
  lowestOffer,
  naverMapUrl,
  offerSpan,
  parseFilter,
  premiumFirst,
  procedureScale,
  regionKey,
  regionOptions,
  similarClinics,
} from "@/lib/clinic/view";
import type { ClinicHours } from "@/lib/content";
import { formatPriceRange } from "@/lib/format";

const HOURS: ClinicHours[] = [
  { label: "월·화·목·금", days: ["Mo", "Tu", "Th", "Fr"], open: "10:00", close: "19:00" },
  { label: "수", days: ["We"], open: "10:00", close: "21:00" },
  { label: "토", days: ["Sa"], open: "10:00", close: "15:00" },
];

/** 서울 시각(UTC+9) 기준 Date — 2026-10-26 은 월요일 */
const seoul = (iso: string) => new Date(`${iso}+09:00`);

describe("lib/clinic/hours — 진료 시간", () => {
  it("월~일 7행, 데이터에 없는 요일(일요일)은 휴진", () => {
    const rows = dayRows(HOURS);
    expect(rows.map((r) => r.day)).toEqual(["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]);
    expect(rows[2]).toEqual({ day: "We", open: "10:00", close: "21:00" });
    expect(rows[6]).toEqual({ day: "Su", open: null, close: null });
    expect(formatRow(rows[0]!)).toBe("10:00–19:00");
    expect(formatRow(rows[6]!)).toBe("휴진");
  });

  it("같은 요일이 여러 항목이면 가장 이른 시작·가장 늦은 종료로 합친다", () => {
    const rows = dayRows([
      { label: "오전", days: ["Mo"], open: "09:00", close: "13:00" },
      { label: "오후", days: ["Mo"], open: "14:00", close: "18:30" },
    ]);
    expect(rows[0]).toEqual({ day: "Mo", open: "09:00", close: "18:30" });
  });

  it("openingHoursSpecification: 항목마다 schema.org 요일 URL·opens·closes", () => {
    expect(openingHoursSpecification(HOURS)).toEqual([
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "https://schema.org/Monday",
          "https://schema.org/Tuesday",
          "https://schema.org/Thursday",
          "https://schema.org/Friday",
        ],
        opens: "10:00",
        closes: "19:00",
      },
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["https://schema.org/Wednesday"], opens: "10:00", closes: "21:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["https://schema.org/Saturday"], opens: "10:00", closes: "15:00" },
    ]);
  });

  it("오늘 판정은 브라우저 시간대가 아니라 서울 시각 기준", () => {
    // UTC 일요일 16:30 = 서울 월요일 01:30
    expect(seoulClock(new Date("2026-10-25T16:30:00Z"))).toEqual({ day: "Mo", minutes: 90 });
    expect(seoulClock(seoul("2026-10-31T23:59:00"))).toEqual({ day: "Sa", minutes: 23 * 60 + 59 });
    expect(toMinutes("09:30")).toBe(570);
  });

  it("진료 중·진료 전·진료 종료·휴진", () => {
    expect(openStatus(HOURS, seoul("2026-10-26T09:00:00"))).toEqual({ day: "Mo", status: { kind: "before", open: "10:00" } });
    expect(openStatus(HOURS, seoul("2026-10-26T10:00:00")).status).toEqual({ kind: "open", close: "19:00" });
    expect(openStatus(HOURS, seoul("2026-10-28T20:30:00")).status).toEqual({ kind: "open", close: "21:00" });
    expect(openStatus(HOURS, seoul("2026-10-26T19:00:00")).status).toEqual({ kind: "after" });
    expect(openStatus(HOURS, seoul("2026-11-01T12:00:00"))).toEqual({ day: "Su", status: { kind: "dayoff" } });
  });

  it("상태 문구", () => {
    expect(statusText({ kind: "open", close: "19:00" })).toEqual({ title: "지금 진료 중", detail: "19:00에 진료 종료" });
    expect(statusText({ kind: "before", open: "10:00" })).toEqual({ title: "진료 시작 전", detail: "오늘 10:00에 진료 시작" });
    expect(statusText({ kind: "after" })).toEqual({ title: "오늘 진료 종료", detail: null });
    expect(statusText({ kind: "dayoff" })).toEqual({ title: "오늘은 휴진", detail: null });
  });

  it("주간 요약: 같은 평일 시간끼리 묶고 토·일 따로", () => {
    expect(weekSummary(HOURS)).toEqual({
      weekday: ["월·화·목·금 10:00–19:00", "수 10:00–21:00"],
      saturday: "10:00–15:00",
      sunday: "휴진",
    });
    expect(weekSummary([{ label: "월–금", days: ["Mo", "Tu", "We", "Th", "Fr"], open: "09:30", close: "18:30" }]).weekday).toEqual([
      "월–금 09:30–18:30",
    ]);
  });
});

describe("lib/clinic/compare — 비교 담기 리듀서", () => {
  const add = (s: CompareState, id: string) => compareReducer(s, { type: "toggle", id });

  it("담기·빼기(토글), 2곳부터 비교 가능", () => {
    let s = add(INITIAL_COMPARE, "a");
    expect(s.ids).toEqual(["a"]);
    expect(canCompare(s)).toBe(false);
    s = add(s, "b");
    expect(canCompare(s)).toBe(true);
    s = add(s, "a");
    expect(s.ids).toEqual(["b"]);
  });

  it(`최대 ${MAX_COMPARE}곳 — 4번째는 담지 않고 blocked 로 알린다`, () => {
    let s = ["a", "b", "c"].reduce(add, INITIAL_COMPARE);
    s = add(s, "d");
    expect(s.ids).toEqual(["a", "b", "c"]);
    expect(s.blocked).toBe("d");
    // 하나 빼면 안내가 사라지고 다시 담을 수 있다
    s = compareReducer(s, { type: "remove", id: "b" });
    expect(s).toEqual({ ids: ["a", "c"], blocked: null });
    s = add(s, "d");
    expect(s.ids).toEqual(["a", "c", "d"]);
  });

  it("dismiss·clear", () => {
    const full = add(["a", "b", "c"].reduce(add, INITIAL_COMPARE), "d");
    expect(compareReducer(full, { type: "dismiss" })).toEqual({ ids: ["a", "b", "c"], blocked: null });
    const quiet = { ids: ["a"], blocked: null };
    expect(compareReducer(quiet, { type: "dismiss" })).toBe(quiet);
    expect(compareReducer(full, { type: "clear" })).toEqual(INITIAL_COMPARE);
  });

  it("비교 표 행: 선택 병원 중 한 곳이라도 공개한 시술만, 시술 순서 유지", () => {
    const procs = [{ id: "p1" }, { id: "p2" }, { id: "p3" }];
    const rows = compareRows(procs, [{ offers: [{ procedure_id: "p3" }] }, { offers: [{ procedure_id: "p1" }] }]);
    expect(rows.map((r) => r.id)).toEqual(["p1", "p3"]);
  });

  it("시작가 최저: 2곳 이상 공개했고 단독 최저일 때만", () => {
    expect(lowestStart([{ id: "a", price_low: 70 }, { id: "b", price_low: 60 }])).toBe("b");
    expect(lowestStart([{ id: "a", price_low: 70 }, { id: "b", price_low: null }])).toBeNull();
    expect(lowestStart([{ id: "a", price_low: 60 }, { id: "b", price_low: 60 }])).toBeNull();
  });
});

const card = (id: string, region: string, procs: string[], extra: Partial<{ is_premium: boolean }> = {}) => ({
  id,
  region,
  is_premium: extra.is_premium ?? false,
  offers: procs.map((procedure_id) => ({ procedure_id })),
});

describe("lib/clinic/view — 지역·필터", () => {
  it("지역 칩 단위: 시·도 + 시·군·구", () => {
    expect(regionKey("서울 강남구")).toBe("서울 강남구");
    expect(regionKey("경기 성남시 분당구")).toBe("경기 성남시");
  });

  it("지역 칩 목록: 수도권 먼저, 같은 시·도는 가나다순, 병원 수", () => {
    expect(regionOptions(["부산 해운대구", "서울 송파구", "경기 성남시 분당구", "서울 강남구", "서울 강남구", "제주 제주시"])).toEqual([
      { key: "서울 강남구", count: 2 },
      { key: "서울 송파구", count: 1 },
      { key: "경기 성남시", count: 1 },
      { key: "부산 해운대구", count: 1 },
      { key: "제주 제주시", count: 1 },
    ]);
  });

  it("지역·시술 필터(null = 전체)", () => {
    const list = [card("a", "서울 강남구", ["eye"]), card("b", "서울 서초구", ["nose"]), card("c", "서울 강남구", ["nose"])];
    expect(filterClinics(list, EMPTY_FILTER).map((c) => c.id)).toEqual(["a", "b", "c"]);
    expect(filterClinics(list, { region: "서울 강남구", procedure: null }).map((c) => c.id)).toEqual(["a", "c"]);
    expect(filterClinics(list, { region: null, procedure: "nose" }).map((c) => c.id)).toEqual(["b", "c"]);
    expect(filterClinics(list, { region: "서울 강남구", procedure: "nose" }).map((c) => c.id)).toEqual(["c"]);
    expect(filterClinics(list, { region: "서울 서초구", procedure: "eye" })).toEqual([]);
  });

  it("프리미엄(광고) 병원만 위로, 나머지는 데이터 순서", () => {
    const list = [card("a", "x", []), card("b", "x", [], { is_premium: true }), card("c", "x", [])];
    expect(premiumFirst(list).map((c) => c.id)).toEqual(["b", "a", "c"]);
  });

  it("URL 쿼리 ↔ 필터 (알 수 없는 값은 버림)", () => {
    const allowed = { regions: ["서울 강남구"], procedures: ["eye"] };
    const q = filterQuery({ region: "서울 강남구", procedure: "eye" });
    expect(q).toBe("?region=%EC%84%9C%EC%9A%B8+%EA%B0%95%EB%82%A8%EA%B5%AC&procedure=eye");
    expect(parseFilter(q, allowed)).toEqual({ region: "서울 강남구", procedure: "eye" });
    expect(parseFilter("?region=부산&procedure=hack", allowed)).toEqual(EMPTY_FILTER);
    expect(filterQuery(EMPTY_FILTER)).toBe("");
  });
});

describe("lib/clinic/view — 가격·비슷한 병원", () => {
  const offers = [
    { procedure_id: "a", price_low: 700000, price_high: 2200000, price_updated_at: "2026-10-01" },
    { procedure_id: "b", price_low: null, price_high: null, price_updated_at: "2026-10-05" },
    { procedure_id: "c", price_low: 400000, price_high: null, price_updated_at: "2026-09-28" },
  ];

  it("최저 시작가·전체 범위·최근 갱신일(가격 미정 제외)", () => {
    expect(lowestOffer(offers)?.procedure_id).toBe("c");
    expect(lowestOffer([{ procedure_id: "x", price_low: null, price_high: null }])).toBeNull();
    expect(offerSpan(offers)).toEqual({ low: 400000, high: 2200000 });
    expect(offerSpan([])).toEqual({ low: null, high: null });
    expect(latestUpdate(offers)).toBe("2026-10-05");
    expect(latestUpdate([])).toBeNull();
    expect(formatMonthDay("2026-10-01")).toBe("10월 1일");
  });

  it("눈금: 시술 전체 공개가, 없으면 병원 값", () => {
    expect(procedureScale({ price_low: 500000, price_high: 2500000 }, { low: 1, high: 2 })).toEqual({ min: 500000, max: 2500000 });
    expect(procedureScale(undefined, { low: 100, high: 300 })).toEqual({ min: 100, max: 300 });
    expect(procedureScale({ price_low: null, price_high: null }, { low: null, high: null })).toEqual({ min: 0, max: 0 });
  });

  it("거리(하버사인)·표기", () => {
    const gangnam = { lat: 37.5216, lng: 127.0204 };
    const seocho = { lat: 37.4877, lng: 127.0174 };
    const km = distanceKm(gangnam, seocho)!;
    expect(km).toBeGreaterThan(3.6);
    expect(km).toBeLessThan(3.9);
    expect(distanceKm(gangnam, { lat: null, lng: null })).toBeNull();
    expect(formatDistance(0.4)).toBe("1km 이내");
    expect(formatDistance(3.78)).toBe("약 3.8km");
    expect(formatDistance(20.4)).toBe("약 20km");
  });

  it("같은 시술 병원: 겹치는 시술 수 → 최저 시작가 → 거리, 자기 자신·겹침 0 제외, 최대 3곳", () => {
    const base = {
      id: "base",
      lat: 37.5,
      lng: 127.0,
      procedures: [
        { procedure_id: "a", price_low: 1, price_high: 2 },
        { procedure_id: "b", price_low: 1, price_high: 2 },
      ],
    };
    const mk = (id: string, procs: [string, number | null][], lat = 37.5) => ({
      id,
      lat,
      lng: 127.0,
      procedures: procs.map(([procedure_id, price_low]) => ({ procedure_id, price_low, price_high: null })),
    });
    const all = [
      base,
      mk("one-cheap", [["a", 100]]),
      mk("two-far", [["a", 500], ["b", 900]], 37.9),
      mk("two-near", [["a", 500], ["b", 900]], 37.51),
      mk("two-cheaper", [["a", 300], ["b", 900]], 38.2),
      mk("none", [["z", 1]]),
    ];
    const out = similarClinics(base, all, 3);
    expect(out.map((s) => s.clinic.id)).toEqual(["two-cheaper", "two-near", "two-far"]);
    expect(out[0]).toMatchObject({ shared: ["a", "b"], lowest: { procedure_id: "a", price: 300 } });
    expect(similarClinics(base, all, 10).map((s) => s.clinic.id)).not.toContain("none");
  });
});

describe("lib/clinic/view — JSON-LD·메타·링크", () => {
  const clinic = {
    name: "단하늘성형외과",
    region: "서울 강남구",
    address: "서울특별시 강남구 신사동",
    lat: 37.5216,
    lng: 127.0204,
    phone: null,
    description: "눈 성형과 코 성형을 중심으로 진료하는 성형외과입니다.",
    specialties: ["성형외과"],
    is_partner: false,
    hours: HOURS,
  };
  const url = "https://example.com/realsurgery/clinics/%EB%8B%A8%ED%95%98%EB%8A%98%EC%84%B1%ED%98%95%EC%99%B8%EA%B3%BC/";

  it("주소 → PostalAddress", () => {
    expect(addressParts("서울 강남구", "서울특별시 강남구 신사동")).toEqual({
      addressRegion: "서울특별시",
      addressLocality: "강남구",
      streetAddress: "신사동",
    });
    expect(addressParts("경기 성남시 분당구", "경기도 성남시 분당구 정자동")).toEqual({
      addressRegion: "경기도",
      addressLocality: "성남시 분당구",
      streetAddress: "정자동",
    });
    // 지역과 주소 형식이 다르면 전체 주소를 그대로 둔다
    expect(addressParts("서울 강남구", "강남대로 1").streetAddress).toBe("강남대로 1");
  });

  it("MedicalClinic: 주소·좌표·진료시간·진료과, 평점·후기 없음, 비제휴 전화 없음", () => {
    const ld = clinicJsonLd(clinic, url, ["쌍꺼풀 수술"]);
    expect(ld).toMatchObject({
      "@context": "https://schema.org",
      "@type": "MedicalClinic",
      name: "단하늘성형외과",
      url,
      address: { "@type": "PostalAddress", addressRegion: "서울특별시", addressLocality: "강남구", addressCountry: "KR" },
      geo: { "@type": "GeoCoordinates", latitude: 37.5216, longitude: 127.0204 },
      medicalSpecialty: "PlasticSurgery",
      availableService: [{ "@type": "MedicalProcedure", name: "쌍꺼풀 수술" }],
    });
    expect(ld.openingHoursSpecification).toHaveLength(3);
    const json = JSON.stringify(ld);
    expect(json).not.toMatch(/AggregateRating|Review|ratingValue/);
    expect(ld).not.toHaveProperty("telephone");
  });

  it("제휴 병원이고 번호가 있을 때만 telephone, 피부과는 Dermatology 추가", () => {
    const ld = clinicJsonLd({ ...clinic, is_partner: true, phone: "02-000-0000", specialties: ["성형외과", "피부과"] }, url, []);
    expect(ld).toMatchObject({ telephone: "02-000-0000", medicalSpecialty: ["PlasticSurgery", "Dermatology"] });
    expect(ld).not.toHaveProperty("availableService");
    expect(clinicJsonLd({ ...clinic, lat: null }, url, [])).not.toHaveProperty("geo");
    expect(clinicJsonLd({ ...clinic, description: null }, url, [])).not.toHaveProperty("description");
  });

  it("description: 병원명·지역·시술·가격 범위, 150자 이내", () => {
    const d = clinicDescription(clinic, ["눈매교정", "쌍꺼풀 수술", "코 성형", "앞트임"], { low: 700000, high: 5500000 }, formatPriceRange);
    expect(d).toContain("단하늘성형외과(서울 강남구)가 공개한");
    // 받침 있는 병원명은 "이"
    expect(clinicDescription({ name: "하결의원", region: "서울 서초구" }, ["코 성형"], { low: null, high: null }, formatPriceRange)).toContain(
      "하결의원(서울 서초구)이 공개한",
    );
    expect(d).toContain("눈매교정·쌍꺼풀 수술·코 성형 등 4개");
    expect(d).toContain("70만~550만 원");
    expect(d.length).toBeLessThanOrEqual(150);
    const long = clinicDescription({ name: "가".repeat(80), region: "서울 강남구" }, ["나".repeat(40)], { low: null, high: null }, formatPriceRange);
    expect(long.length).toBeLessThanOrEqual(150);
  });

  it("<script> 안전 JSON·네이버 지도 링크·slug 디코딩", () => {
    expect(jsonLdScript({ a: "</script>" })).toBe('{"a":"\\u003c/script>"}');
    expect(naverMapUrl("서울 강남구")).toBe("https://map.naver.com/p/search/%EC%84%9C%EC%9A%B8%20%EA%B0%95%EB%82%A8%EA%B5%AC");
    expect(decodeSlug("%EB%8B%A8%ED%95%98%EB%8A%98")).toBe("단하늘");
    expect(decodeSlug("단하늘")).toBe("단하늘");
    expect(decodeSlug("%E0%A4%A")).toBe("%E0%A4%A");
  });

  it("정적 경로: 빌드는 한글 slug 그대로, 개발 서버는 인코딩 slug 도 함께", () => {
    expect(slugParams(["단하늘", "abc"], "production")).toEqual([{ slug: "단하늘" }, { slug: "abc" }]);
    expect(slugParams(["단하늘", "abc"], "development")).toEqual([
      { slug: "단하늘" },
      { slug: "abc" },
      { slug: "%EB%8B%A8%ED%95%98%EB%8A%98" },
    ]);
  });
});
