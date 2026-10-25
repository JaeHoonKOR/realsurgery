"use client";

import { ChevronRight, Copy, Check as CheckIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TrackedLink } from "@/components/common/TrackedLink";
import { Emoji3D, categoryEmoji, type EmojiName } from "@/components/ui/Emoji3D";
import { claimLeadConversion, formatKstDateTime, formatLeadNumber, readLeadSession, type LeadSession } from "@/lib/consult/lead";
import { ROUTES } from "@/lib/routes";
import { SITE } from "@/lib/site";
import { LEAD_VALUE_KRW, track } from "@/lib/track";
import { btn, chip, cx } from "@/lib/ui";
import type { RelatedProcedure } from "./types";

type Props = {
  /** 시술 id → 같은 부위 관련 시술(서버에서 미리 계산) */
  related: Record<string, RelatedProcedure[]>;
  /** 시술을 고르지 않은 신청에 보여 줄 기본 추천 */
  fallback: RelatedProcedure[];
  /** 카카오톡 채널 URL(환경 변수가 있을 때만) */
  kakaoChannelUrl?: string;
};

const CHECKLIST: { emoji: EmojiName; title: string; body: string }[] = [
  {
    emoji: "phone",
    title: "모르는 번호도 받아 주세요",
    body: "운영팀은 02로 시작하는 대표번호로 연락드려요. 못 받으시면 문자로 다시 안내합니다.",
  },
  {
    emoji: "memo",
    title: "궁금한 점을 미리 적어 두세요",
    body: "원하는 모양, 회복 기간 동안의 일정, 예산 범위를 정리해 두면 상담이 빨라져요.",
  },
  {
    emoji: "stethoscope",
    title: "복용 중인 약과 병력을 확인하세요",
    body: "혈액 순환에 영향을 주는 약이나 이전 시술 이력은 상담 때 꼭 알려 주세요.",
  },
  {
    emoji: "money",
    title: "견적의 포함 항목을 비교하세요",
    body: "마취·검사·사후 관리 비용이 포함됐는지에 따라 같은 가격도 실제 부담이 달라져요.",
  },
];

/**
 * P-07 상담 신청 완료 (screen-spec 4절 P-07).
 * - 세션(rs_lead)이 없으면 메인으로 돌려보낸다(직접 접근 차단).
 * - generate_lead 는 이 화면에서만, lead_id 마다 1회(새로고침해도 다시 보내지 않음).
 */
