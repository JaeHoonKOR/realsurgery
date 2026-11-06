// 세션 시작 스크립트: 의존성 확인 → 개발 서버(이미 떠 있으면 재사용) → 스모크 1회.
// 사용: node harness/init.mjs          서버 준비 + 스모크, 성공하면 "OK <url>" 출력
//       node harness/init.mjs --stop   이 스크립트가 띄운 개발 서버 종료
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PID_FILE = path.join(ROOT, "harness", ".dev.pid");
const LOG_FILE = path.join(ROOT, "harness", "dev.log");
const PORT = 3000;
const READY_TIMEOUT_MS = 180_000;

function readBasePath() {
  for (const name of [".env.local", ".env.example"]) {
    const p = path.join(ROOT, name);
    if (!fs.existsSync(p)) continue;
    const m = fs.readFileSync(p, "utf8").match(/^NEXT_PUBLIC_BASE_PATH=(.*)$/m);
    if (m) {
      const v = m[1].trim().replace(/\/+$/, "");
      return v && !v.startsWith("/") ? `/${v}` : v;
    }
  }
  return "";
}

async function isUp(url) {
  try {
    const res = await fetch(url, { redirect: "manual" });
    return res.status < 500;
  } catch {
    return false;
  }
}

function stop() {
  if (!fs.existsSync(PID_FILE)) {
    console.log("이 스크립트가 띄운 개발 서버가 없습니다.");
    return;
  }
  const pid = Number(fs.readFileSync(PID_FILE, "utf8"));
  if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(pid), "/T", "/F"], { stdio: "ignore" });
  else {
    try {
      process.kill(-pid);
    } catch {}
  }
  fs.rmSync(PID_FILE, { force: true });
  console.log(`개발 서버 종료 (pid ${pid})`);
}

async function main() {
  if (process.argv.includes("--stop")) return stop();

  if (!fs.existsSync(path.join(ROOT, "node_modules"))) {
    console.log("node_modules 없음 → pnpm install");
    const r = spawnSync("pnpm install --frozen-lockfile", { cwd: ROOT, shell: true, stdio: "inherit" });
    if (r.status !== 0) throw new Error("pnpm install 실패");
  }

  const url = `http://localhost:${PORT}${readBasePath()}/`;
  if (!(await isUp(url))) {
    const log = fs.openSync(LOG_FILE, "w");
    const child = spawn("pnpm dev", { cwd: ROOT, shell: true, detached: true, stdio: ["ignore", log, log] });
    child.unref();
    fs.writeFileSync(PID_FILE, String(child.pid), "utf8");
    process.stdout.write(`개발 서버 시작 (pid ${child.pid}, 로그 harness/dev.log) `);
    const start = Date.now();
    while (!(await isUp(url))) {
      if (Date.now() - start > READY_TIMEOUT_MS) {
        const tail = fs.readFileSync(LOG_FILE, "utf8").split("\n").slice(-30).join("\n");
        throw new Error(`개발 서버가 ${READY_TIMEOUT_MS / 1000}초 안에 뜨지 않았습니다.\n${tail}`);
      }
      process.stdout.write(".");
      await new Promise((r) => setTimeout(r, 2000));
    }
    process.stdout.write("\n");
  }

  // 스모크: 첫 화면이 200이고 h1이 있다
  const res = await fetch(url);
  const html = await res.text();
  if (res.status !== 200) throw new Error(`스모크 실패: ${url} → HTTP ${res.status}`);
  if (!/<h1[\s>]/.test(html)) throw new Error(`스모크 실패: ${url} 에 <h1> 이 없습니다`);
  console.log(`OK ${url}`);
}

main().catch((e) => {
  console.error(`INIT FAILED: ${e.message}`);
  process.exit(1);
});
