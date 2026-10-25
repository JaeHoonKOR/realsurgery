import { Check } from "lucide-react";
import { Emoji3D } from "@/components/ui/Emoji3D";
import type { ProcedureExtras } from "@/lib/content";
import { PAGE_SECTION_IDS } from "@/lib/procedure/toc";
import { cx } from "@/lib/ui";

/**
 * 본문 앞 한눈에 보기 — "이런 분이 많이 받아요"(extras.good_for) · "꼭 확인하세요"(extras.cautions).
 * 자세한 설명은 아래 본문 "누가 받나"·"부작용·주의" 섹션에 있다 → 여기서는 짧게: 회색 상자 1개,
 * 모바일은 구분선으로 위아래(주의 사항을 옆으로 넘겨 숨기지 않는다), sm 부터는 좌우 2열.
 */
export function HighlightCards({ extras }: { extras: Pick<ProcedureExtras, "good_for" | "cautions"> }) {
  const cards = [
    { key: "good", title: "이런 분이 많이 받아요", items: extras.good_for, emoji: "check" as const },
    { key: "caution", title: "꼭 확인하세요", items: extras.cautions, emoji: "warning" as const },
  ].filter((c) => c.items.length > 0);
  if (cards.length === 0) return null;
  return (
    <div
      id={PAGE_SECTION_IDS.highlights}
      data-testid="procedure-highlights"
      className={cx(
        "divide-y divide-line rounded-lg bg-canvas px-5 sm:grid sm:divide-x sm:divide-y-0 sm:px-0 sm:py-5",
        cards.length > 1 && "sm:grid-cols-2",
      )}
    >
      {cards.map((c) => (
        <section key={c.key} aria-labelledby={`highlight-${c.key}`} className="py-3.5 sm:px-6 sm:py-0">
          <div className="flex items-center gap-2">
            <Emoji3D name={c.emoji} size={24} />
            <h2 id={`highlight-${c.key}`} className="font-bold tracking-tight text-ink">
              {c.title}
            </h2>
          </div>
          <ul className="mt-2 space-y-1">
            {c.items.map((item) => (
              <li key={item} className="flex gap-2 text-ink">
                {c.key === "good" ? (
                  <Check aria-hidden="true" className="mt-1.5 size-4 shrink-0 text-brand-strong" />
                ) : (
                  <span aria-hidden="true" className="mt-3 size-1.5 shrink-0 rounded-full bg-ink-faint" />
                )}
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
