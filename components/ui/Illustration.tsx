import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import { Emoji3D, type EmojiName } from "@/components/ui/Emoji3D";
import { withBasePath } from "@/lib/env.public";
import { cx } from "@/lib/ui";

/**
 * AI 생성 일러스트(public/images/gen/<id>.webp, content/images/prompts.json) — 서버 컴포넌트.
 * 파일이 아직 없으면 같은 자리에 3D 이모지 타일을 그린다 → 이미지가 추가되면 자동으로 바뀐다(빌드 시 판정).
 * 비율 클래스(aspect-*)로 자리를 먼저 잡아 CLS 가 없다.
 */
const GEN_DIR = path.join(process.cwd(), "public", "images", "gen");
const SIZE: Record<Aspect, { w: number; h: number; cls: string }> = {
  "16:9": { w: 1600, h: 900, cls: "aspect-video" },
  "4:3": { w: 1600, h: 1200, cls: "aspect-4/3" },
  "1:1": { w: 1200, h: 1200, cls: "aspect-square" },
};
type Aspect = "16:9" | "4:3" | "1:1";

export function hasIllustration(id: string): boolean {
  return fs.existsSync(path.join(GEN_DIR, `${id}.webp`));
}

type Props = {
  id: string;
  aspect: Aspect;
  /** 이미지가 없을 때 대신 보여 줄 3D 이모지 */
  fallback: EmojiName;
  /** 의미 있는 이미지면 설명, 장식이면 빈 문자열 */
  alt: string;
  /** next/image sizes — 레이아웃 폭에 맞춰 지정 */
  sizes: string;
  priority?: boolean;
  className?: string;
  /** "예시 이미지" 표기(병원 사진 등 실제로 오해될 수 있는 이미지) */
  exampleLabel?: boolean;
};

export function Illustration({ id, aspect, fallback, alt, sizes, priority, className, exampleLabel }: Props) {
  const { w, h, cls } = SIZE[aspect];
  const exists = hasIllustration(id);
  return (
    <div className={cx("relative overflow-hidden bg-canvas", cls, className)}>
      {exists ? (
        <Image
          src={withBasePath(`/images/gen/${id}.webp`)}
          alt={alt}
          width={w}
          height={h}
          sizes={sizes}
          priority={priority}
          className="size-full object-cover"
        />
      ) : (
        <div className="flex size-full items-center justify-center" role={alt ? "img" : undefined} aria-label={alt || undefined}>
          <Emoji3D name={fallback} size={96} />
        </div>
      )}
      {exampleLabel && exists && (
        <span className="absolute right-3 bottom-3 rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-ink-muted shadow-sm">
          예시 이미지
        </span>
      )}
    </div>
  );
}
