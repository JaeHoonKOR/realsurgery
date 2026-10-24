"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { readConsent, saveConsent } from "@/lib/consent";

function Toggle({ label, detail, checked, onChange }: { label: string; detail: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div>
        <p id={`${id}-label`} className="text-sm font-semibold text-ink">
          {label}
        </p>
        <p id={`${id}-detail`} className="text-sm text-ink-muted">
          {detail}
        </p>
      </div>
      {/* 터치 영역 44px 이상: 버튼은 h-11, 시각적 스위치는 안쪽 h-7 */}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-detail`}
        onClick={() => onChange(!checked)}
        className="group inline-flex h-11 w-14 shrink-0 items-center justify-center rounded-sm"
      >
        {/* 꺼짐: 테두리 + 회색 손잡이, 켜짐: 브랜드색 채움 + 흰 손잡이 (상태 구분 대비 3:1 이상) */}
        <span
          aria-hidden="true"
          className={`flex h-7 w-12 items-center rounded-lg p-1 ring-1 transition-colors ring-inset ${
            checked ? "bg-brand ring-brand" : "bg-surface ring-ink-muted"
          }`}
        >
          <span
            className={`size-5 rounded-lg transition-transform ${checked ? "translate-x-5 bg-surface" : "translate-x-0 bg-ink-muted"}`}
          />
        </span>
      </button>
    </div>
  );
}

/**
 * 쿠키·동의 배너 (screen-spec 3절: GA4·메타 픽셀 동의 토글, Consent Mode 기본 denied → 동의 후 업데이트)
 * 서버 HTML 에 포함되고, 이미 선택한 방문자에게는 <html data-consent="set"> + CSS 로 첫 페인트부터 숨겨진다.
 */
export function ConsentBanner({ privacyHref }: { privacyHref?: string }) {
  const titleId = useId();
  const optionsId = useId();
  const [analytics, setAnalytics] = useState(false);
  const [ads, setAds] = useState(false);
  // 낮은 화면(세로 720px 이하: 소형 휴대폰·가로 모드)에서는 토글을 접어 두고 "항목 설정"으로 연다(globals.css).
  // 접힌 상태에서 토글이 모두 꺼져 있으면 "선택 저장" = 거부이므로 버튼 이름을 "동의 안 함"으로 보여 준다.
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const stored = readConsent();
    if (stored) {
      setAnalytics(stored.analytics);
      setAds(stored.ads);
    }
  }, []);

  return (
    <section
      data-consent-banner=""
      data-testid="consent-banner"
      data-expanded={expanded ? "" : undefined}
      data-any-on={analytics || ads ? "" : undefined}
      aria-labelledby={titleId}
      className="fixed inset-x-0 bottom-0 z-(--z-banner) border-t border-line bg-surface pb-safe-4 shadow-lg"
    >
      <div className="consent-inner mx-auto max-w-content px-5 pt-2 md:flex md:items-end md:gap-10 md:px-10 md:pt-3">
        <div className="md:flex-1">
          {/* 제목 줄 높이 44px: 개인정보처리방침 링크·항목 설정 버튼을 문장 안이 아니라 이 줄 오른쪽에 둬 터치 영역 44×44 를 확보한다 */}
          <div className="flex min-h-11 items-center justify-between gap-4">
            <p id={titleId} className="font-bold text-ink">
              쿠키 사용 동의
            </p>
            <div className="flex items-center gap-2">
              {privacyHref && (
                <Link
                  href={privacyHref}
                  className="-mx-2 inline-flex h-11 shrink-0 items-center px-2 text-sm font-semibold text-brand underline"
                >
                  개인정보처리방침
                </Link>
              )}
              <button
                type="button"
                data-testid="consent-disclosure"
                aria-expanded={expanded}
                aria-controls={optionsId}
                onClick={() => setExpanded((v) => !v)}
                className="consent-disclosure -mr-2 h-11 shrink-0 items-center gap-1 px-2 text-sm font-semibold text-brand"
              >
                {expanded ? "설정 접기" : "항목 설정"}
                <ChevronDown aria-hidden="true" className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>
          <p className="text-sm text-ink-muted">
            방문 통계와 광고 성과 측정에 쿠키를 사용합니다. 동의하지 않아도 모든 정보를 그대로 볼 수 있습니다.
          </p>
          <div id={optionsId} className="consent-options mt-2 divide-y divide-line">
            <Toggle label="방문 통계" detail="Google Analytics 4" checked={analytics} onChange={setAnalytics} />
            <Toggle label="광고 성과 측정" detail="Meta 픽셀 · 광고 전환 측정" checked={ads} onChange={setAds} />
          </div>
        </div>
        <div className="consent-actions mt-3 flex gap-2 md:mt-0 md:mb-2 md:w-80">
          <button
            type="button"
            data-testid="consent-save"
            onClick={() => saveConsent({ analytics, ads })}
            className="h-11 basis-0 grow rounded-sm border border-line bg-surface text-sm font-semibold text-ink hover:bg-canvas"
          >
            <span className="consent-label-full">선택 저장</span>
            <span className="consent-label-compact">동의 안 함</span>
          </button>
          <button
            type="button"
            data-testid="consent-accept-all"
            onClick={() => {
              setAnalytics(true);
              setAds(true);
              saveConsent({ analytics: true, ads: true });
            }}
            className="h-11 basis-0 grow rounded-sm bg-brand text-sm font-semibold text-surface hover:opacity-90"
          >
            모두 동의
          </button>
        </div>
      </div>
      {/* 끝 표시: 이 요소까지 파싱되기 전에는 배너를 그리지 않는다(globals.css) — 느린 기기에서 반쯤 파싱된 배너가
          먼저 그려진 뒤 커지며 생기는 레이아웃 이동(CLS)을 막는다 */}
      <span data-consent-end="" hidden />
    </section>
  );
}
