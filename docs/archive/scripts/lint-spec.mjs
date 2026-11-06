// 정의서 형용사 린트: 숫자·예시 없이 형용사만 있는 규칙 행을 찾는다.
import fs from "node:fs";
const f = process.argv[2]; if (!f) { console.error("usage: node scripts/lint-spec.mjs docs/specs/<name>.md"); process.exit(1); }
const bad = /(적절|충분|깔끔|적당|자연스럽|보기 좋|세련|예쁘|괜찮|잘 보이|알맞|적정|원활)/;
const lines = fs.readFileSync(f, "utf8").split("\n");
let n = 0;
lines.forEach((l, i) => { if (l.startsWith("|") && bad.test(l) && !/\d/.test(l)) { n++; console.log(`${f}:${i + 1}: 형용사만 있는 규칙 → ${l.trim().slice(0, 80)}`); } });
const sections = [["목적"], ["원칙"], ["규칙", "목록", "정의"], ["접점"], ["검수 체크리스트", "체크리스트"], ["변경 이력"]].filter(alts => !lines.some(l => l.startsWith("#") && alts.some(a => l.includes(a)))).map(a => a[0]);
if (sections.length) { n++; console.log(`${f}: 누락 절 → ${sections.join(", ")}`); }
if (/\/(10-design|20-content|30-data|60-growth)\.md$/.test(f) && lines.length > 120 && !lines.some(x => /완본|full/i.test(x) && x.startsWith("#"))) { n++; console.log(`${f}: 1쪽 요약 정의서는 120줄 이하 (현재 ${lines.length})`); }
process.exit(n ? 1 : 0);
