import { MessageCircle, Phone } from "lucide-react";
import { isPathBuilt } from "@/lib/built-routes";
import type { Clinic } from "@/lib/content";
import { ROUTES, consultPath } from "@/lib/routes";
import { CONSULT_CTA } from "@/lib/site";
import { TrackedLink } from "./TrackedLink";

type Props = {
  /** 이벤트 page 파라미터 — P-03 procedure · P-05 clinic · P-12 lp (3절: 이 세 화면에서만 노출) */
  page: "procedure" | "clinic" | "lp";
  procedureId?: string;
  clinic?: Pick<Clinic, "id" | "phone" | "kakao_url" | "is_partner">;
};

/**
 * 모바일 하단 고정 바 (screen-spec 3절): 전화 · 카카오톡 상담 · 상담 신청, 버튼마다 별도 이벤트.
 * - 전화·카톡은 제휴 병원(is_partner)이고 값이 있을 때만(8절 폴백).
 * - 바가 있으면 모바일 body 아래에 같은 높이의 여백이 생겨 마지막 콘텐츠(푸터)를 가리지 않는다. 안전 영역 패딩 포함.
 * - md 이상에서는 숨긴다(모바일 전용).
 * - 상담 버튼에 data-bottom-bar-cta 를 단다 → styles/cta.css 가 모바일에서 헤더 CTA 를 숨겨 같은 버튼이 두 번 보이지 않게 한다.
 */
export function BottomBar({ page, procedureId, clinic }: Props) {
  const showConsult = isPathBuilt(ROUTES.consult);
  const phone = clinic?.is_partner && clinic.phone ? clinic.phone.replace(/[^\d+]/g, "") : null;
  const kakao = clinic?.is_partner && clinic.kakao_url ? clinic.kakao_url : null;
  if (!showConsult && !phone && !kakao) return null;

  const secondary =
    "flex h-14 basis-0 grow flex-col items-center justify-center gap-0.5 rounded-md bg-canvas text-sm font-semibold text-ink";
  return (
    <>
      {/* data-bottom-bar → globals.css 가 모바일에서 body 아래 여백(바 높이 + 안전 영역)을 만들어 푸터까지 가리지 않게 한다 */}
      <nav
        aria-label="빠른 상담"
        data-testid="bottom-bar"
        data-bottom-bar=""
        className="fixed inset-x-0 bottom-0 z-(--z-bottom-bar) border-t border-line bg-surface pb-safe-2 md:hidden"
      >
        <div className="flex gap-2 px-4 pt-2">
          {phone && clinic && (
            <TrackedLink href={`tel:${phone}`} event="phone_click" params={{ clinic_id: clinic.id, page }} className={secondary}>
              <Phone aria-hidden="true" className="size-5 text-brand-strong" />
              전화
            </TrackedLink>
          )}
          {kakao && clinic && (
            <TrackedLink
              href={kakao}
              target="_blank"
              rel="noopener noreferrer"
              event="kakao_click"
              params={{ clinic_id: clinic.id, page }}
              className={secondary}
            >
              <MessageCircle aria-hidden="true" className="size-5 text-brand-strong" />
              카카오톡 상담
            </TrackedLink>
          )}
          {showConsult && (
            <TrackedLink
              href={consultPath({ procedure_id: procedureId, clinic_id: clinic?.id })}
              event="click_cta"
              params={{ location: "bottom_bar", procedure_id: procedureId }}
              data-bottom-bar-cta=""
              // 전화·카톡이 있으면 세 버튼을 같은 폭으로("카카오톡 상담"이 375px 에서 잘리지 않게), 없으면 혼자 전체 폭
              className="flex h-14 basis-0 grow items-center justify-center rounded-md bg-brand-strong px-2 text-center text-lg font-semibold text-surface"
            >
              {CONSULT_CTA.short}
            </TrackedLink>
          )}
        </div>
      </nav>
    </>
  );
}
