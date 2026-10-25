import type { Metadata } from "next";
import { ConsultForm } from "@/components/consult/ConsultForm";
import { TrustNotes } from "@/components/consult/TrustNotes";
import type { ClinicOption, ProcedureOption } from "@/components/consult/types";
import { Emoji3D } from "@/components/ui/Emoji3D";
import { isPathBuilt } from "@/lib/built-routes";
import { CONSULT_TITLE, consultMode, consultPageMetadata } from "@/lib/consult/mode";
import { loadContent } from "@/lib/content";
import { formatPriceRange } from "@/lib/format";
import { ROUTES } from "@/lib/routes";

// P-06 상담 신청 폼 (screen-spec 4절). 제휴 전 MVP 폴백(8절): 수신처 운영자, clinic_id 선택.
// 버튼 이름은 "상담 신청(하기)"로 통일(lib/site.ts CONSULT_CTA). 동작 모드(live/demo)는 빌드 시 Supabase 키 유무로 정한다.

const MODE = consultMode();

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

  return (
    <div data-consult-page="" className="mx-auto w-full max-w-form px-5 pt-8 pb-16 md:px-0 md:pt-14 md:pb-24">
      <header>
        <Emoji3D name="clipboard" size={64} priority />
        <h1 className="mt-4 text-h1 font-bold tracking-tighter text-ink">{CONSULT_TITLE}</h1>
        <p className="mt-3 text-ink-muted">
          관심 시술과 연락처를 남기면 가격 범위와 회복 일정, 상담 때 꼭 물어볼 점을 정리한 상담 가이드를 받을 수 있어요.
        </p>
      </header>

      <div className="mt-10 md:mt-12">
        <ConsultForm procedures={procedureOptions} clinics={clinicOptions} privacyHref={privacyHref} mode={MODE} />
      </div>

      <TrustNotes className="mt-12 md:mt-14" mode={MODE} />
    </div>
  );
}
