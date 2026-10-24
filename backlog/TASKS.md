# TASKS

상태: todo / doing / review / done / blocked / needs-approval / needs-key / spec-question
`[human-gate]` 제목 태그 = 리뷰 통과 후에도 사람이 done으로 바꿈
형식: `- [status] T-### | lane | 우선순위 | 제목 | 선행 | 비고`

## 사람 확인 필요
- [needs-approval] T-001 | human | P0 | 계정·키 1회 세션 (아래 체크리스트) | — | 완료 전까지 에이전트는 mock 모드
- [todo] T-000 | human | P0 | 도메인 구매 **승인됨** → 구매 후 SETUP-HUMAN 세션 3-4 (DNS·Pages Custom domain) → `.env.local`·GitHub Variables의 `NEXT_PUBLIC_BASE_PATH`를 빈값, `NEXT_PUBLIC_SITE_URL`을 도메인으로 | — | 도메인 연결 전까지는 /realsurgery 하위 경로로 배포
- [spec-question] T-002 | human | P1 | 첫 카테고리 "눈" 확정 여부 | — | 기본값 눈으로 진행 중
- [spec-question] T-003 | human | P1 | 스펙 8절 서두 "동적 기능은 브라우저에서 Supabase 직접 호출"·269행 "A-01은 클라이언트에서 RLS로 읽는다" ↔ 8절 표·T-107 "admin-leads Edge Function 경유" | — | 가정: Edge Function 경유(표 기준). 서두·269행 수정 필요
- [spec-question] T-004 | human | P1 | 6절 렌더링 "SSR/ISR" ↔ 8절 `output: 'export'` / 7절 CAPI "Route Handler" ↔ Edge Function / 4절 C-01 처리 위탁 "Vercel"·9절 "도메인·Vercel" ↔ GitHub Pages | — | 가정: 정적 생성(SSG)·Edge Function·위탁사 Supabase·Resend(C-01은 human-gate에서 확정)
- [spec-question] T-005 | human | P1 | 4절에만 있는 이벤트 8개(select_category·select_procedure·select_clinic·select_post·expand_faq·click_map·kakao_add·experiment_variant)가 5절 13개 표에 없음. T-206에 expand_faq 포함 → 02 VERIFY "events.md 행 수 == 5절 표 행 수"와 충돌 | — | 가정: builder는 4절 이벤트를 모두 dataLayer push, tracking lane GTM 태그는 5절 13개만. events.md에는 "5절 외" 구역으로 분리
- [spec-question] T-006 | human | P1 | P-01 "추천 병원"·프리미엄 뱃지 ↔ 8절 폴백 "제휴·추천 표현 금지" / QUALITY E2E "병원→전화·카톡" ↔ 폴백 "is_partner=true일 때만 노출" | — | 가정: 섹션명 중립 표현("병원 둘러보기"), 뱃지는 is_premium일 때만, 더미 병원 1곳만 is_partner=true로 E2E

### T-001 체크리스트 (순서대로, 약 60분)
- [x] GitHub: 저장소 `JaeHoonKOR/realsurgery` 생성(public, 비어 있음) · origin 연결 완료(2026-10-24 점검)
- [ ] **GitHub 토큰 쓰기 권한**: 현재 gh 토큰(fine-grained)으로 `git push` 시 403. `gh auth login -h github.com -w`(브라우저 OAuth, repo·workflow 스코프)로 재로그인하거나, fine-grained 토큰에 realsurgery 저장소 **Contents·Workflows·Pages = Read and write** 부여 → `git push --dry-run origin main` 성공 확인
- [x] GitHub Pages: Source = GitHub Actions (`build_type=workflow` 확인)
- [ ] Supabase: 프로젝트 생성(DB 비밀번호 저장) → `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` / `supabase login`
- [ ] Google: GA4 속성 생성(측정ID `G-…`) + GTM 컨테이너 생성(`GTM-…`)
- [ ] GCP: 프로젝트 1개 → **API 활성화: Tag Manager API, Google Analytics Data API, Google Analytics Admin API** → 서비스 계정 1개 생성 → JSON 키를 `secrets/gcp-sa.json`에 저장 → 서비스계정 이메일을 GTM 컨테이너 "게시" 권한, GA4 속성 "편집자"로 추가
- [ ] 메타: 비즈니스 계정 → 픽셀 생성(`META_PIXEL_ID`) → CAPI 액세스 토큰(`META_CAPI_TOKEN`) → 테스트 이벤트 코드(`META_TEST_EVENT_CODE`)
- [ ] Resend: 계정 생성 → `RESEND_API_KEY`, `LEAD_NOTIFY_EMAIL` = **Resend 가입에 쓴 이메일**(도메인 인증 전엔 그 주소로만 발송됨)
- [ ] (선택) 네이버 클라우드 지도 API 키 — 없으면 "네이버 지도에서 보기" 링크로 폴백

