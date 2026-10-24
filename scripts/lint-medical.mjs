// 시술 가이드 MDX 린트 CLI (pipelines/03-content ACT 6·VERIFY) — 프런트매터 스키마·본문 규칙·금칙어
// 사용: pnpm lint:medical                         content/procedures/*.mdx 전부
//       pnpm lint:medical double-eyelid           파일 1개(id 또는 경로)
// 같은 규칙을 build-data(pnpm build·dev)도 강제한다. 규칙 문서: docs/content/procedure-mdx.md
import fs from "node:fs";
import path from "node:path";
import { BANNED_WORDS } from "./build-data.mjs";
import { PROCEDURES_DIR, compileError, lintDocId, lintProcedureMdx, parseProcedureMdx, readProcedureDocs } from "./procedure-mdx.mjs";

/** 금칙어(효과 보장·순위·더미 표기 등) — build-data BANNED_WORDS 와 같은 목록 */
export function bannedWordsIn(source) {
  const lower = source.toLowerCase();
  return BANNED_WORDS.filter((w) => lower.includes(w.toLowerCase()));
}

export async function lintFiles(docs) {
  const problems = [];
  for (const doc of docs) {
    const at = path.relative(process.cwd(), doc.file).split(path.sep).join("/");
    const found = [...lintDocId(doc.id), ...lintProcedureMdx(doc.source), ...bannedWordsIn(doc.source).map((w) => `금칙어 "${w}"`)];
    if (!found.length) {
      const err = await compileError(parseProcedureMdx(doc.source).body);
      if (err) found.push(`MDX 컴파일 오류 — ${err}`);
    }
    for (const p of found) problems.push(`${at}: ${p}`);
  }
  return problems;
}

if (path.basename(process.argv[1] ?? "") === "lint-medical.mjs") {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  let docs = readProcedureDocs();
  if (args.length) {
    docs = args.map((a) => {
      const file = fs.existsSync(a) ? path.resolve(a) : path.join(PROCEDURES_DIR, `${a.replace(/\.mdx$/, "")}.mdx`);
      if (!fs.existsSync(file)) {
        console.error(`[lint-medical] 파일 없음: ${a}`);
        process.exit(1);
      }
      return { id: path.basename(file, ".mdx"), file, source: fs.readFileSync(file, "utf8") };
    });
  }
  const problems = await lintFiles(docs);
  if (problems.length) {
    console.error(`[lint-medical] 문제 ${problems.length}건\n${problems.join("\n")}`);
    process.exit(1);
  }
  console.log(`[lint-medical] OK — MDX ${docs.length}편 (프런트매터·H2 5개·직답·출처 각주·금칙어·컴파일)`);
}
