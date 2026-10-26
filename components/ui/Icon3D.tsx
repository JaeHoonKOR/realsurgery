import Image from "next/image";
import { Emoji3D, type EmojiName } from "@/components/ui/Emoji3D";
import { withBasePath } from "@/lib/env.public";
import { genAssetPath, hasAsset } from "@/lib/gen-assets";
import { cx } from "@/lib/ui";

/**
 * 3D 아이콘 — "Porcelain & Blue" 생성 아이콘(public/images/gen/ic-*.webp, 256px 흰 배경)
 * (docs/design/asset-plan.md 3절·10절, content/images/prompts.json family "icon").
 * - 흰 배경으로 생성했으므로 항상 mix-blend-multiply 로 밝은 표면(surface·canvas·canvas-soft·brand-weak·danger-weak)에 얹는다.
 *   어두운 표면(bg-ink 활성 칩) 위에서는 호출부가 흰 원(size-7 rounded-full bg-surface) 안에 넣는다.
 * - lib/gen-assets.json 에 아직 없으면 3절 매핑대로 Fluent 3D 이모지로 폴백한다 → 파일이 들어오면 다시 빌드할 때 자동으로 바뀐다.
 * - 조작 신호(쉐브론·닫기·복사·인라인 핀 등 16–20px)는 lucide 를 쓴다. 이 컴포넌트는 의미를 그림으로 전하는 자리만.
 */
export const ICON_FALLBACK = {
  // 부위
  "ic-eye": "eye",
  "ic-nose": "nose",
  "ic-contour": "ruler",
  "ic-lifting": "thread",
  "ic-skin": "bubbles",
  "ic-breast": "ribbon",
  // P-03 사실 4칸
  "ic-price": "money",
  "ic-duration": "stopwatch",
  "ic-recovery": "bandage",
  "ic-anesthesia": "syringe",
  // 상담
  "ic-consult": "chat",
  "ic-free": "money",
  "ic-callback": "phone",
  "ic-privacy": "lock",
  "ic-timing-soon": "stopwatch",
  "ic-timing-later": "calendar",
  "ic-undecided": "bulb",
  "ic-memo": "memo",
  "ic-meds": "stethoscope",
  "ic-quote": "money",
  "ic-guide": "clipboard",
  "ic-done": "party",
  // 병원·신뢰·상태
  "ic-clinic": "hospital",
  "ic-check": "check",
  "ic-caution": "warning",
  "ic-search": "search",
  "ic-scale": "chart",
  "ic-calendar": "calendar",
  "ic-fair": "shield",
  "ic-source": "book",
  "ic-pin": "pin",
} as const satisfies Record<`ic-${string}`, EmojiName>;

export type IconName = keyof typeof ICON_FALLBACK;
export const ICON_NAMES = Object.keys(ICON_FALLBACK) as IconName[];

/** 표시 크기(px) — 24px 는 부위 칩·좁은 줄에서만(asset-plan 3절) */
export const ICON_SIZES = [24, 32, 40, 48, 56, 64, 72, 88, 96, 120, 160] as const;
export type IconSize = (typeof ICON_SIZES)[number];

const SIZE_CLASS: Record<IconSize, string> = {
  24: "size-6",
  32: "size-8",
  40: "size-10",
  48: "size-12",
  56: "size-14",
  64: "size-16",
  72: "size-18",
  88: "size-22",
  96: "size-24",
  120: "size-30",
  160: "size-40",
};

/** 시술 부위(카테고리 id) → 아이콘 */
export const CATEGORY_ICON: Record<string, IconName> = {
  eye: "ic-eye",
  nose: "ic-nose",
  contour: "ic-contour",
  lifting: "ic-lifting",
  skin: "ic-skin",
  breast: "ic-breast",
};

export function categoryIcon(categoryId: string): IconName {
  return CATEGORY_ICON[categoryId] ?? "ic-guide";
}

type Props = {
  name: IconName;
  size?: IconSize;
  /** 의미가 있으면 설명, 장식이면 생략(기본 "") */
  alt?: string;
  className?: string;
  /** 첫 화면 위쪽(히어로 탭·헤더)만 */
  priority?: boolean;
};

export function Icon3D({ name, size = 48, alt = "", className, priority }: Props) {
  if (!hasAsset(name)) {
    return <Emoji3D name={ICON_FALLBACK[name]} size={size} alt={alt} className={className} priority={priority} />;
  }
  return (
    <Image
      src={withBasePath(genAssetPath(name))}
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      // 256px 원본 1장(고정 크기) — 반응형 로더(lib/image-loader.ts)를 거치지 않는다
      unoptimized
      aria-hidden={alt ? undefined : true}
      draggable={false}
      data-icon={name}
      className={cx(SIZE_CLASS[size], "shrink-0 select-none mix-blend-multiply", className)}
    />
  );
}
