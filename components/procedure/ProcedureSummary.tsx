import { BookOpen, CalendarCheck, PenLine } from "lucide-react";
import { Emoji3D, categoryEmoji, type EmojiName } from "@/components/ui/Emoji3D";
import type { Author, Category, Procedure } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { procedureClass, procedureFacts, type FactKey } from "@/lib/procedure/facts";
import { PAGE_SECTION_IDS } from "@/lib/procedure/toc";
import { chip, cx } from "@/lib/ui";

const FACT_EMOJI: Record<FactKey, EmojiName> = {
  price: "money",
  duration: "stopwatch",
  recovery: "bandage",
  anesthesia: "syringe",
};

const CLASS_LABEL = { surgical: "수술", percutaneous: "시술", noninvasive: "비수술 시술" } as const;

/** "50만~250만 원" → 물결표 뒤에서 줄바꿈될 수 있게(좁은 타일에서 숫자 중간이 끊기지 않도록) */
function breakableRange(text: string) {
  const [head, ...rest] = text.split("~");
  if (!rest.length) return text;
  return (
    <>
      {head}~<wbr />
      {rest.join("~")}
    </>
  );
}

type Props = { procedure: Procedure; category: Category | undefined; author: Author | undefined };

/**
 * P-03 상단 요약 박스 (4절): 시술명(H1), 직답 요약(AEO 첫 문단), 가격 범위·소요시간·회복기간·마취 4칸, 작성자·최종 수정일·출처.
 * 4칸 값은 lib/procedure/facts 에서 만들어 JSON-LD 와 같은 문자열을 쓴다.
 */
export function ProcedureSummary({ procedure: p, category, author }: Props) {
  const facts = procedureFacts(p);
  return (
    <section id={PAGE_SECTION_IDS.summary} aria-labelledby="procedure-title" data-testid="procedure-summary">
      <div className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-md bg-canvas">
          <Emoji3D name={categoryEmoji(p.category_id)} size={32} priority />
        </span>
        {category && <span className={cx(chip.base, chip.brand)}>{category.name}</span>}
        <span className={cx(chip.base, chip.neutral)}>{CLASS_LABEL[procedureClass(p)]}</span>
      </div>
      <h1 id="procedure-title" className="mt-5 text-h1 font-bold tracking-tighter text-ink md:text-display">
        {p.name}
      </h1>
      <p data-testid="procedure-answer" className="mt-4 max-w-text text-lg text-ink md:text-h3 md:font-medium md:leading-relaxed">
        {p.summary}
      </p>

      <ul data-testid="procedure-meta" className="mt-4 flex flex-wrap items-center gap-x-5 text-sm text-ink-muted">
        <li className="inline-flex min-h-8 items-center gap-1.5">
          <CalendarCheck aria-hidden="true" className="size-4 text-ink-subtle" />
          최종 수정 <time dateTime={p.updated_at}>{formatDate(p.updated_at)}</time>
        </li>
        {p.sources.length > 0 && (
          <li>
            <a
              href={`#${PAGE_SECTION_IDS.sources}`}
              className="inline-flex min-h-11 items-center gap-1.5 underline-offset-4 hover:text-ink hover:underline"
            >
              <BookOpen aria-hidden="true" className="size-4 text-ink-subtle" />
              출처 {p.sources.length}곳
            </a>
          </li>
        )}
        <li className="inline-flex min-h-8 items-center gap-1.5">
          <PenLine aria-hidden="true" className="size-4 text-ink-subtle" />
          작성 {author?.name ?? "리얼성형 편집팀"}
        </li>
      </ul>

      <dl data-testid="procedure-facts" className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-canvas p-2 md:mt-8 md:grid-cols-4 md:gap-3 md:p-3">
        {facts.map((f) => (
          <div key={f.key} data-fact={f.key} className="flex flex-col rounded-lg bg-surface p-4 md:p-5">
            <dt className="flex flex-col items-start gap-3 text-sm text-ink-muted">
              <Emoji3D name={FACT_EMOJI[f.key]} size={40} />
              {f.label}
            </dt>
            <dd className="mt-1 text-lg font-bold tracking-tight text-ink tabular-nums md:text-h3">
              {f.key === "price" ? breakableRange(f.value) : f.value}
            </dd>
            {f.note && <dd className="mt-0.5 text-sm text-ink-subtle">{f.note}</dd>}
          </div>
        ))}
      </dl>
    </section>
  );
}
