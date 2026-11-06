import { Eye, Sparkles } from "lucide-react";
import type { ComponentType, ReactNode, SVGProps } from "react";

/*
 * 부위별 선 아이콘 6종 (QUALITY 3-1 P-01 "부위별 아이콘 6개(선 아이콘, 토큰 색)", docs/IMAGES.md "Lucide, 없으면 24px 그리드 SVG")
 * - 눈: Lucide Eye, 피부: Lucide Sparkles
 * - 코·윤곽·리프팅·가슴: Lucide 에 맞는 아이콘이 없어 같은 규칙(24px 그리드, stroke 2, 둥근 끝, currentColor)으로 직접 그렸다.
 * - 색은 currentColor → 쓰는 쪽에서 text-brand 같은 토큰 클래스로 정한다.
 * - 기본은 장식(aria-hidden). 아이콘만 단독으로 의미를 전할 때는 title 을 넘긴다.
 */

export type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & { size?: number; title?: string };

function Line24({ size = 24, title, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/** 코 — 옆모습 콧등·코끝 곡선 */
export function NoseIcon(props: IconProps) {
  return (
    <Line24 {...props}>
      <path d="M10 3c.4 4.2 1.9 7.7 4.9 10.9a1.7 1.7 0 0 1-.5 2.8l-2.6 1" />
      <path d="M9.5 20.5c1.6.6 3.3.6 5 0" />
    </Line24>
  );
}

/** 윤곽 — 얼굴 외곽(턱선) + 광대 높이 표시 */
export function ContourIcon(props: IconProps) {
  return (
    <Line24 {...props}>
      <path d="M6 4v5.5c0 4.6 2.6 8.4 6 10.5 3.4-2.1 6-5.9 6-10.5V4" />
      <path d="M3 10.5h1.5M19.5 10.5H21" />
    </Line24>
  );
}

/** 리프팅 — 얼굴 외곽 + 위로 끌어올리는 화살표 */
export function LiftingIcon(props: IconProps) {
  return (
    <Line24 {...props}>
      <path d="M6.5 7.5A8 8 0 0 0 5 12.2C5 16.5 8.1 20 12 20s7-3.5 7-7.8a8 8 0 0 0-1.5-4.7" />
      <path d="M12 15V4" />
      <path d="m8.5 7.5 3.5-3.5 3.5 3.5" />
    </Line24>
  );
}

/** 가슴 — 어깨선·목선만 단순화한 상체 윤곽(신체 묘사 없음) */
export function UpperBodyIcon(props: IconProps) {
  return (
    <Line24 {...props}>
      <path d="M8 4c0 3 1.8 5.2 4 5.2S16 7 16 4" />
      <path d="M8 4 4.5 6.5C3.5 7.2 3 8.3 3 9.5V20M16 4l3.5 2.5c1 .7 1.5 1.8 1.5 3V20" />
      <path d="M8 20v-5M16 20v-5" />
    </Line24>
  );
}

export function EyeIcon({ size = 24, title, ...rest }: IconProps) {
  return title ? (
    <Eye size={size} strokeWidth={2} role="img" aria-label={title} {...rest} />
  ) : (
    <Eye size={size} strokeWidth={2} aria-hidden="true" {...rest} />
  );
}

export function SkinIcon({ size = 24, title, ...rest }: IconProps) {
  return title ? (
    <Sparkles size={size} strokeWidth={2} role="img" aria-label={title} {...rest} />
  ) : (
    <Sparkles size={size} strokeWidth={2} aria-hidden="true" {...rest} />
  );
}

/** 카테고리 ID(data/seed/categories.json) → 아이콘 */
export const BODY_AREA_ICONS: Record<string, ComponentType<IconProps>> = {
  eye: EyeIcon,
  nose: NoseIcon,
  contour: ContourIcon,
  lifting: LiftingIcon,
  skin: SkinIcon,
  breast: UpperBodyIcon,
};

export function BodyAreaIcon({ categoryId, ...props }: IconProps & { categoryId: string }) {
  const Icon = BODY_AREA_ICONS[categoryId] ?? SkinIcon;
  return <Icon {...props} />;
}
