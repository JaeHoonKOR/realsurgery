# 리얼성형 비주얼 에셋 계획 (asset-plan)

> 계획 문서다. 이 단계에서 생성·API 호출은 하지 않는다. 제작 매니페스트는 `content/images/prompts.json`. 기준일은 2026-10-26이고, 375px·1280px 전체 화면 스크린샷 11종을 검토해 작성했다.

## 0. 결론
- **문제**: 아이콘 출처가 세 가지(Fluent 3D 이모지 35종, lucide 선 아이콘, 손그림 SVG)라 질감·광원·채도가 제각각이다. 페이지 전체에 콘텐츠 이미지가 한 장도 없다. 그래서 같은 이모지가 카드마다 반복되고 텍스트만 쌓인다.
- **해법**: 하나의 시각 언어 **"Porcelain & Blue"**로 맞춘다. 커스텀 3D 아이콘 32종, 콘텐츠 이미지 39장, 광고용 영상 2편이다. 사이트 본문에는 영상을 넣지 않는다.
- **비용**(표준 단가): B1 $1.75(상한 $2.27), B2 $1.71(상한 $3.18), B3 $1.35(상한 $2.72). 합계는 약 $4.8, 상한 $8.2다.

## 1. 현재 화면 진단
| 위치 | 문제 | 관찰 |
|---|---|---|
| 전 화면 | 아이콘 세트 불일치 | 핑크 전화기, 보라 클립보드, 빨간 선물 리본(가슴), **'$' 돈주머니**(원화 서비스), 주사기(마취) |
| P-01 메인 | 콘텐츠 이미지 0장 | 대표 시술 6카드는 텍스트만 있다. 병원 카드 3장은 같은 병원 이모지라 구분이 안 된다. 흐름·칼럼 카드는 회색 박스 한가운데 이모지 하나다 |
| P-02·P-03 | 같은 그림 반복, 빈 공간 | 눈 시술 4개가 같은 눈 이모지를 쓴다. 상세 상단 우측 40%가 비어 있다. 회복 표와 타임라인이 같은 내용을 두 번 보여 준다 |
| P-04·P-05 | 사진 없는 병원 목록 | 7곳이 같은 아이콘이다. 지도 자리는 손그림 SVG다 |
| P-06 | 데스크톱 공백 | 1280px 화면에서 520px 한 열만 쓴다. 좌우가 각 380px씩 비어 있다 |
| 칼럼·404 | 표지 없음 | 16:9 회색 박스에 이모지 하나만 있다 |

## 2. 아트 디렉션 — Porcelain & Blue
흰 도자기·석고·젖빛 유리 위에 브랜드 블루를 한 줄 더한다. 로고와 PriceBar의 **둥근 블루 바**를 모든 그림의 모티프로 반복해서, 그림이 서비스(가격 범위 비교)를 말하게 한다.

| 항목 | 규칙 (4개 패밀리 공통) |
|---|---|
| 팔레트 | 흰 도자기 #FFFFFF, 쿨그레이 #F2F4F6·#E5E8EB, 블루 #3182F6(주), #8EC5FF(보조), 젖빛 유리, 은색 미세 디테일. 피치 #FFC9B0는 컷당 1곳, 면적 10% 이하. 보라·네온·원색 빨강/초록 금지 |
| 광원 | 왼쪽 위 대형 소프트박스 키 + 오른쪽 약한 필 + 약한 림. 그림자는 항상 오른쪽 아래 |
| 카메라 | 아이콘·오브젝트는 위 25°, 우측 20° 회전 3/4 뷰, 망원. 스틸은 받침대 높이 70mm. 공간은 24mm 틸트시프트 120cm, 수직선 유지 |
| 형태 | 굵고 둥근 비율, 넉넉한 베벨. 가는 장식·날카로운 모서리 금지 |
| 금지 | 글자·숫자·통화기호·로고·간판·사람·손·사실적 얼굴/눈동자/속눈썹/피부·신체·전후 대비·주사기·수술도구·피 |

| family | 쓰임 | 생성 배경 | 얹히는 표면 | 합성 | 원본→출력 |
|---|---|---|---|---|---|
| `icon` | UI 아이콘 32 | #FFFFFF | #FFF·#F2F4F6·#F9FAFB·#E8F3FF·#FFF0F1 | `mix-blend-multiply` | 1K → 256px |
| `object` | 히어로 컷아웃·흐름·칼럼 2·상담 패널·지도·404·광고 B | 컷아웃 #FFFFFF / 장면 #F2F4F6(지도 #E5E8EB) | 같은 색 영역 | 컷아웃=multiply, 장면=영역 채움 | 1K·2K → 1600/1024/640 |
| `still` | 시술 10·회복·칼럼 1·광고 A | #F2F4F6 인피니티 코브 | 이미지 영역 #F2F4F6 | object-cover, 중앙 55% 안전 영역 | 2K |
| `space` | 병원 예시 사진 14 | 실내 사진 | 카드 상단·헤더 | object-cover + **'예시 이미지'** 라벨 | 2K |

