import type { Metadata } from "next";
import { PostCard } from "@/components/blog/PostCard";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ConsultCta } from "@/components/common/ConsultCta";
import { sortPosts } from "@/lib/blog";
import { loadContent } from "@/lib/content";
import { ROUTES } from "@/lib/routes";
import { container, cx, section } from "@/lib/ui";

// P-10 칼럼 목록 — 롱테일 키워드 콘텐츠(screen-spec 2절)

const TITLE = "칼럼 — 성형 상담 전에 알아 둘 것";
const DESCRIPTION =
  "성형 상담을 앞두고 많이 묻는 질문을 정리한 칼럼입니다. 상담 때 준비할 질문, 비슷한 수술의 차이, 견적서에서 확인할 항목을 시술 가이드와 함께 읽어 보세요.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "./" },
  openGraph: { type: "website", locale: "ko_KR", url: "./", title: TITLE, description: DESCRIPTION },
};

export default function BlogPage() {
  const posts = sortPosts(loadContent().posts);
  return (
    <>
      <div className={cx(container, "pt-4 md:pt-6")}>
        <Breadcrumb items={[{ name: "홈", href: ROUTES.home }, { name: "칼럼" }]} />
      </div>
      <header className={cx(container, "pt-6 pb-10 md:pt-8 md:pb-12")}>
        <h1 className="text-h1 font-bold tracking-tighter text-ink">칼럼</h1>
        <p className="mt-3 max-w-text text-lg text-ink-muted">
          상담을 앞두고 많이 묻는 질문을 정리했습니다. 가격·회복기간 수치는 시술 가이드와 같은 기준을 씁니다.
        </p>
      </header>
      <section aria-label="칼럼 목록" data-testid="post-list" className={cx("bg-canvas", section)}>
        <ul className={cx(container, "grid gap-4 sm:grid-cols-2 lg:grid-cols-3")}>
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard post={post} headingLevel="h2" />
            </li>
          ))}
        </ul>
      </section>
      <div className={cx(container, section)}>
        <ConsultCta location="bottom" />
      </div>
    </>
  );
}
