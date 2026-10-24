import type { Metadata } from "next";
import { BottomBar } from "@/components/common/BottomBar";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ConsultCta } from "@/components/common/ConsultCta";
import { SkeletonList, SkeletonText } from "@/components/common/Skeleton";
import { loadContent } from "@/lib/content";
import { ROUTES } from "@/lib/routes";

/*
 * 공통 컴포넌트 미리보기 — 개발 서버 전용(RS_PREVIEW=1 → next.config pageExtensions 에 "preview.tsx" 추가).
 * 정적 export(pnpm build)에는 포함되지 않는다. e2e·a11y·스크린샷이 이 화면으로 컴포넌트를 검증한다.
 * 미리보기에서는 lib/built-routes 가 모든 경로를 "있음"으로 보므로 GNB·검색·CTA 가 전부 보인다.
 */

export const metadata: Metadata = {
  title: "공통 컴포넌트 미리보기",
  robots: { index: false, follow: false },
};

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

export default function ComponentPreviewPage() {
  const { procedures, categories, clinics } = loadContent();
  const procedure = procedures.find((p) => p.id === "double-eyelid") ?? procedures[0];
  const clinic = clinics[0];
  if (!procedure || !clinic) throw new Error("미리보기에 쓸 시술·병원 데이터가 없습니다.");
  const category = categories.find((c) => c.id === procedure.category_id);
  // 하단 바의 전화·카톡 버튼은 제휴 병원(is_partner)에만 나온다. 가상 병원은 모두 비제휴라 여기서만 제휴 상태로 그린다.
  const partnerClinic = { id: clinic.id, is_partner: true, phone: "02-0000-0000", kakao_url: "https://pf.kakao.com/" };

  return (
    <div className="mx-auto grid max-w-content gap-12 px-5 py-10 md:px-10 md:py-14">
      <div>
        <h1 className="text-h1 font-bold text-ink">공통 컴포넌트 미리보기</h1>
        <p className="mt-3 max-w-text text-ink-muted">
          헤더(검색·GNB·CTA), 푸터, 쿠키·동의 배너는 이 화면의 실제 틀입니다. 아래는 화면 안에 넣어 쓰는 공통 요소입니다.
        </p>
      </div>

      <Block id="breadcrumb" title="브레드크럼" note="시술 상세(P-03) 상단. BreadcrumbList JSON-LD 를 함께 출력합니다.">
        <Breadcrumb
          items={[
            { name: "홈", href: ROUTES.home },
            { name: "시술 가이드", href: ROUTES.procedures },
            { name: category?.name ?? "" },
            { name: procedure.name },
          ]}
        />
      </Block>

      <Block id="cta-mid" title="상담 예약 CTA 블록 · 본문 중간" note="location=mid, 시술 ID 를 상담 폼에 넘깁니다.">
        <ConsultCta location="mid" procedureId={procedure.id} title="이 시술 상담 가능한 병원 보기" />
      </Block>

      <Block id="skeleton" title="로딩 스켈레톤" note="데이터를 기다리는 동안 카드·문단 자리를 미리 잡아 레이아웃 이동을 막습니다.">
        <SkeletonList count={3} label="시술 목록을 불러오는 중입니다" />
        <div className="mt-6 max-w-text">
          <SkeletonText lines={3} />
        </div>
      </Block>

      <Block id="cta-bottom" title="상담 예약 CTA 블록 · 본문 하단" note="location=bottom.">
        <ConsultCta location="bottom" procedureId={procedure.id} />
      </Block>

      <Block
        id="bottom-bar"
        title="모바일 하단 고정 바"
        note="375px 화면 하단에 고정됩니다(데스크톱에서는 숨김). 전화·카카오톡은 제휴 병원일 때만 나타납니다."
      >
        <p className="text-sm text-ink-muted">아래 고정 바는 병원 상세(P-05) 제휴 병원 기준입니다.</p>
      </Block>

      <BottomBar page="clinic" procedureId={procedure.id} clinic={partnerClinic} />
    </div>
  );
}
