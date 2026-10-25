import type { Metadata } from "next";
import { withShareDefaults } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, ChevronRight, Info, MapPin, MessageCircle, Phone } from "lucide-react";
import { BottomBar } from "@/components/common/BottomBar";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ConsultCta } from "@/components/common/ConsultCta";
import { TrackedLink } from "@/components/common/TrackedLink";
import { ClinicPhoto } from "@/components/clinic/ClinicPhoto";
import { ClinicPriceList } from "@/components/clinic/ClinicPriceList";
import { ClinicViewTracker } from "@/components/clinic/ClinicViewTracker";
import { HoursTable } from "@/components/clinic/HoursTable";
import { LocationCard } from "@/components/clinic/LocationCard";
import { OpenStatus } from "@/components/clinic/OpenStatus";
import { SectionNav } from "@/components/clinic/SectionNav";
import { Icon3D } from "@/components/ui/Icon3D";
import { isPathBuilt } from "@/lib/built-routes";
import { weekSummary } from "@/lib/clinic/hours";
import { slugParams } from "@/lib/clinic/static-params";
import {
  clinicDescription,
  clinicJsonLd,
  decodeSlug,
  formatDistance,
  formatMonthDay,
  jsonLdScript,
  latestUpdate,
  offerSpan,
  similarClinics,
} from "@/lib/clinic/view";
import { loadContent, type Clinic, type Procedure } from "@/lib/content";
import { siteUrl } from "@/lib/env.public";
import { formatDate, formatManwon, formatPriceRange } from "@/lib/format";
import { clinicImageId, hasAsset } from "@/lib/gen-assets";
import { ROUTES, clinicPath } from "@/lib/routes";
import { SITE } from "@/lib/site";
import { btn, chip, container, cx, section } from "@/lib/ui";

// P-05 병원 상세 (screen-spec 4절): 헤더 · 시술 가격표 · 위치·운영시간 · 연락 · 병원 소개 · 다른 병원 비교
// 8절 폴백: 공개 정보만, "제휴"·"추천" 표현 금지, 전화·카톡은 is_partner 일 때만.

export const dynamicParams = false;

export function generateStaticParams() {
  return slugParams(loadContent().clinics.map((c) => c.slug));
}

type Params = { slug: string };

function findClinic(slug: string): Clinic | undefined {
  const key = decodeSlug(slug);
  return loadContent().clinics.find((c) => c.slug === key);
}

function offeredRows(clinic: Clinic) {
  const { procedures, categories } = loadContent();
  const byId = new Map(procedures.map((p) => [p.id, p]));
  const catById = new Map(categories.map((c) => [c.id, c]));
  return clinic.procedures
    .map((offer) => {
      const procedure = byId.get(offer.procedure_id);
      return procedure ? { offer, procedure, category: catById.get(procedure.category_id) } : null;
    })
    .filter((r): r is { offer: Clinic["procedures"][number]; procedure: Procedure; category: (typeof categories)[number] | undefined } => r != null);
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const clinic = findClinic(slug);
  if (!clinic) return {};
  const rows = offeredRows(clinic);
  const title = `${clinic.name} 시술 가격·진료시간 (${clinic.region})`;
  const description = clinicDescription(
    clinic,
    rows.map((r) => r.procedure.name),
    offerSpan(clinic.procedures),
    formatPriceRange,
  );
  return {
    title,
    description,
    alternates: { canonical: encodeURI(clinicPath(clinic.slug)) },
    ...withShareDefaults({ title: `${title} | ${SITE.name}`, description, url: encodeURI(clinicPath(clinic.slug)) }),
  };
}

const SECTIONS = [
  { id: "prices", label: "시술 가격" },
  { id: "location", label: "위치·진료시간" },
  { id: "about", label: "병원 소개" },
  { id: "others", label: "다른 병원" },
];