### T-001b (첫 배포 후, 10분)
- [ ] 구글 서치콘솔: URL 접두어 속성으로 배포 URL 등록(HTML 태그 → `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`), 설정 › 사용자에 서비스계정 이메일 추가(순위 추적 API용), `GSC_SITE_URL`
- [ ] (도메인 있을 때만) 네이버 서치어드바이저·애널리틱스 등록 → 인증 메타태그 값 2개 → `.env.local` → 다음 `/loop`가 재배포

## build
- [done] T-099 | build | P0 | 권한 부트스트랩 — setup2.ps1로 완료 (git·node·pnpm·claude·gh OK, supabase는 npx 대체) | — | 2026-10-24
- [todo] T-100 | build | P0 | 저장소·Pages는 이미 존재(origin 연결됨, Pages=workflow) → 생성·활성화 명령 실행 금지. `git push -u origin main`은 토큰 권한(T-001)이 없으면 needs-key로 기록하고 로컬 작업 계속 + 프로젝트 스캐폴드(루트 `package.json`의 `packageManager: pnpm@9.15.9` 유지)(Next.js 15 `output: export`, `basePath`/`.nojekyll`, Tailwind + `styles/tokens.css` 디자인 토큰, Pretendard 서브셋, Supabase 클라이언트, lib/env.ts mock 가드, lib/track.ts, 공통 컴포넌트, 품질 스크립트 `pnpm lh`/`test`/`test:a11y`/`test:e2e`, 실서비스형 더미 데이터 시드(시술 10·병원 3·칼럼 3), GitHub Actions 워크플로) | T-099 | 3절 공통 요소
- [todo] T-101 | build | P0 | P-06 상담 폼 ("시술 상담 가이드 받기") → Edge Function `submit-lead` 호출. 브라우저 직접 insert 금지 | T-100, T-109 | 8절 폴백
- [todo] T-102 | build | P0 | P-07 완료 페이지 (sessionStorage 플래그) | T-101 |
- [todo] T-103 | build | P0 | P-03 시술 상세 가이드 (MDX 템플릿 포함) | T-100 |
- [todo] T-104 | build | P0 | P-05 병원 상세 (공개 정보만, is_partner 분기) | T-100 | 8절 폴백
- [todo] T-105 | build | P0 | P-01 메인 | T-103, T-104 |
- [todo] T-106 | build | P0 | P-12 광고 랜딩 | T-101 |
- [todo] T-107 | build | P0 | A-01 관리자 리드 관리 (Edge Function `admin-leads` 경유, `scripts/create-admin.ts`) + 오프라인 전환 업로드(`qualify-lead`) | T-101, T-109 |
- [todo] T-108 | build | P0 | [human-gate] C-01 약관·개인정보처리방침 | T-100 |
- [todo] T-109 | build | P0 | Edge Functions: `submit-lead`(검증·암호화·insert·Resend·CAPI), `admin-leads`(JWT 검증·마스킹), `qualify-lead`(GA4 MP·CAPI) + `supabase link`·`db push`·`functions deploy`·`secrets set` 스크립트 | T-100 |
- [todo] T-111 | build | P0 | 폴리시 패스: 전 화면 일관성(토큰·여백·버튼·카피 톤), E2E 3종 최종 통과, QUALITY.md 전 항목 재검증 | T-101~T-108 | QUALITY.md 5절
- [todo] T-110 | build | P1 | 유저 흐름 GIF (검색→가이드→상담 신청→완료, 375px·1280px 2종): Playwright 스크린샷 프레임 + `gifenc` → `demo/` | T-105 | ffmpeg 불필요

## tracking
- [todo] T-200 | tracking | P0 | generate_lead (P-07) + GTM 태그·트리거 (GTM API로 반영) | T-102, T-001 |
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
- [todo] T-400 | seo | P1 | 첫 전체 점검 + sitemap/robots/llms.txt + 인코딩된 한글 URL 검증 | 배포 URL |
- [todo] T-401 | seo | P1 | 순위 추적: 서치콘솔 API(서비스계정)로 keywords.md 20개 주간 수집 자동화 | T-300~303, T-001b |

## ads
- [needs-approval] T-500 | ads | P1 | 메타 워밍업(트래픽 1만 원/일 × 7일) → Lead 전환 10만 원 + 네이버 검색 10만 원 집행 승인 | T-200, T-106 | 3단계 게이트
- [todo] T-501 | ads | P1 | 리포트 스크립트(scripts/ads-report.py) 작성·더미 검증 | — |

## review
(review 상태 작업이 여기로 이동)
