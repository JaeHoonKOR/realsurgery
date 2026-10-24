import type { Metadata } from "next";

// T-100 스캐폴드용 홈. P-01 메인 화면(검색·인기 시술·병원·칼럼)은 T-105에서 이 파일을 교체한다.
// 공통 헤더·푸터 컴포넌트는 T-100b(components/common)에서 만든다.

export const metadata: Metadata = {
  alternates: { canonical: "./" },
};

const GUIDE_FIELDS = [
  { term: "가격 범위", desc: "병원 공개가 기준 최저가부터 최고가까지" },
  { term: "소요시간", desc: "상담 후 수술·시술이 진행되는 시간" },
  { term: "회복기간", desc: "붓기, 실밥 제거, 일상 복귀 시점" },
  { term: "마취 방식", desc: "국소·수면·전신 마취 여부" },
] as const;

const FIRST_GUIDES = ["쌍꺼풀 수술", "앞트임", "눈매교정", "눈밑지방재배치"] as const;

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header data-testid="site-header" className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-content items-center px-5 md:px-10">
          <p className="text-h3 font-bold tracking-tight text-brand">리얼성형</p>
        </div>
      </header>

      <main className="flex-1">
        <section
          data-testid="home-hero"
          aria-labelledby="home-title"
          className="mx-auto grid max-w-content gap-10 px-5 pb-16 pt-12 md:grid-cols-2 md:items-start md:gap-16 md:px-10 md:pb-24 md:pt-20"
        >
          <div>
            <p className="text-sm font-semibold text-brand">성형 시술 정보 · 가격 비교</p>
            <h1 id="home-title" className="mt-3 text-h1 font-bold text-ink">
              시술 가격·회복기간,
              <br />한 번에 비교
            </h1>
            <p className="mt-5 max-w-text text-ink-muted">
              많이 찾는 성형 시술의 가격 범위와 회복기간, 부작용을 출처와 함께 한 화면에 정리합니다. 병원마다 다른
              공개 정보를 같은 기준으로 비교할 수 있도록 만들고 있습니다.
            </p>

            <div className="mt-8 border-t border-line pt-6" data-testid="home-first-guides">
              <h2 className="text-sm font-semibold text-ink">먼저 공개하는 눈 성형 가이드</h2>
              {/* 링크가 아닌 예정 목록이므로 버튼처럼 보이지 않게 텍스트로 나열한다 */}
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-ink-muted">
                {FIRST_GUIDES.map((name) => (
                  <li key={name} className="flex items-center gap-2">
                    <span aria-hidden="true" className="size-2 rounded-sm bg-accent" />
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div
            data-testid="home-guide-fields"
            className="rounded-lg border border-line bg-surface p-6 shadow-sm md:p-8"
          >
            <h2 className="text-h3 font-bold text-ink">시술 가이드에 담는 정보</h2>
            <dl className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2">
              {GUIDE_FIELDS.map((f) => (
                <div key={f.term} className="border-l-2 border-accent pl-4">
                  <dt className="text-sm font-semibold text-ink">{f.term}</dt>
                  <dd className="mt-1 text-sm text-ink-muted">{f.desc}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 rounded-sm bg-canvas px-4 py-3 text-sm text-ink-muted">
              모든 수치에는 학회·논문 등 출처와 최종 수정일을 함께 표기합니다.
            </p>
          </div>
        </section>
      </main>

      <footer data-testid="site-footer" className="border-t border-line bg-surface">
        <div className="mx-auto max-w-content px-5 py-8 text-sm text-ink-muted md:px-10">
          <p>본 정보는 의료 조언이 아니며 진단·치료는 의료진 상담 필요</p>
          <p className="mt-2">© 2026 리얼성형</p>
        </div>
      </footer>
    </div>
  );
}
