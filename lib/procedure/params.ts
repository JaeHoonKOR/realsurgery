/**
 * /procedures/[slug] 정적 경로 파라미터 — 한글 slug(2절 URL 규칙) 처리.
 *
 * Next 15 정적 export 에서 확인한 동작(next dev·next build 모두 15.5):
 * - 페이지가 받는 params.slug 는 퍼센트 인코딩된 값이다("%EC%8C%8D…") → decodeSlug 로 되돌려 찾는다.
 * - next build: generateStaticParams 가 원문 slug 를 돌려주면 out/procedures/쌍꺼풀-수술/ 로 내보낸다(GitHub Pages 가 디코딩해 서빙).
 * - next dev: 원문만 돌려주면 "missing param … in generateStaticParams()" 500, 인코딩 값만 돌려주면 404.
 *   두 형태를 모두 돌려줘야 통과한다 → 개발 모드에서만 인코딩 값을 덧붙인다(빌드 산출물에는 영향 없음).
 */

export function decodeSlug(raw: string): string {
  try {
    return decodeURIComponent(raw).normalize("NFC");
  } catch {
    return raw;
  }
}

export function staticSlugParams(slugs: readonly string[], env: string | undefined = process.env.NODE_ENV): { slug: string }[] {
  const dev = env === "development";
  return slugs.flatMap((slug) => {
    const encoded = encodeURIComponent(slug);
    return dev && encoded !== slug ? [{ slug }, { slug: encoded }] : [{ slug }];
  });
}
