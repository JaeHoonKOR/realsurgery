import { describe, expect, it } from "vitest";
import {
  DUPLICATE_STORAGE_KEY,
  DUPLICATE_WINDOW_MS,
  checkDuplicate,
  duplicateMessage,
  formatRetryAfter,
  phoneKey,
  recordSubmission,
} from "@/lib/consult/duplicate";
import { MemoryStorage } from "./helpers/memory-storage";

const T0 = Date.parse("2026-10-26T05:00:00Z");

describe("중복 제출 5분 차단", () => {
  it("기록이 없으면 통과", () => {
    expect(checkDuplicate("010-1234-5678", T0, new MemoryStorage())).toEqual({ blocked: false });
  });

  it("같은 번호(표기 달라도)를 5분 안에 다시 내면 막고 남은 시간을 알려 준다", () => {
    const s = new MemoryStorage();
    recordSubmission("010-1234-5678", T0, s);
    const c = checkDuplicate("01012345678", T0 + 60_000, s);
    expect(c).toEqual({ blocked: true, submittedAt: T0, retryAfterMs: DUPLICATE_WINDOW_MS - 60_000 });
    if (c.blocked) expect(duplicateMessage(c)).toBe(
      "같은 번호로 방금 접수된 신청이 있어 중복 접수를 막았으니, 4분 뒤에 다시 시도하거나 연락을 기다려 주세요.",
    );
  });

  it("5분이 지나면 다시 낼 수 있다", () => {
    const s = new MemoryStorage();
    recordSubmission("010-1234-5678", T0, s);
    expect(checkDuplicate("010-1234-5678", T0 + DUPLICATE_WINDOW_MS, s).blocked).toBe(false);
    expect(checkDuplicate("010-1234-5678", T0 + DUPLICATE_WINDOW_MS - 1, s).blocked).toBe(true);
  });

  it("다른 번호는 막지 않는다", () => {
    const s = new MemoryStorage();
    recordSubmission("010-1234-5678", T0, s);
    expect(checkDuplicate("010-9999-0000", T0 + 1000, s).blocked).toBe(false);
  });

  it("번호 원문은 저장하지 않는다(해시 키)", () => {
    const s = new MemoryStorage();
    recordSubmission("010-1234-5678", T0, s);
    const raw = s.getItem(DUPLICATE_STORAGE_KEY) ?? "";
    expect(raw).not.toContain("1234");
    expect(raw).not.toContain("5678");
    expect(JSON.parse(raw)).toEqual({ [phoneKey("010-1234-5678")]: T0 });
    expect(phoneKey("010-1234-5678")).toBe(phoneKey("01012345678"));
    expect(phoneKey("010-1234-5678")).not.toBe(phoneKey("010-1234-5679"));
  });

  it("오래된 기록은 새로 저장할 때 정리한다", () => {
    const s = new MemoryStorage();
    recordSubmission("010-1111-1111", T0, s);
    recordSubmission("010-2222-2222", T0 + DUPLICATE_WINDOW_MS + 1, s);
    expect(Object.keys(JSON.parse(s.getItem(DUPLICATE_STORAGE_KEY) ?? "{}"))).toEqual([phoneKey("010-2222-2222")]);
  });

  it("깨진 값·미래 시각·저장소 예외에도 제출을 막지 않는다", () => {
    const s = new MemoryStorage();
    s.setItem(DUPLICATE_STORAGE_KEY, "{not json");
    expect(checkDuplicate("010-1234-5678", T0, s).blocked).toBe(false);
    s.setItem(DUPLICATE_STORAGE_KEY, JSON.stringify([1, 2]));
    expect(checkDuplicate("010-1234-5678", T0, s).blocked).toBe(false);
    s.setItem(DUPLICATE_STORAGE_KEY, JSON.stringify({ [phoneKey("01012345678")]: T0 + 10_000 }));
    expect(checkDuplicate("010-1234-5678", T0, s).blocked).toBe(false);
    const broken = new MemoryStorage(true);
    expect(() => recordSubmission("010-1234-5678", T0, broken)).not.toThrow();
    expect(checkDuplicate("010-1234-5678", T0, broken).blocked).toBe(false);
    expect(checkDuplicate("010-1234-5678", T0, null).blocked).toBe(false);
  });

  it("남은 시간 표기", () => {
    expect(formatRetryAfter(30_000)).toBe("1분");
    expect(formatRetryAfter(60_000)).toBe("1분");
    expect(formatRetryAfter(61_000)).toBe("2분");
    expect(formatRetryAfter(DUPLICATE_WINDOW_MS)).toBe("5분");
  });
});
