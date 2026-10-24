import { TrackedLink } from "@/components/common/TrackedLink";
import { isPathBuilt } from "@/lib/built-routes";
import type { ClinicPriceRow } from "@/lib/procedure";
import { clinicPath } from "@/lib/routes";

/**
 * 가격 비교 표 (4절 P-03: 병원별 최저~최고가 5곳, 병원명 클릭 → P-05, select_clinic(from=procedure))
 * 병원 상세(P-05, T-104)가 아직 없으면 병원명은 링크 없이 보여 준다(깨진 링크 금지 — lib/built-routes).
 * 빈 상태: 이 시술의 병원 가격 정보가 없을 때 안내 문구.
 */
export function ClinicPriceTable({
  id,
  title,
  rows,
}: {
  id: string;
  title: string;
  rows: ClinicPriceRow[];
}) {
  const hasDemo = rows.some((r) => r.clinic.is_demo);
  return (
    <section aria-labelledby={id} data-testid="procedure-prices" className="mt-14">
      <h2 id={id} className="text-h2 font-bold text-ink">
        {title}
      </h2>
      <p className="mt-2 max-w-text text-sm text-ink-muted">
        {hasDemo ? "병원별 참고 가격 범위입니다." : "병원이 공개한 가격 기준의 참고용 범위입니다."} 실제 비용은 상담 후 시술 범위에 따라 달라질 수
        있습니다.
      </p>
      {rows.length === 0 ? (
        <p data-testid="procedure-prices-empty" className="mt-5 rounded-sm border border-line bg-surface px-5 py-4 text-ink-muted">
          아직 이 시술의 병원별 가격 정보가 없습니다. 위의 가격 범위를 참고하고 상담에서 견적을 확인하세요.
        </p>
      ) : (
        <div className="mt-5 overflow-hidden rounded-sm border border-line bg-surface">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-canvas">
              <tr>
                <th scope="col" className="border-b border-line px-4 py-3 font-semibold text-ink">
                  병원
                </th>
                <th scope="col" className="border-b border-line px-4 py-3 text-right font-semibold text-ink">
                  최저~최고가
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const href = clinicPath(r.clinic.slug);
                return (
                  <tr key={r.clinic.id} className="border-b border-line last:border-b-0">
                    <th scope="row" className="px-4 py-2 align-top font-normal">
                      {isPathBuilt(href) ? (
                        <TrackedLink
                          href={href}
                          event="select_clinic"
                          params={{ clinic_id: r.clinic.id, from: "procedure" }}
                          className="-mx-2 inline-flex min-h-11 items-center px-2 font-semibold text-brand underline-offset-4 hover:underline"
                        >
                          {r.clinic.name}
                        </TrackedLink>
                      ) : (
                        <span className="inline-flex min-h-11 items-center font-semibold text-ink">{r.clinic.name}</span>
                      )}
                      <span className="block pb-1 text-ink-muted">{r.clinic.region}</span>
                    </th>
                    <td className="px-4 py-4 text-right align-top">
                      <span className="block font-semibold whitespace-nowrap text-ink">{r.price}</span>
                      {r.note && <span className="block text-ink-muted">{r.note}</span>}
                      <span className="mt-1 block text-ink-muted">{r.updated} 기준</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {hasDemo && (
        <p data-testid="procedure-prices-demo" className="mt-3 text-sm text-ink-muted">
          병원명과 가격은 제휴 병원 등록 전 화면 구성을 보여 주는 예시 데이터입니다.
        </p>
      )}
    </section>
  );
}
