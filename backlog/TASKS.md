# TASKS

상태: todo / doing / review / done / blocked / needs-approval / needs-key / spec-question
`[human-gate]` 제목 태그 = 리뷰 통과 후에도 사람이 done으로 바꿈
형식: `- [status] T-### | lane | 우선순위 | 제목 | 선행 | 비고`

## 사람 확인 필요
- [needs-approval] T-001 | human | P0 | 계정·키 1회 세션 (아래 체크리스트) | — | 완료 전까지 에이전트는 mock 모드
- [todo] T-000 | human | P0 | 도메인 구매 **승인됨** → 구매 후 SETUP-HUMAN 세션 3-4 (DNS·Pages Custom domain) → `.env.local`·GitHub Variables의 `NEXT_PUBLIC_BASE_PATH`를 빈값, `NEXT_PUBLIC_SITE_URL`을 도메인으로 | — | 도메인 연결 전까지는 /realsurgery 하위 경로로 배포
- [spec-question] T-002 | human | P1 | 첫 카테고리 "눈" 확정 여부 | — | 기본값 눈으로 진행 중
- [spec-question] T-003 | human | P1 | GNB 목록 페이지 경로 미정의(스펙엔 `/prices/{procedure}`, `/blog/{slug}`만) | — | T-100b builder 제기. 현재 미구현 링크는 숨김
- [spec-question] T-004 | human | P1 | 푸터 사업자 정보·상담(운영) 시간 입력 필요 | — | 현재 "사업자 등록 절차를 마친 뒤 이곳에 게시합니다." 표시
- [spec-question] T-005 | human | P2 | 스펙 외 DB 컬럼 추가 추인: `price_note`, `sources`, `specialties`, `is_demo`, `authors` 테이블 | — | reviewer는 스펙 충돌 없음으로 승인
- [spec-question] T-006 | human | P1 | P-03 하단 바 전화·카톡 대상 미정의 | — | 현재 상담 버튼만
- [todo] T-008 | human | P2 | 가상 병원명 3곳(단하늘성형외과·하결성형외과·새솔결의원) 네이버 지도 앱에서 1회 검색해 실존 여부 확인 | — | 카카오맵·네이버 검색 0건. 네이버 지도만 자동 조회 차단으로 미확인. 머지 차단 아님
- [spec-question] T-007 | human | P1 | 동의 철회 진입점 미정의 | — | 개인정보·Consent Mode 관련
- [spec-question] T-009 | human | P1 | P-03 "작성자(의료 자문 포함)" — 의료 자문의 미정(9절 미결정) | — | T-103 builder 제기. 현재 "자문의 검토 전" 표시, 이름 생성 안 함, JSON-LD reviewedBy 없음. 정해지면 authors 에 추가 후 MDX `medical_reviewer`
- [spec-question] T-010 | human | P2 | P-03 "관련 시술·칼럼 카드 4개" — posts↔procedures 연결 데이터(컬럼) 없음 | — | T-103 builder 제기. 현재 시술 카드 4개(같은 부위 조회수 순). P-10(T-1xx) 때 연결 방식 결정 필요
- [spec-question] T-012 | human | P1 | 자문의 검토·출처 검증 전 시술 가이드(P-03)를 공개 URL에 배포할지 여부 | — | T-103 reviewer 제기. 결정 전까지 기본값: 반려 ③ 수정(검증 전 표시) 후 배포
- [spec-question] T-011 | human | P2 | pipelines/03 의 `content/procedures/<slug>.mdx`·`scripts/seed-procedure.ts` vs CLAUDE.md ASCII 파일명 규칙 | — | T-103 builder 제기. `<id>.mdx`(예: double-eyelid.mdx) + `pnpm data:sql`(seed.sql upsert)로 진행, 문서 `docs/content/procedure-mdx.md`. pipelines/03 문구 갱신 여부 결정
- [spec-question] T-013 | human | P1 | P-03 요약 박스 "회복기간"의 정의(일상생활 복귀 / 붓기 / 운동 제한) 고정 여부 + 출처 범위값("7~10일", "2~3시간") 표시용 procedures 최소·최대 컬럼 추가 여부 | — | T-103 reviewer r3 제기. 결정 전 기본값: 회복기간 = 일상 복귀, 범위는 상한 정수 1개
 (순서대로, 약 60분)
