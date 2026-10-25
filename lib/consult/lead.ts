/**
 * 접수 세션 — P-06 → P-07 전달과 generate_lead 1회 보장 (screen-spec 4절 P-07, 5절, 8절 "세션스토리지 플래그로 직접 접근 차단").
 *
 * - 제출 성공 시 sessionStorage `rs_lead` 에 접수 정보를 넣고 완료 화면으로 이동한다.
 * - 완료 화면은 `rs_lead` 가 없으면 메인으로 돌려보낸다(직접 접근 차단 → 전환 부풀림 방지).
 * - generate_lead 는 lead_id 마다 1회. 발화한 lead_id 는 `rs_lead_tracked` 에 남겨 새로고침해도 다시 보내지 않는다.
 */

/** P-07 경로(lib/routes.ts 에 없으므로 여기서 정의, 끝 슬래시 포함) */
export const CONSULT_DONE_PATH = "/consult/done/";
export const LEAD_SESSION_KEY = "rs_lead";
export const LEAD_TRACKED_KEY = "rs_lead_tracked";
const TRACKED_MAX = 20;

export type LeadSession = {
  lead_id: string;
  procedure_id: string | null;
  clinic_id: string | null;
  procedure_name: string | null;
  /** ISO */
  created_at: string;
};

function sessionStore(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

const str = (v: unknown): string | null => (typeof v === "string" && v ? v : null);

export function parseLeadSession(raw: string | null | undefined): LeadSession | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Record<string, unknown> | null;
    if (!v || typeof v !== "object") return null;
    const lead_id = str(v.lead_id);
    const created_at = str(v.created_at);
    if (!lead_id || !/^[0-9a-f-]{8,}$/i.test(lead_id) || !created_at || Number.isNaN(Date.parse(created_at))) return null;
    return {
      lead_id,
      procedure_id: str(v.procedure_id),
      clinic_id: str(v.clinic_id),
      procedure_name: str(v.procedure_name),
      created_at,
    };
  } catch {
    return null;
  }
}

export function saveLeadSession(lead: LeadSession, storage: Storage | null = sessionStore()): void {
  try {
    storage?.setItem(LEAD_SESSION_KEY, JSON.stringify(lead));
  } catch {
    /* 저장 불가(사파리 개인정보 보호 모드 등) — 완료 화면이 메인으로 돌려보낸다 */
  }
}

export function readLeadSession(storage: Storage | null = sessionStore()): LeadSession | null {
  try {
    return parseLeadSession(storage?.getItem(LEAD_SESSION_KEY));
  } catch {
    return null;
  }
}

function readTracked(storage: Storage | null): string[] {
  try {
    const v = JSON.parse(storage?.getItem(LEAD_TRACKED_KEY) ?? "[]") as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/**
 * 이 lead_id 의 전환을 아직 보내지 않았으면 표시하고 true. 이미 보냈으면 false.
 * 표시를 먼저 한 뒤 발화하므로, 같은 렌더에서 두 번 불려도(Strict Mode) 한 번만 true 다.
 * 저장소를 쓸 수 없으면 메모리(이 탭)에서만 막는다.
 */
const memoryTracked = new Set<string>();
export function claimLeadConversion(leadId: string, storage: Storage | null = sessionStore()): boolean {
  if (memoryTracked.has(leadId)) return false;
  const tracked = readTracked(storage);
  if (tracked.includes(leadId)) return false;
  memoryTracked.add(leadId);
  try {
    storage?.setItem(LEAD_TRACKED_KEY, JSON.stringify([...tracked, leadId].slice(-TRACKED_MAX)));
  } catch {
    /* 메모리 표시로 대신한다 */
  }
  return true;
}

/** 테스트 전용: 메모리 표시 초기화 */
export function resetLeadConversionMemory(): void {
  memoryTracked.clear();
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * 고객 안내용 접수번호: RS-<접수 월일(KST)>-<lead_id 앞 4자리 대문자> → "RS-1026-7F3A".
 * 전화 상담 때 읽어 주기 쉬운 길이로 줄인 것이며, 관리자 화면은 lead_id 전체로 찾는다.
 */
export function formatLeadNumber(leadId: string, createdAt: string | Date): string {
  const t = typeof createdAt === "string" ? Date.parse(createdAt) : createdAt.getTime();
  const kst = new Date((Number.isNaN(t) ? 0 : t) + KST_OFFSET_MS);
  const mmdd = `${String(kst.getUTCMonth() + 1).padStart(2, "0")}${String(kst.getUTCDate()).padStart(2, "0")}`;
  const code = leadId.replace(/[^0-9a-z]/gi, "").slice(0, 4).toUpperCase().padEnd(4, "0");
  return `RS-${mmdd}-${code}`;
}

/** 접수 시각(KST) → "2026.10.26 14:32" */
export function formatKstDateTime(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const d = new Date(t + KST_OFFSET_MS);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}.${p(d.getUTCMonth() + 1)}.${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}
