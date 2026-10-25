import type { Metadata } from "next";
import { AttributionCapture } from "@/components/consult/AttributionCapture";
import { ConsultForm } from "@/components/consult/ConsultForm";
import { TrustNotes } from "@/components/consult/TrustNotes";
import type { ClinicOption, ProcedureOption } from "@/components/consult/types";
import { Emoji3D } from "@/components/ui/Emoji3D";
import { isPathBuilt } from "@/lib/built-routes";
import { loadContent } from "@/lib/content";
import { formatPriceRange } from "@/lib/format";
import { ROUTES } from "@/lib/routes";

// P-06 무료 상담 예약 폼 (screen-spec 4절). 제휴 전 MVP 폴백(8절): 제목 "시술 상담 가이드 받기", 수신처 운영자, clinic_id 선택.

const TITLE = "시술 상담 가이드 받기";
const DESCRIPTION =
  "관심 시술과 희망 지역·시기, 연락처만 남기면 리얼성형 운영팀이 시술별 가격 범위와 회복 일정, 상담 때 확인할 점을 정리해 영업일 기준 1일 안에 연락드립니다. 신청은 무료입니다.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // ?procedure_id 같은 쿼리는 같은 화면 → canonical 은 쿼리 없는 경로
  alternates: { canonical: "./" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "./" },
};

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
      <AttributionCapture />
      <header>
        <Emoji3D name="clipboard" size={64} priority />
        <h1 className="mt-4 text-h1 font-bold tracking-tighter text-ink">{TITLE}</h1>
        <p className="mt-3 text-ink-muted">
          시술과 연락처만 남겨 주세요. 가격 범위와 회복 일정, 상담 때 꼭 물어볼 점을 정리해 연락드립니다.
        </p>
      </header>

      <div className="mt-10 md:mt-12">
        <ConsultForm procedures={procedureOptions} clinics={clinicOptions} privacyHref={privacyHref} />
      </div>

      <TrustNotes className="mt-12 md:mt-14" />
    </div>
  );
}
