# 개선 루프 목표·채점 기준 (GOAL)

## 궁극 목표
1. 성형외과 개발·마케팅팀(기술 SEO·JSON-LD, AEO, GA4/GTM 리드 트래킹, 검색광고 분석·리포트, 메타 광고 최적화) 채용 합격용 포트폴리오다.
2. 리얼성형은 강남언니·바비톡·토스 옆에 놓아도 어색하지 않은 **수익형 SaaS** 로 보이고 동작해야 한다. 데모처럼 보이면 실패다.
3. 매 사이클 면접관이 5분 안에 확인할 증거(스크린샷·여정·dataLayer·JSON-LD·리포트)를 하나 이상 더 쌓는다.

## 채점 방법
- 8개 영역을 0~5점(0.5 단위)으로 매긴다. 한 단계는 **그 단계와 아래 단계 조건을 모두** 충족해야 받는다. 다음 단계 조건의 절반 이상이면 +0.5.
- 근거는 파일 경로로 남긴다: `reports/audit/<run>/summary.md`·`report.json`·`screens/*`(Read 로 연 것만), 테스트 출력, 코드 위치.
- 숫자(감사 자동 신호)만으로 4점 이상을 주지 않는다. 스크린샷을 눈으로 보고 QUALITY.md 3절을 대조한다.
- **목표: 모든 영역 ≥ 4, A ≥ 4.5** (합계 만점 40). 기록: `backlog/scorecard.md`.

## 영역별 기준
**A 첫인상·비주얼** — 근거: 전 경로 `*-fold.png`·`*-sheet*.jpg`(375·1280)
- 0 깨진 레이아웃·가로 스크롤·깨진 이미지 / 1 아이콘 출처 혼재(이모지·선·손그림), 콘텐츠 이미지 0장, 같은 그림 반복
- 2 토큰·여백은 일관되나 카드가 텍스트뿐, QUALITY §3 "템플릿 느낌" 항목 위반 1개 이상
- 3 홈·시술·병원 카드에 실제 이미지, 아이콘 세트 하나, 모바일 첫 화면에 시각 요소. 큰 공백 화면이 남음(P-03 상단, P-06 1280)
- 4 전 P0 화면 첫 화면에 의미 있는 시각 요소, 1280 좌우 공백 없음, `no-content-image`·`fold-no-visual`·`overflow-x` 0건(약관·폼·404 제외)
- 5 스크린샷만으로 실서비스와 구분 안 됨: 이미지 QA(asset-plan §9) 통과본만 사용, 히어로 1회 등장·완료 팝 등 모션 규칙 준수, auditor·reviewer 모두 §3 위반 0

**B 핵심 흐름** — 근거: 감사 여정 표, `pnpm test:e2e`
- 0 여정 단계 실패·깨진 내부 링크 / 1 흐름은 끝나지만 E2E 실패 또는 콘솔 에러
- 2 두 여정(검색→가이드→상담→완료, 홈→병원→상담) 통과, 로딩·빈·에러 상태 누락 화면 있음
- 3 두 여정 375·1280 통과, E2E 전부 통과, 콘솔 0
- 4 모든 콘텐츠 화면에서 상담 CTA 1탭(헤더·하단 바·본문 중간), 폼 오류 시 입력 보존·중복 제출 방지, 단계마다 다음 행동이 하나로 보임(스크린샷)
- 5 P-12 광고 랜딩까지 같은 품질로 통과, 404·검색 0건에서 복귀 경로

**C 콘텐츠 밀도·신뢰** — 근거: `text-wall`(전체 감사, 375 기준), 시트, 출처 목록
- 0 lorem·"테스트"·"샘플"·`render-glitch`, 출처 없는 시술 수치 / 1 텍스트 벽 5곳 이상 / 2 텍스트 벽 3~4곳
- 3 텍스트 벽 1~2곳, 시술 화면마다 출처 3개 이상·최종 수정일·작성 주체
- 4 텍스트 벽 0곳(375·1280), 가격·회복은 도표(PriceBar·타임라인), 예시 데이터·AI 이미지 표기 명확
- 5 시술 10편 요약 박스 = JSON-LD = FAQ 일치, 시술↔병원↔칼럼 상호 링크, 의료 검수 표기(사람 항목) 반영

**D 기술 SEO** — 근거: report.json `meta`·`jsonLd`, sitemap.xml, robots.txt, `pnpm lh`
- 0 색인 화면에 title·canonical 없음 또는 H1≠1 / 1 길이 규칙 위반 다수(6화면 이상)
- 2 title ≤60자·description 120~150자 대부분 충족, 기대 JSON-LD 일부 누락
- 3 색인 화면 전부 메타·canonical·og:image·H1 1개, `jsonld-expected` 0, sitemap 에 실제 화면만, /consult/done 차단
- 4 Lighthouse SEO 100(/, P-03, P-05, P-10 대표), 한글 slug 인코딩 정상, 고아 페이지 0, 404 상태·복귀 링크
- 5 서치콘솔·네이버 인증 메타가 env 로 주입되고 리치 결과 테스트 캡처 확보(사람 키 필요)

