/**
 * 상담 신청 동작 모드 — 빌드 시 Supabase 공개 키 유무로 정해진다(NEXT_PUBLIC_* 는 빌드 때 문자열로 치환).
 *
 * - live: submit-lead(Edge Function)로 접수하고 운영팀이 연락한다.
 * - demo: 키 없이 배포한 정적 사이트(포트폴리오 시연). submitLead 가 mock 으로 동작해 서버로 아무것도 보내지 않으므로
 *         "연락드립니다" 같은 약속을 하지 않고, 시연 안내를 띄우고, /consult/ 를 검색 색인에서 뺀다.
 *
 * submit.ts 의 isMockMode(브라우저에서 실제 전송 경로 판단)와 같은 기준(hasPublicKey("SUPABASE"))을 쓴다.
 */
import type { Metadata } from "next";
import { hasPublicKey } from "@/lib/env.public";
import { SITE } from "@/lib/site";
import { RETENTION_LABEL } from "./policy";

export type ConsultMode = "live" | "demo";

export function consultMode(hasSupabaseKey: boolean = hasPublicKey("SUPABASE")): ConsultMode {
  return hasSupabaseKey ? "live" : "demo";
}

/** 시연 안내(상담 폼 제출 영역 위·완료 화면) — 굵은 앞문장 + 설명 */
export const DEMO_NOTICE = {
  lead: "포트폴리오 시연용 화면입니다.",
  body: "입력한 정보는 서버로 전송되지 않고 이 브라우저에만 저장됩니다.",
} as const;
export const DEMO_NOTICE_TEXT = `${DEMO_NOTICE.lead} ${DEMO_NOTICE.body}`;

/** 상담 폼 화면 제목(H1·title) */
export const CONSULT_TITLE = "시술 상담 신청";

export type ConsultCopy = {
  /** /consult/ meta description */
  pageDescription: string;
  /** /consult/done/ meta description */
  doneDescription: string;
  /** 완료 화면 제목 아래 첫 줄 */
  doneLead: string;
  /** 완료 화면 둘째 줄(작게) */
  doneSub: string;
  /** 접수 정보 카드 아래 한 줄 */
  receiptNote: string;
  /** 완료 화면 준비 목록 제목 */
  checklistTitle: string;
  /** 준비 목록에 "모르는 번호도 받아 주세요"(연락 안내)를 넣는지 */
  checklistCallItem: boolean;
  /** 상담 폼 신뢰 안내의 연락 항목 */
  contactNote: { title: string; body: string };
  /** 상담 폼 신뢰 안내의 개인정보 보관 항목 */
  storageNote: { title: string; body: string };
  /** 시연 안내를 보이는지 */
  showDemoNotice: boolean;
};

const COPY: Record<ConsultMode, ConsultCopy> = {
  live: {
    pageDescription:
      "관심 시술과 희망 지역·시기, 연락처만 남기면 리얼성형 운영팀이 시술별 가격 범위와 회복 일정, 상담 때 확인할 점을 정리해 영업일 기준 1일 안에 연락드립니다. 신청 비용은 들지 않습니다.",
    doneDescription: "리얼성형 시술 상담 신청이 접수됐습니다. 영업일 기준 1일 안에 연락드립니다.",
    doneLead: "영업일 기준 1일 안에 연락드립니다.",
    doneSub: SITE.hours,
    receiptNote: "전화 상담 때 접수번호를 알려 주시면 더 빠르게 안내해 드려요.",
    checklistTitle: "연락 오기 전에 준비해 두세요",
    checklistCallItem: true,
    contactNote: { title: "영업일 기준 1일 안에 연락드려요", body: `${SITE.hours}에 남겨 주신 번호로 전화드립니다.` },
    storageNote: {
      title: "개인정보는 필요한 만큼만 보관해요",
      body: `휴대폰 번호는 암호화해 저장하고, ${RETENTION_LABEL} 파기합니다.`,
    },
    showDemoNotice: false,
  },
  demo: {
    pageDescription:
      "관심 시술과 희망 지역·시기, 연락처를 남기는 리얼성형 시술 상담 신청 화면입니다. 포트폴리오 시연용이라 입력한 정보는 서버로 전송되지 않고 이 브라우저에만 저장됩니다.",
    doneDescription: "리얼성형 시술 상담 신청 시연 화면입니다. 입력한 정보는 서버로 전송되지 않았으며 연락은 가지 않습니다.",
    doneLead: "시연 화면이라 실제로 연락드리지 않습니다.",
    doneSub: "실제 서비스에서는 이 단계에서 운영팀이 영업일 기준 1일 안에 전화드립니다.",
    receiptNote: "시연용 접수번호입니다. 이 브라우저 안에서만 만들어졌고 어디에도 전송되지 않았습니다.",
    checklistTitle: "상담 전에 준비해 두면 좋아요",
    checklistCallItem: false,
    contactNote: {
      title: "시연 화면에서는 연락드리지 않아요",
      body: "실제 서비스에서는 영업일 기준 1일 안에 남겨 주신 번호로 전화드립니다.",
    },
    storageNote: {
      title: "서버에 저장하지 않아요",
      body: `시연 화면에서는 번호 가운데를 가린 신청 요약만 이 브라우저에 남습니다. 실제 서비스에서는 번호를 암호화해 저장하고 ${RETENTION_LABEL} 파기합니다.`,
    },
    showDemoNotice: true,
  },
};

export function consultCopy(mode: ConsultMode): ConsultCopy {
  return COPY[mode];
}

/** /consult/ 메타데이터 — 시연 모드는 색인 제외(접수되지 않는 폼이 검색 결과에 나가지 않게) */
export function consultPageMetadata(mode: ConsultMode): Metadata {
  const description = COPY[mode].pageDescription;
  return {
    title: CONSULT_TITLE,
    description,
    // ?procedure_id 같은 쿼리는 같은 화면 → canonical 은 쿼리 없는 경로
    alternates: { canonical: "./" },
    openGraph: { title: CONSULT_TITLE, description, url: "./" },
    ...(mode === "demo" ? { robots: { index: false, follow: true } } : {}),
  };
}

/** /consult/done/ 메타데이터 — 전환 확정 페이지는 모드와 상관없이 검색 노출 금지(screen-spec 6절) */
export function consultDoneMetadata(mode: ConsultMode): Metadata {
  return {
    title: "상담 신청 완료",
    description: COPY[mode].doneDescription,
    robots: { index: false, follow: false },
  };
}
