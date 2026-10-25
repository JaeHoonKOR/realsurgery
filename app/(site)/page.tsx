import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { ConsultCta } from "@/components/common/ConsultCta";
import { HeaderSearch } from "@/components/common/HeaderSearch";
import { TrackedLink } from "@/components/common/TrackedLink";
import { HeroPriceCard } from "@/components/home/HeroPriceCard";
import { Emoji3D, categoryEmoji } from "@/components/ui/Emoji3D";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { isPathBuilt } from "@/lib/built-routes";
import { getSearchItems, loadContent, type Clinic, type Procedure } from "@/lib/content";
import { formatDate, formatDuration, formatManwon, formatPriceRange, formatRecovery } from "@/lib/format";
import { ROUTES, clinicPath, procedurePath } from "@/lib/routes";
import { chip, container, cx, section } from "@/lib/ui";

// P-01 메인 (screen-spec 4절): 히어로(검색·CTA) · 부위별 바로가기 · 인기 시술 TOP 6 · 병원 · 하단 CTA

export const metadata: Metadata = {
  alternates: { canonical: "./" },
};

/** 인기 시술 칩(히어로 검색 아래) — 조회수 상위 */
const QUICK_COUNT = 4;

function lowestOffer(clinic: Clinic, procedures: Map<string, Procedure>) {
  const priced = clinic.procedures.filter((o) => o.price_low != null);
  if (priced.length === 0) return null;
  const cheapest = priced.reduce((a, b) => ((a.price_low ?? 0) <= (b.price_low ?? 0) ? a : b));
  const proc = procedures.get(cheapest.procedure_id);
  return proc ? { name: proc.name, price: cheapest.price_low as number } : null;
}

