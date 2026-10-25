"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/track";

type Props = { clinicId: string; clinicName: string; isPremium: boolean };

/** view_clinic (5절: P-05 로드, clinic_id·clinic_name·is_premium) — 마운트 시 1회 */
export function ClinicViewTracker({ clinicId, clinicName, isPremium }: Props) {
  const sent = useRef<string | null>(null);
  useEffect(() => {
    // StrictMode 개발 모드의 이중 effect 에서도 같은 병원은 한 번만 보낸다
    if (sent.current === clinicId) return;
    sent.current = clinicId;
    track("view_clinic", { clinic_id: clinicId, clinic_name: clinicName, is_premium: isPremium });
  }, [clinicId, clinicName, isPremium]);
  return null;
}