export default async function ClinicPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const clinic = findClinic(slug);
  if (!clinic) notFound();

  const content = loadContent();
  const rows = offeredRows(clinic);
  const procById = new Map(content.procedures.map((p) => [p.id, p]));
  const span = offerSpan(clinic.procedures);
  const updates = new Set(clinic.procedures.map((o) => o.price_updated_at));
  const sharedUpdate = updates.size === 1 ? [...updates][0]! : null;
  const latest = latestUpdate(clinic.procedures);
  const similar = similarClinics(clinic, content.clinics, 3);
  const listBuilt = isPathBuilt(ROUTES.clinics);
  const consultBuilt = isPathBuilt(ROUTES.consult);
  const week = weekSummary(clinic.hours);

  const phone = clinic.is_partner && clinic.phone ? clinic.phone : null;
  const kakao = clinic.is_partner && clinic.kakao_url ? clinic.kakao_url : null;

  const url = `${siteUrl()}${encodeURI(clinicPath(clinic.slug))}`;
  const jsonLd = clinicJsonLd(
    clinic,
    url,
    rows.map((r) => r.procedure.name),
  );

  const categoryNames = [...new Set(rows.map((r) => r.category?.name).filter(Boolean))] as string[];
  // 병원 예시 사진이 있으면 헤더 오른쪽(모바일은 제목 아래 전폭)에 두고 큰 병원 아이콘 타일은 뺀다(asset-plan 5절)
  const photo = hasAsset(clinicImageId(clinic.id));
  const summary = (
    <dl
      data-testid="clinic-summary"
      className={cx("grid grid-cols-3 divide-x divide-line rounded-lg bg-surface py-4 md:py-5", photo ? "mt-3" : "md:col-span-5")}
    >
      <div className="px-4 md:px-5">
        <dt className="text-xs text-ink-subtle">공개 시술</dt>
        <dd className="mt-1 text-lg font-bold text-ink tabular-nums">{rows.length}개</dd>
      </div>
      <div className="px-4 md:px-5">
        <dt className="text-xs text-ink-subtle">시작 가격</dt>
        <dd className="mt-1 text-lg font-bold text-ink tabular-nums">
          {span.low != null ? `${formatManwon(span.low)}원` : "상담 후"}
        </dd>
      </div>
      <div className="px-4 md:px-5">
        <dt className="text-xs text-ink-subtle">가격 갱신</dt>
        <dd className="mt-1 text-lg font-bold text-ink tabular-nums">{latest ? formatMonthDay(latest) : "—"}</dd>
      </div>
    </dl>
  );

  return (
    <>
      <ClinicViewTracker clinicId={clinic.id} clinicName={clinic.name} isPremium={clinic.is_premium} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />

      {/* 병원 헤더 */}
      <section aria-labelledby="clinic-title" data-testid="clinic-header" className="bg-canvas">
        <div className={cx(container, "pt-4 pb-10 md:pt-6 md:pb-14")}>
          <Breadcrumb
            items={[
              { name: "홈", href: ROUTES.home },
              { name: "병원 찾기", href: ROUTES.clinics },
              { name: clinic.name },
            ]}
          />

          <div className={cx("mt-6 grid gap-8 md:mt-8 md:grid-cols-12 md:gap-10", photo ? "md:items-center" : "md:items-end")}>
            <div className="md:col-span-7">
              {!photo && (
                <span className="flex size-20 items-center justify-center rounded-lg bg-surface">
                  <Icon3D name="ic-clinic" size={56} priority />
                </span>
              )}
              <div className={cx("flex flex-wrap items-center gap-2", !photo && "mt-6")}>
                {clinic.is_premium && (
                  <span data-testid="clinic-premium" className={cx(chip.base, chip.brand, "h-7 text-xs")}>
                    <BadgeCheck aria-hidden="true" className="size-4" />
                    프리미엄
                  </span>
                )}
                {clinic.specialties.map((s) => (
                  <span key={s} className={cx(chip.base, "h-7 bg-surface text-xs text-ink-muted")}>
                    {s}
                  </span>
                ))}
              </div>
              <h1 id="clinic-title" className="mt-3 text-h1 font-bold tracking-tighter text-ink">
                {clinic.name}
              </h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-lg text-ink-muted">
                <span className="inline-flex items-center gap-1">
                  <MapPin aria-hidden="true" className="size-5" />
                  {clinic.region}
                </span>
                {categoryNames.length > 0 && (
                  <>
                    <span aria-hidden="true" className="h-4 w-px bg-line-strong" />
                    <span>{categoryNames.join("·")} 시술</span>
                  </>
                )}
              </p>
              <OpenStatus hours={clinic.hours} className="mt-5 text-base" />
              {clinic.ad_review_no && (
                <p data-testid="clinic-ad-review" className="mt-3 text-sm text-ink-muted">
                  의료광고 심의번호 {clinic.ad_review_no}
                </p>
              )}
            </div>

            {/* 한눈 요약 — 공개 시술 수 · 시작 가격 · 가격 갱신일 (사진이 있으면 사진 아래) */}
            {photo ? (
              <div className="md:col-span-5">
                <ClinicPhoto
                  clinicId={clinic.id}
                  className="rounded-lg md:aspect-4/3"
                  sizes="(min-width: 768px) 460px, 100vw"
                  priority
                />
                {summary}
              </div>
            ) : (
              summary
            )}
          </div>

          {clinic.is_demo && (
            <div
              role="note"
              data-testid="clinic-demo-notice"
              className="mt-8 flex items-start gap-3 rounded-md bg-surface px-4 py-3.5 md:items-center"
            >
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ink-subtle md:mt-0" />
              <p className="text-sm text-ink-muted">
                <strong className="font-semibold text-ink">제휴 전 예시 데이터입니다. 실제 병원 정보가 아닙니다.</strong>{" "}
                화면 구성을 보여 드리기 위한 가상의 병원이며, 가격은 같은 시술의 공개 가격대를 참고해 만들었습니다.
              </p>
            </div>
          )}
        </div>
      </section>

      <SectionNav items={SECTIONS.filter((s) => s.id !== "others" || similar.length > 0)} />

      {/* 시술 가격표 */}
      <section id="prices" aria-labelledby="prices-title" data-testid="clinic-prices-section" className={cx("scroll-mt-12 bg-canvas", section)}>
        <div className={container}>
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <div>
              <h2 id="prices-title" className="text-h2 font-bold tracking-tight text-ink">
                시술 가격
              </h2>
              <p className="mt-2 text-ink-muted">병원이 공개한 가격이며 상담 후 달라질 수 있습니다.</p>
            </div>
            {sharedUpdate && (
              <p data-testid="clinic-price-updated" className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-success" />
                가격 갱신 <span className="font-semibold text-ink-muted tabular-nums">{formatDate(sharedUpdate)}</span>
              </p>
            )}
          </div>

          <div className="mt-8">
            <ClinicPriceList clinicName={clinic.name} rows={rows} sharedUpdate={sharedUpdate} />
          </div>
          <p className="mt-4 text-sm text-ink-muted">
            막대는 같은 시술의 전체 공개 가격 범위(양 끝 숫자) 안에서 이 병원 가격이 놓인 위치입니다. 부가세·마취·검사 비용
            포함 여부는 병원마다 다릅니다.
          </p>
        </div>
      </section>

      {/* 위치·운영시간 */}
      <section id="location" aria-labelledby="location-title" className={cx("scroll-mt-12", container, section)}>
        <h2 id="location-title" className="text-h2 font-bold tracking-tight text-ink">
          위치·진료 시간
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-12">
          <div className="md:col-span-6">
            <LocationCard clinicId={clinic.id} clinicName={clinic.name} region={clinic.region} address={clinic.address} />
          </div>
          <div className="rounded-lg bg-surface md:col-span-6 md:border md:border-line md:p-5">
            <h3 className="flex items-center gap-2 px-1 pb-3 text-lg font-bold text-ink md:px-3">
              <Icon3D name="ic-calendar" size={24} />
              요일별 진료 시간
            </h3>
            <HoursTable hours={clinic.hours} />
            <p className="mt-3 px-1 text-xs text-ink-subtle md:px-3">
              점심시간·휴진일은 병원 사정에 따라 바뀔 수 있습니다. 방문 전 확인을 권합니다.
            </p>
          </div>
        </div>
      </section>

      {/* 연락 — 제휴 병원만 전화·카톡, 상담 예약은 항상 */}
      {(phone || kakao || consultBuilt) && (
      <section aria-label="상담·연락" data-testid="clinic-contact" className={cx(container, "pb-14 md:pb-20")}>
        {(phone || kakao) && (
          <div className="mb-4 grid gap-2 sm:grid-cols-2">
            {phone && (
              <TrackedLink
                href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                event="phone_click"
                params={{ clinic_id: clinic.id, page: "clinic" }}
                data-testid="clinic-phone"
                className={cx(btn.outline, btn.lg)}
              >
                <Phone aria-hidden="true" className="size-5 text-brand-strong" />
                전화 문의 {phone}
              </TrackedLink>
            )}
            {kakao && (
              <TrackedLink
                href={kakao}
                target="_blank"
                rel="noopener noreferrer"
                event="kakao_click"
                params={{ clinic_id: clinic.id, page: "clinic" }}
                data-testid="clinic-kakao"
                className={cx(btn.outline, btn.lg)}
              >
                <MessageCircle aria-hidden="true" className="size-5 text-brand-strong" />
                카카오톡 상담
              </TrackedLink>
            )}
          </div>
        )}
        <ConsultCta
          location="mid"
          clinicId={clinic.id}
          title={`${clinic.name} 시술, 상담 가이드로 정리해 드립니다`}
          benefit="관심 시술과 희망 시기만 남기면 됩니다. 신청 비용은 들지 않습니다."
        />
      </section>
      )}

      {/* 병원 소개 */}
      <section id="about" aria-labelledby="about-title" className={cx("scroll-mt-12 bg-canvas", section)}>
        <div className={cx(container, "grid gap-8 md:grid-cols-12 md:gap-10")}>
          <div className="md:col-span-7">
            <h2 id="about-title" className="text-h2 font-bold tracking-tight text-ink">
              병원 소개
            </h2>
            <p data-testid="clinic-description" className="mt-4 max-w-text text-lg text-ink-muted">
              {clinic.description ?? "병원이 공개한 소개 문구가 아직 없습니다."}
            </p>
          </div>
          <dl className="grid gap-px self-start overflow-hidden rounded-lg bg-line md:col-span-5">
            <div className="bg-surface px-5 py-4">
              <dt className="text-sm text-ink-subtle">진료과목</dt>
              <dd className="mt-1 font-semibold text-ink">{clinic.specialties.join(", ")}</dd>
            </div>
            <div className="bg-surface px-5 py-4">
              <dt className="text-sm text-ink-subtle">공개 시술</dt>
              <dd className="mt-1 font-semibold text-ink">{rows.map((r) => r.procedure.name).join(", ")}</dd>
            </div>
            <div className="bg-surface px-5 py-4">
              <dt className="text-sm text-ink-subtle">진료 시간 요약</dt>
              <dd className="mt-1 font-semibold text-ink tabular-nums">
                {week.weekday.map((w) => (
                  <span key={w} className="block">
                    {w}
                  </span>
                ))}
                <span className="block">토 {week.saturday}</span>
                <span className="block text-ink-muted">일요일·공휴일 {week.sunday === "휴진" ? "휴진" : week.sunday}</span>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* 같은 시술 가능한 다른 병원 */}
      {similar.length > 0 && (
        <section id="others" aria-labelledby="others-title" data-testid="clinic-similar" className={cx("scroll-mt-12", container, section)}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="others-title" className="text-h2 font-bold tracking-tight text-ink">
                같은 시술을 하는 다른 병원
              </h2>
              <p className="mt-2 text-ink-muted">겹치는 시술이 많은 순서입니다. 광고와 무관합니다.</p>
            </div>
            {listBuilt && (
              <Link
                href={ROUTES.clinics}
                className="hidden h-11 shrink-0 items-center gap-0.5 text-sm font-semibold text-ink-subtle hover:text-ink sm:inline-flex"
              >
                병원 {content.clinics.length}곳 비교하기
                <ChevronRight aria-hidden="true" className="size-4" />
              </Link>
            )}
          </div>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {similar.map(({ clinic: other, shared, lowest, distance }) => {
              const lowestName = lowest ? procById.get(lowest.procedure_id)?.name : null;
              const sharedNames = shared.map((id) => procById.get(id)?.name).filter(Boolean) as string[];
              const href = clinicPath(other.slug);
              const otherPhoto = hasAsset(clinicImageId(other.id));
              const demoChip = other.is_demo && <span className={cx(chip.base, chip.outline, "h-7 bg-surface text-xs")}>예시 데이터</span>;
              return (
                <li key={other.id}>
                  <TrackedLink
                    href={href}
                    event="select_clinic"
                    params={{ clinic_id: other.id, from: "clinic" }}
                    className={cx(
                      "flex h-full flex-col rounded-lg bg-canvas p-6 transition-colors hover:bg-line",
                      otherPhoto && "overflow-hidden",
                    )}
                  >
                    {otherPhoto ? (
                      <>
                        <ClinicPhoto clinicId={other.id} className="-mx-6 -mt-6 mb-5" />
                        {demoChip && <div className="flex">{demoChip}</div>}
                      </>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex size-12 items-center justify-center rounded-md bg-surface">
                          <Icon3D name="ic-clinic" size={32} />
                        </span>
                        {demoChip}
                      </div>
                    )}
                    <h3 className={cx("text-h3 font-bold tracking-tight text-ink", otherPhoto ? demoChip && "mt-3" : "mt-4")}>
                      {other.name}
                    </h3>
                    <p className="mt-1 text-sm text-ink-muted">
                      {other.region}
                      {distance != null && <span> · 여기서 {formatDistance(distance)}</span>}
                    </p>
                    <p className="mt-4 text-sm font-semibold text-ink-muted">같은 시술 {shared.length}개</p>
                    <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="겹치는 시술">
                      {sharedNames.map((n) => (
                        <li key={n} className={cx(chip.base, "h-7 bg-surface text-xs text-ink-muted")}>
                          {n}
                        </li>
                      ))}
                    </ul>
                    {lowest && lowestName && (
                      <p className="mt-auto pt-5 text-sm text-ink-muted">
                        {lowestName} <strong className="text-base text-ink tabular-nums">{formatManwon(lowest.price)} 원</strong>부터
                      </p>
                    )}
                  </TrackedLink>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* 면책 */}
      <div className={cx(container, "pb-14 md:pb-20")}>
        <p data-testid="clinic-disclaimer" className="rounded-md bg-canvas-soft px-4 py-3 text-sm text-ink-muted">
          {SITE.disclaimer}. 가격·진료 시간은 병원이 공개한 정보를 옮긴 것이며, 리얼성형은 특정 병원을 권유하지 않습니다.
        </p>
      </div>

      <BottomBar page="clinic" clinic={clinic} />
    </>
  );
}
