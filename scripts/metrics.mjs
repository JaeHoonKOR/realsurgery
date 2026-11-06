// 이용자 수·공유 지표 (GA4 Data API, 서비스 계정). /report가 하루 끝에 실행한다.
// 지표: 최근 7일 vs 그 전 7일의 활성 사용자·신규 사용자·세션, 공유 유입 세션(sessionMedium = share), share 이벤트 수.
// 키(GA4_PROPERTY_ID + GCP_SA_KEY_PATH, lib/env.ts 의 GA4_API)가 없으면 호출하지 않고 needs-key 를 출력한다(mock 모드).
// 사용: node scripts/metrics.mjs [--json]
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function loadEnv() {
  const env = { ...process.env };
  const file = path.join(ROOT, ".env.local");
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !env[m[1]]) env[m[1]] = m[2].trim();
    }
  }
  return env;
}

function readServiceAccount(keyPath) {
  if (!keyPath) return null;
  const abs = path.isAbsolute(keyPath) ? keyPath : path.join(ROOT, keyPath);
  if (!fs.existsSync(abs)) return null;
  try {
    const json = JSON.parse(fs.readFileSync(abs, "utf8"));
    return json.type === "service_account" && json.client_email && json.private_key ? json : null;
  } catch {
    return null;
  }
}

const b64url = (v) => Buffer.from(typeof v === "string" ? v : JSON.stringify(v)).toString("base64url");

async function accessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${b64url({ alg: "RS256", typ: "JWT" })}.${b64url(claims)}`;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(unsigned), sa.private_key).toString("base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${signature}` }),
  });
  if (!res.ok) throw new Error(`토큰 발급 실패: HTTP ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

async function runReport(token, propertyId, body) {
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`runReport 실패: HTTP ${res.status} ${await res.text()}`);
  return res.json();
}

const RANGES = [
  { name: "this_week", startDate: "7daysAgo", endDate: "yesterday" },
  { name: "last_week", startDate: "14daysAgo", endDate: "8daysAgo" },
];

/** runReport 응답에서 날짜 범위별 metric 값을 꺼낸다. 행이 없으면 0. */
export function byRange(report, metricIndex) {
  const out = { this_week: 0, last_week: 0 };
  for (const row of report.rows ?? []) {
    const range = row.dimensionValues?.find((d) => d.value in out)?.value;
    if (range) out[range] = Number(row.metricValues?.[metricIndex]?.value ?? 0);
  }
  return out;
}

async function collect(env, sa) {
  const token = await accessToken(sa);
  const id = env.GA4_PROPERTY_ID;
  const users = await runReport(token, id, {
    dateRanges: RANGES,
    metrics: [{ name: "activeUsers" }, { name: "newUsers" }, { name: "sessions" }],
  });
  const shareSessions = await runReport(token, id, {
    dateRanges: RANGES,
    metrics: [{ name: "sessions" }],
    dimensionFilter: { filter: { fieldName: "sessionMedium", stringFilter: { value: "share" } } },
  });
  const shareEvents = await runReport(token, id, {
    dateRanges: RANGES,
    metrics: [{ name: "eventCount" }],
    dimensionFilter: { filter: { fieldName: "eventName", stringFilter: { value: "share" } } },
  });
  return {
    status: "ok",
    activeUsers: byRange(users, 0),
    newUsers: byRange(users, 1),
    sessions: byRange(users, 2),
    shareSessions: byRange(shareSessions, 0),
    shareEvents: byRange(shareEvents, 0),
  };
}

function print(result) {
  if (result.status !== "ok") {
    console.log(`이용자 지표: needs-key — ${result.missing.join(", ")} 필요 (docs/product/DECISIONS.md D-3)`);
    return;
  }
  const row = (label, v) => {
    const diff = v.last_week ? `${Math.round(((v.this_week - v.last_week) / v.last_week) * 100)}%` : "—";
    console.log(`${label.padEnd(12)} ${String(v.this_week).padStart(7)}  (지난주 ${v.last_week}, ${diff})`);
  };
  console.log("이용자 지표 (최근 7일)");
  row("활성 사용자", result.activeUsers);
  row("신규 사용자", result.newUsers);
  row("세션", result.sessions);
  row("공유 유입", result.shareSessions);
  row("공유 이벤트", result.shareEvents);
}

async function main() {
  const env = loadEnv();
  const sa = readServiceAccount(env.GCP_SA_KEY_PATH);
  const missing = [!env.GA4_PROPERTY_ID && "GA4_PROPERTY_ID", !sa && "GCP_SA_KEY_PATH(서비스 계정 JSON)"].filter(Boolean);
  const result = missing.length ? { status: "needs-key", missing } : await collect(env, sa);
  if (process.argv.includes("--json")) console.log(JSON.stringify(result, null, 2));
  else print(result);
}

if (path.basename(process.argv[1] ?? "") === "metrics.mjs") {
  main().catch((e) => {
    console.error(`METRICS FAILED: ${e.message}`);
    process.exit(1);
  });
}
