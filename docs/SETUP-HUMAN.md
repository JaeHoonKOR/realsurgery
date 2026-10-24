# 사람이 할 일 (총 2회 세션)

에이전트가 못 하는 건 "로그인·결제·법적 동의"뿐. 아래 순서대로. 키는 전부 `.env.local`에 붙여 넣고, 서비스 계정 JSON은 `secrets/gcp-sa.json`.

## 세션 1 — 지금 (약 15분)
1. `setup2.cmd` 더블클릭 (Git·Node·Claude Code·pnpm·gh·supabase 설치, 에이전트·권한 설치, C:\rs 링크, git 초기화). UAC 창은 "예". 끝나면 **새 터미널**을 연다
2. 터미널에서 `gh auth login` → GitHub.com → HTTPS → 브라우저 로그인
3. https://github.com/new → 이름 `realsurgery`, Public, 생성. (origin 연결·push는 에이전트가)
4. 저장소 Settings → Pages → Build and deployment → Source = **GitHub Actions**
5. `cd C:\rs` → `claude --permission-mode acceptEdits` → `/loop`  ← 여기서부터 에이전트가 T-099·T-100 진행

## 세션 2 — 첫 /loop 돌린 뒤 아무 때나 (약 45분)
| # | 서비스 | 할 것 | `.env.local`에 넣을 값 |
| --- | --- | --- | --- |
| 1 | Supabase https://supabase.com/dashboard | New project → **DB 비밀번호 저장** → Settings › API, Settings › General의 Reference ID | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`, `ADMIN_EMAIL`·`ADMIN_PASSWORD`(관리자 로그인용, 아무거나 정함) |
| 2 | Supabase CLI | 터미널 `supabase login` (브라우저 승인) | — |
| 3 | GA4 https://analytics.google.com | 관리 › 속성 만들기 → 웹 스트림 생성 | `NEXT_PUBLIC_GA4_MEASUREMENT_ID`(G-…), `GA4_PROPERTY_ID`(속성 설정의 숫자) |
| 4 | GTM https://tagmanager.google.com | 계정·컨테이너(웹) 생성 → 관리 탭에서 ID 확인 | `NEXT_PUBLIC_GTM_ID`(GTM-…), `GTM_ACCOUNT_ID`, `GTM_CONTAINER_ID`, `GTM_WORKSPACE_ID`(기본 작업공간, URL의 숫자) |
| 5 | GCP https://console.cloud.google.com | 새 프로젝트 → "API 및 서비스 › 라이브러리"에서 **Tag Manager API, Google Analytics Data API, Google Analytics Admin API** 3개 사용 설정 → IAM › 서비스 계정 만들기 → 키 › JSON 다운로드 | 파일을 `secrets/gcp-sa.json` 으로 저장 |
| 6 | GTM 권한 | 관리 › 사용자 관리 → 5번 서비스계정 이메일 추가, 컨테이너 권한 **게시** | — |
| 7 | GA4 권한 | 관리 › 속성 액세스 관리 → 같은 이메일 추가, 역할 **편집자** | — |
| 8 | 메타 https://business.facebook.com | 비즈니스 설정 › 데이터 소스 › 픽셀 생성 → 이벤트 관리자 › 설정 › 전환 API › 액세스 토큰 생성, 테스트 이벤트 탭의 코드 | `NEXT_PUBLIC_META_PIXEL_ID`, `META_CAPI_TOKEN`, `META_TEST_EVENT_CODE` |
| 9 | Resend https://resend.com | 가입 → API Keys 생성 | `RESEND_API_KEY`, `LEAD_NOTIFY_EMAIL` = **Resend 가입에 쓴 이메일** (도메인 인증 전엔 그 주소로만 발송) |
| 10 | 암호화 키 | 터미널 `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | `LEAD_ENCRYPTION_KEY` |
| 11 | GitHub Variables | 저장소 Settings › Secrets and variables › Actions › **Variables** 탭에 `NEXT_PUBLIC_*` 값들 동일하게 등록 | — (Actions 빌드용) |

끝나면 `/loop` 한 번 더 → needs-key 항목이 자동 재검증됨.

## 세션 3 — 첫 배포 후 (10분)
| # | 서비스 | 할 것 | 값 |
| --- | --- | --- | --- |
| 0 | 구글 서치콘솔 https://search.google.com/search-console | 속성 추가 › **URL 접두어**(배포 URL) → HTML 태그 → content 값. 설정 › 사용자 및 권한에 서비스계정 이메일 추가(전체) | `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, `GSC_SITE_URL` |
| 1 | 네이버 서치어드바이저 https://searchadvisor.naver.com — **커스텀 도메인 있을 때만 가능** (github.io 하위 경로 등록 불가) | 웹마스터 도구 › 사이트 등록 → HTML 태그 방식 → content 값 복사 | `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` |
| 2 | 네이버 애널리틱스 https://analytics.naver.com | 사이트 등록 → 발급 ID | `NEXT_PUBLIC_NAVER_ANALYTICS_ID` |
| 3 | GitHub Variables | 위 두 값 추가 | — |
| 4 | 도메인 (네이버 SEO 하려면 필수) | 가비아 등에서 구매 → DNS에 CNAME `www` → `<user>.github.io`, A 레코드 4개(GitHub Pages IP) → 저장소 Settings › Pages › Custom domain 입력 | `NEXT_PUBLIC_BASE_PATH=` (빈값), `NEXT_PUBLIC_SITE_URL=https://…` |

## 그 뒤로 사람이 하는 일
- `backlog/TASKS.md`의 `review` → `done` 바꾸기 (에이전트 리포트 읽고 체크)
- `needs-approval` 승인: 광고비(T-500), 병원 섭외 메일 발송(T-306)
- GTM "게시" 버튼 클릭 (에이전트가 새 버전 만들면 알림)
