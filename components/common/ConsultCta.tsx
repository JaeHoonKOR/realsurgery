import { ArrowRight } from "lucide-react";
import { isPathBuilt } from "@/lib/built-routes";
import { ROUTES, consultPath } from "@/lib/routes";
import type { CtaLocation } from "@/lib/track";
import { TrackedLink } from "./TrackedLink";

type Props = {
  /** click_cta location — 콘텐츠 본문 중간 mid, 하단 bottom, 메인 하단 footer (3절·4절) */
  location: Exclude<CtaLocation, "header" | "bottom_bar">;
  /** 상담 폼 선입력용(P-06 1단계). 시술 페이지에서는 반드시 넘긴다. */
  procedureId?: string;
  clinicId?: string;
  title?: string;
  benefit?: string;
};

/**
 * 상담 예약 CTA 블록 (screen-spec 3절: 제목, 1줄 혜택, 버튼 / 콘텐츠 페이지 본문 중간·하단 2회, location 으로 구분)
 * 상담 폼(P-06)이 아직 없으면 렌더링하지 않는다(깨진 CTA 금지).
 */
export function ConsultCta({
  location,
  procedureId,
  clinicId,
  title = "내 상황에 맞는 상담 가이드를 받아 보세요",
  benefit = "상담 신청은 무료이며, 영업일 기준 1일 안에 연락드립니다.",
}: Props) {
  if (!isPathBuilt(ROUTES.consult)) return null;
  const titleId = `consult-cta-${location}-title`;
  return (
    <section
      data-testid={`consult-cta-${location}`}
      aria-labelledby={titleId}
      className="flex flex-col gap-5 rounded-lg bg-brand px-6 py-7 text-surface md:flex-row md:items-center md:justify-between md:gap-10 md:px-10 md:py-8"
    >
      <div>
        <h2 id={titleId} className="text-h3 font-bold">
          {title}
        </h2>
        <p className="mt-1 text-sm">{benefit}</p>
      </div>
      <TrackedLink
        href={consultPath({ procedure_id: procedureId, clinic_id: clinicId })}
        event="click_cta"
        params={{ location, procedure_id: procedureId }}
        className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-sm bg-surface px-6 font-semibold text-brand hover:opacity-90"
      >
        무료 상담 예약
        <ArrowRight aria-hidden="true" className="size-5" />
      </TrackedLink>
    </section>
  );
}
