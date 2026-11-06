# TASKS

상태: todo / doing / review / done / blocked / needs-approval / needs-key / spec-question
`[human-gate]` 제목 태그 = 리뷰 통과 후에도 사람이 done으로 바꿈
형식: `- [status] T-### | lane | 우선순위 | 제목 | 선행 | 비고`

## 사람 확인 필요
- [needs-approval] T-001 | human | P0 | 계정·키 1회 세션 (아래 체크리스트) | — | 완료 전까지 에이전트는 mock 모드
- [todo] T-000 | human | **P0 — 오늘** | 도메인 구매 **승인됨**(색인 2~4주 → 가장 느린 병목, 네이버 SEO 증명 전제) → 구매 후 SETUP-HUMAN 세션 3-4 (DNS·Pages Custom domain) → `.env.local`·GitHub Variables의 `NEXT_PUBLIC_BASE_PATH`를 빈값, `NEXT_PUBLIC_SITE_URL`을 도메인으로 | — | 도메인 연결 전까지는 /realsurgery 하위 경로로 배포
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
- [done] T-014 | human | P1 | P-07은 직접 접근 불가(robots 차단 + 세션 플래그) — 심사자 증거로 `/insights#tracking` 공개 사본을 쓸지 | — | T-079 90 제기 → **기본값 채택: /insights#tracking 공개 사본 사용** (2026-10-25)
- [done] T-015 | human | P1 | 주간 수기 입력 담당(AEO 80칸 + 네이버 순위 20개, 주 약 50분, 월요일) | — | T-079 90 제기. 기본값: 사람 입력 → **기본값 채택: 사람 입력(월요일 50분). 서치콘솔 API 연결되면 순위 20개는 자동화(T-401)** (2026-10-25)
- [done] T-016 | human | P1 | 내부·심사자 테스트 리드 식별: `leads.is_demo` 컬럼(95) vs `utm_source=internal`(90) | — | T-079 K12. 기본값: is_demo 컬럼, T-083에서 확정 → **기본값 채택: leads.is_demo 컬럼** (2026-10-25)
- [done] T-017 | human | P1 | 상담 폼 동의 4개(민감정보 별도, 95 3-6) vs screen-spec 3개 + CAPI 해시 전화번호의 제3자 제공 동의 필요 여부 + 만 14세 미만 차단 여부 | — | T-079 95 K1·K3 제기 → **결정: 동의 4개(95 기준), CAPI 해시 전화번호는 제3자 제공 동의 항목에 포함, 만 14세 미만 차단 체크박스** (2026-10-25)
- [needs-approval] T-018 | human | P1 | **[사람 결정 대기 — 추천: 예]** 런칭 전 변호사 1회 검토(사이트 자체 의료광고 해당 여부 3-11, 통신판매업 신고, 동의 문구) — 비용 발생 | — | T-079 95 K10
- [done] T-019 | human | P1 | 무료 계정 가입 1회씩: 네이버 검색광고, 네이버 블로그, Bing 웹마스터 도구(사이트맵 제출) | — | T-079 90 제기. ChatGPT 검색은 Bing 색인 의존 → **사람: 무료 가입 3곳(네이버 검색광고·블로그·Bing 웹마스터) — SETUP-HUMAN 세션 3에 추가** (2026-10-25)
- [done] T-020 | human | P2 | PDF·지표 생성 스크립트를 신규 T-141(M1 11-09)로 둘지, T-140에 포함할지 | — | T-079 90 제기 → **결정: T-141 신설(PDF·지표 스크립트), T-140은 취합만** (2026-10-25)
- [needs-approval] T-021 | human | P1 | **[사람 결정 대기 — 추천: 보류, 1차 결과 후]** 네이버 검색광고 예산 +68,300원(98,700 → 167,000원, 리드 5건 = 클릭 167 × CPC 1,000원) — 검색 CPL을 표본 부족 없이 측정하려면 필요. 비용 발생 | — | T-080 Q11. 기본값: 증액 0, KPI-02 (d)는 D5에만
- [done] T-022 | human | P1 | 의료 자문의 섭외 여부·기한(00 S15 기한 11-16) | — | T-080 Q15, T-009·T-012와 같은 건. 미확보 시 M4까지 95 S0("검토 전" 표시) → **결정: 섭외 시도하되 미확보 시 "검토 전" 표시로 진행(95 S0)** (2026-10-25)
- [done] T-023 | human | P1 | 00-product 목표·일정 추인: Q2 KPI-01 실리드 목표 11건(메타 5·네이버 3·오가닉 3, 목표 CPL 없음), Q4 도메인 연결 기한 11-01(컷오프 11-10·11-16 — T-000과 연동), Q5 완본 10편(눈 4 → 비눈 6, screen-spec 20편 대신), Q7 AEO W0 리허설 11-03(사람 약 15분), Q1 RM2 프리미엄 노출 금액 미기재 | — | T-080. 기본값대로 진행 중. 상세 00-product 8절 → **추인: 00-product 목표·일정 그대로** (2026-10-25)
- [done] T-024 | human | P1 | 00-product 3-3 "경쟁사 공개 가격 0" vs 실측: 바비톡 키워드 허브는 로그인 없이 가격·할인율·평점·후기 수 노출(BENCHMARK 2-2, `reports/benchmark/babitalk-procedure-375.png`) — 1순위 차별점 V1 문구를 "출처·조사일 있는 가격 분포"로 좁힐지 | — | T-090 reviewer r1 제기. 결정 전 기본값: V1 = 출처·조사일·n곳 표기 가격 분포(경쟁 0), "공개 가격 0" 표현은 쓰지 않음 → **결정: V1 문구를 "출처·조사일 있는 가격 분포"로 좁힘** (2026-10-25)
- [done] T-025 | human | P2 | 90 3-8-2 D3 칸 값 "행마다 3열" 고정 vs BENCHMARK 8절 인용 순위 보조 지표용 `aeo_checks.csv` 열 3개(`rank_ours`·`rank_unni`·`rank_babitalk`) 추가 제안 — 90 변경을 허용할지 | — | T-090 reviewer r1 반려 11(BENCHMARK 7-1 S5). 결정 전 기본값: csv 3열 그대로, 순위 보조 지표 기록 0 → **결정: 보조 지표 열 3개 추가 허용** (2026-10-25)
- [done] T-026 | human | P1 | 강남언니 `unni.app` robots.txt `User-agent: *` `Disallow: /`(이름 지정 봇만 허용) — 분기 벤치마크 재측정에서 unni.app 열람을 계속할지, 2026-10-25 관찰값만 유지할지 | — | T-090 r2 benchmark 제기(BENCHMARK 1절·7-1 S7). 이번 측정은 사용자 지시 화면당 소수 열람(r2 12회), UA 변경 0. 결정 전 기본값: 다음 재측정 전까지 추가 열람 0 → **결정: unni.app 재측정 중단, 2026-10-25 관찰값 유지 + 공개 페이지(gangnamunni.com)만** (2026-10-25)
- [done] T-027 | human | P1 | P-03 본문 섹션 접기(B-44 ≥14 = 본문 H2 5개를 `<h2><button aria-expanded>`로) 허용 여부 + 섹션 토글 이벤트(`expand_faq` 통합 vs 신규 `toggle_section`) — screen-spec P-03은 FAQ만 아코디언, 이벤트는 `expand_faq`뿐 | — | T-090 r4 benchmark SQ-a. 결정 전 기본값: 본문 섹션 기본 펼침(`aria-expanded="true"`), 이벤트 추가 0 → **결정: 본문 섹션 접기 허용, 이벤트는 신규 toggle_section** (2026-10-25)
- [done] T-028 | human | P2 | B-03 "병원 공개 가격 n곳" vs "이 시술 병원 n곳"이 다른 양인지(가격 조사 대상 ⊂ 등록 병원) — 같은 원천이면 B-03이 12로 떨어짐 | — | T-090 r4 benchmark SQ-b. P-03 레이아웃·T-083 30-data에서 다른 양으로 정의되면 해소 → **결정: 다른 양으로 정의(가격 조사 병원 ⊂ 등록 병원), T-083에서 컬럼 분리** (2026-10-25)
- [spec-question] T-013 | human | P1 | P-03 요약 박스 "회복기간"의 정의(일상생활 복귀 / 붓기 / 운동 제한) 고정 여부 + 출처 범위값("7~10일", "2~3시간") 표시용 procedures 최소·최대 컬럼 추가 여부 | — | T-103 reviewer r3 제기. 결정 전 기본값: 회복기간 = 일상 복귀, 범위는 상한 정수 1개
- [spec-question] T-029 | human | **P0** | mock 배포(키 없음)에서 P-06 제출 버튼: 00 S8 "비활성 + '상담 접수 준비 중'" vs CLAUDE.md M1 "상담→완료가 클릭으로 이어짐" — 키 없이는 M1(T-130) 통과 불가. (가) mock에서도 제출 활성 + 더미 접수번호로 P-07 이동(리드 저장 0, 화면 문자열 "mock"·"테스트" 0) (나) 00 S8 유지 + T-001 Supabase 키를 M1 선행으로 | — | T-081 10-design DQ-09·DC-29. 결정 전 기본값: 10-design은 00 S8 따름(비활성 + "시술 가이드 보기" 링크). **추천: (가)** — M1 기한 11-09 전에 키가 안 들어오면 M1이 막힘
- [spec-question] T-030 | human | P2 | 주간 `metrics` 잡이 Actions 봇으로 main에 직접 커밋(`reports/leads/agg.json`·`reports/metrics.json` 2경로, `pnpm build` 통과 뒤) 허용 여부 | — | T-082 70 EQ-02. 기본값: 아티팩트만 생성, 오케스트레이터가 다음 루프에 커밋(/insights 갱신 지연 ≤7일)
- [needs-approval] T-031 | human | P2 | Supabase Free → Pro(월 비용 발생, 자동 백업 7일) — 비용 발생 | — | T-082 70 EQ-03. 기본값: Free + keep-alive, 백업 0(95 3-6 문장 그대로). 리드 유실 위험 감수
- [spec-question] T-032 | human | P2 | 오류 수집 도구(Sentry 등) 도입 여부 | — | T-082 70 EQ-04. 기본값: 도입 0. 도입 시 95 수탁자 표·CSP·PB-01 먼저 갱신
- [spec-question] T-033 | human | P1 | 95 3-6 CAPI 식별자 갱신: T-017 결정(해시 전화를 제3자 제공 동의에 포함) + `client_user_agent` 반영 | — | T-082 70 EQ-05. 기본값: fbc·fbp·UA만, 해시 전화 0(95 현행 유지). T-088에서 95 v4와 함께 처리 가능
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