export default function HomePage() {
  const content = loadContent();
  const { categories, clinics } = content;
  const procedures = [...content.procedures];
  const byId = new Map(procedures.map((p) => [p.id, p]));
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const popular = [...procedures].sort((a, b) => b.view_count - a.view_count);
  const hasProcedurePage = popular.some((p) => isPathBuilt(procedurePath(p.slug)));
  const searchItems = getSearchItems(content).filter((i) => isPathBuilt(procedurePath(i.slug)));

  const heroProcedure = byId.get("double-eyelid") ?? popular[0];
  if (!heroProcedure) throw new Error("시술 데이터가 없습니다 (data/generated/content.json)");
  const heroClinics = clinics.filter((c) => c.procedures.some((o) => o.procedure_id === heroProcedure.id));
  const procedureCount = procedures.length;
  const clinicCount = clinics.length;

  return (
    <>
      {/* 히어로 */}
      <section data-testid="home-hero" aria-labelledby="home-title" className="overflow-hidden">
        <div className={cx(container, "grid gap-12 pt-10 pb-16 md:grid-cols-12 md:items-center md:gap-10 md:pt-16 md:pb-24")}>
          <div className="md:col-span-6">
            <h1 id="home-title" className="text-display font-bold tracking-tighter text-ink">
              시술 가격·회복기간,
              <br />한 번에 비교
            </h1>
            <p className="mt-5 max-w-text text-lg text-ink-muted">
              병원 {clinicCount}곳의 공개 가격과 학회·의료기관 자료를 같은 기준으로 정리했습니다. 상담 전에 내
              시술의 가격대와 회복 일정부터 확인하세요.
            </p>

            {searchItems.length > 0 && (
              <div className="mt-8 max-w-form">
                <HeaderSearch items={searchItems} size="lg" testId="home-search" placeholder="어떤 시술이 궁금하세요?" />
                <div className="mt-4 flex flex-wrap items-center gap-2" data-testid="home-quick">
                  <span className="mr-1 text-sm text-ink-subtle">많이 찾는 시술</span>
                  {popular
                    .filter((p) => isPathBuilt(procedurePath(p.slug)))
                    .slice(0, QUICK_COUNT)
                    .map((p) => (
                      <TrackedLink
                        key={p.id}
                        href={procedurePath(p.slug)}
                        event="select_procedure"
                        params={{ procedure_id: p.id, from_page: "home_hero" }}
                        className={cx(chip.base, chip.neutral, "h-9 hover:bg-line")}
                      >
                        {p.name}
                      </TrackedLink>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative md:col-span-6">
            <div aria-hidden="true" className="absolute -inset-x-5 -inset-y-6 rounded-xl bg-canvas md:-inset-x-8 md:-inset-y-10" />
            <div className="relative md:px-4">
              <HeroPriceCard procedure={heroProcedure} category={categoryById.get(heroProcedure.category_id)} clinics={heroClinics} />
              <Emoji3D name="sparkles" size={56} className="absolute -top-7 -right-1 md:-right-3" />
            </div>
          </div>
        </div>
      </section>

      {/* 부위별 바로가기 */}
      <section aria-labelledby="home-categories" data-testid="home-categories" className={cx(container, "pb-16 md:pb-20")}>
        <SectionHeading id="home-categories" title="부위별로 찾아보기" />
        <ul className="mt-6 grid grid-cols-3 gap-3 md:grid-cols-6 md:gap-4">
          {categories
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((cat) => {
              const items = procedures.filter((p) => p.category_id === cat.id);
              const first = items.find((p) => isPathBuilt(procedurePath(p.slug)));
              const listHref = `${ROUTES.procedures}#${cat.slug}`;
              const href = isPathBuilt(ROUTES.procedures) ? listHref : first ? procedurePath(first.slug) : null;
              const inner = (
                <>
                  <Emoji3D name={categoryEmoji(cat.id)} size={56} />
                  <span className="mt-3 font-bold text-ink">{cat.name}</span>
                  <span className="text-xs text-ink-muted">시술 {items.length}개</span>
                </>
              );
              const tile = "flex flex-col items-center rounded-lg bg-canvas px-2 pt-5 pb-4";
              return (
                <li key={cat.id}>
                  {href ? (
                    <TrackedLink
                      href={href}
                      event="select_category"
                      params={{ category: cat.id }}
                      className={cx(tile, "transition-colors hover:bg-line")}
                    >
                      {inner}
                    </TrackedLink>
                  ) : (
                    <div className={tile}>{inner}</div>
                  )}
                </li>
              );
            })}
        </ul>
      </section>

      {/* 인기 시술 TOP 6 */}
      <section aria-labelledby="home-popular" data-testid="home-popular" className={cx("bg-canvas", section)}>
        <div className={container}>
          <SectionHeading
            id="home-popular"
            title="이번 주 많이 본 시술"
            description="조회수 기준 상위 6개 시술의 가격대와 회복기간입니다."
            more={isPathBuilt(ROUTES.procedures) ? { href: ROUTES.procedures, label: `시술 ${procedureCount}개 전체` } : undefined}
          />
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popular.slice(0, 6).map((p, i) => {
              const cat = categoryById.get(p.category_id);
              const href = procedurePath(p.slug);
              const body = (
                <>
                  <div className="flex items-start justify-between">
                    <span className="flex size-14 items-center justify-center rounded-md bg-canvas">
                      <Emoji3D name={categoryEmoji(p.category_id)} size={40} />
                    </span>
                    <span className="text-sm font-bold text-ink-faint tabular-nums" aria-label={`${i + 1}위`}>
                      {i + 1}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <h3 className="text-h3 font-bold tracking-tight text-ink">{p.name}</h3>
                    {cat && <span className={cx(chip.base, chip.neutral, "h-6 px-2 text-xs")}>{cat.name}</span>}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{p.extras?.tagline ?? p.summary}</p>
                  <p className="mt-5 text-lg font-bold text-ink tabular-nums">
                    {formatPriceRange(p.price_low, p.price_high)}
                    {p.price_note && <span className="ml-1 text-sm font-medium text-ink-subtle">{p.price_note}</span>}
                  </p>
                  <dl className="mt-3 flex gap-5 border-t border-line pt-3 text-sm">
                    <div className="flex gap-1.5">
                      <dt className="text-ink-subtle">회복</dt>
                      <dd className="font-semibold text-ink">{formatRecovery(p.recovery_days)}</dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt className="text-ink-subtle">소요</dt>
                      <dd className="font-semibold text-ink">{formatDuration(p.duration_min)}</dd>
                    </div>
                  </dl>
                </>
              );
              const cardClass = "flex h-full flex-col rounded-lg bg-surface p-6";
              return (
                <li key={p.id}>
                  {isPathBuilt(href) ? (
                    <TrackedLink
                      href={href}
                      event="select_procedure"
                      params={{ procedure_id: p.id, from_page: "home" }}
                      className={cx(cardClass, "transition-shadow hover:shadow-lg")}
                    >
                      {body}
                    </TrackedLink>
                  ) : (
                    <div className={cardClass}>{body}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* 병원 */}
      <section aria-labelledby="home-clinics" data-testid="home-clinics" className={cx(container, section)}>
        <SectionHeading
          id="home-clinics"
          title="병원 공개 정보 둘러보기"
          description="병원이 공개한 진료 시간과 시술 가격을 그대로 옮겼습니다. 순서는 광고와 무관합니다."
          more={isPathBuilt(ROUTES.clinics) ? { href: ROUTES.clinics, label: `병원 ${clinicCount}곳 전체` } : undefined}
        />
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {clinics.slice(0, 3).map((c) => {
            const low = lowestOffer(c, byId);
            const offered = c.procedures.map((o) => byId.get(o.procedure_id)?.name).filter(Boolean) as string[];
            const href = clinicPath(c.slug);
            const body = (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex size-12 items-center justify-center rounded-md bg-surface">
                    <Emoji3D name="hospital" size={32} />
                  </span>
                  {c.is_demo && <span className={cx(chip.base, chip.outline, "h-7 bg-surface text-xs")}>예시 데이터</span>}
                </div>
                <h3 className="mt-4 text-h3 font-bold tracking-tight text-ink">{c.name}</h3>
                <p className="mt-1 flex items-center gap-1 text-sm text-ink-muted">
                  <MapPin aria-hidden="true" className="size-4" />
                  {c.region}
                </p>
                <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="공개 시술">
                  {offered.slice(0, 3).map((name) => (
                    <li key={name} className={cx(chip.base, "h-7 bg-surface text-xs text-ink-muted")}>
                      {name}
                    </li>
                  ))}
                  {offered.length > 3 && (
                    <li className={cx(chip.base, "h-7 bg-surface text-xs text-ink-muted")}>+{offered.length - 3}</li>
                  )}
                </ul>
                {low && (
                  <p className="mt-auto pt-5 text-sm text-ink-muted">
                    {low.name} <strong className="text-base text-ink tabular-nums">{formatManwon(low.price)} 원</strong>부터
                  </p>
                )}
              </>
            );
            const cardClass = "flex h-full flex-col rounded-lg bg-canvas p-6";
            return (
              <li key={c.id}>
                {isPathBuilt(href) ? (
                  <TrackedLink
                    href={href}
                    event="select_clinic"
                    params={{ clinic_id: c.id, from: "home" }}
                    className={cx(cardClass, "transition-colors hover:bg-line")}
                  >
                    {body}
                  </TrackedLink>
                ) : (
                  <div className={cardClass}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* 정보 원칙 — 출처·갱신일 실물 */}
      <section aria-labelledby="home-trust" data-testid="home-trust" className={cx(container, "pb-14 md:pb-20")}>
        <div className="grid gap-8 rounded-xl bg-canvas-soft p-6 md:grid-cols-12 md:items-center md:p-10">
          <div className="md:col-span-5">
            <Emoji3D name="book" size={56} />
            <h2 id="home-trust" className="mt-4 text-h2 font-bold tracking-tight text-ink">
              모든 수치에 출처를 붙입니다
            </h2>
            <p className="mt-3 text-ink-muted">
              가격은 병원 공개가, 회복기간과 부작용은 학회·대학병원 자료를 근거로 적고 최종 수정일을 함께
              표시합니다. 병원 광고는 정보와 구분해 표시합니다.
            </p>
          </div>
          <div className="rounded-lg bg-surface p-5 md:col-span-7 md:p-6">
            <p className="text-sm font-semibold text-ink-subtle">예: {heroProcedure.name} 가이드의 출처</p>
            <ul className="mt-3 divide-y divide-line">
              {heroProcedure.sources.map((s) => (
                <li key={s.url} className="flex items-center justify-between gap-4 py-3">
                  <span className="font-semibold text-ink">{s.title}</span>
                  <Emoji3D name="check" size={24} />
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-ink-muted">최종 수정 {formatDate(heroProcedure.updated_at)}</p>
          </div>
        </div>
      </section>

      {/* 하단 CTA */}
      <div className={cx(container, "pb-16 md:pb-24")}>
        <ConsultCta
          location="footer"
          title={hasProcedurePage ? "궁금한 시술, 상담 가이드로 정리해 드립니다" : undefined}
          benefit="시술·지역·희망 시기만 남기면 영업일 기준 1일 안에 연락드립니다. 상담 신청은 무료입니다."
        />
      </div>
    </>
  );
}
