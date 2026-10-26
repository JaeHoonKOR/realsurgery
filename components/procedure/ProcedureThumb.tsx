import { Illustration } from "@/components/ui/Illustration";
import { procedureImageId } from "@/lib/gen-assets";

/** 시술 카드 썸네일 표시 폭 — 모바일 가로 레일 288px, sm 2열, lg 3열 352px (asset-plan 10절) */
export const PROCEDURE_THUMB_SIZES = "(min-width: 1024px) 352px, (min-width: 640px) 50vw, 288px";

/**
 * 시술 카드 상단 16:10 썸네일(proc-<id>, 원본 4:3 을 크롭). 이미지가 없으면 아무것도 그리지 않는다 →
 * 카드가 지금 모양(부위 아이콘 타일·텍스트)을 그대로 쓴다. 제목이 카드에 있으므로 장식 이미지(alt="").
 */
export function ProcedureThumb({ procedureId, className }: { procedureId: string; className?: string }) {
  return <Illustration id={procedureImageId(procedureId)} aspect="16:10" alt="" sizes={PROCEDURE_THUMB_SIZES} className={className} />;
}
