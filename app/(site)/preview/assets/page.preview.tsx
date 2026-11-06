import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Image from "next/image";
import { PriceRangeChart, type PriceRangeItem } from "@/components/charts/PriceRangeChart";
import { ProcedureLocationDiagram } from "@/components/diagrams/ProcedureLocationDiagram";
import { RecoveryTimeline } from "@/components/diagrams/RecoveryTimeline";
import { BodyAreaIcon } from "@/components/icons/BodyAreaIcons";
import { loadContent } from "@/lib/content";
import { withBasePath } from "@/lib/env.public";
import { SLOT_NAMES, getProcedureImage, getSlotImage, type SlotName } from "@/lib/images";

/*
 * 에셋 미리보기 (T-112) — 개발 서버 전용(RS_PREVIEW=1). 정적 export 에는 들어가지 않는다.
 * 로고 3안, 시술 일러스트(히어로·썸네일), 부위 아이콘, 플레이스홀더 세트, 다이어그램 2종, 막대 차트, OG 이미지를 한 화면에서 본다.
 */

export const metadata: Metadata = {
  title: "에셋 미리보기",
  robots: { index: false, follow: false },
};

const SLOT_LABEL: Record<SlotName, string> = {
  "home-hero": "메인 히어로 (P-01)",
  "lp-hero": "광고 랜딩 히어로 (P-12)",
  "clinic-cover": "병원 헤더 커버 패턴 (P-05)",
  map: "지도 썸네일 (P-01·P-05)",
  "post-cover": "칼럼 커버 (P-10)",
  "consult-done": "상담 완료 일러스트 (P-07)",
  empty: "빈 상태 일러스트",
};

const LOGO_OPTIONS = [
  { id: "a", name: "A안 · 점 강조형", note: "워드마크 오른쪽 위에 코랄 반짝임" },
  { id: "b", name: "B안 · 심볼 결합형", note: "틸 라운드 사각 심볼(접힘 선·점) + 워드마크" },
  { id: "c", name: "C안 · 곡선 밑줄형", note: "‘리얼’ 틸 · ‘성형’ 잉크 + 코랄 곡선 밑줄" },
] as const;

/** public/brand/*.svg 의 width·height (표시 크기 계산용) */
function svgSize(file: string): { width: number; height: number } {
  const src = fs.readFileSync(path.join(process.cwd(), "public", "brand", file), "utf8");
  const width = Number(src.match(/\bwidth="([\d.]+)"/)?.[1] ?? 0);
  const height = Number(src.match(/\bheight="([\d.]+)"/)?.[1] ?? 0);
  if (!width || !height) throw new Error(`${file}: width/height 없음`);
  return { width, height };
}

function Logo({ file, height }: { file: string; height: number }) {
  const s = svgSize(file);
  return <Image src={withBasePath(`/brand/${file}`)} alt="리얼성형 로고" width={Math.round((s.width * height) / s.height)} height={height} />;
}

