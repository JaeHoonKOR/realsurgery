import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KEYS, checkKey, hasKey, keyReport, mockModeKeys } from "@/lib/env";
import { hasPublicKey, readPublicVar, siteUrl, withBasePath } from "@/lib/env.public";

const ALL_VARS = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_BASE_PATH",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_GTM_ID",
  "NEXT_PUBLIC_GA4_MEASUREMENT_ID",
  "NEXT_PUBLIC_META_PIXEL_ID",
  "NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION",
  "NEXT_PUBLIC_NAVER_SITE_VERIFICATION",
  "NEXT_PUBLIC_NAVER_ANALYTICS_ID",
  "NEXT_PUBLIC_NAVER_MAP_CLIENT_ID",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_PROJECT_REF",
  "SUPABASE_DB_PASSWORD",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
  "LEAD_ENCRYPTION_KEY",
  "RESEND_API_KEY",
  "LEAD_NOTIFY_EMAIL",
  "META_CAPI_TOKEN",
  "GEMINI_API_KEY",
  "GCP_SA_KEY_PATH",
  "GA4_PROPERTY_ID",
  "GTM_ACCOUNT_ID",
  "GTM_CONTAINER_ID",
  "GTM_WORKSPACE_ID",
  "GSC_SITE_URL",
];

// 실제 형식을 흉내 낸 더미 서비스 계정(실키 아님)
const DUMMY_SA = JSON.stringify({
  type: "service_account",
  project_id: "realsurgery-ops",
  client_email: "tag-manager@realsurgery-ops.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC\n-----END PRIVATE KEY-----\n",
});

let tmp: string;

beforeEach(() => {
  for (const v of ALL_VARS) vi.stubEnv(v, "");
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "rs-env-"));
});

afterEach(() => {
  vi.unstubAllEnvs();
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe("hasPublicKey (브라우저 안전)", () => {
  it("키가 비어 있으면 false → mock 모드", () => {
    expect(hasPublicKey("SUPABASE")).toBe(false);
    expect(hasPublicKey("GTM")).toBe(false);
  });

  it("묶음의 모든 변수가 있어야 true", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abcd.supabase.co");
    expect(hasPublicKey("SUPABASE")).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key-value");
    expect(hasPublicKey("SUPABASE")).toBe(true);
  });

  it("공백만 있는 값은 빈 값으로 본다", () => {
    vi.stubEnv("NEXT_PUBLIC_GTM_ID", "   ");
    expect(hasPublicKey("GTM")).toBe(false);
    expect(readPublicVar("NEXT_PUBLIC_GTM_ID")).toBe("");
  });

  it("모든 공개 변수를 읽을 수 있다", () => {
    for (const v of ALL_VARS.filter((n) => n.startsWith("NEXT_PUBLIC_"))) {
      vi.stubEnv(v, `value-${v}`);
      expect(readPublicVar(v as Parameters<typeof readPublicVar>[0])).toBe(`value-${v}`);
    }
  });
});

describe("withBasePath / siteUrl", () => {
  it("basePath 를 앞에 붙인다", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/realsurgery");
    expect(withBasePath("/images/a.webp")).toBe("/realsurgery/images/a.webp");
    expect(withBasePath("images/a.webp")).toBe("/realsurgery/images/a.webp");
  });

  it("basePath 가 비어 있으면 루트 경로", () => {
    expect(withBasePath("/robots.txt")).toBe("/robots.txt");
  });

  it("사이트 URL 끝 슬래시를 제거하고, 없으면 localhost", () => {
    expect(siteUrl()).toBe("http://localhost:3000");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://jaehoonkor.github.io/realsurgery/");
    expect(siteUrl()).toBe("https://jaehoonkor.github.io/realsurgery");
  });
});

