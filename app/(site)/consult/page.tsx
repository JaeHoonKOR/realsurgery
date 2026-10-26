import type { Metadata } from "next";
import { ConsultForm } from "@/components/consult/ConsultForm";
import { TrustNotes } from "@/components/consult/TrustNotes";
import type { ClinicOption, ProcedureOption } from "@/components/consult/types";
import { Icon3D } from "@/components/ui/Icon3D";
import { Illustration } from "@/components/ui/Illustration";
import { isPathBuilt } from "@/lib/built-routes";
import { CONSULT_TITLE, consultMode, consultPageMetadata } from "@/lib/consult/mode";
import { loadContent } from "@/lib/content";
import { formatPriceRange } from "@/lib/format";
import { hasAsset } from "@/lib/gen-assets";
import { ROUTES } from "@/lib/routes";

// P-06 상담 신청 폼 (screen-spec 4절). 제휴 전 MVP 폴백(8절): 수신처 운영자, clinic_id 선택.
// 버튼 이름은 "상담 신청(하기)"로 통일(lib/site.ts CONSULT_CTA). 동작 모드(live/demo)는 빌드 시 Supabase 키 유무로 정한다.

const MODE = consultMode();

/** lg 이상 왼쪽 고정 패널 이미지(prompts.json consult-desk — 받게 될 상담 가이드 실물 은유). 없으면 지금처럼 1열 */
const DESK = "consult-desk";

export const metadata: Metadata = consultPageMetadata(MODE);

export default function ConsultPage() {
  const { procedures, categories, clinics } = loadContent();
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  // 부위 순서 → 조회수 순서(많이 찾는 시술이 위)
  const procedureOptions: ProcedureOption[] = [...procedures]
    .sort(
      (a, b) =>
        (categoryById.get(a.category_id)?.order ?? 99) - (categoryById.get(b.category_id)?.order ?? 99) ||
        b.view_count - a.view_count,
    )
    .map((p) => ({
      id: p.id,
      name: p.name,
      category_id: p.category_id,
      category_name: categoryById.get(p.category_id)?.name ?? "",
      price_label: formatPriceRange(p.price_low, p.price_high),
    }));
  const clinicOptions: ClinicOption[] = clinics.map((c) => ({ id: c.id, name: c.name, region: c.region }));
  const privacyHref = isPathBuilt(ROUTES.privacy) ? ROUTES.privacy : undefined;

  const header = (
    <header>
      <Icon3D name="ic-guide" size={64} priority />
      <h1 className="mt-4 text-h1 font-bold tracking-tighter text-ink">{CONSULT_TITLE}</h1>
      <p className="mt-3 text-ink-muted">
        관심 시술과 연락처를 남기면 가격 범위와 회복 일정, 상담 때 꼭 물어볼 점을 정리한 상담 가이드를 받을 수 있어요.
      </p>
    </header>
  );
  const form = (
    <div className="mt-10 md:mt-12">
      <ConsultForm procedures={procedureOptions} clinics={clinicOptions} privacyHref={privacyHref} mode={MODE} />
    </div>
  );

  if (hasAsset(DESK)) {
    // lg 이상 2열(asset-plan 5절 P-06): 왼쪽 5/12 이미지 + 안심 안내(고정), 오른쪽 7/12 폼. 그 아래 폭은 지금과 같은 1열 —
    // DOM 순서가 제목 → 폼 → 안심 안내라 모바일 화면·읽는 순서는 그대로다(이미지는 lg 미만에서 숨김·지연 로딩).
    return (
      <div
        data-consult-page=""
        data-testid="consult-layout-wide"
        className="mx-auto w-full max-w-form px-5 pt-8 pb-16 md:px-0 md:pt-14 md:pb-24 lg:grid lg:max-w-content lg:grid-cols-12 lg:items-start lg:gap-x-12 lg:px-10"
      >
        <div className="lg:col-span-7 lg:col-start-6 lg:row-start-1">
          {header}
          {form}
        </div>
        <div className="lg:sticky lg:top-24 lg:col-span-5 lg:col-start-1 lg:row-start-1">
          <Illustration
            id={DESK}
            aspect="4:3"
            alt=""
            sizes="(min-width: 1024px) 440px, 0px"
            className="hidden rounded-xl lg:block"
          />
          <TrustNotes className="mt-12 md:mt-14 lg:mt-6" mode={MODE} />
        </div>
      </div>
    );
  }

  return (
    <div data-consult-page="" className="mx-auto w-full max-w-form px-5 pt-8 pb-16 md:px-0 md:pt-14 md:pb-24">
      {header}
      {form}
      <TrustNotes className="mt-12 md:mt-14" mode={MODE} />
    </div>
  );
}
