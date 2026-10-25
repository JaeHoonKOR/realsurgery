import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Props = {
  id: string;
  title: string;
  description?: string;
  /** 오른쪽 "전체 보기" 링크(대상 화면이 있을 때만 넘긴다) */
  more?: { href: string; label: string };
};

/** 섹션 제목 — 왼쪽 정렬 제목 + 한 줄 설명 + (선택) 전체 보기 링크 */
export function SectionHeading({ id, title, description, more }: Props) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 id={id} className="text-h2 font-bold tracking-tight text-ink">
          {title}
        </h2>
        {description && <p className="mt-2 text-ink-muted">{description}</p>}
      </div>
      {more && (
        <Link
          href={more.href}
          className="inline-flex h-11 shrink-0 items-center gap-0.5 text-sm font-semibold text-ink-subtle hover:text-ink"
        >
          {more.label}
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      )}
    </div>
  );
}
