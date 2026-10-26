import { Icon3D } from "@/components/ui/Icon3D";
import { isPathBuilt } from "@/lib/built-routes";
import { ROUTES, consultPath } from "@/lib/routes";
import { CONSULT_CTA } from "@/lib/site";
import type { CtaLocation } from "@/lib/track";
import { btn, cx } from "@/lib/ui";
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

/** 기본 제목·혜택 문구 — 버튼에는 "무료"를 쓰지 않고, 비용 안내는 설명 문장에서 한다(lib/site.ts CONSULT_CTA) */
export const CONSULT_CTA_DEFAULTS = {
  title: "내 상황에 맞는 상담 가이드를 받아 보세요",
  benefit: "신청 비용은 들지 않습니다. 시술별 가격 범위와 회복 일정, 상담 때 확인할 점을 정리해 드려요.",
} as const;

/**
 * 상담 신청 CTA 블록 (screen-spec 3절: 제목, 1줄 혜택, 버튼 / 콘텐츠 페이지 본문 중간·하단 2회, location 으로 구분)
 * 상담 폼(P-06)이 아직 없으면 렌더링하지 않는다(깨진 CTA 금지).
 */
export function ConsultCta({
  location,
  procedureId,
  clinicId,
  title = CONSULT_CTA_DEFAULTS.title,
  benefit = CONSULT_CTA_DEFAULTS.benefit,
}: Props) {
  if (!isPathBuilt(ROUTES.consult)) return null;
  const titleId = `consult-cta-${location}-title`;
  return (
    <section
      data-testid={`consult-cta-${location}`}
      aria-labelledby={titleId}
      className="flex flex-col gap-6 rounded-xl bg-brand-weak px-6 py-7 md:flex-row md:items-center md:gap-8 md:px-10 md:py-9"
    >
      <Icon3D name="ic-consult" size={64} />
      <div className="md:flex-1">
        <h2 id={titleId} className="text-h3 font-bold tracking-tight text-ink">
          {title}
        </h2>
        <p className="mt-1 text-ink-muted">{benefit}</p>
      </div>
      <TrackedLink
        href={consultPath({ procedure_id: procedureId, clinic_id: clinicId })}
        event="click_cta"
        params={{ location, procedure_id: procedureId }}
        className={cx(btn.primary, btn.md, "w-full md:w-auto")}
      >
        {CONSULT_CTA.long}
      </TrackedLink>
    </section>
  );
}
