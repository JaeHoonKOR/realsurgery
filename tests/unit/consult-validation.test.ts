import { describe, expect, it } from "vitest";
import {
  CONTACT_TIME_OPTIONS,
  REGION_OPTIONS,
  TIMING_OPTIONS,
  isOptionValue,
  optionLabel,
  regionFromAddress,
} from "@/lib/consult/options";
import {
  MESSAGES,
  PROCEDURE_UNDECIDED,
  allConsented,
  emptyValues,
  firstErrorField,
  hasErrors,
  validateAll,
  validateName,
  validatePhone,
  validateStep1,
  validateStep2,
  type ConsultValues,
} from "@/lib/consult/validation";

const IDS = ["double-eyelid", "rhinoplasty"];

const valid = (): ConsultValues => ({
  ...emptyValues({ procedure_id: "double-eyelid" }),
  region: "gangnam-seocho",
  timing: "within_3m",
  name: "김지은",
  phone: "010-1234-5678",
  contact_time: "afternoon",
  consent_privacy: true,
  consent_3rd: true,
});

describe("1단계 검증(관심 시술)", () => {
  it("빈 값이면 세 필드 모두 원인+해결 문구", () => {
    const e = validateStep1(emptyValues(), IDS);
    expect(e).toEqual({ procedure_id: MESSAGES.procedure, region: MESSAGES.region, timing: MESSAGES.timing });
    for (const m of Object.values(e)) expect(m).toMatch(/니 .+ 주세요\.$/);
  });
  it("선입력 시술 + 지역·시기 선택 → 통과", () => {
    expect(validateStep1(valid(), IDS)).toEqual({});
  });
  it("목록에 없는 시술 id 는 오류, '아직 정하지 못했어요'는 통과", () => {
    expect(validateStep1({ ...valid(), procedure_id: "unknown" }, IDS).procedure_id).toBe(MESSAGES.procedure);
    expect(validateStep1({ ...valid(), procedure_id: PROCEDURE_UNDECIDED }, IDS)).toEqual({});
    // 목록을 넘기지 않으면 형식만 본다
    expect(validateStep1({ ...valid(), procedure_id: "anything" })).toEqual({});
  });
  it("선택지 밖 값은 오류", () => {
    const e = validateStep1({ ...valid(), region: "jeju" as never, timing: "tomorrow" as never }, IDS);
    expect(Object.keys(e)).toEqual(["region", "timing"]);
  });
});

describe("2단계 검증(연락처·동의)", () => {
  it("모두 맞으면 오류 없음", () => {
    expect(validateStep2(valid())).toEqual({});
    expect(hasErrors(validateAll(valid(), IDS))).toBe(false);
  });
  it("필수 동의 2개가 없으면 각각 오류, 마케팅(선택)은 없어도 통과", () => {
    const e = validateStep2({ ...valid(), consent_privacy: false, consent_3rd: false, consent_marketing: false });
    expect(e).toEqual({ consent_privacy: MESSAGES.consentPrivacy, consent_3rd: MESSAGES.consent3rd });
  });
  it("메모 500자 초과는 오류(500자는 통과)", () => {
    expect(validateStep2({ ...valid(), memo: "가".repeat(500) }).memo).toBeUndefined();
    expect(validateStep2({ ...valid(), memo: "가".repeat(501) }).memo).toBe(MESSAGES.memoLong);
  });
  it("연락 가능 시간 미선택", () => {
    expect(validateStep2({ ...valid(), contact_time: "" }).contact_time).toBe(MESSAGES.contactTime);
  });
});

describe("이름 검증", () => {
  it.each([
    ["", MESSAGES.nameEmpty],
    ["   ", MESSAGES.nameEmpty],
    ["김", MESSAGES.nameShort],
    ["김지은1", MESSAGES.nameChars],
    ["@김지은", MESSAGES.nameChars],
    ["가".repeat(21), MESSAGES.nameLong],
  ])("%s → 오류", (input, msg) => {
    expect(validateName(input)).toBe(msg);
  });
  it.each(["김지은", "이준", "Jieun Kim", "남궁 민수", "Mary-Jane"])("%s → 통과", (input) => {
    expect(validateName(input)).toBeNull();
  });
});

describe("휴대폰 검증 문구", () => {
  it.each([
    ["", MESSAGES.phoneEmpty],
    ["02-123-4567", MESSAGES.phoneLandline],
    ["031-1234-5678", MESSAGES.phoneLandline],
    ["010-1234", MESSAGES.phoneShort],
    ["010", MESSAGES.phoneShort],
    ["011-12", MESSAGES.phoneShort],
    ["012-3456-7890", MESSAGES.phoneInvalid],
    ["1234-5678", MESSAGES.phoneInvalid],
  ])("%s → %s", (input, msg) => {
    expect(validatePhone(input)).toBe(msg);
  });
  it("정상 번호는 통과", () => {
    expect(validatePhone("010-1234-5678")).toBeNull();
    expect(validatePhone("011-123-4567")).toBeNull();
  });
});

describe("보조 함수", () => {
  it("첫 오류 필드는 화면 순서(1단계 → 2단계)", () => {
    expect(firstErrorField({ phone: "x", region: "y" })).toBe("region");
    expect(firstErrorField({ consent_3rd: "x", name: "y" })).toBe("name");
    expect(firstErrorField({})).toBeNull();
  });
  it("전체 동의는 선택 항목까지 켜져야 true", () => {
    expect(allConsented({ consent_privacy: true, consent_3rd: true, consent_marketing: false })).toBe(false);
    expect(allConsented({ consent_privacy: true, consent_3rd: true, consent_marketing: true })).toBe(true);
  });
  it("emptyValues 선입력", () => {
    expect(emptyValues({ procedure_id: "rhinoplasty", clinic_id: "hagyeol" })).toMatchObject({
      procedure_id: "rhinoplasty",
      clinic_id: "hagyeol",
      region: "",
    });
  });
});

describe("선택지", () => {
  it("스펙 선택지 그대로(지역 5·시기 3·연락 시간 4)", () => {
    expect(REGION_OPTIONS.map((o) => o.label)).toEqual(["서울 강남·서초", "서울 기타", "경기·인천", "부산·경남", "기타"]);
    expect(TIMING_OPTIONS.map((o) => o.label)).toEqual(["1개월 내", "3개월 내", "아직 미정"]);
    expect(CONTACT_TIME_OPTIONS.map((o) => o.label)).toEqual(["오전", "오후", "저녁", "언제든"]);
  });
  it("값 확인·이름 변환", () => {
    expect(isOptionValue(REGION_OPTIONS, "etc")).toBe(true);
    expect(isOptionValue(REGION_OPTIONS, 3)).toBe(false);
    expect(optionLabel(TIMING_OPTIONS, "within_1m")).toBe("1개월 내");
    expect(optionLabel(TIMING_OPTIONS, "zzz")).toBe("zzz");
    expect(optionLabel(TIMING_OPTIONS, "")).toBe("");
  });
  it.each([
    ["서울 강남구", "gangnam-seocho"],
    ["서울 서초구", "gangnam-seocho"],
    ["서울 마포구", "seoul-etc"],
    ["경기 성남시 분당구", "gyeonggi-incheon"],
    ["인천 연수구", "gyeonggi-incheon"],
    ["부산 해운대구", "busan-gyeongnam"],
    ["대구 수성구", "etc"],
    ["", null],
  ])("병원 지역 %s → %s", (region, expected) => {
    expect(regionFromAddress(region)).toBe(expected);
  });
});
