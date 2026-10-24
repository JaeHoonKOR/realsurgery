import { evaluate } from "@mdx-js/mdx";
import type { ComponentPropsWithoutRef } from "react";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import { rehypeGuide } from "@/lib/rehype-guide";
import { sectionAnchor } from "@/lib/procedure";

/*
 * 시술 가이드 본문(MDX) — 서버 컴포넌트, 빌드 때 HTML 로 굳는다(클라이언트 JS 없음).
 * 본문 규칙(H2 5개·직답 문단·[n] 각주·링크 금지)은 scripts/procedure-mdx.mjs 린트가 빌드 전에 강제한다.
 * GFM 표만 쓴다. "50만~150만" 의 물결표가 취소선이 되지 않게 singleTilde 를 끈다.
 * 스타일은 부모 클래스 .guide-prose / .guide-table (app/globals.css) — 요소마다 class 를 반복하지 않는다.
 */

/** 표: 375px 에서 넘치면 표 안에서만 가로 스크롤(페이지 가로 스크롤 금지). 스크롤 영역은 키보드로 닿게 tabIndex. */
function Table(props: ComponentPropsWithoutRef<"table">) {
  return (
    <div role="region" aria-label="표 (좌우로 스크롤할 수 있습니다)" tabIndex={0} className="guide-table">
      <table {...props} />
    </div>
  );
}

const components = {
  table: Table,
  th: (props: ComponentPropsWithoutRef<"th">) => <th {...props} scope="col" />,
};

export async function GuideBody({ body, sectionIds }: { body: string; sectionIds: string[] }) {
  const { default: Content } = await evaluate(body, {
    Fragment: runtime.Fragment,
    jsx: runtime.jsx,
    jsxs: runtime.jsxs,
    remarkPlugins: [[remarkGfm, { singleTilde: false }]],
    rehypePlugins: [[rehypeGuide, { ids: sectionIds.map(sectionAnchor) }]],
  });
  return (
    <div data-testid="procedure-body" className="guide-prose max-w-text">
      <Content components={components} />
    </div>
  );
}
