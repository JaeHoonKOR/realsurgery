"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { naverMapUrl } from "@/lib/clinic/view";
import { track } from "@/lib/track";
import { btn, cx } from "@/lib/ui";
import { MapPreview } from "./MapPreview";

type Props = {
  clinicId: string;
  clinicName: string;
  region: string;
  address: string;
};

type CopyState = "idle" | "copied" | "failed";

/** 클립보드 API 가 없거나 막힌 환경(비보안 출처 등)용 대체 복사 */
function legacyCopy(text: string): boolean {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.className = "fixed top-0 left-0 opacity-0";
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  ta.remove();
  return ok;
}

/**
 * 위치 카드 (4절 P-05 위치·운영시간, "지도 클릭 → 길찾기", click_map).
 * 네이버 지도 키가 없으므로 임베드 대신 위치 일러스트 + 주소 + "네이버 지도에서 보기" + "주소 복사"(확인 표시).
 * 일러스트를 눌러도 네이버 지도로 간다(포인터 사용자용 — 키보드·스크린리더는 아래 버튼 하나로 충분해 탭 순서에서 뺀다).
 */
export function LocationCard({ clinicId, clinicName, region, address }: Props) {
  const [copy, setCopy] = useState<CopyState>("idle");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const mapHref = naverMapUrl(`${address} ${clinicName}`);
  const onMap = () => track("click_map", { clinic_id: clinicId });

  const onCopy = async () => {
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(address);
        ok = true;
      }
    } catch {
      ok = false;
    }
    if (!ok) ok = legacyCopy(address);
    setCopy(ok ? "copied" : "failed");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopy("idle"), 2400);
  };

  return (
    <div data-testid="clinic-location" className="flex h-full flex-col overflow-hidden rounded-lg bg-canvas">
      <a
        href={mapHref}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={-1}
        aria-hidden="true"
        data-track="click_map"
        onClick={onMap}
        className="block h-40 transition-opacity hover:opacity-90 md:h-auto md:min-h-48 md:flex-1"
      >
        <MapPreview />
      </a>

      <div className="flex flex-col p-5 md:p-6">
        <p className="text-sm font-semibold text-ink-muted">{region}</p>
        <p data-testid="clinic-address" className="mt-0.5 text-lg font-bold text-ink">
          {address}
        </p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <a
            href={mapHref}
            target="_blank"
            rel="noopener noreferrer"
            data-track="click_map"
            data-testid="clinic-map-link"
            onClick={onMap}
            className={cx(btn.outline, btn.md, "px-3")}
          >
            <ExternalLink aria-hidden="true" className="size-4 text-brand-strong" />
            네이버 지도에서 보기
            <span className="sr-only">(새 창)</span>
          </a>
          <button
            type="button"
            data-testid="clinic-copy-address"
            onClick={onCopy}
            className={cx(btn.outline, btn.md, "px-3", copy === "copied" && "border-success text-success")}
          >
            {copy === "copied" ? (
              <Check aria-hidden="true" className="size-4" />
            ) : (
              <Copy aria-hidden="true" className="size-4 text-brand-strong" />
            )}
            {copy === "copied" ? "복사했습니다" : "주소 복사"}
          </button>
        </div>
        <p role="status" data-testid="clinic-copy-status" className="mt-2 min-h-5 text-xs">
          {copy === "copied" && <span className="text-success">주소를 클립보드에 복사했습니다.</span>}
          {copy === "failed" && <span className="text-danger">복사하지 못했습니다. 주소를 길게 눌러 직접 복사해 주세요.</span>}
        </p>
      </div>
    </div>
  );
}
