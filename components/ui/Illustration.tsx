import Image from "next/image";
import { Icon3D, type IconName } from "@/components/ui/Icon3D";
import { withBasePath } from "@/lib/env.public";
import { genImageBase, hasAsset } from "@/lib/gen-assets";
import { cx } from "@/lib/ui";

/**
 * AI 생성 이미지 자리(public/images/gen/<id>.webp + -1024·-640 변형, content/images/prompts.json) — 서버·클라이언트 공용.
 * - 파일 유무는 lib/gen-assets.json(scripts/finalize-images.mjs 가 갱신)으로 판정한다 → 이미지가 들어오면 다시 빌드할 때 자동으로 바뀐다.
 * - 없을 때: fallback 아이콘이 있으면 같은 비율 상자 안에 3D 아이콘 타일을, 없으면 아무것도 그리지 않는다
 *   (호출부가 지금 디자인을 그대로 둔다 — 빈 회색 상자 금지).
 * - 비율 클래스(aspect-*)로 자리를 먼저 잡아 CLS 가 없다. 표시 크롭(16:10·21:9·3:4)은 object-cover 로 원본(4:3·16:9)을 자른다.
 * - srcset 은 커스텀 로더(lib/image-loader.ts)가 미리 만든 640·1024·1600 변형으로 만든다 → sizes 를 레이아웃 폭에 맞춰 넘긴다.
 */
export type Aspect = "16:9" | "4:3" | "1:1" | "16:10" | "21:9" | "3:4";

const SIZE: Record<Aspect, { w: number; h: number; cls: string }> = {
  "16:9": { w: 1600, h: 900, cls: "aspect-video" },
  "4:3": { w: 1600, h: 1200, cls: "aspect-4/3" },
  "1:1": { w: 1600, h: 1600, cls: "aspect-square" },
  "16:10": { w: 1600, h: 1000, cls: "aspect-16/10" },
  "21:9": { w: 1600, h: 686, cls: "aspect-21/9" },
  "3:4": { w: 1200, h: 1600, cls: "aspect-3/4" },
};

/** 병원 사진(clinic-*)은 실제 병원으로 오해되지 않게 대체 텍스트와 "예시 이미지" 표기를 고정한다(asset-plan 10절) */
export const CLINIC_PHOTO_ALT = "병원 내부 예시 이미지(실제 병원 사진 아님)";

type Props = {
  id: string;
  aspect: Aspect;
  /** 이미지가 없을 때 같은 자리에 그릴 3D 아이콘. 없으면 아무것도 그리지 않는다 */
  fallback?: IconName;
  /** 의미 있는 이미지면 설명, 장식이면 빈 문자열 */
  alt: string;
  /** next/image sizes — 레이아웃 폭에 맞춰 지정 */
  sizes: string;
  priority?: boolean;
  className?: string;
  /** "예시 이미지" 표기(병원 사진 등 실제로 오해될 수 있는 이미지). clinic-* 은 항상 켜진다 */
  exampleLabel?: boolean;
};

export function Illustration({ id, aspect, fallback, alt, sizes, priority, className, exampleLabel }: Props) {
  const exists = hasAsset(id);
  if (!exists && !fallback) return null;
  const { w, h, cls } = SIZE[aspect];
  const isClinic = id.startsWith("clinic-");
  return (
    <div className={cx("relative overflow-hidden bg-canvas", cls, className)}>
      {exists ? (
        <Image
          src={withBasePath(genImageBase(id))}
          alt={isClinic ? CLINIC_PHOTO_ALT : alt}
          width={w}
          height={h}
          sizes={sizes}
          priority={priority}
          draggable={false}
          className="size-full object-cover"
        />
      ) : (
        fallback && (
          <div className="flex size-full items-center justify-center" role={alt ? "img" : undefined} aria-label={alt || undefined}>
            <Icon3D name={fallback} size={96} />
          </div>
        )
      )}
      {exists && (exampleLabel || isClinic) && (
        <span className="absolute right-3 bottom-3 rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-ink-muted shadow-sm">
          예시 이미지
        </span>
      )}
    </div>
  );
}
