import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { ConsultCta } from "@/components/common/ConsultCta";
import { HeaderSearch } from "@/components/common/HeaderSearch";
import { TrackedLink } from "@/components/common/TrackedLink";
import { PostCard } from "@/components/blog/PostCard";
import { ClinicPhoto } from "@/components/clinic/ClinicPhoto";
import { HERO_CUTOUT, HeroCutoutBack, HeroCutoutFront } from "@/components/home/HeroCutouts";
import { HeroPriceCard, type HeroShowcase } from "@/components/home/HeroPriceCard";
import { ProcedureThumb } from "@/components/procedure/ProcedureThumb";
import { Icon3D, categoryIcon } from "@/components/ui/Icon3D";
import { Illustration } from "@/components/ui/Illustration";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { sortPosts } from "@/lib/blog";
import { isPathBuilt } from "@/lib/built-routes";
import { getSearchItems, loadContent, type Clinic, type Procedure } from "@/lib/content";
import { formatDate, formatDuration, formatManwon, formatPriceRange, formatRecovery } from "@/lib/format";
import { clinicImageId, hasAsset, procedureImageId } from "@/lib/gen-assets";
import { ROUTES, clinicPath, postPath, procedurePath } from "@/lib/routes";
import { chip, container, cx, section } from "@/lib/ui";

// P-01 메인 (screen-spec 4절): 히어로(검색·CTA) · 부위별 바로가기 · 인기 시술 TOP 6 · 병원 · 하단 CTA

export const metadata: Metadata = {
  alternates: { canonical: "./" },
};

/** 인기 시술 칩(히어로 검색 아래) — 조회수 상위 */
const QUICK_COUNT = 4;

/** 이용 흐름 3단계 (일러스트: content/images/prompts.json flow-*, 없으면 3D 아이콘 타일) */
const FLOW = [
  {
    id: "flow-compare",
    fallback: "ic-search",
    title: "가격·회복기간 비교",
    body: "시술별 공개 가격 범위와 회복 일정을 출처와 함께 확인합니다.",
  },
  {
    id: "flow-request",
    fallback: "ic-guide",
    title: "상담 신청",
    body: "관심 시술과 희망 지역·시기, 연락처만 남기면 됩니다. 신청 비용은 들지 않습니다.",
  },
  {
    id: "flow-connect",
    fallback: "ic-callback",
    title: "상담 가이드 받기",
    body: "상담 때 확인할 질문과 견적 체크리스트, 회복 일정을 정리해 드립니다.",
  },
] as const;

/** 히어로 비교 카드 탭: 시술 id → 탭 이름 */
const SHOWCASE: [string, string][] = [
  ["double-eyelid", "쌍꺼풀"],
  ["rhinoplasty", "코 성형"],
  ["thread-lift", "실리프팅"],
];

