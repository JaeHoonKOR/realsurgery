"use client";

import { useEffect, useRef } from "react";
import { newlyReached, scrollPercent } from "@/lib/scroll-depth";
import { track, type TrackEvents } from "@/lib/track";

/**
 * P-03 로드 이벤트 view_procedure (5절: procedure_id, procedure_name, category) — 화면 진입마다 1회.
 * 개발 모드 StrictMode 의 이펙트 2회 실행에도 ref 로 1회만 보낸다.
 */
export function ViewProcedureTracker(props: TrackEvents["view_procedure"]) {
  const sent = useRef(false);
  const { procedure_id, procedure_name, category } = props;
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    track("view_procedure", { procedure_id, procedure_name, category });
  }, [procedure_id, procedure_name, category]);
  return null;
}

/** scroll_depth (5절: 25/50/75/100%, page_type) — 구간마다 1회. 스크롤 이벤트는 프레임당 1번만 계산한다. */
export function ScrollDepthTracker({ pageType }: { pageType: string }) {
  useEffect(() => {
    const sent = new Set<number>();
    let frame = 0;
    const check = () => {
      frame = 0;
      const doc = document.documentElement;
      const percent = scrollPercent(window.scrollY, window.innerHeight, doc.scrollHeight);
      for (const t of newlyReached(percent, sent)) {
        sent.add(t);
        track("scroll_depth", { percent: t, page_type: pageType });
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pageType]);
  return null;
}
