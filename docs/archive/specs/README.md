# 정의서 체계 (SSOT 계층)

화면 정의서 하나로는 부족하다. 분야별 정의서가 각각 "무엇이 맞는가"를 정의하고, 화면 정의서·레이아웃 명세는 그것을 조립한다. **구현은 정의서 승인 뒤에만** 시작한다.

```
docs/specs/
├── 00-product.md      제품 정의서   — 목적·타겟·가치 제안·KPI·수익·법적 경계·마일스톤        [owner: product-lead]
├── 10-design.md       디자인 정의서 — 브랜드·토큰·타이포·그리드·컴포넌트 카탈로그·모션·일러스트 규칙 [owner: designer]
├── 20-content.md      콘텐츠 정의서 — 톤·용어·문장 규칙·출처 기준·의료 표현 경계·AEO 작성법        [owner: content-lead]
├── 30-data.md         데이터 정의서 — ERD·컬럼 정의·제약·시드 규칙·개인정보 분류·보존             [owner: data-architect]
├── 40-tracking.md     트래킹 정의서 — 이벤트 사전·파라미터 스키마·전환 정의·GTM 구조·CAPI·동의     [owner: analytics-lead]
├── 50-seo-aeo.md      SEO/AEO 정의서 — URL·메타 템플릿·JSON-LD 스키마·내부링크·llms.txt·측정 방법  [owner: seo-lead]
├── 60-growth.md       그로스 정의서 — 광고 캠페인 구조·소재 규칙·랜딩 매핑·리포트 지표·실험 설계  [owner: growth-lead]
├── 70-engineering.md  엔지니어링 정의서 — 아키텍처·정적 export 제약·Edge Fn·보안·품질 게이트·배포  [owner: tech-lead]
├── 80-quality.md      품질 정의서   — (= docs/QUALITY.md) 완료 기준·검수 절차                     [owner: reviewer]
├── 90-deliverables.md 제출물 정의서 — 심사자가 보는 제출물 D1~D8 양식·증거·담당·기한                 [owner: product-lead]
└── 95-legal-ops.md    법무·운영 정의서 — 금지 표현·소재 사전검수·거절 대응·리드 응대 SLA             [owner: product-lead]

docs/spec/screen-spec.md   화면 정의서 — 위 정의서를 조립해 화면별로 구성·기능·데이터·이벤트 명시
docs/layouts/<ID>.md       레이아웃 명세 — 화면 1개의 섹션·비주얼·인터랙션 와이어
docs/BENCHMARK.md          벤치마크 실측 — 넘어야 할 수치 목표
```

## 타임박스
정의서 1개 = 루프 1회(≤ 90분). M1 전 **완본**은 00·70·40·50·90·95, **1쪽 요약**으로 시작하는 것은 10·20·30·60(구현 중 보강).

## 각 정의서의 공통 형식
1. 목적과 범위 (이 정의서가 결정하는 것 / 안 하는 것)
2. 원칙 3~5개
3. 규칙 (표 위주, 형용사 금지, 숫자·예시 필수)
4. 다른 정의서와의 접점 (참조·충돌 시 우선순위)
5. 검수 체크리스트 (reviewer가 이 정의서로 화면을 판정할 때 쓰는 항목)
6. 변경 이력

## 작성·검토 절차 (파이프라인 08-specs)
1. **작성**: owner 서브에이전트가 초안. 입력 = 제품 정의서 + BENCHMARK + 기존 screen-spec.
2. **교차 검토 1**: 다른 분야 owner 2명이 **한 번의 Agent 호출로 병렬** "내 분야와 충돌하는 것·빠진 것"을 지적 (예: 디자인 정의서는 content-lead·tech-lead가 검토).
3. **채용 심사자 검토**: `hiring-reviewer` 서브에이전트가 "성형외과 마케팅·개발 팀장" 관점으로 "이 정의서대로 만들면 채용하고 싶은가, 공고 요건이 드러나는가"를 판정.
4. **수정 → 승인**: 수정은 1라운드. 재확인은 hiring-reviewer 1명 + `lint-spec.mjs`. 지적·반영 표는 `backlog/log/<date>-spec-<name>.md`가 유일한 인수인계물. TASKS에 `spec:<name> done`.
5. 화면 정의서·레이아웃 명세는 분야 정의서 승인 뒤에 갱신한다.

## SSOT 선언
규범 문서는 `docs/specs/*.md`뿐이다. `screen-spec.md`·`layouts/*`는 파생물(각 행에 근거 정의서 ID 표기), `BENCHMARK.md`는 10-design의 입력 데이터, `QUALITY.md`는 80-quality의 별칭. CLAUDE.md는 링크만 가진다.

## 우선순위 충돌 시
법무·운영(95) > 제품(00) > 데이터·보안(30·70) > 트래킹(40) > SEO/AEO(50) > 품질(80) > 디자인(10) > 콘텐츠(20) > 그로스(60). 충돌은 TASKS `spec-question`으로. **정의서 간 충돌 전수 점검은 T-088(화면 정의서 재조립)에서 spec-tech-lead가 수행한다.**
