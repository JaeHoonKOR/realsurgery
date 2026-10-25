import type { Metadata } from "next";
import { DoneView } from "@/components/consult/DoneView";
import type { RelatedProcedure } from "@/components/consult/types";
import { isPathBuilt } from "@/lib/built-routes";
import { consultDoneMetadata, consultMode } from "@/lib/consult/mode";
import { loadContent, type Procedure } from "@/lib/content";
import { formatPriceRange, formatRecovery } from "@/lib/format";
import { procedurePath } from "@/lib/routes";

// P-07 상담 신청 완료 (screen-spec 4절). 전환 확정 페이지 — 검색 노출 금지(6절 robots: /consult/done 차단).
// 시연 모드(Supabase 키 없음)에서는 접수가 서버로 가지 않으므로 연락을 약속하지 않는다(lib/consult/mode.ts).

const MODE = consultMode();

export const metadata: Metadata = consultDoneMetadata(MODE);

const RELATED_COUNT = 2;

/**
 * 카카오톡 채널 URL — 채널 개설 후 NEXT_PUBLIC_KAKAO_CHANNEL_URL 에 넣으면 버튼이 나타난다(없으면 숨김).
 * SPEC-GAP: lib/env.public.ts PUBLIC_VARS 에 아직 없는 변수라 여기서 리터럴로 읽는다(빌드 시 치환).
 */
function kakaoChannelUrl(): string | undefined {
  const v = (process.env.NEXT_PUBLIC_KAKAO_CHANNEL_URL ?? "").trim();
  return /^https:\/\//.test(v) ? v : undefined;
}

export default function ConsultDonePage() {
  const { procedures, categories } = loadContent();
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const popular = [...procedures].sort((a, b) => b.view_count - a.view_count);

  const toCard = (p: Procedure): RelatedProcedure => {
    const href = procedurePath(p.slug);
    return {
      id: p.id,
      name: p.name,
      category_id: p.category_id,
      category_name: categoryName.get(p.category_id) ?? "",
      tagline: p.extras?.tagline ?? "",
      price_label: formatPriceRange(p.price_low, p.price_high),
      recovery_label: formatRecovery(p.recovery_days),
      href: isPathBuilt(href) ? href : null,
    };
  };

  // 같은 부위(조회수 순) 먼저, 모자라면 전체 인기 시술로 채운다
  const related: Record<string, RelatedProcedure[]> = {};
  for (const p of procedures) {
    const same = popular.filter((o) => o.id !== p.id && o.category_id === p.category_id);
    const rest = popular.filter((o) => o.id !== p.id && o.category_id !== p.category_id);
    related[p.id] = [...same, ...rest].slice(0, RELATED_COUNT).map(toCard);
  }
  const fallback = popular.slice(0, RELATED_COUNT).map(toCard);

  return (
    <div data-consult-page="" className="mx-auto w-full max-w-form px-5 pt-10 pb-16 md:px-0 md:pt-16 md:pb-24">
      <DoneView related={related} fallback={fallback} kakaoChannelUrl={kakaoChannelUrl()} mode={MODE} />
    </div>
  );
}