**왜 흰 배경 + multiply인가**: Gemini 이미지 모델은 알파 채널을 내지 못한다. 크로마키는 유리 재질에 초록이 번진다. 흰 배경으로 생성해 multiply로 얹으면 한 장으로 밝은 표면 5종에 모두 맞고, 접지 그림자도 자연스럽게 남는다. 제약이 두 가지 있다.
- 어두운 면(#191F28 활성 칩) 위에서는 그림이 검게 죽는다. 이때는 흰 원(28px) 안에 넣는다.
- 흰 부분은 표면색을 띠게 된다. 그래서 아이콘 몸체는 블루와 유리 위주로 설계했다.

**스타일 접미사**(영문 전문은 `prompts.json > styles`에 있다. 프롬프트 = 본문 + `Style:` + 접미사):
```
icon   : Premium 3D app-icon render… three-quarter view (25° elevation, 20° turn)… glossy-matte azure blue (#3182F6), light blue (#8EC5FF), frosted glass, white ceramic, ≤1 pale-peach accent… softbox upper left… flat pure white (#FFFFFF), object fills ~70%, never cropped… no text/numbers/currency/logos/faces/hands.
object : same materials & light; 2–4 object still life; background = exact flat color named in prompt; important objects inside central 60%; no readable UI.
still  : editorial gallery still life; matte plaster/porcelain on low rounded white plinth; seamless #F2F4F6 cove; 70mm; one blue accent (glowing line or blue glass); subject in central 55%; plaster faces = Greek-statue cast fragments, blank pupil-less eyes, no skin/lashes/hair/body/blood/instruments.
space  : photoreal unbranded Seoul aesthetic clinic interior; 24mm tilt-shift 120cm; 5200K daylight; white, light oak, terrazzo; one dusty-blue accent; empty — no people, signage, screens, posters with faces, equipment.
```

## 3. 아이콘 시스템
| 구분 | 3D 아이콘 (`ic-*`) | lucide 유지 |
|---|---|---|
| 역할 | 의미를 그림으로 전달한다: 타일·카드·체크리스트·빈 상태·페이지 헤더·CTA | 조작 신호: 쉐브론, 닫기, 외부 링크, 복사, 로딩·재시도, 검색 입력, 브레드크럼 홈, 인라인 지역 핀, 메타 줄(CalendarCheck·BookOpen·PenLine), 필드 오류, 면책 Info, 버튼 속 전화·카톡, 프리미엄 BadgeCheck, 목록 체크 |
| 표시 크기 | 32·40·48·64·72·88·96px (원본 256px, 히어로 컷아웃 384px) | 16–20px, stroke 1.75, ink-subtle 또는 brand-strong |
| 규칙 | 밝은 타일 위에 두거나, 72px 이상이면 타일 없이 단독. **24px 이하 3D 금지**. 예외는 부위 칩 24px(흰 원 안) | 의미 그림 자리에 lucide를 쓰지 않는다 |
| 유지 | 로고 SVG·favicon은 벡터 그대로 둔다 | — |

| 현재(Fluent) | 새 id | 위치 | 표시 | B |
|---|---|---|---|---|
| eye | `ic-eye` (세트 앵커) | 부위 타일·칩·헤더, P-03 요약, 히어로 탭, 폼, P-07 | 24–72 | 1 |
| nose · ruler · thread · bubbles · ribbon | `ic-nose` `ic-contour` `ic-lifting` `ic-skin` `ic-breast` | 같은 자리 | 24–72 | 1 |
| money(가격) · stopwatch · bandage · syringe | `ic-price` `ic-duration` `ic-recovery` `ic-anesthesia` | P-03 사실 4칸 | 48 | 1 |
| chat(CTA) | `ic-consult` | 상담 CTA 블록(전 페이지) | 88/64 | 1 |
| sparkles | `hero-obj-a` · `hero-obj-b` | 홈 히어로 카드 모서리 | 160/104 · 128/88 | 1 |
| money(무료) · phone · lock | `ic-free` `ic-callback` `ic-privacy` | P-06 안심 3줄, P-07 체크(전화) | 32/40 | 2 |
| stopwatch(1개월) · calendar(3개월) · chat(미정)·bulb | `ic-timing-soon` `ic-timing-later` `ic-undecided` | P-06 희망 시기, 시술 '아직 모르겠어요' | 40 | 2 |
| memo · stethoscope · money(견적) | `ic-memo` `ic-meds` `ic-quote` | P-07 체크리스트, P-03 본문 준비중 | 40/48 | 2 |
| clipboard · party | `ic-guide` `ic-done` | P-06 헤더, P-07 헤더 | 72 · 96 | 2 |
| hospital | `ic-clinic` (사진이 없을 때만) | 폴백, P-03 가격 빈 상태 | 32–48 | 2 |
| check · warning · search | `ic-check` `ic-caution` `ic-search` | 하이라이트, 출처, 제출 오류, 빈 상태 | 32–80 | 2 |
| chart · calendar(갱신) · shield · book · pin | `ic-scale` `ic-calendar` `ic-fair` `ic-source` `ic-pin` | P-04 원칙, P-05 진료시간·지도, P-01 출처 | 32–72 | 2 |
| memo(예시 데이터 안내 24px) · chat(카톡 버튼 24px) | lucide `Info` · `MessageCircle` | 인라인 텍스트 줄·버튼 | 16–20 | — |
| — | `brand-mark-3d` | OG 합성·apple-touch-icon 장식 | — | 3 |

교체가 끝나면 `public/images/emoji/` 전체(미사용 7종 포함)와 `Emoji3D`를 삭제하고, QUALITY.md §3의 "Fluent Emoji 3D" 문구를 이 문서로 바꾼다.

## 4. 페이지별 슬롯 표
표시 폭은 1280px 기준이고, `/` 뒤는 375px 기준이다. 폴백은 파일이 없을 때 보여 줄 것이다. B는 배치다.

| 화면 | 슬롯 | 에셋 id | 유형 | 비율 · 표시 | 표면 | 목적 | 폴백 | 우선 | B |
|---|---|---|---|---|---|---|---|---|---|
| P-01 | 히어로 카드 우상단(카드 위 겹침) | hero-obj-a | 컷아웃 | 1:1 · 160/104px | #F2F4F6+#FFF | 가격 바 모티프, 스파클 대체 | 숨김 | P0 | 1 |
| P-01 | 히어로 카드 좌하단(카드 뒤) | hero-obj-b | 컷아웃 | 1:1 · 128/88px | #F2F4F6 | 깊이감, 일정·비용 암시 | 숨김 | P0 | 1 |
| P-01 | 히어로 카드 시술 타일 | ic-eye·ic-nose·ic-lifting | 아이콘 | 48px | #F2F4F6 | 탭 전환 시 부위 인지 | Emoji3D | P0 | 1 |
| P-01 | 부위별 타일 ×6 | ic-{eye,nose,contour,lifting,skin,breast} | 아이콘 | 72/56px | #F2F4F6 | 세트 통일, 리본·$ 제거 | Emoji3D | P0 | 1 |
| P-01 | 대표 시술 카드 ×6 상단 | proc-<id> | 이미지 | 4:3→16:10 · 352/288px | #F2F4F6 | 스펙 "카드(썸네일…)" 충족 | ic-<cat> 타일 | P0 | 1 |
| P-01 | 병원 카드 ×3 상단 | clinic-<id> | 사진 | 16:9 · 352px | — | 병원 구분, 실서비스감 | ic-clinic | P0 | 1 |
| P-01 | 이용 흐름 ×3 | flow-compare·-request·-connect | 이미지 | 4:3 · 352px | #F2F4F6 | 단계 은유 | Emoji3D | P0 | 1 |
| P-01 | 칼럼 카드 ×3 | post-* | 이미지 | 16:9 · 352px | #F2F4F6 | 표지 | Emoji3D | P0 | 1 |
| P-01 | 출처 섹션 | ic-source(72)·ic-check(32) | 아이콘 | — | #F9FAFB/#FFF | 신뢰 근거 시각화 | Emoji3D | P1 | 2 |
| 공통 | 상담 CTA 블록 | ic-consult | 아이콘 | 88/64px | #E8F3FF | CTA 시선 집중 | Emoji3D | P0 | 1 |
| P-02 | 부위 칩 ×6 | ic-<cat> | 아이콘 | 24px(흰 원 28) | #F2F4F6/#191F28 | 칩 인지 | Emoji3D | P0 | 1 |
| P-02 | 부위 섹션 머리 ×6 | ic-<cat> | 아이콘 | 72px, 타일 없음 | #F2F4F6 | 섹션 앵커 | Emoji3D | P0 | 1 |
| P-02 | 시술 카드 ×10 상단 | proc-<id> | 이미지 | 16:10 · 330/335px | #F2F4F6 | 목록에 콘텐츠감 | 현행 텍스트 카드 | P0 | 1 |
| P-02 | 헤더 우측(md+) | ic-eye·ic-nose·ic-lifting 군집 | 아이콘 재사용 | 96px ×3 겹침 | #FFF | 첫 화면 시각 | 숨김 | P1 | 1 |
| P-03 | 히어로 | proc-<id> | 이미지 | 4:3 · 460px / 16:9 전폭 | #F2F4F6 | 빈 우측 채움, 시술 정체성 | ic-<cat> 96 타일 | P0 | 1 |
| P-03 | 요약 칩 앞 | ic-<cat> | 아이콘 | 32px | #F2F4F6 | 부위 표시 | Emoji3D | P0 | 1 |
| P-03 | 사실 4칸 | ic-price·-duration·-recovery·-anesthesia | 아이콘 | 48px | #FFF | 숫자 앞 시각 앵커 | Emoji3D | P0 | 1 |
| P-03 | 하이라이트 2카드 | ic-check·ic-caution | 아이콘 | 40px | #F2F4F6 | 좋은 점/주의 구분 | Emoji3D | P1 | 2 |
| P-03 | 회복 타임라인 상단 띠 | recovery-kit | 이미지 | 21:9 · 720×160 크롭 | #F2F4F6 | 회복 섹션 시각화 | 없음 | P1 | 2 |
| P-03 | 본문 준비중 · 가격 빈 상태 | ic-memo · ic-clinic | 아이콘 | 48px | #F9FAFB·#F2F4F6 | 빈 상태 | Emoji3D | P1 | 2 |
| P-03 | 비슷한 시술 카드 ×3 | proc-<id> | 이미지 | 16:10 · 352px | #F2F4F6 | 같은 눈 이모지 3연속 해소 | ic-<cat> | P0 | 1 |
| P-03 | 비교 표 열 머리 | proc-<id> 크롭 | 재사용 | 1:1 · 40px | #FFF | 표 가독성 | 없음 | P2 | 1 |
| P-04 | 헤더 띠(md+) | hdr-clinics | 이미지 | 21:9 · 460px | #F2F4F6 | 첫 화면 시각 | 현행 통계 | P2 | 3 |
| P-04 | 병원 카드 ×7 상단 | clinic-<id> | 사진 | 16:9 · 352/335px | — | 사진 중심 목록 | ic-clinic | P0 | 1 |
| P-04 | 빈 상태 | ic-search | 아이콘 | 80px | #FFF | — | Emoji3D | P1 | 2 |
| P-04 | 원칙 3블록 | ic-scale(64)·ic-calendar·ic-fair(48) | 아이콘 | — | #F2F4F6 | 원칙 구분 | Emoji3D | P1 | 2 |
| P-04 | 비교 패널·트레이 행 | clinic-<id> 크롭 | 재사용 | 1:1 · 32px | #FFF | 병원 구분 | ic-clinic | P1 | 1 |
| P-05 | 헤더 | clinic-<id> | 사진 | 4:3 · 460px / 16:9 전폭 | — | 병원 정체성 + '예시 이미지' | ic-clinic 96 타일 | P0 | 1 |
| P-05 | 진료 시간 제목 | ic-calendar | 아이콘 | 32px | #FFF | — | Emoji3D | P1 | 2 |
| P-05 | 지도 자리 | map-tile + ic-pin(56) | 이미지 | 16:9 · 540px | #E5E8EB | 손그림 SVG 대체 | 현행 SVG | P1 | 2 |
| P-05 | 병원 소개 옆 | clinic-<id>-room | 사진 | 4:3 · 460px | — | 소개 텍스트 보강 | 없음 | P2 | 3 |
| P-05 | 다른 병원 카드 ×3 | clinic-<id> | 사진 | 16:9 · 352px | — | 병원 구분 | ic-clinic | P0 | 1 |
| P-06 | 헤더(모바일) | ic-guide | 아이콘 | 72px | #FFF | — | Emoji3D | P1 | 2 |
| P-06 | 좌측 고정 패널(lg+) | consult-desk | 이미지 | 4:3 · 440px | #F2F4F6 | 받게 될 가이드 실물화, 공백 해소 | 1열 유지 | P1 | 2 |
| P-06 | 관심 시술 트리거 | ic-<cat>·ic-search·ic-undecided | 아이콘 | 40px | #F2F4F6 | 선택 상태 표시 | Emoji3D | P1 | 2 |
| P-06 | 희망 시기 ×3 | ic-timing-soon·-later·ic-undecided | 아이콘 | 40px | #FFF | 선택지 구분 | Emoji3D | P1 | 2 |
| P-06 | 선택 병원 | clinic-<id> 크롭 | 재사용 | 1:1 · 44px | #F2F4F6 | 병원 확인 | ic-clinic | P1 | 1 |
| P-06 | 안심 3줄 · 제출 오류 | ic-free·ic-callback·ic-privacy · ic-caution | 아이콘 | 32px | #FFF·#FFF0F1 | 신뢰·오류 | Emoji3D | P1 | 2 |
| P-07 | 헤더 | ic-done | 아이콘 | 96px | #FFF | 완료 감정 | Emoji3D | P1 | 2 |
| P-07 | 체크리스트 ×4 | ic-callback·ic-memo·ic-meds·ic-quote | 아이콘 | 40px | #F2F4F6 | 준비 항목 구분 | Emoji3D | P1 | 2 |
| P-07 | 관련 시술 ×2 | proc-<id> 크롭 | 재사용 | 1:1 · 64px | #F2F4F6 | 재방문 유도 | ic-<cat> | P1 | 1 |
| P-10·상세 | 카드 / 표지 | post-* | 이미지 | 16:9 · 352px / 680px | #F2F4F6 | 표지 | Emoji3D | P0 | 1 |
| 404 | 중앙 | notfound | 컷아웃 | 1:1 · 200px | #FFF | 친근한 오류 | ic-search | P2 | 3 |
| 약관·개인정보 | — | 없음(의도적) | — | — | — | 법적 문서는 텍스트가 맞다 | — | — | — |
| OG | 공유 이미지 | og-default·og-procedure-<id>×10·og-post-<id>×3·og-clinics·og-consult | HTML 합성 | 1200×630 | #FFF | 공유 클릭률 | 현행 default.png | P1 | 2(API 0) |
| P-12 LP(예정) | 히어로 | vid-ad-reel + ad-reel-key | 영상+이미지 | 9:16 / 3:4 | #F2F4F6 | 소재-랜딩 메시지 일치 | ad-reel-key | P1 | 2 |
| 메타 광고 | 소재 B | ad-reel-key-b + vid-ad-reel-recovery | 영상+이미지 | 9:16 / 3:4 | #F2F4F6 | A/B 두 번째 콘셉트 | — | P2 | 3 |

## 5. 히어로·키 비주얼 결정
- **홈 히어로**: 주인공은 인터랙티브 가격 비교 카드다. 회색 패널은 유지한다.
  - `hero-obj-a`는 카드 우상단에 카드 위로 겹치고, `hero-obj-b`는 좌하단에 카드 뒤로 깔린다.
  - 첫 로드에 한 번만 등장한다(@starting-style, 12px 위에서 제자리, 0.6s, 막대 성장과 동시). QUALITY §3 모션 규칙을 지킨다.
  - 전면 배경 키비주얼은 기각했다. 카드가 패널의 약 90%를 덮어 테두리 32px만 보이고, LCP 후보만 커진다.
- **모바일 첫 화면(812px)**: 설명을 1문장으로 줄여 카드 상단과 hero-obj-a가 첫 화면에 들어오게 한다.
- **P-03**: lg 이상은 H1·요약을 7/12, `proc-<id>` 4:3을 5/12에 둔다. 모바일은 브레드크럼 아래 16:9 크롭(높이 약 190px, priority)이다.
- **P-05**: md 이상은 텍스트 7/12, 사진(4:3 크롭) 5/12다. 모바일은 16:9 전폭이다. 요약 3칸은 사진 아래로 내리고, 큰 병원 이모지 타일은 삭제한다.
- **P-02·P-04 헤더**: 새로 생성하지 않고 아이콘 군집을 재사용한다. P-04는 B3에서 `hdr-clinics` 띠를 추가한다.
- **P-06**: lg 이상은 2열이다(좌 5/12에 consult-desk와 안심 3줄을 sticky로, 우 7/12에 폼). 모바일은 ic-guide 72px.
- **P-07**: ic-done 96px에 1회 팝(scale 0.9→1)을 준다.
- **OG**: AI로 글자를 그리지 않는다(한글 깨짐, 의료광고 문구 통제). `design/og` HTML 템플릿에 생성 이미지, 실제 텍스트, PriceBar를 합성해 `render.mjs`로 루프 렌더링한다. 비용은 0이다.

## 6. 영상
| 확인 항목(2026-10-26 공식 문서) | 내용 |
|---|---|
| Veo 3.1 (`veo-3.1-generate-preview`·`-fast-`·`-lite-`) | Gemini API에서 **2026-10-22 종료**됐다. GA Veo는 Gemini Enterprise Agent Platform 쪽에 있으며 계정·단가는 미확인이다 |
| 대체 모델 | `gemini-omni-1.1-flash`(2026-08-27 GA). Interactions API `POST /v1beta/interactions`, `response_format{type:"video",aspect_ratio,resolution}` |
| 비율·해상도 | 16:9·9:16만 지원한다. 360p, 720p(기본), 1080p·4k(업스케일) |
| 길이 | 생성 1회 최대 10초. 길이 파라미터가 없어 프롬프트 타임코드(`[0-3s]`)로 조절한 뒤 자른다. 연장은 10초씩 최대 40초 |
| 입력·오디오 | 참조 이미지 `<IMAGE_REF_N>`, `<FIRST_FRAME>`/`<LAST_FRAME>`을 넣을 수 있다. 오디오가 기본으로 생성되므로 ffmpeg `-an`으로 제거한다 |
| 단가 | 720p 약 **$0.10/초**($17.50/1M 비디오 토큰). 360p는 약 1/3, 1080p·4k는 720p보다 비싸다(공식 단가 미표기) |

| 후보 자리 | 판정 | 이유 |
|---|---|---|
| 홈 히어로 배경 루프 | 기각 | 카드가 패널을 덮는다. LCP·대역폭 부담이 있고 QUALITY §3 "첫 로드 한 순간" 규칙에 어긋난다. 720p AI 영상은 선명한 UI 옆에서 흐려 보인다. 3D 컷아웃과 CSS 1회 등장으로 대체한다 |
| 이용 흐름 3단계 마이크로 루프 | 기각 | 정지 일러스트로 정보가 충분하다. 3편이면 $2.4 이상이고 스크롤 영역에 지속 모션이 생긴다 |
| P-03 시술 히어로 '선 그리기' | 기각 | 10편이면 $8 이상이고, 상세 페이지 LCP 위험이 있다 |
| **메타 릴스·스토리 소재 A + P-12 LP 모바일 히어로** | **채택 P1·B2** | 직무 요건(메타 광고 운영, 소재 A/B)과 바로 연결된다. LP 스펙 "소재-랜딩 일치"를 충족하고, 사이트 성능과 분리된다 |
| 소재 B(회복 일정) | 채택 P2·B3 | P-12 A/B 실험(`experiment_variant`)용 두 번째 콘셉트 |

| id | 비율·해상도 | 길이 | 웹 파일 | 포스터 | 재생 | 비용 |
|---|---|---|---|---|---|---|
| vid-ad-reel | 9:16 · 720×1280 | 8초(생성 ≤10초 → 트림) | mp4 H.264 ≤1.2MB, webm VP9 ≤0.9MB. 메타 업로드용 마스터 mp4 CRF 18은 저장소 밖에 둔다 | 첫 프레임 추출 WebP ≤40KB. 스타일 레퍼런스는 `ad-reel-key` | 아래 규칙 | $0.8–1.0/회 |
| vid-ad-reel-recovery | 같음 | 8초 | 같음 | 첫 프레임. 레퍼런스는 `ad-reel-key-b` | 같음 | $0.8–1.0/회 |

재생 규칙(LP):
- `<video muted playsinline preload="none" poster>`로 넣는다. 헤드라인 아래에 두어 LCP가 텍스트로 잡히게 한다.
- 화면에 50% 들어오면 1회 재생하고, 마지막 프레임에서 정지한다.
- `prefers-reduced-motion`이나 `saveData`일 때는 포스터만 보여 준다.

## 7. 밀도 개선 (텍스트 → 시각)
1. **홈 히어로(모바일)**: 설명을 2문장에서 1문장으로 줄인다(두 번째 문장은 md 이상에서만). 카드 모서리 hero-obj로 첫 화면에 그림을 넣는다.
2. **홈 대표 시술 카드**: 56px 이모지 타일과 태그라인 2줄을 상단 16:10 썸네일과 태그라인 1줄로 바꾼다.
3. **홈·P-04 병원 카드**: 이모지 아바타를 16:9 커버 사진(예시 이미지)으로 바꾸고, 시술 칩은 3개에서 2개+N으로 줄인다.
4. **홈 흐름 카드**: 본문을 2줄에서 1줄로 줄인다. 일러스트는 그대로 둔다.
5. **홈 출처 섹션**: 좌측 설명 3줄을 1줄로 줄이고 ic-source 72px를 둔다. 출처 목록은 유지한다.
6. **P-02**: 헤더 설명을 1문장으로 줄인다. 부위 머리의 64px 타일은 타일 없는 72px 아이콘으로 바꾼다. 카드마다 썸네일을 단다.
7. **P-03 상단**: 비어 있는 우측 40%에 proc 히어로를 넣는다. 메타 줄은 유지한다.
8. **P-03 비용 섹션**: 방식별 가격 표를 PriceBar 2줄(같은 눈금 위 매몰/절개)로 시각화하고, 표는 `<details>`로 접는다.
9. **P-03 회복 섹션**: 타임라인과 중복되는 마크다운 표를 접고, 그 위에 recovery-kit 21:9 띠를 단다.
10. **P-03 비슷한 시술 비교 표**: 열 머리에 1:1 썸네일 40px를 넣는다(P2).
11. **P-04 원칙 3블록**: 설명 2~3줄을 1줄로 줄이고 3D 아이콘을 64·48px로 키운다.
12. **P-05 헤더**: 아이콘 타일을 사진으로 바꾼다. 가격표 아래 막대 설명 2줄은 범례 칩 1줄로 줄인다.
13. **P-05 병원 소개**: 텍스트+표 구성에 공간 사진 1장을 더한다(P2).
14. **P-06 데스크톱**: 520px 1열을 2열로 바꾼다(좌측 sticky 시각 패널, 우측 폼).
15. **P-07 체크리스트**: 설명을 2줄에서 1줄로 줄이고 3D 아이콘 40px를 쓴다.
16. **상담 CTA**: 64px 말풍선을 ic-consult 88px로 바꾸고, md 이상에서는 패널 위로 −24px 걸친다.

## 8. 예산·배치
단가는 `gemini-nano-banana-2.1` 표준 기준 1K $0.0336, 2K $0.0504다. Batch API를 쓰면 절반($0.0168/$0.0252)이고 24시간 안에 비동기로 처리된다.

| 배치 | 범위 | 장수(후보 포함) | 기본 | 재시도 여유 | 상한 |
|---|---|---|---|---|---|
| B1 | 아이콘 11(ic-eye ×2), 히어로 컷아웃 2(각 ×2), 시술 10(앵커 ×2), 병원 7(앵커 ×2), 흐름 3, 칼럼 표지 3 | 41장 | $1.75 | +30%(약 12장) $0.52 | **$2.27** |
| B2 | 아이콘 20, consult-desk, recovery-kit, map-tile, ad-reel-key(×2), 영상 vid-ad-reel | 25장 + 영상 1 | $0.91 + $0.8 | 이미지 +$0.27, 영상 1회 재시도 $1.0 | **$3.18** |
| B3 | notfound, hdr-clinics, brand-mark-3d, 병원 공간 7, ad-reel-key-b(×2), 영상 vid-ad-reel-recovery | 12장 + 영상 1 | $0.55 + $0.8 | +$0.17, 영상 $1.0 | **$2.72** |
| 합계 | 71 id(아이콘 32 · 이미지 39) / 79장 + 영상 2 | | 약 $4.8 | | $8.17 |

- **후보 수**: 세트의 기준이 되는 앵커(ic-eye, proc-double-eyelid, clinic-danhaneul)와 첫인상 컷(hero-obj-a/b, ad-reel-key/-b)만 2장씩 뽑는다. 나머지는 1장이다.
- **순서**:
  1. B1 0단계: 앵커 5종(ic-eye, proc-double-eyelid, clinic-danhaneul, hero-obj-a/b. 10장, 약 $0.40)을 먼저 뽑는다.
  2. 오너가 선택한다.
  3. 나머지 생성 때 `ref`로 확정 앵커를 이미지 입력으로 함께 보낸다.
  4. 컨택트 시트로 검수한다.
  5. 확정본만 `public/`에 넣는다.

## 9. 제작·QA 체크리스트
1. `--dry-run`으로 장수와 비용을 출력하고, `backlog/TASKS.md`에 needs-approval로 올린다. 승인 후에 실행한다.
2. 후보는 `.gen-candidates/<id>-v<n>.webp`에 저장한다(git 제외).
3. 컨택트 시트에서 실제 표면색(#FFF·#F2F4F6·#E8F3FF)과 multiply, 실제 표시 크기(48px·352px 등)로 나란히 놓고 고른다.
4. 반려 기준(아래)을 하나씩 대조하고, 200% 확대해 글자·해부 오류를 확인한다.
5. 후처리 결과가 용량 예산을 넘지 않는지 확인한다.
6. 해당 화면 375·1280 스크린샷을 Read로 열어 QUALITY §3와 대조한다.
7. 로그에 채택 후보, 반려 사유, 실제 비용을 기록한다.

| 분류 | 반려 조건 |
|---|---|
| 법·정책 | 사람·손·실루엣. 사실적 얼굴·눈동자·속눈썹·피부결. 몸통·가슴을 연상시키는 곡선. **전후 비교로 읽히는 좌우·상하 대비**(post-lower-eye-compare는 '동등한 두 선택지'로 보이는지 확인). 주사기·메스·피·절개. 특정 실존 병원·브랜드를 연상시키는 공간·패턴 |
| 글자 | 글자·숫자·가짜 글리프·통화기호·간판·화면 UI 글자·워터마크(동전·시계·달력·문서에서 특히 확인) |
| 형태 | 석고상 비대칭·녹은 이목구비, 눈·콧구멍 개수 이상, 물체 관통, 떠 있는 그림자 |
| 일관성 | 키 라이트가 왼쪽 위가 아님, 그림자 방향 불일치. 앵커 대비 재질(유광 블루+젖빛 유리)·베벨·카메라 각도 차이. 팔레트 이탈(보라·네온, 피치 10% 초과) |
| 배경 | 아이콘·컷아웃은 정규화 후 네 모서리 평균이 253 미만이거나 물체가 프레임에 닿으면 반려. 장면·스틸은 배경이 #F2F4F6 ±4 범위 밖이거나 비네팅·바닥선이 보이면 반려 |
| 구도 | 피사체가 안전 영역(still 55%, object 60%) 밖이라 16:10·1:1 크롭에서 잘림 |
| 공간 | 수직선 휨, 불가능한 구조, 거울·유리에 사람, 모니터 내용, 얼굴 포스터, 수술 장비 |
| 영상 | 모핑·깜빡임, 글자 등장, 급격한 카메라 이동, 사람, 마지막 1초가 정지하지 않음 |
| 기술 | 해상도 미달, 그라디언트 밴딩(1% 그레인으로 구제 가능), 용량 예산 초과 |

재시도 규칙:
- 같은 사유로 2회 반려되면 그대로 다시 돌리지 않는다. 반려 사유를 `Do not …` 문장으로 프롬프트에 추가해 1회 더 시도한다.
- 그래도 실패하면 폴백을 유지하고 TASKS에 기록한다.

## 10. 엔지니어 구현 노트
**파일·명명**
- 이미지: `public/images/gen/<id>.webp`(최대 폭 1600) + `<id>-1024.webp`, `<id>-640.webp`.
- 아이콘: `public/images/gen/<id>.webp` 256×256. hero-obj는 384×384.
- 영상: `public/videos/<id>.mp4`, `<id>.webm`, `<id>.poster.webp`.
- 존재 목록: 파이프라인이 `lib/gen-assets.json`(확정 id 배열)을 쓴다. 지금 `Illustration`의 `fs` 판정은 서버 전용이라, 클라이언트 컴포넌트(HeroPriceCard·ConsultForm·DoneView·CategoryChips)도 폴백을 판정할 수 있게 하려면 이 목록이 필요하다.

**컴포넌트**
- `components/ui/Icon3D.tsx`(신규)
  - props: `name`(ic id), `size`(24·32·40·48·56·64·72·88·96·120·160), `alt`.
  - 항상 `mix-blend-multiply select-none`을 붙이고 `unoptimized`로 쓴다.
  - 이행 기간에는 gen-assets.json에 없으면 3절 매핑대로 `Emoji3D`로 폴백한다.
- `Illustration`: Aspect에 `"21:9" "3:4" "16:10"`(표시 크롭)을 추가한다. `clinic-*`과 `clinic-*-room`은 `exampleLabel`이 필수다. alt는 "병원 내부 예시 이미지(실제 병원 사진 아님)"이고, 장식 이미지는 `alt=""`.
- `next.config.ts`
  - 지금은 `images.unoptimized: true`라 `sizes`가 srcset을 만들지 않는다.
  - `images: { loader: "custom", loaderFile: "./lib/image-loader.ts" }`로 바꾸고, 로더가 요청 폭을 640·1024·1600 변형 파일에 매핑하게 한다. 정적 export와 호환된다.
- 비율 클래스: Tailwind v4 분수 클래스(`aspect-16/10`, `aspect-21/9`, `aspect-3/4`)를 쓴다. 임의값 `[]` 금지 규칙과 충돌하지 않는다.
- 활성 칩(bg-ink): 아이콘을 `size-7 rounded-full bg-surface` 원 안에 넣는다.
- 히어로 컷아웃: `aria-hidden`, `pointer-events-none`, priority를 주지 않는다(160px라 LCP 후보가 아니다).
- 푸터: "일부 일러스트·예시 이미지는 AI로 생성했습니다" 1줄을 넣는다(AI 기본법 2026.1 시행 취지. Gemini 출력에는 SynthID가 들어 있다).

| 슬롯 | next/image `sizes` | 로딩 | 용량 예산(WebP) |
|---|---|---|---|
| P-03 히어로 | `(min-width: 1024px) 460px, 100vw` | priority | 1024w ≤110KB · 640w ≤55KB |
| P-05 헤더 | `(min-width: 768px) 460px, 100vw` | priority | ≤120KB |
| 시술 카드 썸네일 | `(min-width: 1024px) 352px, (min-width: 640px) 50vw, 288px` | lazy | 640w ≤45KB |
| 병원 카드 커버 | `(min-width: 1024px) 352px, (min-width: 768px) 50vw, 100vw` | lazy | ≤60KB |
| 흐름 카드 | `(min-width: 768px) 352px, 100vw` | lazy | ≤40KB |
| 칼럼 표지(상세) | `(min-width: 768px) 680px, 100vw` | priority | ≤90KB |
| recovery-kit · map-tile | `(min-width: 768px) 720px, 100vw` · `(min-width: 768px) 540px, 100vw` | lazy | ≤50KB · ≤45KB |
| consult-desk | `(min-width: 1024px) 440px, 0px`(lg 미만 미렌더) | lazy | ≤70KB |
| 아이콘 | 고정 크기, sizes 없음 | lazy(히어로 탭만 eager) | ≤18KB |

페이지 무게 목표: P-01은 첫 화면 이미지 ≤120KB, 전체 이미지 ≤600KB다. LCP ≤2.0s 게이트는 그대로 둔다.

**후처리(sharp·ffmpeg)**
- 아이콘·컷아웃
  1. 흰점을 정규화한다(247→255 레벨).
  2. 임계 250 기준으로 trim한다.
  3. 물체가 80%를 차지하도록 정사각으로 다시 패딩한다(세트 크기 통일).
  4. 256(또는 384)으로 리사이즈하고 WebP q85로 저장한다.
  5. 네 모서리가 255인지 검사한다.
- 장면·스틸·공간: 1600/1024/640으로 리사이즈한다. WebP q78(공간 q80)로 저장하고, 밴딩이 보이면 그레인 1%를 더한다.
- 영상
  - mp4: `ffmpeg -i raw.mp4 -an -t 8 -vf "fps=30,scale=720:-2" -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 26 -preset slow -movflags +faststart <id>.mp4`
  - webm: `-c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1 -an <id>.webm`
  - 포스터: `-frames:v 1` → WebP q75

**매니페스트 스키마 변경** — 오케스트레이터가 `scripts/gen-images.mjs`를 고쳐야 한다.

| 필드 | 이전 | 이후 / 스크립트 처리 |
|---|---|---|
| `style` | sculpture·clay·interior | `family`(icon·object·still·space). `styles` 키도 교체 |
| `size` | 없음(코드에 "2K" 하드코딩) | `"1K"`·`"2K"` → `imageConfig.imageSize` |
| `variants` | CLI 전역 | 항목별 후보 수(CLI `--variants`는 덮어쓰기용) |
| `batch`·`priority` | 없음 | `--batch 1` 필터, 정렬·리포트 |
| `usage`·`background` | 없음 | 문서·검수용. `background`는 컨택트 시트 합성 색 |
| `ref`(선택) | 없음 | 확정된 `public/images/gen/<ref>.webp`(또는 `--ref-dir`의 선택본)를 `inlineData` 이미지 파트로 텍스트 앞에 붙인다 |
| `aspect` | 3종 | `21:9`·`3:4` 추가(모델 지원) |
| 단가표 | 2K 단가만 | `{model:{"1K":0.0336,"2K":0.0504}}` |
| `videos[]` | 없음 | 신규 `scripts/gen-videos.mjs`가 Interactions API 호출, 폴링, 다운로드, ffmpeg 후처리를 맡는다. 비용 상한 `--max-usd` |

## 11. 오너 결정 필요
1. **영상 모델**: Veo는 Gemini API에서 종료됐다. `gemini-omni-1.1-flash`로 광고 소재 영상을 만들지(B2 $0.8~2.0), 영상을 생략할지 정해야 한다. 생략해도 사이트에는 영향이 없다.
2. **얼굴 부위 시술 7종**: '그리스 석고상 조각' 표현을 승인할지 정해야 한다. 대안은 얼굴 없는 순수 오브젝트로, 반려율은 낮지만 시술 의미 전달은 약하다.
3. **병원 예시 사진**: 사실적 인테리어 사진('예시 이미지' 라벨, 권장)과 3D 미니어처 중 하나를 골라야 한다.
4. **B1 집행 승인**: 상한 $2.27. CLAUDE.md 비용 규칙상 needs-approval 대상이다.
