# 02 tracking — 이벤트·GTM·CAPI 루프

**단위**: 이벤트 1개 (5절 표 행). 순서: generate_lead → form_start → view_procedure → view_clinic → click_cta → phone_click → kakao_click → 나머지.
**에이전트**: `.claude/agents/tracker.md`
**선행**: build P-06·P-07 done (generate_lead), 해당 화면 done (그 외).

## READ
`screen-spec.md` 5절(해당 행 + GTM 구성 + GA4 설정), 7절 Pixel/CAPI.

## ACT
1. `lib/track.ts` — `track(name, params)` 가 `window.dataLayer.push({event: name, ...params})`만 수행. 파라미터 타입은 `lib/track.types.ts`에 5절 표대로 정의.
2. 발화 지점 코드에서 호출 확인·추가. generate_lead는 **P-07에서만**, 서버 검증 세션이 있을 때만.
3. GTM 컨테이너를 코드로 관리: `tracking/gtm/container.json`에 태그·트리거·변수 추가 → `scripts/gtm-sync.mjs`가 서비스 계정(`secrets/gcp-sa.json`)으로 GTM API에 반영해 새 버전 생성(게시는 사람 클릭 1회). 키 없으면 export JSON만 남기고 needs-key.
   - 태그 명명 `GA4 - Event - <name>`, `Meta - <PixelEvent>`
   - 트리거: Custom Event = `<name>`
   - 변수: `DLV - <param>` 하나씩
4. CAPI: Edge Function `submit-lead`(Lead)·`qualify-lead`(Schedule + GA4 Measurement Protocol) 안에서 전송, `event_id = lead_id`, fbc·fbp·sha256(phone). 브라우저는 함수 호출만.
5. Consent Mode 기본값 denied 스니펫은 `components/common/Consent.tsx`.
6. `tracking/events.md`에 이벤트 사전(이름·파라미터·발화 조건·GA4 전환 여부·픽셀 매핑) 자동 갱신.

## VERIFY
- [ ] vitest: 발화 조건 재현 시 dataLayer에 정확한 event·params 1회 push (중복 0)
- [ ] generate_lead: 새로고침·직접 접근 시 재발화 없음
- [ ] `container.json`이 GTM import 스키마 유효 (`node tracking/gtm/validate.mjs`)
- [ ] events.md의 행 수 == 5절 표 행 수 (불일치 시 spec-question)
- [ ] CAPI: `supabase functions serve`로 로컬 실행 → 테스트 이벤트 코드로 200 응답 (키 없으면 mock, needs-key)
- [ ] `scripts/ga4-verify.mjs <event>`: 로컬 Playwright로 이벤트 발화 → GA4 Data API(realtime)로 수신 확인. 서비스 계정 없으면 needs-key + DebugView 캡처 요청을 사람 게이트로

## REPORT
로그 + TASKS.md review. ga4-verify 통과(또는 needs-key 명시) 전까지 done 금지.

## 종료 조건
5절 표의 13개 이벤트 모두 done + GTM 버전 게시 1회(사람 클릭).
