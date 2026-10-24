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
| updated_at | `"YYYY-MM-DD"` (따옴표) | 최종 수정일·title 연도 |
| sources | `[{ title, url }]` 3개 이상 | https, 중복 금지. 순서 = 본문 각주 번호 |
| faqs | `[{ question, answer }]` 5~8개 | 질문은 물음표로 끝나는 실제 검색어 형태. **가격(비용) FAQ 답변에 최저·최고가를 요약 박스 표기(`50만`, `250만`)로** |

요약 박스 4칸(가격 범위·소요시간·회복기간·마취 방식)과 JSON-LD(MedicalProcedure description·howPerformed·followup), FAQ 는 같은 값에서 만들어진다(3중 일치는 `scripts/check-triple.mjs` 가 빌드마다 검사).

## 3. 본문 규칙 (AEO)
- H2 정확히 5개, 이 순서, 문장형 질문(물음표로 끝): ① 누가 받나 ② 비용·가격 ③ 회복 ④ 부작용·주의 ⑤ 비슷한 시술 비교(비교·차이·다른가·비슷한 중 한 단어).
- 각 H2 바로 아래 첫 블록은 직답 문단(첫 문장 20~100자, 권장 40~60자). 표·목록은 그 다음.
- 섹션마다 출처 각주 `[n]` 1개 이상, n = sources 순번. 모든 출처가 한 번 이상 인용돼야 한다. GFM 각주 `[^1]` 은 쓰지 않는다.
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
