/**
 * 중복 제출 5분 차단 (screen-spec 4절 P-06 "중복 제출 5분 차단").
 * 같은 휴대폰 번호로 5분 안에 다시 제출하면 막는다. 번호 원문은 저장하지 않고 해시만 localStorage 에 둔다.
 * (서버 submit-lead 도 같은 기준으로 한 번 더 막는다 — 브라우저 저장소는 지울 수 있으므로.)
 */
import { phoneDigits } from "./phone";

export const DUPLICATE_STORAGE_KEY = "rs_recent_leads";
export const DUPLICATE_WINDOW_MS = 5 * 60 * 1000;

type Recent = Record<string, number>;

/** FNV-1a 32bit — 번호를 그대로 남기지 않기 위한 식별용(보안 해시 아님) */
export function phoneKey(phone: string): string {
  let h = 0x811c9dc5;
  for (const ch of `rs:${phoneDigits(phone)}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

function defaultStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function readRecent(storage: Storage | null): Recent {
  try {
    const raw = storage?.getItem(DUPLICATE_STORAGE_KEY);
    const v = raw ? (JSON.parse(raw) as unknown) : null;
    if (!v || typeof v !== "object" || Array.isArray(v)) return {};
    return Object.fromEntries(Object.entries(v).filter(([, t]) => typeof t === "number")) as Recent;
  } catch {
    return {};
  }
}

export type DuplicateCheck =
  | { blocked: false }
  | {
      blocked: true;
      /** 이전 제출 시각(ms) */
      submittedAt: number;
      /** 다시 제출할 수 있을 때까지 남은 시간(ms) */
      retryAfterMs: number;
    };

export function checkDuplicate(phone: string, now: number = Date.now(), storage: Storage | null = defaultStorage()): DuplicateCheck {
  const at = readRecent(storage)[phoneKey(phone)];
  if (at == null || now - at >= DUPLICATE_WINDOW_MS || at > now) return { blocked: false };
  return { blocked: true, submittedAt: at, retryAfterMs: DUPLICATE_WINDOW_MS - (now - at) };
}

/** 제출 성공 시 기록. 5분 지난 항목은 함께 지운다. */
export function recordSubmission(phone: string, now: number = Date.now(), storage: Storage | null = defaultStorage()): void {
  const fresh = Object.fromEntries(Object.entries(readRecent(storage)).filter(([, t]) => now - t < DUPLICATE_WINDOW_MS));
  fresh[phoneKey(phone)] = now;
  try {
    storage?.setItem(DUPLICATE_STORAGE_KEY, JSON.stringify(fresh));
  } catch {
    /* 저장 불가 — 서버 측 차단에 맡긴다 */
  }
}

/** 남은 시간 → "4분" / "1분 미만" */
export function formatRetryAfter(ms: number): string {
  const min = Math.ceil(ms / 60000);
  return ms < 60000 ? "1분" : `${min}분`;
}

/** 중복 차단 안내 한 문장(원인 + 해결) */
export function duplicateMessage(check: Extract<DuplicateCheck, { blocked: true }>): string {
  return `같은 번호로 방금 접수된 신청이 있어 중복 접수를 막았으니, ${formatRetryAfter(check.retryAfterMs)} 뒤에 다시 시도하거나 연락을 기다려 주세요.`;
}
