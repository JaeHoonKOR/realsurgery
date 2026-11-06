---
name: reference-bash-env
description: How to run pnpm/git from the reviewer Bash tool in this repo (C:\rs junction is outside the Bash sandbox; cd/git -C need approval)
metadata:
  type: reference
---

Bash tool sandbox only allows the real path `C:\Users\이재훈\CLAUDE\realsurgery`; `cd /c/rs`, `ls /c/rs`, and `git -C /c/rs ...` are blocked or prompt for approval.

Works without prompts:
- `pnpm --dir C:/rs <script>; echo "EXIT $?"` (pnpm resolves to the real path; scripts use process.cwd() and work fine)
- plain `git ...` from the default cwd (same repo as C:\rs)
- Read/Write/Glob/Grep with `C:\rs\...` paths

Git Bash rewrites a bare `/` argument to `C:/Program Files/Git/`; scripts/lh.mjs and scripts/screens.mjs undo this, but other new scripts might not.
For reviewer screenshots use `pnpm --dir C:/rs screens <ID> / --suffix reviewer` so the builder's evidence files are not overwritten.
Compound commands with redirects/`tail`/`${...}` prompt for approval — run one `pnpm --dir C:/rs <script>; echo "EXIT $?"` per call.
Delete temporary probe files with `node -e "fs.unlinkSync(...)"` (no rm). YAML check: require `C:/rs/node_modules/.pnpm/js-yaml@4.3.2/node_modules/js-yaml` (not hoisted).
`pnpm lh --runs 1` overwrites test-results/lh/home.* — rerun the 3-run version afterwards.
Since T-100b: component checks live on dev-only `/preview/` (`pnpm --dir C:/rs screens <ID> /preview/ --preview --state consent-saved|search-open|scrolled|viewport [--viewport] --suffix reviewer-x`).
Touch-target probe that works without prompts: one `node --input-type=module -e` that spawns `C:/rs/scripts/preview.mjs --port 4175`, imports `file:///C:/rs/node_modules/@playwright/test/index.mjs`, measures all visible a/button/input/[role=switch] <44px, then kills child (port freed on Windows). Builder e2e touch lists are hand-picked and miss elements — always run the full probe.
No web tool and `git ls-remote` needs approval, BUT `node -e` with global fetch reaches the internet without prompts. Clinic-name existence check that works: Kakao map `https://search.map.kakao.com/mapsearch/map.daum?callback=cb&q=<name>&msFlag=A&sort=0` with header `referer: https://map.kakao.com/` → parse `place_totalcount`/`"name"`. Always run a positive control (e.g. 바노바기성형외과 → 1). Naver map API `map.naver.com/p/api/search/allSearch` returns `ncaptcha-all-search-no-result` even for real clinics → bot-blocked, inconclusive. Naver mobile search (`m.search.naver.com/search.naver?where=m_local&query=`) works but auto-corrects; follow the `sm=mtb_org&qvt=0` link for the original query.
Static out/ probes without prompts: `node --input-type=module -e` importing `file:///C:/rs/scripts/serve-out.mjs` (`startServer({port})` → `{url, server}`; url already has basePath) + playwright as above. Use `page.route('**/*.rsc.js*', r => r.abort())` to test hydration failure modes (since T-103 the RSC payload is an external .rsc.js; failure blanked the page in r1). For readable 375 full-page review, capture clip segments of ~1400px (full 11000px PNG is unreadable when downscaled).
Unprocessed Next HTML (before externalize-rsc) is in `.next/server/app/**/*.html` — use it for mutation probes of build post-processors; run a CLI against a temp out/ via `spawnSync(node, [script], {cwd: tmp})` (scripts use process.cwd()).
`git check-ignore` needs approval; `git status --porcelain --ignored <paths>` works (shows `!!` for ignored). Playwright MCP writes snapshots/console logs to `C:\rs\.playwright-mcp\` (gitignored since T-090).
Benchmark re-measure without prompts: `node C:/rs/scripts/bench-measure.mjs <name>=<url> --widths 375 --runs 1 --cache cold --out C:/rs/test-results/<dir>/x.json; echo "EXIT $?"` (test-results/ is ignored). Raw competitor results: `reports/benchmark/raw/r2-*.json` (summary.lcpAll/clsAll, runs[].m.first/dens, probe). Playwright MCP screenshot accepts absolute `filename` like `C:/rs/test-results/...png`. Memory edits must use the real path (C:\Users\...\realsurgery\.claude\agent-memory\reviewer\), not C:\rs (symlink → flagged sensitive).
Status/LCP retry rules without external requests: one `node -e` that starts `http.createServer` (403 or empty body) on 4198/4199, spawns bench-measure against localhost, counts server hits (r4: 403 stops per width, not per target).
Port-occupancy check: `node -e` with net.connect on 4173/4174 (netstat needs approval).