function Block({ id, title, note, children }: { id: string; title: string; note: string; children: React.ReactNode }) {
  return (
    <section data-testid={`preview-${id}`} aria-labelledby={`preview-${id}-title`} className="border-t border-line pt-8">
      <h2 id={`preview-${id}-title`} className="text-h2 font-bold text-ink">
        {title}
      </h2>
      <p className="mt-1 max-w-text text-sm text-ink-muted">{note}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function AssetPreviewPage() {
  const { procedures, categories, clinics } = loadContent();
  const hero = procedures.find((p) => p.id === "double-eyelid") ?? procedures[0];
  if (!hero) throw new Error("미리보기에 쓸 시술 데이터가 없습니다.");
  const heroImage = getProcedureImage(hero.id);

  // 가격 막대: 쌍꺼풀 수술 — 시술 공개 범위(전체) + 병원별 공개 가격(clinic_procedures)
  const priceItems: PriceRangeItem[] = [
    { label: "공개 가격 범위(전체)", min: hero.price_low, max: hero.price_high, tone: "reference" },
    ...clinics.flatMap((c) =>
      c.procedures.filter((cp) => cp.procedure_id === hero.id).map((cp) => ({ label: c.name, min: cp.price_low, max: cp.price_high })),
    ),
  ];

  return (
    <div className="mx-auto grid max-w-content gap-12 px-5 py-10 md:px-10 md:py-14">
      <div>
        <h1 className="text-h1 font-bold text-ink">에셋 미리보기</h1>
        <p className="mt-3 max-w-text text-ink-muted">
          로고 시안, 시술 일러스트, 부위 아이콘, 이미지 자리 플레이스홀더, 다이어그램·차트 템플릿을 한 화면에서 확인합니다.
        </p>
      </div>

      <Block id="logos" title="워드마크 로고 3안" note="컬러 · 단색(잉크) · 반전(흰색) 변형. 헤더 적용은 1안을 고른 뒤 T-100c 에서 합니다.">
        <ul className="grid gap-4 md:grid-cols-3">
          {LOGO_OPTIONS.map((o) => (
            <li key={o.id} className="overflow-hidden rounded-lg border border-line bg-surface shadow-sm" data-testid={`logo-option-${o.id}`}>
              <div className="flex h-24 items-center justify-center px-5">
                <Logo file={`logo-${o.id}.svg`} height={36} />
              </div>
              <div className="grid grid-cols-2">
                <div className="flex h-16 items-center justify-center border-t border-line bg-canvas px-3">
                  <Logo file={`logo-${o.id}-mono.svg`} height={24} />
                </div>
                <div className="flex h-16 items-center justify-center bg-brand px-3">
                  <Logo file={`logo-${o.id}-inverse.svg`} height={24} />
                </div>
              </div>
              <div className="border-t border-line p-5">
                <p className="font-bold text-ink">{o.name}</p>
                <p className="text-sm text-ink-muted">{o.note}</p>
              </div>
            </li>
          ))}
        </ul>
      </Block>

      <Block
        id="hero"
        title="시술 히어로 일러스트 (3:2)"
        note={
          heroImage.kind === "generated"
            ? "Gemini 생성 이미지(WebP 1200×800)."
            : "Gemini 키가 없어 브랜드 기하 플레이스홀더를 같은 자리에 넣었습니다. 키가 들어오면 생성 이미지로 바뀝니다."
        }
      >
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <Image src={heroImage.src} alt={heroImage.alt} width={heroImage.width} height={heroImage.height} className="h-auto w-full" priority />
        </div>
      </Block>

      <Block id="procedure-images" title="시술 썸네일 10종" note="카드용 600×400. 이미지 아래 부위 아이콘·시술명이 함께 들어갑니다.">
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {procedures.map((p) => {
            const img = getProcedureImage(p.id);
            const cat = categories.find((c) => c.id === p.category_id);
            return (
              <li key={p.id} className="overflow-hidden rounded-lg border border-line bg-surface shadow-sm" data-testid="procedure-thumb">
                <Image src={img.srcSm} alt={img.alt} width={600} height={400} className="h-auto w-full" />
                <div className="flex items-center gap-2 p-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-canvas text-brand">
                    <BodyAreaIcon categoryId={p.category_id} size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-ink">{p.name}</span>
                    <span className="block text-sm text-ink-muted">{cat?.name}</span>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </Block>

      <Block id="icons" title="부위별 아이콘 6종" note="눈·피부는 Lucide, 코·윤곽·리프팅·가슴은 같은 규칙(24px 그리드, 선 2px)으로 직접 그렸습니다.">
        <ul className="grid grid-cols-3 gap-3 md:grid-cols-6">
          {categories.map((c) => (
            <li key={c.id} className="flex flex-col items-center gap-2 rounded-lg border border-line bg-surface px-3 py-4" data-testid="body-area-icon">
              <span className="flex size-12 items-center justify-center rounded-full bg-canvas text-brand">
                <BodyAreaIcon categoryId={c.id} size={26} />
              </span>
              <span className="text-sm font-bold text-ink">{c.name}</span>
            </li>
          ))}
        </ul>
      </Block>

      <Block id="placeholders" title="이미지 자리 플레이스홀더" note="생성 이미지가 없을 때 같은 자리에 들어가는 브랜드 기하 SVG입니다. 빈 자리는 없습니다.">
        <ul className="grid gap-4 md:grid-cols-3">
          {SLOT_NAMES.map((slot) => {
            const s = getSlotImage(slot);
            return (
              <li key={slot} className="overflow-hidden rounded-lg border border-line bg-surface" data-testid="slot-placeholder">
                <Image src={s.src} alt={s.alt} width={s.width} height={s.height} className="h-auto w-full" />
                <p className="p-3 text-sm font-bold text-ink">{SLOT_LABEL[slot]}</p>
              </li>
            );
          })}
        </ul>
      </Block>

      <Block id="diagrams" title="다이어그램 템플릿 2종" note="P-03 이 시술별 값을 props 로 넘깁니다. 예시는 쌍꺼풀 수술(시술 FAQ 문장 기준).">
        <div className="grid gap-10">
          <ProcedureLocationDiagram
            title="쌍꺼풀 수술 시술 위치"
            description="쌍꺼풀 수술 방법별 시술 위치를 단순화한 그림입니다."
            region="eye"
            markers={[
              { kind: "incision", x: 242, y: 66, path: "M94 80Q160 42 226 80", label: "절개법: 쌍꺼풀 선을 따라 피부를 절개하고 지방·근육을 정리합니다" },
              {
                kind: "point",
                x: 122,
                y: 60,
                points: [
                  [160, 50],
                  [198, 60],
                ],
                label: "매몰법: 피부를 절개하지 않고 실로 몇 군데를 고정합니다",
              },
            ]}
            caption="위치 이해를 돕기 위한 단순화 그림입니다. 실제 방법과 절개 범위는 진찰 후 의료진이 정합니다."
          />
          <RecoveryTimeline
            title="쌍꺼풀 수술 회복 과정"
            description="절개법 기준 일반적인 회복 흐름입니다."
            steps={[
              { when: "5~7일", label: "실밥 제거", detail: "절개법 기준" },
              { when: "실밥 제거 후", label: "가벼운 세안", detail: "다음 날부터 가능한 경우가 많습니다" },
              { when: "1~2주", label: "눈 화장", detail: "병원 안내를 우선으로 따릅니다" },
              { when: "2~3주", label: "큰 붓기 감소" },
              { when: "수개월", label: "라인 자리 잡음", detail: "붓기 정도는 사람마다 다릅니다" },
            ]}
            caption="쌍꺼풀 수술 FAQ 답변 기준입니다. 회복 속도와 붓기 정도는 사람마다 다릅니다."
          />
        </div>
      </Block>

      <Block id="chart" title="가격 범위 막대 차트" note="병원별 공개 가격의 하한~상한. 값이 없으면 ‘가격 미정’ 점선 자리로 표시합니다.">
        <PriceRangeChart
          title="쌍꺼풀 수술 병원별 공개 가격"
          items={priceItems}
          caption="병원이 공개한 가격 기준이며 상담 결과에 따라 달라질 수 있습니다."
        />
      </Block>

      <Block id="og" title="OG 이미지 (1200×630)" note="빌드 때 scripts/og.mjs 가 존재하는 경로마다 만듭니다. 지금은 메인(기본) 1장입니다.">
        <div className="overflow-hidden rounded-lg border border-line">
          <Image src={withBasePath("/og/default.png")} alt="리얼성형 공유 이미지: 시술 가격·회복기간, 한 번에 비교" width={1200} height={630} className="h-auto w-full" />
        </div>
      </Block>
    </div>
  );
}
