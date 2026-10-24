"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes, MouseEvent, Ref } from "react";
import { track, type TrackEventName, type TrackEvents } from "@/lib/track";

type Props<N extends TrackEventName> = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  /** screen-spec 5절 이벤트명. 클릭 요소에 data-track 으로도 붙는다(GTM 클릭 트리거는 data-track 만 쓴다). */
  event: N;
  params: TrackEvents[N];
  ref?: Ref<HTMLAnchorElement>;
};

/**
 * 클릭 시 track(event, params) 를 부르는 링크.
 * 내부 경로("/…")는 next/link(basePath·클라이언트 이동), 그 밖(tel:·https:)은 일반 <a>.
 */
export function TrackedLink<N extends TrackEventName>({ href, event, params, onClick, children, ...rest }: Props<N>) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    (track as (name: TrackEventName, p: TrackEvents[N]) => void)(event, params);
    onClick?.(e);
  };
  if (href.startsWith("/")) {
    return (
      <Link href={href} data-track={event} onClick={handleClick} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} data-track={event} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
