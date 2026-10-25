"use client";

import { useEffect, useRef } from "react";
import { newThresholds, scrollPercent } from "@/lib/procedure/scroll";
import { track } from "@/lib/track";

type Props = { procedureId: string; procedureName: string; category: string };

/**
 * P-03 이벤트 (5절): view_procedure 1회(페이지 로드), scroll_depth 25/50/75/100 각 1회(page_type "procedure").
 * 화면에는 아무것도 그리지 않는다. 개발 모드 StrictMode 의 이중 실행에도 한 번만 보내도록 ref 로 기억한다.
 */
export function ProcedureTracker({ procedureId, procedureName, category }: Props) {
  const viewed = useRef<string | null>(null);
  const sent = useRef(new Set<number>());

  useEffect(() => {
    if (viewed.current === procedureId) return;
    viewed.current = procedureId;
    sent.current = new Set();
    track("view_procedure", { procedure_id: procedureId, procedure_name: procedureName, category });
  }, [procedureId, procedureName, category]);

  useEffect(() => {
    let frame = 0;
    const check = () => {
      frame = 0;
      const doc = document.documentElement;
      const percent = scrollPercent(window.scrollY, window.innerHeight, doc.scrollHeight);
      for (const t of newThresholds(percent, sent.current)) {
        sent.current.add(t);
        track("scroll_depth", { percent: t, page_type: "procedure" });
      }
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(check);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [procedureId]);

  return null;
}