describe("hasKey (Node: 키 파일 존재까지 확인)", () => {
  it("서버 키도 값이 없으면 false 이고 빠진 변수명을 알려준다", () => {
    const r = checkKey("RESEND");
    expect(r.ok).toBe(false);
    expect(r.missing).toEqual(["RESEND_API_KEY", "LEAD_NOTIFY_EMAIL"]);
    vi.stubEnv("RESEND_API_KEY", "re_dummy");
    vi.stubEnv("LEAD_NOTIFY_EMAIL", "ops@example.com");
    expect(hasKey("RESEND")).toBe(true);
  });

  it("GCP: 경로 변수만 있고 파일이 없으면 false", () => {
    vi.stubEnv("GCP_SA_KEY_PATH", path.join(tmp, "gcp-sa.json"));
    const r = checkKey("GCP");
    expect(r.ok).toBe(false);
    expect(r.missing[0]).toMatch(/^GCP_SA_KEY_PATH: 파일 없음/);
  });

  it("GCP: 파일이 있어도 서비스 계정 JSON 형식이 아니면 false", () => {
    const p = path.join(tmp, "gcp-sa.json");
    fs.writeFileSync(p, "{not json", "utf8");
    vi.stubEnv("GCP_SA_KEY_PATH", p);
    expect(checkKey("GCP").missing[0]).toMatch(/형식 오류/);
    fs.writeFileSync(p, JSON.stringify({ type: "authorized_user" }), "utf8");
    expect(hasKey("GCP")).toBe(false);
  });

  it("GCP: 디렉터리를 가리키면 false", () => {
    vi.stubEnv("GCP_SA_KEY_PATH", tmp);
    expect(hasKey("GCP")).toBe(false);
  });

  it("GCP: 올바른 서비스 계정 파일이 있으면 true", () => {
    const p = path.join(tmp, "gcp-sa.json");
    fs.writeFileSync(p, DUMMY_SA, "utf8");
    vi.stubEnv("GCP_SA_KEY_PATH", p);
    expect(hasKey("GCP")).toBe(true);
  });

  it("GCP: 상대 경로는 저장소 루트(cwd) 기준으로 찾는다", () => {
    const p = path.join(tmp, "secrets", "gcp-sa.json");
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, DUMMY_SA, "utf8");
    const cwd = vi.spyOn(process, "cwd").mockReturnValue(tmp);
    vi.stubEnv("GCP_SA_KEY_PATH", "secrets/gcp-sa.json");
    expect(hasKey("GCP")).toBe(true);
    cwd.mockRestore();
  });

  it("GTM_API 는 GCP 키 파일까지 있어야 true", () => {
    vi.stubEnv("GTM_ACCOUNT_ID", "6012345678");
    vi.stubEnv("GTM_CONTAINER_ID", "198765432");
    vi.stubEnv("GTM_WORKSPACE_ID", "3");
    const r = checkKey("GTM_API");
    expect(r.ok).toBe(false);
    expect(r.missing).toEqual(["GCP → GCP_SA_KEY_PATH"]);

    const p = path.join(tmp, "gcp-sa.json");
    fs.writeFileSync(p, DUMMY_SA, "utf8");
    vi.stubEnv("GCP_SA_KEY_PATH", p);
    expect(hasKey("GTM_API")).toBe(true);
  });

  it("공개 키 묶음도 hasKey 로 확인할 수 있다", () => {
    expect(hasKey("SUPABASE")).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abcd.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key-value");
    expect(hasKey("SUPABASE")).toBe(true);
  });

  it("keyReport / mockModeKeys 는 모든 키를 다루고 값은 노출하지 않는다", () => {
    vi.stubEnv("GEMINI_API_KEY", "secret-gemini-value");
    const report = keyReport();
    expect(report.map((r) => r.name).sort()).toEqual(Object.keys(KEYS).sort());
    expect(JSON.stringify(report)).not.toContain("secret-gemini-value");
    const mock = mockModeKeys();
    expect(mock).not.toContain("GEMINI");
    expect(mock).toContain("SUPABASE");
    expect(mock).toContain("GCP");
  });
});
