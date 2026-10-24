# TASKS

상태: todo / doing / review / done / blocked / needs-approval / needs-key / spec-question
형식: `- [status] T-### | lane | 우선순위 | 제목 | 선행 | 비고`

## 사람 확인 필요
- [needs-approval] T-001 | human | P0 | 계정·키 1회 세션 (아래 체크리스트) | — | 완료 전까지 에이전트는 mock 모드
- [todo] T-000 | human | P0 | 도메인 구매 **승인됨** → 구매 후 SETUP-HUMAN 세션 3-4 (DNS·Pages Custom domain) → `.env.local`·GitHub Variables의 `NEXT_PUBLIC_BASE_PATH`를 빈값, `NEXT_PUBLIC_SITE_URL`을 도메인으로 | — | 도메인 연결 전까지는 /realsurgery 하위 경로로 배포
- [spec-question] T-002 | human | P1 | 첫 카테고리 "눈" 확정 여부 | — | 기본값 눈으로 진행 중

### T-001 체크리스트 (순서대로, 약 60분)
- [ ] GitHub: 저장소 `realsurgery` 생성(public), 로컬에서 `gh auth login` → origin 연결은 에이전트가
- [ ] GitHub Pages: 저장소 Settings → Pages → Source = GitHub Actions
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
- [todo] T-099 | build | P0 | 권한 부트스트랩: `.claude/settings.json` 생성 + `pnpm`·`gh`·`supabase` CLI 존재 확인, 없으면 설치 명령을 로그에 | — | CLAUDE.md 참조
- [todo] T-100 | build | P0 | 프로젝트 스캐폴드(Next.js 15 `output: export`, `basePath`/`.nojekyll` 처리, Tailwind, Supabase 클라이언트, lib/env.ts mock 가드, lib/track.ts, 공통 컴포넌트, GitHub Actions Pages 워크플로) | T-099 | 3절 공통 요소
- [todo] T-101 | build | P0 | P-06 상담 폼 ("시술 상담 가이드 받기") → Edge Function `submit-lead` 호출. 브라우저 직접 insert 금지 | T-100, T-109 | 8절 폴백
- [todo] T-102 | build | P0 | P-07 완료 페이지 (sessionStorage 플래그) | T-101 |
- [todo] T-103 | build | P0 | P-03 시술 상세 가이드 (MDX 템플릿 포함) | T-100 |
- [todo] T-104 | build | P0 | P-05 병원 상세 (공개 정보만, is_partner 분기) | T-100 | 8절 폴백
- [todo] T-105 | build | P0 | P-01 메인 | T-103, T-104 |
- [todo] T-106 | build | P0 | P-12 광고 랜딩 | T-101 |
- [todo] T-107 | build | P0 | A-01 관리자 리드 관리 (Edge Function `admin-leads` 경유, `scripts/create-admin.ts`) + 오프라인 전환 업로드(`qualify-lead`) | T-101, T-109 |
- [todo] T-108 | build | P0 | C-01 약관·개인정보처리방침 | T-100 |
- [todo] T-109 | build | P0 | Edge Functions: `submit-lead`(검증·암호화·insert·Resend·CAPI), `admin-leads`(JWT 검증·마스킹), `qualify-lead`(GA4 MP·CAPI) + `supabase link`·`db push`·`functions deploy`·`secrets set` 스크립트 | T-100 |
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
- [todo] T-306 | content | P1 | 병원 10곳 공개 정보 CSV(병원 홈페이지 기준: 이름·주소·진료과목·운영시간, 출처 URL) → 사람 확인 후 등록 + 제휴 섭외 메일 초안 | T-104 | 심평원 API 미사용

## seo
- [todo] T-400 | seo | P1 | 첫 전체 점검 + sitemap/robots/llms.txt + 인코딩된 한글 URL 검증 | 배포 URL |
- [todo] T-401 | seo | P1 | 순위 추적: 서치콘솔 API(서비스계정)로 keywords.md 20개 주간 수집 자동화 | T-300~303, T-001b |

## ads
- [needs-approval] T-500 | ads | P1 | 메타 워밍업(트래픽 1만 원/일 × 7일) → Lead 전환 10만 원 + 네이버 검색 10만 원 집행 승인 | T-200, T-106 | 3단계 게이트
- [todo] T-501 | ads | P1 | 리포트 스크립트(scripts/ads-report.py) 작성·더미 검증 | — |

## review
(review 상태 작업이 여기로 이동)
