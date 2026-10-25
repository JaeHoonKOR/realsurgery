import { Check } from "lucide-react";
import { Emoji3D } from "@/components/ui/Emoji3D";
import type { ProcedureExtras } from "@/lib/content";
import { PAGE_SECTION_IDS } from "@/lib/procedure/toc";

/**
 * 본문 앞 한눈에 보기 — "이런 분이 많이 받아요"(extras.good_for) · "꼭 확인하세요"(extras.cautions).
 * 자세한 설명은 아래 본문 "누가 받나"·"부작용·주의" 섹션에 있다.
 */
export function HighlightCards({ extras }: { extras: Pick<ProcedureExtras, "good_for" | "cautions"> }) {
  const cards = [
    { key: "good", title: "이런 분이 많이 받아요", items: extras.good_for, emoji: "check" as const },
    { key: "caution", title: "꼭 확인하세요", items: extras.cautions, emoji: "warning" as const },
  ].filter((c) => c.items.length > 0);
  if (cards.length === 0) return null;
  return (
    <div id={PAGE_SECTION_IDS.highlights} data-testid="procedure-highlights" className="grid gap-3 sm:grid-cols-2">
      {cards.map((c) => (
        <section key={c.key} aria-labelledby={`highlight-${c.key}`} className="rounded-lg bg-canvas p-5 md:p-6">
          <div className="flex items-center gap-3">
            <Emoji3D name={c.emoji} size={32} />
            <h2 id={`highlight-${c.key}`} className="text-lg font-bold tracking-tight text-ink">
              {c.title}
            </h2>
          </div>
          <ul className="mt-4 space-y-2.5">
            {c.items.map((item) => (
              <li key={item} className="flex gap-2.5 text-ink">
                {c.key === "good" ? (
                  <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-brand-strong" />
                ) : (
                  <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-ink-faint" />
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