- [x] GitHub 저장소·Pages: 완료 (JaeHoonKOR/realsurgery)
- [x] **GitHub 토큰 쓰기 권한**: 2026-10-25 `git push origin main` 성공 확인(이전엔 403). `gh auth login -h github.com -w` → 브라우저 로그인(repo·workflow 권한) → `git -C C:\rs push --dry-run origin main` 으로 확인
- [ ] Supabase: 프로젝트 생성(DB 비밀번호 저장) → `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` / `supabase login`
- [ ] Google: GA4 속성 생성(측정ID `G-…`) + GTM 컨테이너 생성(`GTM-…`)
- [ ] GCP: 프로젝트 1개 → **API 활성화: Tag Manager API, Google Analytics Data API, Google Analytics Admin API** → 서비스 계정 1개 생성 → JSON 키를 `secrets/gcp-sa.json`에 저장 → 서비스계정 이메일을 GTM 컨테이너 "게시" 권한, GA4 속성 "편집자"로 추가
- [ ] 메타: 비즈니스 계정 → 픽셀 생성(`META_PIXEL_ID`) → CAPI 액세스 토큰(`META_CAPI_TOKEN`) → 테스트 이벤트 코드(`META_TEST_EVENT_CODE`)
- [ ] Resend: 계정 생성 → `RESEND_API_KEY`, `LEAD_NOTIFY_EMAIL` = **Resend 가입에 쓴 이메일**(도메인 인증 전엔 그 주소로만 발송됨)
- [ ] (선택) 쿠팡 파트너스 가입 → 시술별 회복기 추천템 최대 3개 트래킹 링크를 `data/seed/affiliate_items.json`(id·procedure_id·name·url·order)에 — 없으면 P-03 추천템 영역 숨김(T-103 needs-key)
- [ ] (선택) 네이버 클라우드 지도 API 키 — 없으면 "네이버 지도에서 보기" 링크로 폴백

### T-001b (첫 배포 후, 10분)
- [ ] 구글 서치콘솔: URL 접두어 속성으로 배포 URL 등록(HTML 태그 → `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`), 설정 › 사용자에 서비스계정 이메일 추가(순위 추적 API용), `GSC_SITE_URL`
- [ ] (도메인 있을 때만) 네이버 서치어드바이저·애널리틱스 등록 → 인증 메타태그 값 2개 → `.env.local` → 다음 `/loop`가 재배포

