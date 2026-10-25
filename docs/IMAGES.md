# 이미지·에셋 가이드

원칙: **얼굴·실사·전후 사진 없음**. 모든 시각 자료는 "정보 일러스트"다. 의료광고 심의·개인정보·저작권 리스크를 처음부터 0으로.

## 소스별 용도

| 용도 | 소스 | 규칙 |
| --- | --- | --- |
| 시술 썸네일(카드)·히어로 일러스트 | Gemini 이미지 생성 (`scripts/gen-image.mjs`) | 아래 스타일 프롬프트 고정. 생성 후 WebP 변환, 1200×800·600×400 두 사이즈 |
| 부위·UI 아이콘 | Lucide (`lucide-react`) | 커스텀 아이콘 필요 시 24px 그리드 SVG 직접 작성 |
| 절개 위치·회복 타임라인 다이어그램 | 에이전트가 SVG 직접 작성 (`components/diagrams/*`) | 토큰 색만 사용, 텍스트는 실제 `<text>`로(접근성) |
| 병원 사진 | 사용하지 않음 | 지도 임베드 + 텍스트 카드로 대체 |
| 칼럼 커버 | Gemini 생성 또는 추상 패턴 SVG | 사람 없음 |
| OG 이미지 | 빌드 시 자동 생성 (`scripts/og.mjs`, satori) | 제목 + 브랜드 배경, 1200×630 |
| 로고 | 워드마크 SVG (에이전트 제작, 3안 → 사람 선택) | 단색·흑백 변형 포함 |

## Gemini 생성 규칙 (`scripts/gen-image.mjs`)
- 환경: `GEMINI_API_KEY`, `GEMINI_IMAGE_MODEL`(기본 `gemini-2.5-flash-image`). REST: `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`, 헤더 `X-goog-api-key`. 응답 `inlineData`(base64 PNG)를 저장 후 sharp로 WebP 변환.
- 키 없으면 호출하지 않고 `public/images/placeholder/<slug>.svg`(브랜드색 기하 도형 + 시술명)를 생성, TASKS에 `needs-key`.
- 스타일 프롬프트 고정 접두사(모든 이미지 동일):
  `Flat vector illustration, soft pastel palette (#F7F3EF background, accent #D97B66 and #2F6F6B), clean geometric shapes, no people, no faces, no text, no photorealism, medical-information mood, generous whitespace, centered composition, 3:2 aspect.`
- 시술별 주제는 추상화: 쌍꺼풀 → "stylized eye outline with a gentle fold line and small sparkle", 코 → "abstract profile curve", 윤곽 → "soft geometric jawline curve". 신체 노출·수술 도구·혈액 묘사 금지.
- 한 시술당 3장 생성 → 에이전트가 Read로 열어 스타일 일관성 기준으로 1장 선택, 나머지 삭제. 선택 기준: 팔레트 일치, 얼굴 없음, 텍스트 없음, 여백.
- 파일명 ASCII: `public/images/procedures/double-eyelid.webp`, 메타 `public/images/manifest.json`(slug, 파일, 프롬프트, 생성일, 모델).
- alt 텍스트는 매니페스트에 한글로 함께 저장(예: "쌍꺼풀 수술을 상징하는 눈 일러스트").
- 일일 생성 한도: 60장(무료 티어 보호). 초과 시 다음 루프로.

## 금지
- 실제 인물·연예인·병원 사진, 전후 비교, 수술 장면, 신체 부위 실사, "효과"를 암시하는 이미지.
- 스톡 사진 중 라이선스 불명확한 것. Unsplash/Pexels만, 그것도 사람 없는 추상.