export function DoneView({ related, fallback, kakaoChannelUrl }: Props) {
  const router = useRouter();
  const [lead, setLead] = useState<LeadSession | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const session = readLeadSession();
    if (!session) {
      router.replace(ROUTES.home);
      return;
    }
    setLead(session);
    if (claimLeadConversion(session.lead_id)) {
      track("generate_lead", {
        lead_id: session.lead_id,
        procedure_id: session.procedure_id ?? undefined,
        clinic_id: session.clinic_id ?? undefined,
        value: LEAD_VALUE_KRW,
        currency: "KRW",
      });
    }
  }, [router]);

  if (!lead) {
    // 세션 확인 전(정적 HTML·리다이렉트 중): 자리만 잡아 레이아웃이 튀지 않게 한다
    return (
      <div role="status" aria-busy="true" data-testid="consult-done-pending" className="min-h-dvh">
        <span className="sr-only">신청 정보를 확인하고 있습니다</span>
      </div>
    );
  }

  const number = formatLeadNumber(lead.lead_id, lead.created_at);
  const items = (lead.procedure_id ? related[lead.procedure_id] : undefined) ?? fallback;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* 클립보드 권한 없음 — 번호는 화면에 그대로 보인다 */
    }
  };

  return (
    <div data-testid="consult-done" className="transition duration-500 starting:translate-y-2 starting:opacity-0">
      <header>
        <Emoji3D name="party" size={80} priority />
        <h1 className="mt-5 text-h1 font-bold tracking-tighter text-ink">상담 신청이 접수됐습니다</h1>
        <p className="mt-3 text-lg text-ink-muted">
          영업일 기준 1일 안에 연락드립니다.
          <br />
          <span className="text-base">{SITE.hours}</span>
        </p>
      </header>

      <section aria-label="접수 정보" data-testid="consult-done-receipt" className="mt-8 rounded-xl bg-canvas p-5 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-muted">접수번호</p>
            <p data-testid="consult-done-number" className="mt-0.5 text-h2 font-bold tracking-tight text-ink tabular-nums">
              {number}
            </p>
          </div>
          <button
            type="button"
            onClick={copy}
            className={cx(btn.outline, "h-11 rounded-sm px-3 text-sm")}
            aria-label={copied ? "접수번호를 복사했습니다" : "접수번호 복사"}
          >
            {copied ? <CheckIcon aria-hidden="true" className="size-4 text-success" /> : <Copy aria-hidden="true" className="size-4" />}
            {copied ? "복사됨" : "복사"}
          </button>
        </div>
        <dl className="mt-4 grid gap-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">관심 시술</dt>
            <dd className="text-right font-semibold text-ink">{lead.procedure_name ?? "상담에서 함께 정해요"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">접수 시각</dt>
            <dd className="font-semibold text-ink tabular-nums">{formatKstDateTime(lead.created_at)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-ink-muted">전화 상담 때 접수번호를 알려 주시면 더 빠르게 안내해 드려요.</p>
      </section>

      {kakaoChannelUrl && (
        <TrackedLink
          href={kakaoChannelUrl}
          target="_blank"
          rel="noopener noreferrer"
          event="kakao_add"
          params={{}}
          className={cx(btn.secondary, btn.md, "mt-4 w-full")}
        >
          <Emoji3D name="chat" size={24} />
          카카오톡 채널 추가하고 알림 받기
        </TrackedLink>
      )}

      <section aria-labelledby="done-checklist" data-testid="consult-done-checklist" className="mt-12">
        <h2 id="done-checklist" className="text-h3 font-bold tracking-tight text-ink">
          연락 오기 전에 준비해 두세요
        </h2>
        <ol className="mt-5 grid gap-5">
          {CHECKLIST.map((c, i) => (
            <li key={c.title} className="flex gap-4">
              <span className="relative flex size-12 shrink-0 items-center justify-center rounded-md bg-canvas">
                <Emoji3D name={c.emoji} size={32} />
                <span className="sr-only">{i + 1}.</span>
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="font-bold text-ink">{c.title}</p>
                <p className="mt-0.5 text-sm text-ink-muted">{c.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {items.length > 0 && (
        <section aria-labelledby="done-related" data-testid="consult-done-related" className="mt-12">
          <h2 id="done-related" className="text-h3 font-bold tracking-tight text-ink">
            {lead.procedure_id ? "함께 많이 알아보는 시술" : "많이 알아보는 시술"}
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {items.slice(0, 2).map((p) => {
              const body = (
                <>
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-surface">
                    <Emoji3D name={categoryEmoji(p.category_id)} size={32} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate font-bold text-ink">{p.name}</span>
                      <span className={cx(chip.base, "h-6 shrink-0 bg-surface px-2 text-xs text-ink-muted")}>{p.category_name}</span>
                    </span>
                    <span className="mt-1 flex flex-wrap gap-x-3 text-sm">
                      <span className="whitespace-nowrap">
                        <span className="text-ink-muted">가격 </span>
                        <span className="font-semibold text-ink tabular-nums">{p.price_label}</span>
                      </span>
                      <span className="whitespace-nowrap">
                        <span className="text-ink-muted">회복 </span>
                        <span className="font-semibold text-ink">{p.recovery_label}</span>
                      </span>
                    </span>
                  </span>
                  {p.href && <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-ink-faint" />}
                </>
              );
              const cls = "flex h-full items-center gap-3 rounded-lg bg-canvas p-4";
              return (
                <li key={p.id}>
                  {p.href ? (
                    <TrackedLink
                      href={p.href}
                      event="select_procedure"
                      params={{ procedure_id: p.id, from_page: "consult_done" }}
                      className={cx(cls, "transition-colors hover:bg-line")}
                    >
                      {body}
                    </TrackedLink>
                  ) : (
                    <div className={cls}>{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="mt-12">
        <Link href={ROUTES.home} className={cx(btn.neutral, btn.lg, "w-full")}>
          홈으로 가기
        </Link>
      </div>
    </div>
  );
}