## build — 마일스톤 M1: 배포 URL에서 "메인→가이드→병원→상담→완료"가 클릭으로 이어지고 QUALITY v2 통과
- [done] T-099 | build | P0 | 권한 부트스트랩 | — |
- [done] T-100 | build | P0 | 스캐폴드 1/2 (배포 파이프라인·품질 스크립트·토큰) | T-099 | 2026-10-25 배포 성공
- [done] T-100b | build | P0 | 스캐폴드 2/2 (공통 컴포넌트·시드) — **v1 기준 통과분. M1 기준으로는 미완(링크 없는 카드·배너 과대). T-100c에서 재작업** | T-100 |
- [done] T-079 | specs | P0 | **제출물 정의서 90-deliverables 검토·보강**(초안 있음) + 법무·운영 95-legal-ops 검토·보강 — 이것이 모든 작업의 목적지 | — | 08-specs. 2026-10-25 둘 다 v3, hiring-reviewer r1 반려 → 반영(90: 33건, 95: 39건) → r2 approve, lint 0. 충돌 기록 90 19건·95 18건 → T-088. 상세 `backlog/log/2026-10-25-spec-deliverables-legal-ops.md`. 커밋 90ea156 @ `feat/T-079-deliverables-legal-ops` — **main 미머지**: 브랜치에 리뷰 안 된 12f6f63(chore sync)이 함께 있고 작업트리에 T-112 미커밋 변경이 많아 체크아웃 위험 → 사람이 12f6f63 포함 여부 결정 후 머지(문서만 변경, 빌드 영향 없음)
- [done] T-080 | specs | P0 | 제품 정의서 00-product (완본, 마일스톤은 '느린 신호 먼저') | T-079 | 08-specs. 2026-10-25 v3.1. 교차 검토 r1 53건(tech 20·content 18·hiring 15) 전부 반영 → hiring r2 request-changes(신규 7) → v3 → hiring r3 **approve(채용 예)** → 후속 5건 v3.1 반영, lint 0. 후속 3건 결정(3-10): ① D5 네이버 2열(GA4 naver_organic 항상 + 서치어드바이저는 도메인 연결일 분기) ② B13 정규식 교체안 + 허용·차단 예문 fixture ③ 마일스톤 M0 10-26~11-01·M1 11-09·M2 11-23·M3 12-08·M4 12-21 확정(90과 차이 0). 주요 기본값: 눈 4편 완본 11-03(AEO 첫 측정 11-10 전)·미완본·is_demo 병원·/insights·/deliverables noindex, 메타 랜딩 `/lp/c2611a`, 메타 CPL 목표 없음(21일 누적 1개), flight 시작 = 실키 + 리드 왕복 1건. 충돌 C1~C29 → T-088. spec-question Q1~Q15 → 사람 확인 필요 T-021~T-023, T-083·T-088 비고. 상세 `backlog/log/2026-10-25-spec-product.md`. 커밋 @ `feat/T-080-product`(T-079 브랜치 위) — main 미머지(T-079와 같은 사유)
- [done] T-090 | benchmark | P0 | 경쟁 서비스 실측 → `docs/BENCHMARK.md` (강남언니·바비톡·여신티켓·RealSelf·Zocdoc, 4화면씩, 수치 목표) | — | 07-benchmark. **2026-10-25 r4 → reviewer r4 approve(차단 0, `backlog/log/2026-10-25-reviewer-T-090-r4.md`)**. BENCHMARK v1.3: `ssrOne`에 ariaExpanded·refLinks 추가, RealSelf raw `reports/benchmark/raw/r3-realself-ssr.json`(요청 1회) → B-44 14 재현(목표 ≥14 유지), B-29 최고 4·목표 ≥4(P-03 5번 연동), B-30 ≤75%·목표 100%; `isOk` status ≥400/null 즉시 중단, lcpMissing/statusFail 분리. r4 비차단(P-03 레이아웃·스크립트 몫): ① B-44 셈 규칙 불일치 — RealSelf는 class 기준, 우리 `ax=`는 `closest("header,nav")` 기준 → P-03 아코디언을 `<header>` 안에 두면 0으로 셀 수 있음, P-03 명세에서 "헤더 메뉴" 정의 통일 + BENCHMARK 129행 추정 문구 "원인 미확인"으로 ② 차단 응답 중단을 폭 단위 → URL 단위로 ③ perf null 회차 집계 누락. **커밋·머지 미실행**: 이번 세션에서 git 명령이 권한 승인 대기로 막힘 → 사람이 `docs/BENCHMARK.md`·`scripts/bench-measure.mjs`·T-090 로그(r1~r4)를 `feat/T-090-benchmark`에 커밋 후 머지(문서·측정 스크립트만, 빌드 영향 없음). — r3 이력: **2026-10-25 r3 반영(`backlog/log/2026-10-25-benchmark-T-090-r3.md`: B-03 개수 기준 R-숫자 최고 13·목표 ≥13, R-단위 규칙, 전수 점검으로 B-44 목표 ≥14·B-30·B-29·P-01 검색창 y≤70·빈 상태 E2·B-02 정정, LCP 재측정 `--max-runs`) → reviewer r3 request-changes 1건(`backlog/log/2026-10-25-reviewer-T-090-r3.md`)**: B-03 해소·목표<최고값 0건 확인. 차단 = RealSelf SSR 값(B-29 참고문헌 3, B-30 PMID 2/3, B-44 aria-expanded 14) 재현 불가 — `scripts/bench-measure.mjs` `ssrOne`이 세지 않고 raw에도 없음(gitignored `.playwright-mcp/ssr.mjs`·일회성 분석뿐). 고칠 것: (a) `ssrOne`에 `ariaExpanded`·`refLinks{pubmed,pmc,ncbiBook,doi}` 추가·요약 출력 (b) RealSelf 시술 상세 `--ssr --out reports/benchmark/raw/r3-realself-ssr.json` 1회, 칸에 raw 경로, 값 다르면 B-44·6절 P-03 6번 재조정 (c) 1절 B행 지표 목록 수정 + "RealSelf 값은 SSR HTML 기준, 렌더 후 미확인" 1줄. r3 비차단: 248행 `isOk` — status ≥400/null이면 즉시 중단·LCP 0일 때만 재측정, 요약 `lcpMissing`/`statusFail` 분리(r3 빈 페이지 EXIT 1 확인은 status null 경로였음); 5절 A4 AggregateRating 5곳/6개 병기; B-03 "병원 공개 가격 n곳"≠"이 시술 병원 n곳"을 P-03 레이아웃에서 정의; B-44 섹션 접기·토글 이벤트는 P-03 레이아웃에서(스펙 변경 시 spec-question); 2-2 O3 평점 y≈780 정정. — r2 이력: **2026-10-25 r2 반영(`backlog/log/2026-10-25-benchmark-T-090-r2.md`, `scripts/bench-measure.mjs` 신규) → reviewer r2 request-changes 1건(`backlog/log/2026-10-25-reviewer-T-090-r2.md`, r1 반려 1과 같은 사유 2회차)**: B-03 R-허브 셈 단위 불일치 — 바비톡 O3 첫 화면 숫자 = 카드 3 × 4 = 12개인데 "카드 1장 4" 기준으로 적어 목표 ≥ 5 < 12. (a) 개수 기준 최고값 12·목표 ≥ 12(못 따라가면 7-2 E2) 또는 (b) 항목명 "숫자 종류 수"로 바꾸고 R-허브에 행별 셈 단위 명시. 2-2 해당 행·6절 P-03 1번도 같이. r2 비차단: LCP 미기록 시 3회 채울 때까지 재측정 규칙, B-32 작성자 표기는 E1에서 달성 항목으로 분리, 2-4b TimeoutError 기록, `.gitignore`의 `public/og/` 줄은 커밋 분리, check-density.mjs `ERR_MODULE_NOT_FOUND`(playwright 미설치) → T-112. 나머지 r1 반려 10건 해소 확인. — r1 이력: **M1 모든 작업의 선행**. T-079 후속: 90 3-9 경쟁 비교 7행 중 시술 상세·JSON-LD "미확인" 실측, 바비톡 "AI 검색"은 입력창 아닌 /search 링크로 정정, D3 경쟁사 인용 점유율 기준. **2026-10-25 reviewer r1 request-changes(11건, `backlog/log/2026-10-25-reviewer-T-090.md`)**: ① B-05·B-19·B-32 목표 < 실측 최고값(허브 포함 규칙 통일 또는 7절 예외) ② B-44 산식 최소 7 < 목표 9(FAQ ≥ 7) ③ 90 3-9 비교표 7행 중 5행(가격 출처·확인일, 의사 정보 누락) + 바비톡 허브 비로그인 가격·평점 노출 → 00 3-3 "공개 가격 0" 충돌 7절 기록(T-024) ④ 측정 코드 `.playwright-mcp/bm-run.js` → `scripts/`로 이관, 1절에 경로·캐시 조건·대기·네트워크 명시, check-density와 규칙 차이 정정, 1280 밀도 도구 ⑤ 속도 최고값 5개 URL 3회 중앙값 재측정 ⑥ 바비톡 카톡상담 경로 클릭 수(입력 없이) ⑦ B-05·B-26 최고값 2절 표 출처, B-36 추정치 표기(폼 내 키보드 필드 1) ⑧ O1 구형 콘텐츠·LCP, `realself-clinic-*.png`, Zocdoc 나머지 3화면 미시도 사유 ⑨ P-05 신뢰 수치 숫자 3종만(뱃지 분리) ⑩ B-46 단위 개수↔비율 통일 ⑪ D3 열 3개 추가 = 90 3-8-2 변경 → 7절 spec-question. 비차단: B-22 "검사 오류 0일 때" 단서, 로그의 .gitignore 문구 정정. 재측정은 화면당 1회 열람(바비톡 약 25회 후 403)
- [done] T-081 | specs | P0 | 디자인 정의서 10-design (벤치마크 이상 수치, 컴포넌트 카탈로그, 모션, 일러스트) — M1 전엔 1쪽 요약+카탈로그, 구현 중 보강 | T-080, T-090 | 08-specs. 2026-10-25 v2 완본(884줄, "완본" 제목으로 120줄 예외). r1 교차 검토 content 32·tech 34·hiring 28 → request-changes → owner 반영 90·사유 4(CL-C10 mock 제출 비활성 유지=00 S8, TL-C9 하단 바 라벨 ≤16자, TL-M4 일부, H-M2 숫자 색 ink 700) → lint 0 → r2 spec-content-lead(sonnet) **approve(차단 0)**. r2 비차단 10건(375 배분표 합계 680↔675 오탈, P-05 가상 병원 고지 위치, 1280 주 CTA 위치·P-07 CTA, CHP-D 칩 폭, SUM 높이 중복 합산 등)은 레이아웃 명세·T-112 몫, 로그 4절. 충돌 DC-01~38·질문 DQ-01~18 → T-088. 남은 리스크: P-03 375 첫 화면 여유 9px(DQ-07 요약 문장 길이), B-05 1280 23개 중 1개가 쿠키 배너 아이콘, bench-measure 마지막 부분 구간(DQ-12). 상세 `backlog/log/2026-10-25-spec-design.md`. **커밋 미실행**(git 권한 승인 대기)
- [done] T-082 | specs | P0 | 엔지니어링 정의서 70-engineering | T-080 | 08-specs. 2026-10-25 v1.2 완본(590줄, lint 0). r1 교차 검토 data 5·analytics 9 → request-changes → v1.1 14건 반영 → r2(analytics) 13 해소, 미해소 A5(메타 중복 제거 브라우저 Lead 없음) + 신규 N1(rate_limits 보존 실제 최대 48시간) → request-changes(반려 2회) → v1.2 반영 → 3회차 **approve**(오케스트레이터 lint + 본문 대조로 A5·N1 해소 확인, 상한 규칙). 주요 결정: 리드 제출 모드 live/closed/demo(`data/generated/lead-mode.json`, T-029 결정 전 `closed`), 브라우저 DB 직접 접근 0(콘텐츠는 빌드 시 정적 JSON, leads 계열 5개 테이블 RLS 정책 0 + revoke), Edge Function 5개 계약, meta referrer·meta CSP(`CSP_GTM_PREVIEW=1` 시 Preview 호스트), 동의 전 큐 정리·철회 시 reload, 예산 JS ≤150KB gzip·LCP ≤2.0s·CLS ≤0.05, QG-01~15, CI build→e2e→deploy→post-deploy + cron daily/weekly. 충돌 EC-01~26 → T-088, 질문 EQ-02~05 → T-030~T-033. 구현 후보(3-16)는 T-109·T-112·T-204·T-141 비고에 연결. 로그 `backlog/log/2026-10-25-spec-engineering*.md`(본문·review-data·review-analytics·review-r2). **커밋 미실행**
- [doing] T-083 | specs | P0 | 데이터 정의서 30-data (M1 전 1쪽 요약) | T-082 | T-079 후속: 95 3-12 요건 DR1~DR10(consent_sensitive·consent_version·retention_until·is_demo·lead_access_logs·cascade·삭제 배치 주체) 반영, 사이트 전역 `referrer=strict-origin` + 픽셀 dl·rl 디코딩 한글 0 검사, P-12 쿼리 제거 전 fbc 생성 순서. T-082 후속: 70 3-5b "30에 넘기는 컬럼 요건" 표 그대로 받기(receipt_no 6hex UNIQUE, idempotency_key UNIQUE, phone_hash, age_confirmed, attribution 9키, rate_limits·retention_runs `deleted_rate_limits`), 콘텐츠 정본 = seed JSON. T-080 후속: Q10 내부 리드 = `x-internal-token` 헤더 검증(utm_source=internal 단독 무효), Q14 시드 `view_count` 삭제·`sources` 루트 URL 교체, 00 3-5 agg.json by_source 8키·`metrics-agg` 건수 전용
- [todo] T-084 | specs | P0 | 트래킹 정의서 40-tracking (이벤트 사전 21개, 투명성 블록 항목) | T-083 | T-079 후속: CPL 원장 = leads(UTM 라스트클릭), GA4는 Consent basic 모드 참고값 — generate_lead ÷ leads 하한(90 제안 50%), 퍼스트·라스트클릭 UTM 둘 다 저장 여부, Consent Mode v2 ad_user_data·ad_personalization
- [todo] T-085 | specs | P0 | SEO/AEO 정의서 50-seo-aeo | T-082 |
- [todo] T-086 | specs | P0 | 콘텐츠 정의서 20-content (M1 전 1쪽 요약: 용어 사전·금지 표현·출처 등급) | T-085 |
- [todo] T-087 | specs | P0 | 그로스 정의서 60-growth (더미 리포트 1부 완성본 포함) — 광고 워밍업 전 필요 | T-084 |
- [todo] T-088 | specs | P0 | 화면 정의서 v2: 승인 정의서로 재조립(모든 표에 "링크 대상" 열, 근거 정의서 ID), **정의서 간 충돌 전수 점검**(LCP·CLS·Vercel 잔재 등), hiring-reviewer 검토 | T-081~T-086 | T-079 충돌 기록 90 19건·95 18건 일괄 정리(서치어드바이저 메타는 GTM 아닌 정적 head, A-01 leads 브라우저 직접 조회 금지, FAQ 리치 결과 종료 반영, `/lp/eye-2026-11` K16, D5-creatives.md, 90 체크리스트 네이버 항목·외부 링크 수 기준). T-080 충돌 C1~C29 + spec-question Q6(95 B13 정규식 교체 → 95 v4), Q8(90 D2 "색인 ≥ 20" → ≥60%만), Q9(95 타사 플랫폼 비교 규칙), Q12(90 3-9 D8 숫자 6칸 교체), Q13(95 3-11 "상담 가이드" 영역 추가). T-081 10-design 충돌 DC-01~38 + 질문 DQ-01~18(DQ-09는 T-029로 승격). T-082 70-engineering 충돌 EC-01~26(70 4-2: consent ad_personalization, pages.yml cron·잡, e2e 리드 데이터, check-density playwright, SUPABASE_ 접두 시크릿, 95 CAPI 식별자·연령 확인, 95 withdraw·수집 항목 48시간, view_count, 10 TRK JS, `_utm` 쿠키 vs sessionStorage, 00 is_demo 메타 테스트 예외, lead_qualified 서버 전용, metrics-agg `sla`)
- [todo] T-112 | build | P0 | 에셋 파이프라인: 워드마크 로고 SVG 3안→1안, 시술 10개 히어로·썸네일(Gemini), 부위 아이콘 6개, 플레이스홀더 세트, `components/diagrams/`(시술 위치·회복 타임라인) `components/charts/`(가격 분포 바·비교 바·스파크라인), `scripts/check-density.mjs`·`check-links.mjs`, 쿠키 배너 1줄(≤64px) | T-081, T-088 | T-082 70 3-16: `check-budget.mjs`·`check-secrets.mjs`, check-out 정규식(`wcslog`·`wcs_do`), PNG 예외 3종, check-density import → `@playwright/test`(EC-09)
- [todo] T-100c | build | P0 | fix: 공통 컴포넌트 M1 재작업 — 로고 SVG, 헤더 GNB 실링크, 카드 컴포넌트(이미지+뱃지+호버, 항상 링크), CTA 블록 아이콘, 스켈레톤, 빈 상태 일러스트, 푸터 | T-112 | 레이아웃 명세 `docs/layouts/common.md` 먼저, 10-design 컴포넌트 카탈로그 그대로
- [todo] T-105 | build | P0 | P-01 메인 — 3초 규칙(가치 제안·실데이터 카드≥2·신뢰 수치·CTA), 히어로 일러스트, 부위 아이콘 6, 인기 시술 썸네일 카드(링크), 병원 카드(링크), 칼럼 카드. **M1 시작점이라 순서 앞당김** | T-100c | `docs/layouts/P-01.md`
- [todo] T-103 | build | P0 | P-03 시술 가이드 — 히어로 일러스트, AI 답변용 요약 박스(복사 버튼), 요약 4칸 아이콘, 시술 위치·회복 타임라인 다이어그램, 가격 분포 바 차트, 병원 비교 바(링크), 스크롤 진행 표시, FAQ 아코디언 애니메이션, 관련 시술 썸네일 카드, 구조화 데이터 토글 | T-100c | 기존 브랜치 재사용 가능. `docs/layouts/P-03.md`. 회복기간 = 일상 복귀(T-013 결정)
- [todo] T-104 | build | P0 | P-05 병원 상세 — 커버 패턴, 지도(키 없으면 정적 지도 SVG+링크), 시술 가격 범위 바, 연락 버튼(is_partner 분기), 비교 병원 카드(링크), `is_demo` 표기 | T-100c | `docs/layouts/P-05.md`
- [todo] T-109 | build | P0 | Edge Functions `submit-lead`·`admin-leads`·`qualify-lead` + mock 모드 | T-100 | T-082 70 3-5·3-6·3-16: EF-1~EF-5(+`metrics-agg`·`retention-status`), `_shared/*.ts`, `lib/lead-client.ts`, lead-mode 생성, build-data seed·DB id 비교, `pages.yml` e2e·post-deploy·daily·metrics 잡(EC-03·04). 30-data(T-083) 승인 뒤 착수
- [todo] T-101 | build | P0 | P-06 상담 폼 — 2단계 진행 표시기, 시술 썸네일 칩, 인라인 검증, 요약 카드, 제출 중 상태, 실패 시 값 보존 | T-100c, T-109 | `docs/layouts/P-06.md`
- [todo] T-102 | build | P0 | P-07 완료 — 완료 애니메이션, 체크리스트, 다음 단계 카드, **"이 전환은 이렇게 기록됩니다" 투명성 블록**(generate_lead 파라미터·GTM 태그명) | T-101 | `docs/layouts/P-07.md`
- [todo] T-120 | build | P0 | 전 페이지 "구조화 데이터 보기" 토글 컴포넌트 + 리치 결과 테스트 링크 | T-103 |
- [todo] T-130 | build | P0 | **M1 흐름 검수**: `tests/e2e/flow.spec.ts`(메인→가이드→병원→상담→완료, 375·1280, 배포 URL·로컬 둘 다) + reviewer가 배포 URL에서 전 흐름 클릭 + 최종 질문. 통과해야 M1 | T-105, T-103, T-104, T-101, T-102, T-120 |
- [todo] T-106 | build | P1 | P-12 광고 랜딩 — 풀폭 히어로, 신뢰 수치 3블록, 혜택 아이콘, 인라인 폼, A/B | T-130 | M2
- [todo] T-107 | build | P1 | A-01 관리자 — 상태 뱃지, 스파크라인, 퍼널 미니 차트 | T-130 | M2
- [todo] T-121 | build | P1 | `/insights` 공개 인사이트 페이지 — 퍼널·유입 채널·키워드 순위·AEO 인용률·CPL (키 없으면 "수집 중" + 구조) | T-130 | M2. 공고 요건 증명 핵심
- [todo] T-108 | build | P1 | [human-gate] C-01 약관·개인정보처리방침 | T-100c | M2. 95-legal-ops 3-6·3-13 기준(백업 잔존 고지, 푸터 사업자 정보·면책). T-079 후속: /privacy GA4 "14개월"과 실제 보존 설정 캡처 대조
- [todo] T-111 | build | P1 | 폴리시 패스 | T-130 | M2
- [todo] T-110 | build | P1 | 유저 흐름 GIF | T-130 | M2

