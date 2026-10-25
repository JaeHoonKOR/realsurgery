import { isPathBuilt } from "@/lib/built-routes";
import { loadContent } from "@/lib/content";
import { formatPriceRange, formatRecovery } from "@/lib/format";
import { postPath, procedurePath } from "@/lib/routes";
import { absoluteUrl } from "@/lib/seo";
import { SITE } from "@/lib/site";

// 정적 export: 빌드 시 /llms.txt 파일로 생성된다(서버 실행 없음). AI 답변 엔진용 사이트 안내(llmstxt.org 형식).
export const dynamic = "force-static";

export function GET(): Response {
  const { procedures, categories, posts } = loadContent();
  const lines = [
    `# ${SITE.name}`,
    "",
    `> ${SITE.tagline}. 성형 시술별 병원 공개 가격 범위, 소요시간, 회복기간, 마취 방식, 부작용을 학회·의료기관 출처와 함께 정리한 정보 서비스입니다. ${SITE.disclaimer}.`,
    "",
  ];
  for (const cat of [...categories].sort((a, b) => a.order - b.order)) {
    const items = procedures.filter((p) => p.category_id === cat.id && isPathBuilt(procedurePath(p.slug)));
    if (items.length === 0) continue;
    lines.push(`## ${cat.name} 시술`, "");
    for (const p of items) {
      lines.push(
        `- [${p.name}](${absoluteUrl(procedurePath(p.slug))}): 가격 ${formatPriceRange(p.price_low, p.price_high)}${p.price_note ? `(${p.price_note})` : ""}, 회복 ${formatRecovery(p.recovery_days)}. 최종 수정 ${p.updated_at}.`,
      );
    }
    lines.push("");
  }
  const builtPosts = posts.filter((p) => isPathBuilt(postPath(p.slug)));
  if (builtPosts.length) {
    lines.push("## 칼럼", "");
    for (const p of builtPosts) lines.push(`- [${p.title}](${absoluteUrl(postPath(p.slug))}): ${p.summary}`);
    lines.push("");
  }
  return new Response(`${lines.join("\n").trimEnd()}\n`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
