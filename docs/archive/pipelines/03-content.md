# 03 content — 시술 가이드 MDX 루프

**단위**: 시술 1개. 목록은 `backlog/keywords.md` (눈 카테고리 우선: 쌍꺼풀 수술, 앞트임, 눈매교정, 눈밑지방재배치, 상안검, 하안검 …).
**에이전트**: `.claude/agents/writer.md`
**선행**: build P-03 done.

## READ
`screen-spec.md` 4절 P-03 표, 6절 전체(테크니컬·JSON-LD·AEO), 1절 법적 고려.

## ACT
1. 조사: 웹 검색으로 가격 범위·소요시간·회복기간·마취·부작용을 **3개 이상 출처**에서 수집. WebSearch가 안 되면 `backlog/sources.md`의 시드 URL을 WebFetch로 순회. 출처 URL을 `sources` 프런트매터에 기록. 출처 없는 수치는 쓰지 않는다.
2. `content/procedures/<slug>.mdx` 작성. 프런트매터: name, slug, category, summary(직답 2~3문장), price_low, price_high, duration_min, recovery_days, anesthesia, updated_at, sources[], faqs[] (5~8개, 질문은 실제 검색어 형태).
3. 본문 H2 5개 고정: 누가 받나 / 비용은 얼마 / 회복은 며칠 / 부작용·주의 / 비슷한 시술 비교. 각 H2 바로 아래 한 문단 직답(40~60자 문장).
4. 수치는 표로. 전후 사진·효과 보장·"최고" 류 표현 금지. 면책 문구는 레이아웃이 붙이므로 본문에 넣지 않는다.
5. `scripts/seed-procedure.ts <slug>`로 프런트매터 → procedures·procedure_faqs 테이블 upsert.
6. 금칙어 검사: `scripts/lint-medical.mjs` (보장, 완치, 부작용 없음, 100%, 최고, 1위, 전후 등).

## VERIFY
- [ ] 프런트매터 필수 필드 전부 존재, 숫자 타입 맞음
- [ ] 요약 박스 값 == JSON-LD 값 == FAQ 값 (`scripts/check-triple.mjs`)
- [ ] 출처 3개 이상, 모두 200 응답
- [ ] 금칙어 0건
- [ ] JSON-LD 유효성 (`scripts/validate-jsonld.mjs` — schema.org 타입·필수 속성)
- [ ] title 60자 이내, description 120~150자
- [ ] 내부 링크: 관련 시술 2개 이상, 병원 상세 1개 이상

## REPORT
로그 + TASKS.md review. 의료 자문 의사 검토가 필요한 문장은 `<!-- MD-REVIEW -->` 주석으로 표시해 목록을 로그에 남긴다.

## 종료 조건
2단계 게이트: 20편 done + 색인 20페이지(사람 확인).
