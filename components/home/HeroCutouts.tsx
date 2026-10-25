import Image from "next/image";
import { Emoji3D } from "@/components/ui/Emoji3D";
import { withBasePath } from "@/lib/env.public";
import { genAssetPath, hasAsset } from "@/lib/gen-assets";
import { cx } from "@/lib/ui";

/**
 * 메인 히어로 가격 비교 카드 모서리의 3D 컷아웃(docs/design/asset-plan.md 5절, prompts.json hero-obj-a·b).
 * 384px 흰 배경 원본을 mix-blend-multiply 로 회색 패널·흰 카드 위에 얹는다. 장식이라 aria-hidden·pointer-events-none,
 * 160px 이하라 LCP 후보가 아니므로 priority 를 주지 않는다. 첫 로드에 한 번 12px 위에서 내려앉는다(@starting-style, 막대 성장과 동시).
 * 부모: 카드를 감싼 relative 상자. Back 은 카드보다 먼저(DOM 순서로 카드 뒤), Front 는 카드 다음에 둔다.
 * Front 는 카드 위로 80px 올라가므로 히어로 위 여백이 그만큼 있어야 한다(page.tsx 가 HERO_CUTOUT 일 때 md:pt-24).
 * 위치: 카드 탭 줄·글자를 가리지 않게 카드 안쪽은 모서리 패딩 정도만 겹친다(md·lg 104px, xl 160px).
 */
export const HERO_CUTOUT = "hero-obj-a";
const BASE = "pointer-events-none absolute select-none mix-blend-multiply transition duration-600 ease-out starting:-translate-y-3 starting:opacity-0";

/** hero-obj-a — 카드 우상단에 걸친다(카드 위). 파일이 없으면 지금의 스파클 3D 이모지를 그대로 둔다. */
export function HeroCutoutFront() {
  if (!hasAsset(HERO_CUTOUT)) {
    return <Emoji3D name="sparkles" size={56} className="absolute -top-7 -right-1 md:-right-3" />;
  }
  return (
    <Image
      src={withBasePath(genAssetPath(HERO_CUTOUT))}
      alt=""
      aria-hidden="true"
      width={160}
      height={160}
      unoptimized
      draggable={false}
      data-testid="hero-cutout-a"
      className={cx(BASE, "-top-20 -right-1 size-26 md:-right-2 xl:-right-18 xl:size-40")}
    />
  );
}

/** hero-obj-b — 카드 좌하단 뒤에 깔린다. 파일이 없으면 그리지 않는다. */
export function HeroCutoutBack() {
  if (!hasAsset("hero-obj-b")) return null;
  return (
    <Image
      src={withBasePath(genAssetPath("hero-obj-b"))}
      alt=""
      aria-hidden="true"
      width={128}
      height={128}
      unoptimized
      draggable={false}
      data-testid="hero-cutout-b"
      className={cx(BASE, "-bottom-10 -left-3 size-22 md:-bottom-12 md:-left-8 xl:-bottom-16 xl:-left-20 xl:size-32")}
    />
  );
}