## tracking
- [todo] T-200 | tracking | P0 | generate_lead (P-07) + GTM 태그·트리거 — **T-102와 동시 진행**(M1 게이트 예외) | T-102 |
- [todo] T-201 | tracking | P0 | form_start, form_step2 — T-101과 동시 | T-101 |
- [todo] T-202 | tracking | P0 | view_procedure, view_clinic, view_lp | T-130 |
- [todo] T-203 | tracking | P0 | click_cta, phone_click, kakao_click | T-130 |
- [todo] T-204 | tracking | P0 | Consent Mode v2 + CAPI(Edge Function) 연결·중복 제거 검증 | T-200, T-109 | T-082 70 3-8·3-10·3-16: `lib/gtm.ts`(큐 정리·철회)·`lib/csp.ts`·`lib/attribution.ts`, layout referrer·CSP meta, consent ad_personalization 고정(EC-01), `scripts/meta-dedup-test.mjs` + P-07 `meta_test_lead`
- [todo] T-205 | tracking | P0 | GA4 Data API로 이벤트 수신 자동 검증 스크립트 (DebugView 대체) | T-200 |
- [todo] T-206 | tracking | P1 | scroll_depth, search, click_affiliate, expand_faq, lead_qualified | T-107 |

## content
- [todo] T-300 | content | P0 | 쌍꺼풀 수술 | T-130 |
- [todo] T-301 | content | P0 | 앞트임 | T-130 |
- [todo] T-302 | content | P0 | 눈매교정 | T-130 |
- [todo] T-303 | content | P0 | 눈밑지방재배치 | T-130 |
- [todo] T-304 | content | P1 | 상안검 | T-130 |
- [todo] T-305 | content | P1 | 하안검 | T-130 |
- [todo] T-306 | content | P1 | [human-gate] 병원 10곳 공개 정보 CSV(병원 홈페이지 기준: 이름·주소·진료과목·운영시간, 출처 URL) → 사람 확인 후 등록 + 제휴 섭외 메일 초안 | T-130 | 심평원 API 미사용

