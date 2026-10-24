# 시술 가이드 MDX 템플릿 (P-03 본문) — content lane 용

P-03 시술 상세(`/procedures/{slug}/`)의 원본은 `content/procedures/<시술 id>.mdx` 1개 파일이다. 파일을 추가하면 다음 빌드에서 페이지가 생긴다.
복사해서 시작할 파일: `content/procedures/_template.mdx` (밑줄로 시작하는 파일은 빌드 제외). 작성 예시 10편: 같은 폴더.

## 1. 파일 이름
- `content/procedures/<id>.mdx` — id 는 ASCII 소문자·숫자·하이픈(예: `double-eyelid.mdx`). CLAUDE.md "파일명 ASCII" 규칙 때문에 한글 slug 가 아니라 id 를 쓴다. 한글 URL 은 프런트매터 `slug`.
- `data/seed/procedures.json` 에는 `{ "id", "view_count" }` 만 둔다(새 시술은 행을 추가하지 않아도 되며 view_count 0). 시술 콘텐츠 필드를 여기 쓰면 빌드가 실패한다.

## 2. 프런트매터 (모두 필수, 표시된 2개만 선택)
| 키 | 형식 | 규칙 |
| --- | --- | --- |
| name | 문자열 | H1·JSON-LD name. title `{name} 가격·회복기간·부작용 총정리 (YYYY) \| 리얼성형` 60자 이내 |
| slug | 문자열 | 한글·소문자·숫자·하이픈 (`쌍꺼풀-수술`) |
| category | 카테고리 id | `eye` `nose` `contour` `lifting` `skin` `breast` (data/seed/categories.json) |
| summary | 문자열 | 직답 2~3문장. 가격이 있으면 요약 박스와 같은 표기 `50만~250만 원` 을 그대로 포함 |
| description | 문자열 | 검색 설명 120~150자(직답 1문장 + 가격 범위) |
| price_low / price_high | 정수(원) 또는 null | low ≤ high. 표기는 자동(`500000` → `50만`) |
| price_note | 문자열 또는 null (선택) | 가격 단위 보충(`1회 기준`) |
| duration_min | 정수(분) 또는 null | 표기 자동(`90` → `약 1시간 30분`) |
| recovery_days | 정수(일) 또는 null | 표기 자동(`0` → `당일 복귀`, `14` → `약 2주`) |
| anesthesia | 문자열 | 요약 박스 "마취 방식" |
| procedure_type | `surgical` \| `noninvasive` \| `percutaneous` | schema.org procedureType |
| body_location | 문자열 | schema.org bodyLocation (`윗눈꺼풀`) |
| preparation | 문자열 | schema.org preparation (수술 전 진찰·검사 1~2문장) |
| author | 저자 id | data/seed/authors.json (`editorial`) |
| medical_reviewer | 저자 id 또는 null (선택) | 의료 자문의. 정해지기 전에는 null — 화면은 "자문의 검토 전" |
| unverified_facts | `price` `duration` `recovery` `anesthesia` 중 배열 (선택) | 출처로 확인하지 못한 요약 박스 칸. 그 칸 값 아래 "출처 검증 전"이 보이고 JSON-LD(howPerformed·followup)에도 "[출처 검증 전]"이 붙는다. `price` 외 칸이 있으면 본문에 `{/* MD-REVIEW: 요약 박스 … */}` 메모 필수. 값이 null 인 칸은 넣지 않는다 |
| updated_at | `"YYYY-MM-DD"` (따옴표) | 최종 수정일·title 연도 |
| sources | `[{ title, url }]` 3개 이상 | https, 중복 금지, 사이트 첫 화면(경로 없는 URL) 금지. 순서 = 본문 각주 번호. 기관 홈·목록이 아니라 각주 문장의 내용이 적힌 **구체 페이지**(title 은 "기관 — 페이지 제목") |
| faqs | `[{ question, answer }]` 5~8개 | 질문은 물음표로 끝나는 실제 검색어 형태. **가격(비용) FAQ 답변에 최저·최고가를 요약 박스 표기(`50만`, `250만`)로** |

요약 박스 4칸(가격 범위·소요시간·회복기간·마취 방식)과 JSON-LD(MedicalProcedure description·howPerformed·followup), FAQ 는 같은 값에서 만들어진다(3중 일치는 `scripts/check-triple.mjs` 가 빌드마다 검사).

**요약 박스 수치의 근거(빌드 검사, `scripts/fact-support.mjs`)** — 요약 박스는 JSON-LD 로도 나가므로 같은 페이지의 본문·FAQ·출처와 어긋나면 안 된다(리뷰 T-103 r2 반려 1).
- `duration_min`·`recovery_days`·`anesthesia` 는 `unverified_facts` 에 없으면, 같은 값이 **본문 문단·목록 문장 또는 FAQ 답변**에 있어야 한다. 표와 "요약 박스"를 언급한 문장은 근거로 치지 않는다(다른 시술 값을 옮겨 적은 비교 표·자기 참조).
- 판정은 쉼표·문장 끝으로 나눈 절 단위: 소요시간은 "소요·수술·시술·걸리" 가 있는 절, 회복기간은 "일상·생활·복귀·사회·회복·외출·정상" 이 있는 절(또는 회복기간을 묻는 FAQ 답변 전체), 마취 방식은 "마취·진정제" 가 있는 절에 각 종류(국소·수면·전신·진정·연고)가 있어야 한다. 범위("7~10일")는 양 끝 값 중 하나와 같으면 된다 — 출처가 범위면 **위쪽 끝**(보수적인 값)을 프런트매터에 쓴다. "30분 전", "3시간 간격", "3~4일째" 같은 시점·간격 표현은 소요시간·기간으로, "입원"이 있는 절은 회복기간으로 치지 않는다.
- 근거 문장에는 그 값을 적은 출처 각주를 단다. 출처에 값이 없으면 값을 지어내지 말고 `unverified_facts` + MD-REVIEW.
- 한계: 같은 페이지의 다른 시술 비교 문장(예: 실리프팅 페이지의 안면 거상 수술 회복 2~3주)도 맥락어가 맞으면 근거로 잡힐 수 있다. 수치를 바꿀 때는 근거 문장이 그 시술에 대한 것인지 사람이 확인한다.
- 다른 시술 가이드의 비교 표(예: 쌍꺼풀 페이지의 눈매교정 회복기간)는 그 시술의 요약 박스 값을 손으로 옮긴 것이다. 요약 박스 값을 바꾸면 `grep` 으로 다른 MDX 의 비교 표도 함께 고친다(자동 검사 없음).