## build
- [done] T-099 | build | P0 | 권한 부트스트랩 — setup2.ps1로 완료 (git·node·pnpm·claude·gh OK, supabase는 npx 대체) | — | 2026-10-24
- [done] T-100 | build | P0 | 스캐폴드 1/2: Next.js 15 `output: export` + `basePath`/`.nojekyll`, Tailwind + `styles/tokens.css` 디자인 토큰, Pretendard 서브셋, lib/env.ts mock 가드(키 **파일 존재까지** 확인), lib/track.ts, 품질 스크립트 `pnpm lh`/`test`/`test:a11y`/`test:e2e` 동작, 빈 홈 1페이지가 Lighthouse 90/95/95/100 통과. 끝에 `git push origin main` 시도 — 403이면 needs-key(토큰 권한)로 기록하고 계속 | T-099 | 저장소·Pages는 이미 존재. **반려 1회(2026-10-25, reviewer)**: 브랜치 `feat/T-100-scaffold`@6a14f04 기준 게이트 7종 재실행 전부 통과(LH 99/100/100/100). 사유 ① `scripts/check-tokens.mjs:35` 앵커 예외가 a–f로만 된 hex 색(`"#fff"`, `"#ffffff"`, `'#abc'`)을 통과시킴 → `href`/`id`/`to` 속성 뒤 `#`만 예외로, 놓친 케이스·`href="#main"` 회귀 테스트 추가. 권고(반려 아님): 인라인 숫자 style 미검사, workflow `pages`/`id-token` 권한을 deploy job으로 이동, `styles/fonts.css:14` 주석의 테스트명 불일치. 상세 `backlog/log/2026-10-25-reviewer-T-100.md`. **재작업 05a09fd → reviewer APPROVE(r2, LH 99/100/100/100, test 64/64) → main 머지 e11d20d → push 성공 → Pages Actions run 40107146392 통과, https://jaehoonkor.github.io/realsurgery/ 200 (2026-10-25)**. 상세 `backlog/log/2026-10-25-reviewer-T-100-r2.md`
- [todo] T-112 | build | P0 | 에셋 파이프라인: `scripts/gen-image.mjs`(Gemini → WebP), `scripts/og.mjs`, 로고 워드마크 3안, 시술 10개 썸네일·히어로 생성 (docs/IMAGES.md) | T-100b | **P-03·P-01·P-05보다 먼저**. 키 있음 → 즉시 생성. 산출물: 로고 SVG 3안, 시술 10개 히어로+썸네일, 부위 아이콘 6개, 플레이스홀더 SVG 세트, `components/diagrams/` 기본 2종(시술 위치·회복 타임라인) 템플릿, `components/charts/` 막대 바 1종
- [todo] T-100c | build | P0 | fix: 공통 컴포넌트 비주얼 보강 — 워드마크 SVG 로고 3안 중 1안 적용, 헤더·푸터·CTA 블록·동의 배너에 아이콘, 빈 상태 일러스트, 섹션 리듬(QUALITY 3-1) | T-112 | QUALITY 3-1 신설로 재작업
- [done] T-100b | build | P0 | 스캐폴드 2/2: 3절 공통 컴포넌트(헤더·하단바·푸터·CTA 블록·동의 배너·스켈레톤), 실서비스형 더미 데이터(시술 10·병원 3·칼럼 3, 병원명은 가상) 시드 + 빌드 시 JSON 생성 | T-100 | 3절 공통 요소. T-100 리뷰 후속 4건은 16b49c0에서 처리·검증됨. **반려 1회(2026-10-25, reviewer)**: 브랜치 `feat/T-100b-common-components`@16b49c0, 게이트 7종 전부 통과(test 205/205, a11y 8/8, e2e 45+5skip, LH 99/100/100/100). 사유 ① `components/common/Breadcrumb.tsx:37` 링크에 최소 너비 없음 → "홈" 12×44px(375px), QUALITY 3절 44px 위반 → `min-w-11 justify-center` 등 + `tests/e2e/common.preview.spec.ts:304-322` 터치 타깃 테스트를 보이는 모든 인터랙티브 요소(브레드크럼·CTA·푸터 링크·검색 옵션)로 확대. **머지 전 확인**: workflow 액션 태그 존재(pnpm/action-setup@v5, configure-pages@v6, upload-pages-artifact@v5 `include-hidden-files`, deploy-pages@v5), 가상 병원명 3곳(단하늘성형외과·하결성형외과·새솔결의원) 실존 여부 1회 재검색. 가정 승인: built-routes로 미구현 화면 링크 숨김, `/preview/`는 RS_PREVIEW=1 전용, 스펙 외 DB 컬럼. 권고: 동의 배너(z50)가 하단바(z40) 가림, 푸터 "상담 연락 시간"→스펙 "운영 시간"(T-111), tsconfig `.next-preview` include/exclude 중복, 마이그레이션 `create policy` 재실행 불가, T-109에 "db push 후 SUPABASE env 설정" 순서 명시. 상세 `backlog/log/2026-10-25-reviewer-T-100b.md`. **재작업 39a4ad0(브레드크럼·배너 링크 44px, 터치 타깃 테스트 전 인터랙티브 요소로 확대, 배너를 하단바 위로, tsconfig 정리, policy drop-if-exists) → reviewer APPROVE(r2, test 205/205, a11y 8/8, e2e 47+7skip, LH 99/100/100/100) → main 머지 54babba → pnpm build 통과 → push 성공 → Pages Actions run 40113495392 통과, 배포 URL 200 (2026-10-25)**. 액션 태그 4종 존재 확인. 가상 병원명: 카카오맵·네이버 검색 0건, 네이버 지도는 자동 조회 차단으로 미확인(사람 1회 확인 권장). r2 권고: 소형·가로 화면에서 첫 방문 배너+하단바가 화면 67~89% 차지 → 접이식 배너 검토(T-103/104/106), 하단바 높이 72px가 3곳 하드매칭 → CSS 변수화(T-111), 푸터 "운영 시간"(T-111). 상세 `backlog/log/2026-10-25-reviewer-T-100b-r2.md`
- [todo] T-101 | build | P0 | P-06 상담 폼 ("시술 상담 가이드 받기") → Edge Function `submit-lead` 호출. 브라우저 직접 insert 금지 | T-100b, T-109 | 8절 폴백
- [todo] T-102 | build | P0 | P-07 완료 페이지 (sessionStorage 플래그) | T-101 |
- [todo] T-103 | build | P0 | P-03 시술 상세 가이드 (MDX 템플릿 포함) — **QUALITY 3-1 비주얼 필수 요건 적용**: 히어로 일러스트, 요약 박스 아이콘, 시술 위치·회복 타임라인 다이어그램, 가격 비교 막대 차트, 썸네일 카드 | T-112, T-100c | **반려 3회(2026-10-25, reviewer r3)**: 재작업 a71b167·ba7a9c3. 게이트 전부 재실행 통과(test 327/327, a11y 19+1skip, e2e 92+20skip, LH 쌍꺼풀 99/100/100/100 LCP 1,948ms·가슴 LCP 1,965ms·홈 LCP 1,953ms, verify:sources 20/20). r2 ②는 해결, ①은 10편 중 9편 해결. 사유 ① `breast-augmentation.mdx:11` `recovery_days: 21` — 근거로 든 서울대병원 문장의 "2~3주"는 과격한 운동 제한 기간이지 회복기간이 아니며(서울아산병원은 격렬한 운동 1개월), check-triple은 "생활" 키워드 오탐으로 통과 → `unverified_facts`에 recovery 추가 + MD-REVIEW 또는 회복기간 정의에 맞는 출처 값으로 교체. b) 회복기간 정의("일상 복귀"로 가정, T-013)를 `docs/content/procedure-mdx.md`에 명시하고 `ptosis-correction.mdx:11`(붓기 1~2주를 회복기간으로 사용) 재판정. 승인: `unverified_facts` 필드, JSON-LD "[출처 검증 전]", 범위 상한 가정(정의 보완 조건). 권고: R1 회복기간 판정에서 운동·붓기·멍·흉 절 제외 + 광대 4주·가슴 3주/1개월 회귀 테스트(키워드 오탐 실증됨), R2 `data/seed/clinics.json` 소요시간(사각턱 150분 등)을 박스와 맞추기(P-05 전), R3 인용 출처끼리 값이 다를 때 규칙 문서화(가슴 소요시간 2h vs 2~3h, 눈밑지방 회복 1주 vs 10일), R4 JSON-LD·meta description 가격 문장에 "검증 전" 단서, R5 콘텐츠 작업마다 LH 재측정(LCP 여유 35~52ms), R6 `thread-lift.mdx:60` "붓기와 당김이 며칠" 무출처. 상세 `backlog/log/2026-10-25-reviewer-T-103-r3.md`. **이전 반려 2회(2026-10-25, reviewer r2)**: 재작업 46630ed·cc9b59d·ec4a55f. 게이트 전부 재실행 통과(test 298/298, a11y 19, e2e 92+20skip, LH 쌍꺼풀 99/100/100/100 LCP 1,949ms·가슴 LCP 1,966ms·홈 LCP 1,950ms). r1 ①②는 해결됐고 ③은 각주·가격만 해결. 사유 ① 요약 박스 값(JSON-LD에도 쓰임)이 같은 페이지 본문·FAQ·출처와 모순되거나 출처 없이 사실처럼 표시됨: `square-jaw-reduction.mdx:10-11`(2시간 30분·4주 vs 본문/FAQ/표 약 1시간·7~10일), `zygoma-reduction.mdx:10`(2시간 vs FAQ·서울대병원 약 4시간), `ptosis-correction.mdx:10,12`(90분·국소+수면 vs 서울아산병원 약 2시간·국소 또는 전신), `laser-toning.mdx:11`·`thread-lift.mdx:10-12`·`epicanthoplasty.mdx:11` 회복 값 출처 없음, `GuideMeta.tsx:34` "가격만 검증 전" 문구가 사실과 다름 → 본문·출처와 맞추거나 "검증 전" 표시. `check-triple.mjs:38-45`가 박스 값을 본문·FAQ와 대조하도록 검사 확대 ② `test-results/verify-sources.mjs`가 gitignore 대상이라 저장소에 없음 → `scripts/`로 옮기고 package 스크립트로 등록, `test-results/`에 남은 임시 스크립트 7개 정리. 권고: R1 Next 버전 고정 또는 `__next_s` 빌드 검사, R2 payload가 끝내 실패하면 동의 배너 숨김, R3 T-200 때 GTM을 hydration 실패 상황과 함께 테스트, R4 lint는 사이트 루트만 거름(목록 페이지는 통과) → `docs/content/procedure-mdx.md`에 명시, R5 실리프팅 공개 여부는 T-012와 함께 결정. 상세 `backlog/log/2026-10-25-reviewer-T-103-r2.md`. **이전 반려 1회(2026-10-25, reviewer)**: 게이트 전부 재실행 통과(test 288/288, a11y 19+1skip, e2e 86+20skip, LH 99/100/100/100 LCP 1,964ms). 사유 ① `scripts/externalize-rsc.mjs:38-39` 외부 `.rsc.js` 로드 실패(abort·404) 시 페이지 전체 공백(H1·본문 없음) → 실패해도 정적 HTML이 보이게 + abort/404 e2e 추가. 불가하면 외부화 제거 후 spec-question(스펙 LCP 2.5s vs QUALITY 2.0s) ② `externalize-rsc.mjs:33,60-73` Next 출력 변경 시 0건 매치·부분 매치가 빌드를 조용히 통과 → 처리 후 HTML에 `self.__next_f` 잔존 0 검사, App Router 페이지 0매치면 실패 + 단위 테스트 2건 ③ MDX 각주가 문장을 뒷받침하지 않음(출처 7개 모두 기관 홈/목록 페이지): 10편 가격 문장(~45행, double-eyelid 47행)·`_template.mdx:48`이 학회·의협·심평원에 시드 가격을 귀속, 조언 문장 무관 각주(`thread-lift.mdx:86`, `double-eyelid.mdx:54,89`, `laser-toning.mdx:52`) → 문장별 근거 페이지로 링크하거나 각주 제거 + 실제 근거(검증 전 예시 데이터) 명시 + `MD-REVIEW` 표시. 섹션별 각주 규칙을 못 지키면 lint 완화 말고 spec-question. 승인 사항: 접이식 동의 배너, T-009~T-011 처리. 상세 `backlog/log/2026-10-25-reviewer-T-103.md`. 이전 작업: `feat/T-103-procedure-guide`@88145a2 (builder, 2026-10-25). 시술 10쪽 정적 생성, MDX 원본 `content/procedures/<id>.mdx` + 템플릿·스키마 문서 `docs/content/procedure-mdx.md`, content lane 도구 `pnpm lint:medical`·`validate-jsonld`·`check-triple`(build 자동). 게이트: lint 0/0·check-tokens 0, typecheck 0, test 288/288(lib 커버리지 99.6%), build OK(First Load 109kB), a11y 19+1skip, e2e 86+20skip, LH 쌍꺼풀 99/100/100/100 LCP 1,966ms·가슴 99/100/100/100 LCP 1,965ms·홈 98/100/100/100 LCP 1,971ms. LCP 2.12s 초과 원인(문서 gzip 14KB 초과로 TCP 한 왕복 지연)을 인라인 RSC 페이로드 외부화(`scripts/externalize-rsc.mjs`)로 해결 — 리뷰 시 확인 요청. 동의 배너 접기(세로 720px 이하) → 배너+하단바 320×568 48%·667×375 50%·375×667 36%. 배너 파싱 중 CLS 수정. needs-key: 쿠팡 파트너스(추천템), Supabase. 상세 `backlog/log/2026-10-25-builder-T-103.md`
- [todo] T-104 | build | P0 | P-05 병원 상세 (공개 정보만, is_partner 분기, QUALITY 3-1 비주얼) | T-112, T-100c | 8절 폴백
- [todo] T-105 | build | P0 | P-01 메인 (QUALITY 3-1 비주얼) | T-103, T-104 |
- [todo] T-106 | build | P0 | P-12 광고 랜딩 | T-101 |
- [todo] T-107 | build | P0 | A-01 관리자 리드 관리 (Edge Function `admin-leads` 경유, `scripts/create-admin.ts`) + 오프라인 전환 업로드(`qualify-lead`) | T-101, T-109 |
- [todo] T-108 | build | P0 | [human-gate] C-01 약관·개인정보처리방침 | T-100b |
- [todo] T-109 | build | P0 | Edge Functions: `submit-lead`(검증·암호화·insert·Resend·CAPI), `admin-leads`(JWT 검증·마스킹), `qualify-lead`(GA4 MP·CAPI) + `supabase link`·`db push`·`functions deploy`·`secrets set` 스크립트 | T-100 | T-100b 리뷰 지시: `db push` 후에 SUPABASE env 설정(순서 명시), 마이그레이션 `20261025000000_content_tables.sql` 첫 실제 실행·재실행 검증을 여기서 수행
- [todo] T-111 | build | P0 | 폴리시 패스: 전 화면 일관성(토큰·여백·버튼·카피 톤), E2E 3종 최종 통과, QUALITY.md 전 항목 재검증 | T-101~T-107, T-112 (T-108 제외) | QUALITY.md 5절
- [todo] T-110 | build | P1 | 유저 흐름 GIF (검색→가이드→상담 신청→완료, 375px·1280px 2종): Playwright 스크린샷 프레임 + `gifenc` → `demo/` | T-105 | ffmpeg 불필요

