import type { MetadataRoute } from "next";
import { isPathBuilt } from "@/lib/built-routes";
import { loadContent } from "@/lib/content";
import { ROUTES, clinicPath, procedurePath } from "@/lib/routes";
import { absoluteUrl } from "@/lib/seo";

// 정적 export: 빌드 시 sitemap.xml 파일로 생성된다. 실제로 만들어진 화면만 넣는다(lib/built-routes).
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const { procedures, clinics, meta } = loadContent();
  const latest = procedures.reduce((max, p) => (p.updated_at > max ? p.updated_at : max), meta.generated_at.slice(0, 10));
  const entries: MetadataRoute.Sitemap = [];
  const add = (path: string, lastModified: string, priority: number) => {
    if (isPathBuilt(path)) entries.push({ url: absoluteUrl(path), lastModified, priority });
  };
  add(ROUTES.home, latest, 1);
  add(ROUTES.procedures, latest, 0.9);
  for (const p of procedures) add(procedurePath(p.slug), p.updated_at, 0.9);
  add(ROUTES.clinics, latest, 0.7);
  for (const c of clinics) {
    const updated = c.procedures.reduce((max, o) => (o.price_updated_at > max ? o.price_updated_at : max), "2026-10-01");
    add(clinicPath(c.slug), updated, 0.6);
  }
  add(ROUTES.consult, latest, 0.5);
  add(ROUTES.terms, latest, 0.2);
  add(ROUTES.privacy, latest, 0.2);
  return entries;
}
