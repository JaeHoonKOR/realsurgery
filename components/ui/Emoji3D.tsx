import Image from "next/image";
import { withBasePath } from "@/lib/env.public";

/**
 * 3D 일러스트 아이콘 — Microsoft Fluent Emoji 3D (MIT, public/images/emoji/LICENSE.txt).
 * 160px WebP 원본을 표시 크기(size)로 줄여 쓴다. 장식이면 alt 생략(기본), 의미가 있으면 alt 를 넘긴다.
 */
export const EMOJI = [
  "bandage", "book", "bubbles", "bulb", "calendar", "chart", "chat", "check", "clipboard", "envelope",
  "eye", "gem", "hospital", "hourglass", "ice", "lipstick", "lock", "lotion", "memo", "mirror",
  "money", "nose", "party", "phone", "pin", "ribbon", "ruler", "search", "shield", "sparkles",
  "stethoscope", "stopwatch", "syringe", "thread", "warning",
] as const;
export type EmojiName = (typeof EMOJI)[number];

/** 시술 부위(카테고리 id) → 일러스트 */
export const CATEGORY_EMOJI: Record<string, EmojiName> = {
  eye: "eye",
  nose: "nose",
  contour: "ruler",
  lifting: "thread",
  skin: "bubbles",
  breast: "ribbon",
};

export function categoryEmoji(categoryId: string): EmojiName {
  return CATEGORY_EMOJI[categoryId] ?? "sparkles";
}

type Props = {
  name: EmojiName;
  /** 표시 크기(px) — 24·32·40·48·56·64·80·96 중 하나 */
  size?: 24 | 32 | 40 | 48 | 56 | 64 | 80 | 96;
  alt?: string;
  className?: string;
  priority?: boolean;
};

const SIZE_CLASS: Record<NonNullable<Props["size"]>, string> = {
  24: "size-6",
  32: "size-8",
  40: "size-10",
  48: "size-12",
  56: "size-14",
  64: "size-16",
  80: "size-20",
  96: "size-24",
};

export function Emoji3D({ name, size = 48, alt = "", className, priority }: Props) {
  return (
    <Image
      src={withBasePath(`/images/emoji/${name}.webp`)}
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      aria-hidden={alt ? undefined : true}
      className={`${SIZE_CLASS[size]} shrink-0 select-none ${className ?? ""}`}
      draggable={false}
    />
  );
}