**E AEO** — 근거: 시술 페이지 본문·FAQ·JSON-LD, `llms.txt`, robots
- 0 FAQ·직답 없음 / 1 FAQ 있으나 FAQPage 없음 / 2 P-03 FAQPage·직답 있으나 H2 일부가 질문형 아님
- 3 시술 10편 모두 첫 문단 직답(2~3문장)·질문형 H2·FAQ 5개·출처, llms.txt 에 전 시술·칼럼
- 4 요약 박스=JSON-LD=FAQ 수치 일치 테스트, 수치는 표, 작성자·수정일(E-E-A-T), robots 가 GPTBot·ClaudeBot·PerplexityBot 허용
- 5 AEO 측정 시트(핵심 질문 20개, 주 1회) 템플릿 + 첫 측정 기록

**F 측정** — 근거: 감사 여정 dataLayer 확인, `docs/tracking/*`, `lib/track.ts`
- 0 generate_lead 0회 또는 2회 이상(새로고침 포함) / 1 파라미터 불일치(value≠50000·KRW, lead_id 없음)
- 2 lead 여정 확인 통과, 퍼널 이벤트 일부 누락(form_start·form_step2·view_*·click_cta)
- 3 두 여정 dataLayer 확인 전부 ✓, Consent Mode 기본 denied·consent_update, 하드코딩 태그 0, GTM 컨테이너 JSON 21 이벤트
- 4 이벤트 사전(tracking-plan 3절)↔`lib/track.ts` 일치 테스트, `_utm` 첫 유입 E2E, 리포트 템플릿에 CPL·예약확정률 계산식
- 5 실제 GTM·GA4·Meta ID 로 DebugView·Meta 테스트 이벤트 수신 증거(사람 키 T-001 필요)

**G 성능·접근성** — 근거: 감사 LCP·CLS·axe·전송량, `pnpm test:a11y`, `pnpm lh`
- 0 axe critical 또는 콘솔 에러 다수 / 1 axe serious 다수, 모바일 LCP(감사 근사) > 3s
- 2 axe 0, LCP ≤ 2.5s, CLS ≤ 0.1
- 3 전 경로·두 폭 axe 0, CLS ≤ 0.05, 첫 로드 JS ≤ 150KB, 44px 미만 터치 타겟 0
- 4 `pnpm lh` 대표 4화면(/, P-03, P-05, P-06) 모바일 성능 ≥90·접근성 ≥95·권장사항 ≥95·SEO 100, LCP ≤ 2.0s, CLS ≤ 0.05
- 5 전 경로 lh 통과, 이미지 용량 예산(asset-plan §10) 준수

**H 법·의료광고 안전** — 근거: `jsonld-forbidden`·`ad-safety`, 푸터·동의 화면, 콘텐츠
- 0 AggregateRating·Review·평점·전후 사진·효과 보장 1건이라도 / 1 출처 없는 수치, 병원 순위·추천 표현
- 2 금지 항목 0, 면책·동의 문구 일부 누락
- 3 금지 0, 푸터 면책 문구, 민감정보 별도 [필수]·제3자 제공 [선택], 개인정보처리방침, 예시 데이터 표기
- 4 AI 생성 이미지 고지(푸터 1줄)·'예시 이미지' 라벨, 광고 소재 규칙 문서화, `ad-safety` 0(오탐은 findings 에 사유 기록)
- 5 사람 확인 항목(약관 human-gate, 변호사 검토 권장) 완료 표시

## 하지 않는 것 (가드레일)
- `main` 에 merge·push·배포하지 않는다. 루프는 `feat/m1-flow` 에만 push 한다. main 반영은 오너가 직접 한다.
- 돈이 드는 실행은 `backlog/budget.md` 승인 표의 항목만, 잔액 안에서만 한다(이미지·영상·광고·유료 API·도메인). 나머지는 TASKS "사람 확인 필요".
- `content/images/request.json` 을 고치지 않는다(push 되면 CI 이미지 생성이 돌아 비용이 생긴다). 생성은 로컬 `scripts/gen-images.mjs` 로만.
- 테스트·기준을 약화하지 않는다: 기대값 완화, `test.skip`·`fixme` 추가, `LIMITS`·QUALITY 수치 변경, 측정 회피용 `data-visual`(실제 도표·그림에만 쓴다) 금지.
- 가짜 데이터를 실제처럼 보이게 하지 않는다: 예시 병원은 "예시 데이터"·"예시 이미지" 표기, 지어낸 통계·순위·후기 수·리뷰 금지.
- 전후 사진, 평점(AggregateRating·Review), 효과 보장·"최고" 표현 금지. 시술 수치에는 출처.
- 개인정보 실데이터와 키 값을 로그·커밋·스크린샷에 넣지 않는다(`.env.local` 내용 출력 금지). 태그는 `dataLayer.push` 만.
- 외부 서비스 설정 변경·외부 발송(GTM 게시, 광고 집행, 메일)과 삭제·결제는 하지 않는다.
- 스펙과 충돌하면 `docs/spec/screen-spec.md` 를 고치지 말고 `spec-question` 으로 올린다.
- CLAUDE.md 한글 경로 규칙: `C:\rs` 에서만 작업, 파일·폴더 이름 ASCII, `.ps1` 은 UTF-8 BOM, 파일 I/O 인코딩 명시, `.cmd`·`.bat` 에 한글 금지.

## 관련 파일
`.claude/commands/improve.md`(1사이클 절차) · `.claude/agents/{auditor,ui-builder,content-seo,tracker,asset-maker,perf,reviewer}.md` · `scripts/audit.mjs`(`pnpm audit:site`) · `backlog/scorecard.md` · `backlog/budget.md` · `scripts/loop/*.ps1` · `docs/loop/START.md`