function toShowcase(p: Procedure, shortName: string, categoryName: string, clinics: Clinic[]): HeroShowcase {
  const rows = clinics
    .flatMap((c) => {
      const o = c.procedures.find((x) => x.procedure_id === p.id);
      return o ? [{ clinic: c.name, low: o.price_low, high: o.price_high }] : [];
    })
    .sort((a, b) => (a.low ?? Infinity) - (b.low ?? Infinity))
    .slice(0, 4);
  const demo = clinics.filter((c) => c.procedures.some((x) => x.procedure_id === p.id)).every((c) => c.is_demo);
  const href = procedurePath(p.slug);
  return {
    id: p.id,
    name: p.name,
    shortName,
    category: categoryName,
    icon: categoryIcon(p.category_id),
    priceLow: p.price_low,
    priceHigh: p.price_high,
    scaleMin: p.price_low ?? 0,
    scaleMax: p.price_high ?? p.price_low ?? 0,
    rows,
    demo,
    facts: [
      { term: "소요시간", value: formatDuration(p.duration_min) },
      { term: "회복기간", value: formatRecovery(p.recovery_days) },
      { term: "마취", value: (p.anesthesia ?? "상담 후 안내").replace(/\s*\(.*\)$/, "") },
    ],
    updated: formatDate(p.updated_at),
    sourceCount: p.sources.length,
    href: isPathBuilt(href) ? href : null,
  };
}

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
  const showcase = SHOWCASE.flatMap(([pid, short]) => {
    const p = byId.get(pid);
    return p ? [toShowcase(p, short, categoryById.get(p.category_id)?.name ?? "", clinics)] : [];
  });
  const procedureCount = procedures.length;
  const latestPosts = sortPosts(content.posts)
    .filter((p) => isPathBuilt(postPath(p.slug)))
    .slice(0, 3);
  const clinicCount = clinics.length;

  return (
    <>
      {/* 히어로 */}
      <section data-testid="home-hero" aria-labelledby="home-title" className="overflow-hidden">
        <div
          className={cx(
            container,
            "grid gap-12 pt-10 pb-16 md:grid-cols-12 md:items-center md:gap-10 md:pb-24",
            // 카드 우상단 컷아웃이 카드 위로 올라오는 만큼 위 여백(없으면 지금 그대로)
            hasAsset(HERO_CUTOUT) ? "md:pt-24" : "md:pt-16",
          )}
        >
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
                  <span className="mr-1 text-sm text-ink-subtle">대표 시술</span>
                  {popular
                    .filter((p) => isPathBuilt(procedurePath(p.slug)))
                    .slice(0, QUICK_COUNT)
                    .map((p) => (
                      <TrackedLink
                        key={p.id}
                        href={procedurePath(p.slug)}
                        event="select_procedure"
                        params={{ procedure_id: p.id, from_page: "home_hero" }}
                        className={cx(chip.base, chip.neutral, "h-11 px-4 hover:bg-line")}
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
              <HeroCutoutBack />
              <HeroPriceCard items={showcase} />
              <HeroCutoutFront />
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
                  <Icon3D name={categoryIcon(cat.id)} size={56} />
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
            title="대표 시술 한눈에 보기"
            description="부위별 대표 시술의 공개 가격대와 회복기간입니다. 자세한 내용은 시술 가이드에서 확인하세요."
            more={isPathBuilt(ROUTES.procedures) ? { href: ROUTES.procedures, label: `시술 ${procedureCount}개 전체` } : undefined}
          />
          <ol className="-mx-5 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
            {popular.slice(0, 6).map((p) => {
              const cat = categoryById.get(p.category_id);
              const href = procedurePath(p.slug);
              // 시술 이미지가 있으면 상단 16:10 썸네일 + 태그라인 1줄(asset-plan 7절), 없으면 부위 아이콘 타일 + 2줄
              const thumb = hasAsset(procedureImageId(p.id));
              const catChip = cat && <span className={cx(chip.base, chip.neutral, "h-6 px-2 text-xs")}>{cat.name}</span>;
              const body = (
                <>
                  {thumb ? (
                    <>
                      <ProcedureThumb procedureId={p.id} className="-mx-6 -mt-6 mb-5" />
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-h3 font-bold tracking-tight text-ink">{p.name}</h3>
                        {catChip}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <span className="flex size-14 items-center justify-center rounded-md bg-canvas">
                          <Icon3D name={categoryIcon(p.category_id)} size={40} />
                        </span>
                        {catChip}
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <h3 className="text-h3 font-bold tracking-tight text-ink">{p.name}</h3>
                      </div>
                    </>
                  )}
                  <p className={cx("mt-1 text-sm text-ink-muted", thumb ? "line-clamp-1" : "line-clamp-2")}>{p.extras?.tagline ?? p.summary}</p>
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
              const cardClass = cx("flex h-full flex-col rounded-lg bg-surface p-6", thumb && "overflow-hidden");
              return (
                <li key={p.id} className="w-72 shrink-0 snap-start sm:w-auto">
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
            // 병원 예시 사진이 있으면 상단 16:9 커버('예시 이미지' 표기), 없으면 병원 아이콘 타일
            const photo = hasAsset(clinicImageId(c.id));
            // 사진이 있으면 카드가 길어지므로 시술 칩은 2개 + N(asset-plan 7절)
            const maxChips = photo ? 2 : 3;
            const demoChip = c.is_demo && <span className={cx(chip.base, chip.outline, "h-7 bg-surface text-xs")}>예시 데이터</span>;
            const body = (
              <>
                {photo ? (
                  <>
                    <ClinicPhoto clinicId={c.id} className="-mx-6 -mt-6 mb-5" />
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
                <h3 className={cx("text-h3 font-bold tracking-tight text-ink", photo ? demoChip && "mt-3" : "mt-4")}>{c.name}</h3>
                <p className="mt-1 flex items-center gap-1 text-sm text-ink-muted">
                  <MapPin aria-hidden="true" className="size-4" />
                  {c.region}
                </p>
                <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="공개 시술">
                  {offered.slice(0, maxChips).map((name) => (
                    <li key={name} className={cx(chip.base, "h-7 bg-surface text-xs text-ink-muted")}>
                      {name}
                    </li>
                  ))}
                  {offered.length > maxChips && (
                    <li className={cx(chip.base, "h-7 bg-surface text-xs text-ink-muted")}>+{offered.length - maxChips}</li>
                  )}
                </ul>
                {low && (
                  <p className="mt-auto pt-5 text-sm text-ink-muted">
                    {low.name} <strong className="text-base text-ink tabular-nums">{formatManwon(low.price)} 원</strong>부터
                  </p>
                )}
              </>
            );
            const cardClass = cx("flex h-full flex-col rounded-lg bg-canvas p-6", photo && "overflow-hidden");
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

      {/* 이용 흐름 — 실제 순서이므로 단계 번호를 쓴다 */}
      <section aria-labelledby="home-flow" data-testid="home-flow" className={cx("bg-canvas-soft", section)}>
        <div className={container}>
          <SectionHeading
            id="home-flow"
            title="상담까지 이렇게 진행돼요"
            description="비교는 바로 하고, 상담 신청은 연락처만 남기면 끝납니다."
          />
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {FLOW.map((step, i) => (
              <li key={step.id} className="overflow-hidden rounded-lg bg-surface">
                <Illustration id={step.id} aspect="4:3" fallback={step.fallback} alt="" sizes="(min-width: 768px) 352px, 100vw" />
                <div className="p-6">
                  <p className="text-sm font-bold text-brand-strong tabular-nums">{i + 1}단계</p>
                  <h3 className="mt-1 text-h3 font-bold tracking-tight text-ink">{step.title}</h3>
                  <p className="mt-2 text-ink-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 최신 칼럼 3 (screen-spec 4절 P-01) */}
      {latestPosts.length > 0 && (
        <section aria-labelledby="home-posts" data-testid="home-posts" className={cx("bg-canvas", section)}>
          <div className={container}>
            <SectionHeading
              id="home-posts"
              title="상담 전에 읽어 보세요"
              description="상담 때 많이 묻는 질문을 칼럼으로 정리했습니다."
              more={isPathBuilt(ROUTES.blog) ? { href: ROUTES.blog, label: "칼럼 전체" } : undefined}
            />
            <ul className="mt-8 grid gap-4 md:grid-cols-3">
              {latestPosts.map((post) => (
                <li key={post.id}>
                  <PostCard post={post} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 정보 원칙 — 출처·갱신일 실물 */}
      <section aria-labelledby="home-trust" data-testid="home-trust" className={cx(container, section)}>
        <div className="grid gap-8 rounded-xl bg-canvas-soft p-6 md:grid-cols-12 md:items-center md:p-10">
          <div className="md:col-span-5">
            <Icon3D name="ic-source" size={56} />
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
                  <Icon3D name="ic-check" size={24} />
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
          benefit="시술·지역·희망 시기만 남기면 됩니다. 신청 비용은 들지 않습니다."
        />
      </div>
    </>
  );
}
