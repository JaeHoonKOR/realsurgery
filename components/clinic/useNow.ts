"use client";

import { useEffect, useState } from "react";

/**
 * 방문 시점의 현재 시각. 정적 빌드 HTML 은 빌드 시각으로 굳으므로 "오늘"·"진료 중" 판정은 마운트 뒤에만 한다.
 * 서버·첫 렌더는 null → 하이드레이션 불일치가 생기지 않는다. 1분마다 갱신.
 */
export function useNow(intervalMs = 60_000): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}
