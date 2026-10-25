import { CLINIC_PHOTO_ALT, Illustration, type Aspect } from "@/components/ui/Illustration";
import { clinicImageId } from "@/lib/gen-assets";

/** 병원 카드 커버 표시 폭 — md 2열·lg 3열 352px (asset-plan 10절) */
export const CLINIC_CARD_SIZES = "(min-width: 1024px) 352px, (min-width: 768px) 50vw, 100vw";

type Props = {
  clinicId: string;
  aspect?: Aspect;
  sizes?: string;
  priority?: boolean;
  className?: string;
};

/**
 * 병원 예시 사진(clinic-<id>, 생성한 실내 사진). 실제 병원 사진으로 오해되지 않게 항상 "예시 이미지" 표기와
 * 고정 대체 텍스트를 붙인다. 이미지가 없으면 아무것도 그리지 않는다(호출부가 지금 병원 아이콘 타일을 그대로 쓴다).
 */
export function ClinicPhoto({ clinicId, aspect = "16:9", sizes = CLINIC_CARD_SIZES, priority, className }: Props) {
  return (
    <Illustration
      id={clinicImageId(clinicId)}
      aspect={aspect}
      alt={CLINIC_PHOTO_ALT}
      exampleLabel
      sizes={sizes}
      priority={priority}
      className={className}
    />
  );
}
