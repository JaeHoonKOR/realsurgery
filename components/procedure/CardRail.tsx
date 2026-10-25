import { Children, type ReactNode } from "react";
import { cx } from "@/lib/ui";

/**
 * 카드 목록 — 모바일은 가로로 넘겨 보는 한 줄(다음 카드가 살짝 보이게 80% 폭, 스냅), sm 부터는 2열·lg 3열 그리드.
 * 세로로 카드 3~4장을 쌓으면 한 화면을 넘기므로 P-03 끝부분(비슷한 시술·관련 칼럼)에서 쓴다.
 * 컨테이너 좌우 여백(px-5)만큼 화면 끝까지 붙여 그린다.
 */
export function CardRail({ children, label, className }: { children: ReactNode; label?: string; className?: string }) {
  return (
    <ul
      aria-label={label}
      className={cx(
        "-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 py-1",
        "sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:p-0 lg:grid-cols-3",
        className,
      )}
    >
      {Children.map(children, (child) => (
        <li className="w-4/5 shrink-0 snap-start sm:w-auto">{child}</li>
      ))}
    </ul>
  );
}
