// PreToolUse guard: this agent may only touch the realsurgery repo and the C:\rs working tree.
// Exit 2 + stderr = block. Exit 0 = let normal permission flow decide.
import fs from "node:fs";

const REPO = "JaeHoonKOR/realsurgery";
const ROOTS = ["c:\\rs", "c:/rs", "/c/rs", "c:\\users\\이재훈\\claude\\realsurgery", "c:/users/이재훈/claude/realsurgery", "/c/users/이재훈/claude/realsurgery"];
const SAFE_PREFIX = ["c:\\users\\이재훈\\appdata", "c:/users/이재훈/appdata", "/c/users/이재훈/appdata", "/tmp", "c:\\windows\\temp", "c:/windows/temp"];

let input = "";
try { input = fs.readFileSync(0, "utf8"); } catch { process.exit(0); }
let cmd = "";
try { cmd = JSON.parse(input)?.tool_input?.command ?? ""; } catch { process.exit(0); }
const c = cmd.toLowerCase();

function block(reason) { process.stderr.write(`GUARD BLOCKED: ${reason}\n`); process.exit(2); }
function underAllowed(p) {
  const q = p.toLowerCase().replace(/"/g, "");
  return ROOTS.some(r => q.startsWith(r)) || SAFE_PREFIX.some(r => q.startsWith(r));
}

// 1. gh: any repo reference must be ours
for (const m of c.matchAll(/(?:-r\s+|--repo[= ]|repos\/)([a-z0-9_.-]+\/[a-z0-9_.-]+)/g)) {
  if (m[1] !== REPO.toLowerCase()) block(`gh command targets another repo: ${m[1]}`);
}
if (/\bgh\s+repo\s+(create|clone|delete|fork|rename|archive|edit)\b/.test(c) && !c.includes(REPO.toLowerCase()))
  block("gh repo mutation on a repo other than " + REPO);
if (/\bgh\s+(gist|secret\s+set\s+--org|org|codespace)\b/.test(c)) block("gh gist/org/codespace not allowed");

// 2. git: no clones, no remote changes to other repos, no global config, no -C outside tree
if (/\bgit\s+clone\b/.test(c)) block("git clone not allowed");
if (/\bgit\s+remote\s+(add|set-url)\b/.test(c) && !c.includes("jaehoonkor/realsurgery")) block("git remote must point to " + REPO);
if (/\bgit\s+config\b.*--global/.test(c) || /\bgit\s+config\b.*--system/.test(c)) block("global git config not allowed");
for (const m of c.matchAll(/\bgit\s+-c\s+("[^"]+"|\S+)/g)) { if (!underAllowed(m[1])) block(`git -C outside working tree: ${m[1]}`); }
if (/\bgit\s+push\b/.test(c) && /\bgit\s+push\s+(https?:|git@)/.test(c) && !c.includes("jaehoonkor/realsurgery")) block("git push to a foreign URL");

// 3. filesystem: cd / absolute paths outside allowed roots (Windows + Git Bash spellings)
for (const m of c.matchAll(/\bcd\s+(?:\/d\s+)?("[^"]+"|\S+)/g)) {
  const p = m[1];
  if (/^([a-z]:|\/[a-z]\/|\/)/.test(p.replace(/"/g, "")) && !underAllowed(p)) block(`cd outside working tree: ${p}`);
}
for (const m of c.matchAll(/(?:^|[\s"'=])((?:[a-z]:[\\/]|\/[a-z]\/)[^\s"'&|;>]*)/g)) {
  const p = m[1];
  if (!underAllowed(p) && /\b(rm|mv|cp|del|rmdir|touch|mkdir|>|>>|tee|out-file|set-content|remove-item|copy-item|move-item)\b/.test(c))
    block(`write/delete outside working tree: ${p}`);
}
if (/\.\.[\\/]\.\.[\\/]/.test(c)) block("path climbs above working tree");

// 4. misc hard stops
if (/\b(winget|choco|scoop)\s+(install|uninstall|upgrade)\b/.test(c)) block("package manager install not allowed (ask human)");
if (/\bnpm\s+(i|install|add)\s+-g\b|\bnpm\s+(i|install|add)\s+--global\b/.test(c)) block("global npm install not allowed (ask human)");
if (/\b(reg|regedit|schtasks|sc|net\s+user|bcdedit)\b/.test(c)) block("system configuration command not allowed");

process.exit(0);
