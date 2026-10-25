import Image from "next/image";
import { withBasePath } from "@/lib/env.public";

/**
 * 이행 기간 폴백 전용 — Microsoft Fluent Emoji 3D (MIT, public/images/emoji/LICENSE.txt).
 * 화면 코드는 이 컴포넌트를 직접 쓰지 않고 `Icon3D`(components/ui/Icon3D)를 쓴다. Icon3D 는 생성 아이콘
 * (public/images/gen/ic-*.webp)이 아직 없을 때 여기로 폴백한다(docs/design/asset-plan.md 3절 매핑).
 * 생성 아이콘으로 모두 바뀌면 이 파일과 public/images/emoji/ 를 함께 지운다.
 * 160px WebP 원본을 표시 크기(size)로 줄여 쓴다. 장식이면 alt 생략(기본), 의미가 있으면 alt 를 넘긴다.
 */
export const EMOJI = [
  "bandage", "book", "bubbles", "bulb", "calendar", "chart", "chat", "check", "clipboard", "envelope",
  "eye", "gem", "hospital", "hourglass", "ice", "lipstick", "lock", "lotion", "memo", "mirror",
  "money", "nose", "party", "phone", "pin", "ribbon", "ruler", "search", "shield", "sparkles",
  "stethoscope", "stopwatch", "syringe", "thread", "warning",
] as const;
export type EmojiName = (typeof EMOJI)[number];

/** 표시 크기(px) — Icon3D 와 같은 단계 */
export type EmojiSize = 24 | 32 | 40 | 48 | 56 | 64 | 72 | 88 | 96 | 120 | 160;

const SIZE_CLASS: Record<EmojiSize, string> = {
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

type Props = {
  name: EmojiName;
  size?: EmojiSize;
  alt?: string;
  className?: string;
  priority?: boolean;
};

export function Emoji3D({ name, size = 48, alt = "", className, priority }: Props) {
  return (
    <Image
      src={withBasePath(`/images/emoji/${name}.webp`)}
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      // 고정 크기 원본 1장 — 반응형 로더(lib/image-loader.ts)를 거치지 않는다
      unoptimized
      aria-hidden={alt ? undefined : true}
      className={`${SIZE_CLASS[size]} shrink-0 select-none ${className ?? ""}`}
      draggable={false}
    />
  );
}
