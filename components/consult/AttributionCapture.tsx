"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { captureFirstTouch } from "@/lib/consult/attribution";
import { recordPageView } from "@/lib/consult/source";

/**
 * 첫 유입 기록(_utm 쿠키, 90일) + 사이트 내부 이동 기록(form_start 의 source_page 용). 화면에는 아무것도 그리지 않는다.
 * 루트 레이아웃에 1회 마운트하면 모든 랜딩에서 첫 방문을 잡는다. 상담 폼에도 마운트해 단독으로 동작하게 한다.
 * 쿠키가 이미 있으면 덮어쓰지 않고, 같은 경로는 한 번만 기록하므로 여러 곳에 마운트해도 안전하다.
 */
export function AttributionCapture() {
  const pathname = usePathname();
  useEffect(() => {
    captureFirstTouch();
  }, []);
  useEffect(() => {
    if (pathname) recordPageView(pathname);
  }, [pathname]);
  return null;
}