## tracking
- [todo] T-200 | tracking | P0 | generate_lead (P-07) + GTM 태그·트리거 (키 없으면 container.json까지만, GTM API 반영은 needs-key 항목) | T-102 |
- [todo] T-201 | tracking | P0 | form_start, form_step2 | T-101 |
- [todo] T-202 | tracking | P0 | view_procedure, view_clinic, view_lp | T-103, T-104, T-106 |
- [todo] T-203 | tracking | P0 | click_cta, phone_click, kakao_click | T-104 |
- [todo] T-204 | tracking | P0 | Consent Mode v2 + CAPI(Edge Function) 연결·중복 제거 검증 | T-200, T-109 |
- [todo] T-205 | tracking | P0 | GA4 Data API로 이벤트 수신 자동 검증 스크립트 (DebugView 대체) | T-200 |
- [todo] T-206 | tracking | P1 | scroll_depth, search, click_affiliate, expand_faq, lead_qualified | T-107 |

## content
- [todo] T-300 | content | P0 | 쌍꺼풀 수술 | T-103 |
- [todo] T-301 | content | P0 | 앞트임 | T-103 |
- [todo] T-302 | content | P0 | 눈매교정 | T-103 |
- [todo] T-303 | content | P0 | 눈밑지방재배치 | T-103 |
- [todo] T-304 | content | P1 | 상안검 | T-103 |
- [todo] T-305 | content | P1 | 하안검 | T-103 |
- [todo] T-306 | content | P1 | [human-gate] 병원 10곳 공개 정보 CSV(병원 홈페이지 기준: 이름·주소·진료과목·운영시간, 출처 URL) → 사람 확인 후 등록 + 제휴 섭외 메일 초안 | T-104 | 심평원 API 미사용

## seo
- [todo] T-400 | seo | P1 | 첫 전체 점검 + sitemap/robots/llms.txt + 인코딩된 한글 URL 검증 | 배포 URL | 게이트 충족: 첫 Pages 배포 성공(2026-10-25, https://jaehoonkor.github.io/realsurgery/)
- [todo] T-401 | seo | P1 | 순위 추적: 서치콘솔 API(서비스계정)로 keywords.md 20개 주간 수집 자동화 | T-300~303, T-001b |

## ads
- [needs-approval] T-500 | ads | P1 | 메타 워밍업(트래픽 1만 원/일 × 7일) → Lead 전환 10만 원 + 네이버 검색 10만 원 집행 승인 | T-200, T-106 | 3단계 게이트
- [todo] T-501 | ads | P1 | 리포트 스크립트(scripts/ads-report.py) 작성·더미 검증 | — |

## review
(review 상태 작업이 여기로 이동)
