import { afterEach, describe, expect, it, vi } from "vitest";
import { absoluteUrl, jsonLdString, siteJsonLd } from "@/lib/seo";
import { cx } from "@/lib/ui";

afterEach(() => vi.unstubAllEnvs());

describe("absoluteUrl", () => {
  it("사이트 URL(basePath 포함) 뒤에 한글 slug 를 퍼센트 인코딩해 붙인다", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com/realsurgery");
    expect(absoluteUrl("/procedures/쌍꺼풀-수술/")).toBe(
      "https://example.com/realsurgery/procedures/%EC%8C%8D%EA%BA%BC%ED%92%80-%EC%88%98%EC%88%A0/",
    );
    // 이미 인코딩된 경로는 이중 인코딩하지 않는다
    expect(absoluteUrl("/procedures/%EC%8C%8D/")).toBe("https://example.com/realsurgery/procedures/%EC%8C%8D/");
    expect(absoluteUrl("sitemap.xml")).toBe("https://example.com/realsurgery/sitemap.xml");
  });
});

describe("JSON-LD", () => {
  it("Organization·WebSite 그래프", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const ld = siteJsonLd() as { "@graph": { "@type": string; url: string }[] };
    expect(ld["@graph"].map((n) => n["@type"])).toEqual(["Organization", "WebSite"]);
    expect(ld["@graph"][0]?.url).toBe("https://example.com/");
  });
  it("</script> 조기 종료를 막는다", () => {
    expect(jsonLdString({ a: "</script>" })).not.toContain("</script>");
  });
});

describe("cx", () => {
  it("거짓 값을 빼고 합친다", () => expect(cx("a", false, null, undefined, "b")).toBe("a b"));
});