## seo
- [todo] T-402 | seo | P0 | AEO 측정: 질문 20개 × 엔진 4개 주간 시트 + `aeo_checks` + /insights 노출 (D3) — M1 직후 시작, 4주 연속 | T-103 |
- [todo] T-400 | seo | **P0 — 지금** | sitemap/robots/llms.txt 생성·배포 + 구글 서치콘솔 등록(사람 1회) + 네이버 서치어드바이저(도메인 연결 후) — 색인에 2~4주 걸리므로 M1과 병렬 | 배포 URL(있음) | **M1 게이트 예외** 게이트 충족: 첫 Pages 배포 성공(2026-10-25, https://jaehoonkor.github.io/realsurgery/)
- [todo] T-401 | seo | P1 | 순위 추적: 서치콘솔 API(서비스계정)로 keywords.md 20개 주간 수집 자동화 | T-300~303, T-001b |

## ads
- [needs-approval] T-500 | ads | P0 | 메타 워밍업(트래픽 1만 원/일 × 7일) → Lead 전환 10만 원 + 네이버 검색 10만 원 집행 승인 | T-102, T-200, T-087 | **P-06/07 라이브 즉시 워밍업 승인 요청** (광고 학습 1~2주). T-079 90 v3 기준 안: 메타 Lead 단일 집행 11-10~11-30 168,000원(캠페인 1·세트 1 Advantage+·소재 3, "학습 제한 예상" 사전 고지), 네이버는 정보형 롱테일 + CPC 상한. 미승인·심사 거절 시 D5 오가닉판·D6 미집행판. 95 K4: 메타가 건강 광고주 Lead 최적화를 제한할 수 있음
- [todo] T-502 | ads | P0 | 메타 소재 10안 + 95-legal-ops 3-2 체크리스트 통과 + 캠페인 구조도 (D6 준비) | T-087 |
- [todo] T-141 | deliverables | P1 | PDF·지표 생성 스크립트(제출물 D2~D6 자동 취합) | T-121 | T-082 70 3-13 QG-15·3-14: `lib/metrics/*.ts`, `build-metrics.mjs --check`·`ga4-report.mjs`·`gtm-export.mjs`, zod, `.gitignore` `reports/leads/*.csv`
- [todo] T-140 | deliverables | P0 | 1장 요약 커버(D8) + 제출물 D1~D7 취합·검수(hiring-reviewer) | D1~D7 |
- [todo] T-501 | ads | P1 | 리포트 스크립트(scripts/ads-report.py) 작성·더미 검증 | — |

## review
(review 상태 작업이 여기로 이동)