## 3. 본문 규칙 (AEO)
- H2 정확히 5개, 이 순서, 문장형 질문(물음표로 끝): ① 누가 받나 ② 비용·가격 ③ 회복 ④ 부작용·주의 ⑤ 비슷한 시술 비교(비교·차이·다른가·비슷한 중 한 단어).
- 각 H2 바로 아래 첫 블록은 직답 문단(첫 문장 20~100자, 권장 40~60자). 표·목록은 그 다음.
- 섹션마다 출처 각주 `[n]` 1개 이상, n = sources 순번. 모든 출처가 한 번 이상 인용돼야 한다. GFM 각주 `[^1]` 은 쓰지 않는다.
- 각주 `[n]` 은 sources[n] 페이지에서 **그 문장의 내용을 확인할 수 있을 때만** 단다(문장 끝 각주는 문장 전체를 뒷받침해야 하므로, 출처에 없는 내용은 별도 문장으로 나눈다). 조언 문장("견적서를 확인하세요")에는 각주를 달지 않는다.
- 출처를 확인하지 못한 수치·사실(특히 가격 범위)에는 기관 각주를 달지 않고 근거를 사실대로 적는다: "참고 가격 … 이 범위는 출처 검증 전 예시 데이터입니다" + `{/* MD-REVIEW: … */}`. 표 머리글도 "참고 가격(검증 전)". 학회·의사회·심평원 등에 가격을 귀속하지 않는다.
- 출처 확인 도구: `pnpm verify:sources` (`scripts/verify-sources.mjs`) — 10편의 sources URL 이 HTTP 200 인지, 각주 문장이 기대는 문구가 페이지(법령 PDF 포함)에 그대로 있는지 확인한다. 네트워크를 쓰므로 `pnpm build`·CI 게이트가 아닌 수동 도구다. 새 출처·각주 문장을 넣으면 스크립트의 `CHECK` 표에 URL 키와 확인 문구를 추가한다(키가 없는 URL 은 문제로 센다). 2026-10-25 기준 결과는 로그 `backlog/log/2026-10-25-builder-T-103-r3.md`.
- 린트가 막는 출처는 **경로 없는 사이트 첫 화면**뿐이다(`scripts/procedure-mdx.mjs` isSiteRoot). 기관의 목록·검색 결과 페이지처럼 경로가 있는 URL 은 통과하므로, 출처가 각주 문장을 실제로 담고 있는지는 리뷰와 `pnpm verify:sources` 의 확인 문구로만 보장된다.
- content lane(T-300~)은 가격 출처를 찾으면 "검증 전" 문구와 MD-REVIEW 를 지우고 가격이 적힌 페이지를 sources 에 넣고, `unverified_facts` 에서 `price` 를 뺀다.
- 수치는 표(GFM 표). `~` 는 그대로 써도 취소선이 되지 않는다.
- 금지: H1, 링크·URL(내부 링크는 화면이 관련 시술·가격 표로 만든다), 이미지, HTML·JSX 태그, `{ }` 표현식, import/export, 코드 블록, 금칙어(보장·완치·부작용 없·100%·최고·1위·전후 사진·테스트·샘플 등), 면책 문구(레이아웃이 붙인다).
- 의료 자문 검토가 필요한 문장 표시는 MDX 주석 `{/* MD-REVIEW: 내용 */}` (HTML 주석 `<!-- -->` 은 MDX 에서 오류).

## 4. 검사·반영 순서
1. `pnpm lint:medical <id>` — 프런트매터·본문 규칙·금칙어·MDX 컴파일
2. `pnpm data:sql` — `supabase/seed.sql` 재생성(procedures·procedure_faqs upsert, content_mdx = 파일 전체). pipelines/03 의 `seed-procedure.ts` 역할. 실제 DB 반영은 Supabase 키가 생긴 뒤 T-109 `db push`(needs-key)
3. `pnpm build` — 빌드 데이터 검증 → 페이지 생성 → `validate-jsonld`(JSON-LD 필수 속성·평점 금지) → `check-triple`(요약 박스 = JSON-LD = FAQ)
4. `pnpm test:e2e` — 시술 전체 페이지 200·구성 요소·가로 스크롤·HTML 크기(gzip 14KB 이하) 검사

## 5. 화면이 자동으로 붙이는 것
브레드크럼(홈 › 시술 가이드 › 부위 › 시술), 요약 박스, 목차(H2 5개 + 가격 비교 + FAQ), 병원별 가격 비교 표(clinic_procedures 최저가 순 5곳), 중간·하단 상담 CTA(상담 폼 T-101 이후), FAQ 아코디언, 회복기 추천템(affiliate_items 가 있을 때), 작성·검토 정보와 출처 목록, 관련 시술 카드 4개, 푸터 면책 문구, JSON-LD(MedicalWebPage·MedicalProcedure·FAQPage·BreadcrumbList).
