import { Emoji3D } from "@/components/ui/Emoji3D";

/**
 * 지도 키가 없을 때 쓰는 위치 일러스트 — 실제 지도처럼 보이지 않게 단순화한 도로·강 패턴 위에 핀 1개.
 * 장식이며(aria-hidden), 실제 위치는 주소 문구와 "네이버 지도에서 보기" 링크가 전달한다.
 * 색은 토큰 클래스(fill-*·stroke-*)만 쓴다.
 */
export function MapPreview() {
  return (
    <div aria-hidden="true" className="relative size-full overflow-hidden bg-line">
      <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
        {/* 강 */}
        <path d="M-20 168 C 60 140, 120 196, 210 170 S 360 120, 430 150" className="fill-none stroke-brand-weak" strokeWidth="26" />
        {/* 큰길 */}
        <g className="fill-none stroke-surface" strokeLinecap="round">
          <path d="M-10 70 L 410 52" strokeWidth="12" />
          <path d="M150 -10 L 176 210" strokeWidth="12" />
          <path d="M300 -10 L 278 210" strokeWidth="9" />
        </g>
        {/* 골목 */}
        <g className="fill-none stroke-canvas-soft" strokeLinecap="round" strokeWidth="5">
          <path d="M-10 118 L 410 104" />
          <path d="M60 -10 L 78 140" />
          <path d="M230 -10 L 222 150" />
          <path d="M350 -10 L 364 130" />
          <path d="M-10 22 L 410 10" />
        </g>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="relative flex flex-col items-center">
          <span className="absolute top-8 size-12 animate-ping rounded-full bg-brand opacity-20" />
          <span className="relative flex size-16 items-center justify-center rounded-full bg-surface shadow-lg">
            <Emoji3D name="pin" size={40} />
          </span>
        </span>
      </div>
    </div>
  );
}
