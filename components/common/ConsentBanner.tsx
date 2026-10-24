"use client";

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
  const [analytics, setAnalytics] = useState(false);
  const [ads, setAds] = useState(false);

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
      aria-labelledby={titleId}
      className="fixed inset-x-0 bottom-0 z-(--z-banner) border-t border-line bg-surface pb-safe-4 shadow-lg"
    >
      <div className="mx-auto max-w-content px-5 pt-2 md:flex md:items-end md:gap-10 md:px-10 md:pt-3">
        <div className="md:flex-1">
          {/* 제목 줄 높이 44px: 개인정보처리방침 링크를 문장 안이 아니라 이 줄 오른쪽에 둬 터치 영역 44×44 를 확보한다 */}
          <div className="flex min-h-11 items-center justify-between gap-4">
            <p id={titleId} className="font-bold text-ink">
              쿠키 사용 동의
            </p>
            {privacyHref && (
              <Link
                href={privacyHref}
                className="-mx-2 inline-flex h-11 shrink-0 items-center px-2 text-sm font-semibold text-brand underline"
              >
                개인정보처리방침
              </Link>
            )}
          </div>
          <p className="text-sm text-ink-muted">
            방문 통계와 광고 성과 측정에 쿠키를 사용합니다. 동의하지 않아도 모든 정보를 그대로 볼 수 있습니다.
          </p>
          <div className="mt-2 divide-y divide-line">
            <Toggle label="방문 통계" detail="Google Analytics 4" checked={analytics} onChange={setAnalytics} />
            <Toggle label="광고 성과 측정" detail="Meta 픽셀 · 광고 전환 측정" checked={ads} onChange={setAds} />
          </div>
        </div>
        <div className="mt-3 flex gap-2 md:mt-0 md:mb-2 md:w-80">
          <button
            type="button"
            data-testid="consent-save"
            onClick={() => saveConsent({ analytics, ads })}
            className="h-11 basis-0 grow rounded-sm border border-line bg-surface text-sm font-semibold text-ink hover:bg-canvas"
          >
            선택 저장
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
    </section>
  );
}
