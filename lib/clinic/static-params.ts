/**
 * 한글 slug 정적 경로 — next dev 호환.
 *
 * Next 15 개발 서버는 output: "export" 에서 요청 경로(퍼센트 인코딩된 그대로, 예: /clinics/%EB%8B%A8…)를
 * generateStaticParams 결과 경로(디코딩된 한글)와 문자열로 비교해 "missing param" 500 을 낸다.
 * 정적 빌드(out/)는 한글 디렉터리로 정상 생성되므로, 개발 모드에서만 인코딩된 slug 를 함께 돌려준다.
 * 페이지는 decodeSlug() 로 두 형태를 같은 병원으로 찾는다.
 */
export function slugParams(slugs: readonly string[], env: string | undefined = process.env.NODE_ENV): { slug: string }[] {
  const params = slugs.map((slug) => ({ slug }));
  if (env !== "development") return params;
  const encoded = slugs.map((slug) => encodeURIComponent(slug)).filter((s, i) => s !== slugs[i]);
  return [...params, ...encoded.map((slug) => ({ slug }))];
}
