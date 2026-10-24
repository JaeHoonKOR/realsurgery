-- 생성 파일 — 직접 수정하지 마세요.
-- 원본: data/seed/*.json → `node scripts/build-data.mjs --sql`
-- 실서비스형 더미 데이터. 병원은 가상(is_demo=true)이며 제휴 병원이 들어오면 교체합니다.

insert into public.categories ("id", "name", "slug", "order") values
  ('eye', '눈', '눈', 1),
  ('nose', '코', '코', 2),
  ('contour', '윤곽', '윤곽', 3),
  ('lifting', '리프팅', '리프팅', 4),
  ('skin', '피부', '피부', 5),
  ('breast', '가슴', '가슴', 6)
on conflict ("id") do update set "name" = excluded."name", "slug" = excluded."slug", "order" = excluded."order";

insert into public.authors ("id", "name", "role") values
  ('editorial', '리얼성형 편집팀', '의료 정보 편집')
on conflict ("id") do update set "name" = excluded."name", "role" = excluded."role";

insert into public.procedures ("id", "category_id", "name", "slug", "summary", "price_low", "price_high", "price_note", "duration_min", "recovery_days", "anesthesia", "content_mdx", "sources", "updated_at", "view_count") values
  ('double-eyelid', 'eye', '쌍꺼풀 수술', '쌍꺼풀-수술', '쌍꺼풀 수술은 눈꺼풀에 접히는 선을 만들어 눈매를 또렷하게 하는 수술로, 매몰법과 절개법으로 나뉩니다. 병원 공개 가격은 대략 50만~250만 원이며, 절개법은 보통 5~7일 뒤 실밥을 제거합니다.', 500000, 2500000, null, 60, 7, '국소 마취 (수면 마취 병행 가능)', null, '[{"title":"대한성형외과학회","url":"https://www.plasticsurgery.or.kr/"},{"title":"서울아산병원 검사·시술·수술 정보","url":"https://www.amc.seoul.kr/asan/healthinfo/management/managementSubmain.do"},{"title":"건강보험심사평가원 비급여 진료비 정보","url":"https://www.hira.or.kr/"}]'::jsonb, '2026-10-24'::date, 4820),
  ('epicanthoplasty', 'eye', '앞트임', '앞트임', '앞트임은 눈 앞쪽을 덮은 몽고주름을 조정해 눈의 가로 길이와 눈 사이 간격을 보완하는 수술입니다. 비용은 대략 70만~200만 원이며, 보통 5~7일 뒤 실밥을 제거합니다.', 700000, 2000000, null, 40, 7, '국소 마취', null, '[{"title":"대한성형외과학회","url":"https://www.plasticsurgery.or.kr/"},{"title":"대한성형외과의사회","url":"https://www.prskorea.co.kr/"},{"title":"서울아산병원 검사·시술·수술 정보","url":"https://www.amc.seoul.kr/asan/healthinfo/management/managementSubmain.do"}]'::jsonb, '2026-10-24'::date, 2150),
  ('ptosis-correction', 'eye', '눈매교정', '눈매교정', '눈매교정은 눈을 뜨는 근육(눈꺼풀올림근)의 힘을 보완해 눈을 뜨는 높이를 조절하는 수술입니다. 비용은 방식에 따라 대략 60만~350만 원이며, 큰 붓기는 2~3주가량 이어집니다.', 600000, 3500000, null, 90, 10, '국소 마취 + 수면 마취', null, '[{"title":"대한성형외과학회","url":"https://www.plasticsurgery.or.kr/"},{"title":"서울대학교병원 의학정보","url":"https://www.snuh.org/health/nMedInfo/nList.do"},{"title":"국가건강정보포털 (질병관리청)","url":"https://health.kdca.go.kr/"}]'::jsonb, '2026-10-23'::date, 3360),
  ('lower-fat-repositioning', 'eye', '눈밑지방재배치', '눈밑지방재배치', '눈밑지방재배치는 튀어나온 눈밑 지방을 꺼진 부위로 옮겨 눈밑 굴곡과 그늘을 완화하는 수술입니다. 비용은 대략 100만~300만 원이며, 멍과 붓기는 1~2주에 걸쳐 줄어듭니다.', 1000000, 3000000, null, 60, 7, '수면 마취 + 국소 마취', null, '[{"title":"대한성형외과학회","url":"https://www.plasticsurgery.or.kr/"},{"title":"서울아산병원 검사·시술·수술 정보","url":"https://www.amc.seoul.kr/asan/healthinfo/management/managementSubmain.do"},{"title":"국가건강정보포털 (질병관리청)","url":"https://health.kdca.go.kr/"}]'::jsonb, '2026-10-22'::date, 2980),
  ('rhinoplasty', 'nose', '코 성형', '코-성형', '코 성형은 보형물이나 자가 연골로 콧대 높이와 코끝 모양을 조정하는 수술입니다. 수술 범위와 재료에 따라 비용은 대략 100만~600만 원이며, 부목은 보통 1주 뒤 제거합니다.', 1000000, 6000000, null, 120, 14, '수면 마취 또는 전신 마취', null, '[{"title":"대한성형외과학회","url":"https://www.plasticsurgery.or.kr/"},{"title":"대한성형외과의사회","url":"https://www.prskorea.co.kr/"},{"title":"식품의약품안전처","url":"https://www.mfds.go.kr/"}]'::jsonb, '2026-10-21'::date, 3710),
  ('square-jaw-reduction', 'contour', '사각턱 수술', '사각턱-수술', '사각턱 수술은 발달한 아래턱뼈의 각진 부위를 절제해 얼굴 하관 폭을 줄이는 수술입니다. 비용은 범위에 따라 대략 350만~700만 원이며, 일상 복귀까지 2~4주가 걸립니다.', 3500000, 7000000, null, 150, 28, '전신 마취', null, '[{"title":"대한성형외과학회","url":"https://www.plasticsurgery.or.kr/"},{"title":"서울아산병원 검사·시술·수술 정보","url":"https://www.amc.seoul.kr/asan/healthinfo/management/managementSubmain.do"},{"title":"서울대학교병원 의학정보","url":"https://www.snuh.org/health/nMedInfo/nList.do"}]'::jsonb, '2026-10-20'::date, 1640),
  ('zygoma-reduction', 'contour', '광대 축소술', '광대-축소술', '광대 축소술은 옆으로 돌출된 광대뼈와 광대활을 안쪽으로 옮겨 얼굴 폭을 줄이는 수술입니다. 비용은 대략 400만~750만 원이며, 큰 붓기는 2~4주 동안 이어집니다.', 4000000, 7500000, null, 120, 28, '전신 마취', null, '[{"title":"대한성형외과학회","url":"https://www.plasticsurgery.or.kr/"},{"title":"대한성형외과의사회","url":"https://www.prskorea.co.kr/"},{"title":"서울아산병원 검사·시술·수술 정보","url":"https://www.amc.seoul.kr/asan/healthinfo/management/managementSubmain.do"}]'::jsonb, '2026-10-20'::date, 1380),
  ('thread-lift', 'lifting', '실리프팅', '실리프팅', '실리프팅은 녹는 실을 피부 아래에 넣어 처진 볼과 턱선을 당겨 고정하는 시술입니다. 실의 종류와 개수에 따라 비용은 대략 50만~350만 원이며, 붓기와 당김은 3~7일 정도 이어집니다.', 500000, 3500000, null, 40, 3, '국소 마취 (수면 마취 선택)', null, '[{"title":"대한성형외과의사회","url":"https://www.prskorea.co.kr/"},{"title":"식품의약품안전처","url":"https://www.mfds.go.kr/"},{"title":"국가건강정보포털 (질병관리청)","url":"https://health.kdca.go.kr/"}]'::jsonb, '2026-10-19'::date, 1920),
  ('laser-toning', 'skin', '레이저 토닝', '레이저-토닝', '레이저 토닝은 낮은 출력의 레이저를 여러 번 조사해 기미·잡티 같은 색소를 옅게 하는 시술입니다. 비용은 1회 기준 대략 3만~15만 원이며, 보통 여러 회 반복해 받습니다.', 30000, 150000, '1회 기준', 20, 0, '마취 크림', null, '[{"title":"국가건강정보포털 (질병관리청)","url":"https://health.kdca.go.kr/"},{"title":"서울대학교병원 의학정보","url":"https://www.snuh.org/health/nMedInfo/nList.do"},{"title":"건강보험심사평가원 비급여 진료비 정보","url":"https://www.hira.or.kr/"}]'::jsonb, '2026-10-18'::date, 1210),
  ('breast-augmentation', 'breast', '가슴 확대 수술', '가슴-확대-수술', '가슴 확대 수술은 보형물을 가슴 근육이나 유선 아래에 넣어 가슴 볼륨을 키우는 수술입니다. 보형물 종류와 절개 위치에 따라 비용은 대략 600만~1,200만 원이며, 일상 복귀까지 1~2주가 걸립니다.', 6000000, 12000000, null, 120, 14, '전신 마취', null, '[{"title":"식품의약품안전처","url":"https://www.mfds.go.kr/"},{"title":"대한성형외과학회","url":"https://www.plasticsurgery.or.kr/"},{"title":"서울아산병원 검사·시술·수술 정보","url":"https://www.amc.seoul.kr/asan/healthinfo/management/managementSubmain.do"}]'::jsonb, '2026-10-17'::date, 1050)
on conflict ("id") do update set "category_id" = excluded."category_id", "name" = excluded."name", "slug" = excluded."slug", "summary" = excluded."summary", "price_low" = excluded."price_low", "price_high" = excluded."price_high", "price_note" = excluded."price_note", "duration_min" = excluded."duration_min", "recovery_days" = excluded."recovery_days", "anesthesia" = excluded."anesthesia", "content_mdx" = excluded."content_mdx", "sources" = excluded."sources", "updated_at" = excluded."updated_at", "view_count" = excluded."view_count";

insert into public.procedure_faqs ("id", "procedure_id", "question", "answer", "order") values
  ('double-eyelid-1', 'double-eyelid', '쌍꺼풀 수술 가격은 얼마인가요?', '매몰법은 대체로 50만~150만 원, 절개법은 100만~250만 원 선에서 공개되어 있습니다. 눈매교정이나 트임을 함께 하면 비용이 달라지므로 견적서의 포함 항목을 확인하세요.', 1),
  ('double-eyelid-2', 'double-eyelid', '매몰법과 절개법은 어떻게 다른가요?', '매몰법은 피부를 절개하지 않고 실로 고정하는 방식이라 붓기가 적은 편이고, 절개법은 피부를 절개해 지방·근육을 정리하므로 눈꺼풀이 두꺼운 경우에 주로 고려합니다. 어떤 방법이 맞는지는 진찰 후 의료진이 판단합니다.', 2),
  ('double-eyelid-3', 'double-eyelid', '쌍꺼풀 수술 회복기간은 얼마나 걸리나요?', '절개법은 보통 5~7일 뒤 실밥을 제거하고, 큰 붓기는 2~3주, 라인은 수개월에 걸쳐 자리 잡습니다. 붓기 정도는 사람마다 차이가 있습니다.', 3),
  ('double-eyelid-4', 'double-eyelid', '수술 후 언제부터 세안과 화장을 할 수 있나요?', '일반적으로 실밥 제거 다음 날부터 가벼운 세안이 가능하고, 눈 화장은 1~2주 뒤부터 권하는 경우가 많습니다. 병원 안내를 우선으로 따르세요.', 4),
  ('double-eyelid-5', 'double-eyelid', '쌍꺼풀 수술의 부작용에는 무엇이 있나요?', '좌우 비대칭, 라인 풀림, 흉터, 감염, 눈을 감을 때의 불편감 등이 생길 수 있습니다. 수술 전 상담에서 재수술 기준과 사후 관리 범위를 확인하는 것이 좋습니다.', 5),
  ('epicanthoplasty-1', 'epicanthoplasty', '앞트임 가격은 얼마인가요?', '단독으로 할 때 70만~200만 원 선이며, 쌍꺼풀 수술과 함께 하면 묶음 비용으로 안내하는 병원이 많습니다. 견적서에 마취비와 실밥 제거 비용이 포함되는지 확인하세요.', 1),
  ('epicanthoplasty-2', 'epicanthoplasty', '앞트임 흉터가 남나요?', '눈 앞쪽 피부를 절개하므로 흉터가 생길 수 있으며, 대부분 수개월에 걸쳐 옅어집니다. 피부 특성에 따라 붉은 기가 오래갈 수 있습니다.', 2),
  ('epicanthoplasty-3', 'epicanthoplasty', '앞트임을 하면 눈이 몰려 보이지 않나요?', '눈 사이 간격이 이미 좁다면 앞트임이 맞지 않을 수 있습니다. 미간 거리와 몽고주름 정도를 진찰로 확인한 뒤 절개 범위를 정합니다.', 3),
  ('epicanthoplasty-4', 'epicanthoplasty', '앞트임 후 원래대로 되돌릴 수 있나요?', '복원 수술이 있지만 처음 상태로 완전히 돌아가기는 어렵습니다. 첫 수술 전에 절개 범위를 충분히 상의하세요.', 4),
  ('epicanthoplasty-5', 'epicanthoplasty', '앞트임 회복기간은 얼마나 걸리나요?', '실밥은 보통 5~7일 뒤 제거하고, 붉은 기와 단단한 느낌은 1~3개월에 걸쳐 줄어듭니다.', 5),
  ('ptosis-correction-1', 'ptosis-correction', '눈매교정 가격은 얼마인가요?', '비절개 방식은 낮은 쪽, 절개 방식은 높은 쪽으로 60만~350만 원 선입니다. 쌍꺼풀 수술과 함께 진행하는 경우가 많아 묶음 견적을 확인하는 것이 좋습니다.', 1),
  ('ptosis-correction-2', 'ptosis-correction', '눈매교정이 필요한지 어떻게 알 수 있나요?', '눈을 뜰 때 이마에 힘이 들어가거나 검은자가 눈꺼풀에 많이 가려진다면 진찰을 받아 볼 만합니다. 안검하수 여부와 정도는 의료진 검사로 판단합니다.', 2),
  ('ptosis-correction-3', 'ptosis-correction', '눈매교정 회복기간은 얼마나 걸리나요?', '실밥 제거는 5~7일, 큰 붓기는 2~3주가 걸리며 눈 뜨는 높이가 안정되기까지 수개월이 걸릴 수 있습니다.', 3),
  ('ptosis-correction-4', 'ptosis-correction', '절개 눈매교정과 비절개 눈매교정은 어떻게 다른가요?', '비절개는 붓기와 회복 기간이 짧은 편이지만 교정할 수 있는 범위가 제한되고, 절개는 근육 상태를 직접 확인해 교정량을 조절할 수 있습니다.', 4),
  ('ptosis-correction-5', 'ptosis-correction', '눈매교정 부작용에는 무엇이 있나요?', '과교정·저교정, 좌우 비대칭, 눈 감김 불편, 안구 건조감 등이 생길 수 있습니다. 재수술 기준과 비용 부담 범위를 미리 확인하세요.', 5),
  ('lower-fat-repositioning-1', 'lower-fat-repositioning', '눈밑지방재배치 가격은 얼마인가요?', '100만~300만 원 선이며, 피부 절개 여부와 지방 이식 추가 여부에 따라 달라집니다.', 1),
  ('lower-fat-repositioning-2', 'lower-fat-repositioning', '눈밑지방재배치를 하면 흉터가 남나요?', '결막(눈꺼풀 안쪽)으로 접근하면 겉 피부에 흉터가 남지 않습니다. 다만 피부 처짐이 심하면 피부 절개가 필요할 수 있습니다.', 2),
  ('lower-fat-repositioning-3', 'lower-fat-repositioning', '눈밑지방재배치 회복기간은 얼마나 걸리나요?', '멍과 붓기는 1~2주에 걸쳐 줄어들고, 출근은 보통 3~7일 뒤부터 가능하다고 안내합니다. 개인차가 있습니다.', 3),
  ('lower-fat-repositioning-4', 'lower-fat-repositioning', '하안검 수술과는 무엇이 다른가요?', '하안검 수술은 늘어진 눈밑 피부를 함께 잘라내는 수술로 피부 탄력이 떨어진 경우에 고려합니다. 지방 돌출이 주된 고민이라면 재배치를 먼저 검토합니다.', 4),
  ('lower-fat-repositioning-5', 'lower-fat-repositioning', '눈밑지방재배치 부작용에는 무엇이 있나요?', '좌우 비대칭, 눈밑 꺼짐, 덩어리감, 드물게 아래 눈꺼풀이 뒤집히는 외반 등이 생길 수 있습니다.', 5),
  ('rhinoplasty-1', 'rhinoplasty', '코 성형 가격은 얼마인가요?', '콧대 보형물만 넣으면 낮은 쪽, 코끝 연골 수술을 함께 하면 높은 쪽으로 100만~600만 원 선입니다. 자가 늑연골을 쓰면 비용이 더 올라갈 수 있습니다.', 1),
  ('rhinoplasty-2', 'rhinoplasty', '실리콘과 고어텍스 보형물은 어떻게 다른가요?', '보형물마다 촉감, 주변 조직과 붙는 정도, 제거 난이도가 다릅니다. 피부 두께와 원하는 높이에 따라 의료진과 상의해 고릅니다.', 2),
  ('rhinoplasty-3', 'rhinoplasty', '코 성형 회복기간은 얼마나 걸리나요?', '부목과 실밥은 약 1주 뒤 제거하고, 큰 붓기는 2~4주, 코끝 붓기는 수개월에 걸쳐 빠집니다.', 3),
  ('rhinoplasty-4', 'rhinoplasty', '수술 후 운동이나 안경 착용은 언제부터 가능한가요?', '격한 운동은 4주 이상, 무거운 안경은 1개월 정도 피하도록 안내하는 경우가 많습니다. 병원 지시에 따라 시점을 정하세요.', 4),
  ('rhinoplasty-5', 'rhinoplasty', '코 성형 부작용에는 무엇이 있나요?', '보형물 비침·움직임, 염증, 코끝이 짧아지며 들리는 구축, 비대칭 등이 생길 수 있습니다.', 5),
  ('square-jaw-reduction-1', 'square-jaw-reduction', '사각턱 수술 가격은 얼마인가요?', '뼈 절제만 하면 낮은 쪽, 바깥 피질 절제나 턱끝 수술을 함께 하면 높은 쪽으로 350만~700만 원 선입니다. 입원비와 CT 촬영비 포함 여부를 확인하세요.', 1),
  ('square-jaw-reduction-2', 'square-jaw-reduction', '보툴리눔 톡신 주사로 대신할 수는 없나요?', '턱 근육이 발달해 넓어 보이는 경우에는 주사로 근육 부피를 줄일 수 있지만, 뼈가 넓은 경우에는 수술을 검토합니다. 원인은 진찰과 CT로 확인합니다.', 2),
  ('square-jaw-reduction-3', 'square-jaw-reduction', '입원이 필요한가요?', '전신 마취로 진행하므로 보통 1~2일 입원합니다.', 3),
  ('square-jaw-reduction-4', 'square-jaw-reduction', '수술 후 식사는 어떻게 하나요?', '수술 직후에는 유동식을 먹고, 1~4주 동안 부드러운 음식 위주로 식사합니다.', 4),
  ('square-jaw-reduction-5', 'square-jaw-reduction', '사각턱 수술 부작용에는 무엇이 있나요?', '신경 손상에 따른 입술·턱 감각 저하, 좌우 비대칭, 출혈, 볼 처짐 등이 생길 수 있습니다.', 5),
  ('zygoma-reduction-1', 'zygoma-reduction', '광대 축소술 가격은 얼마인가요?', '400만~750만 원 선이며, 사각턱이나 턱끝 수술과 함께 하면 묶음 비용으로 안내되는 경우가 많습니다.', 1),
  ('zygoma-reduction-2', 'zygoma-reduction', '광대를 줄이면 볼이 처지지 않나요?', '뼈 폭이 줄어든 만큼 피부가 남아 볼 처짐이 생길 수 있습니다. 상담에서 뼈 고정 방법과 처짐 대비 방법을 확인하세요.', 2),
  ('zygoma-reduction-3', 'zygoma-reduction', '광대 축소술 회복기간은 얼마나 걸리나요?', '큰 붓기는 2~4주, 뼈가 단단히 붙기까지는 수개월이 걸립니다. 그동안 얼굴에 강한 압박을 피해야 합니다.', 3),
  ('zygoma-reduction-4', 'zygoma-reduction', '입원이 필요한가요?', '전신 마취로 진행해 보통 1일 정도 입원합니다.', 4),
  ('zygoma-reduction-5', 'zygoma-reduction', '광대 축소술 부작용에는 무엇이 있나요?', '뼈가 늦게 붙는 유합 지연, 비대칭, 감각 저하, 볼 처짐 등이 생길 수 있습니다.', 5),
  ('thread-lift-1', 'thread-lift', '실리프팅 가격은 얼마인가요?', '실의 종류와 개수에 따라 50만~350만 원 선입니다. 견적서에 실 개수와 제품명이 적혀 있는지 확인하세요.', 1),
  ('thread-lift-2', 'thread-lift', '실리프팅은 얼마나 유지되나요?', '녹는 실은 보통 6~12개월에 걸쳐 흡수되며, 유지 정도는 피부 상태와 생활 습관에 따라 차이가 큽니다.', 2),
  ('thread-lift-3', 'thread-lift', '시술 후 일상생활은 언제부터 가능한가요?', '당김과 붓기는 3~7일가량 이어지고, 입을 크게 벌리는 동작은 1~2주 정도 조심하도록 안내합니다.', 3),
  ('thread-lift-4', 'thread-lift', '실리프팅 부작용에는 무엇이 있나요?', '피부 울퉁불퉁함, 실 끝 돌출, 비대칭, 감염 등이 생길 수 있습니다.', 4),
  ('thread-lift-5', 'thread-lift', '어떤 경우에 실리프팅이 맞나요?', '처짐이 가볍거나 중간 정도일 때 주로 고려합니다. 처짐이 심하다면 안면거상 수술을 함께 상담해 보는 것이 좋습니다.', 5),
  ('laser-toning-1', 'laser-toning', '레이저 토닝 가격은 얼마인가요?', '1회 기준 3만~15만 원 선이며, 5회·10회 묶음 가격을 따로 안내하는 병원이 많습니다.', 1),
  ('laser-toning-2', 'laser-toning', '몇 번 받아야 하나요?', '보통 1~2주 간격으로 5~10회 이상 받으며, 색소의 종류와 깊이에 따라 횟수가 달라집니다.', 2),
  ('laser-toning-3', 'laser-toning', '시술 직후 화장이나 외출이 가능한가요?', '당일 세안과 화장이 가능한 경우가 많지만 붉은 기가 잠시 생길 수 있고, 자외선 차단은 꼭 필요합니다.', 3),
  ('laser-toning-4', 'laser-toning', '기미가 다시 생기지는 않나요?', '기미는 호르몬과 자외선 영향으로 다시 짙어질 수 있어 자외선 차단과 생활 관리를 함께 해야 합니다.', 4),
  ('laser-toning-5', 'laser-toning', '레이저 토닝 부작용에는 무엇이 있나요?', '색소 침착, 붉은 기, 짧은 간격으로 과하게 반복할 때 생기는 얼룩덜룩한 탈색 등이 보고됩니다.', 5),
  ('breast-augmentation-1', 'breast-augmentation', '가슴 확대 수술 가격은 얼마인가요?', '보형물 종류에 따라 600만~1,200만 원 선입니다. 수술비, 마취비, 보형물 비용, 사후 검진이 나뉘어 적힌 견적서를 받아 비교하세요.', 1),
  ('breast-augmentation-2', 'breast-augmentation', '보형물은 어떤 기준으로 고르나요?', '표면(매끈한 형·거친 형)과 모양(원형·물방울형)에 따라 촉감과 모양이 다릅니다. 거친 표면 보형물은 드물게 역형성 대세포 림프종(BIA-ALCL)과의 연관성이 보고되어 식약처가 안전성 정보를 안내하고 있습니다.', 2),
  ('breast-augmentation-3', 'breast-augmentation', '절개는 어디로 하나요?', '겨드랑이, 가슴 밑선, 유륜 주변 중에서 고르며, 보형물 크기와 흉터 위치에 대한 선호에 따라 정합니다.', 3),
  ('breast-augmentation-4', 'breast-augmentation', '가슴 확대 수술 회복기간은 얼마나 걸리나요?', '일상 복귀까지 1~2주, 팔을 크게 쓰는 운동은 4~6주 뒤부터 권하는 경우가 많습니다.', 4),
  ('breast-augmentation-5', 'breast-augmentation', '가슴 확대 수술 부작용에는 무엇이 있나요?', '보형물 주변이 단단해지는 구형구축, 보형물 파열, 비대칭, 감염, 감각 변화 등이 생길 수 있어 정기 검진이 필요합니다.', 5)
on conflict ("id") do update set "procedure_id" = excluded."procedure_id", "question" = excluded."question", "answer" = excluded."answer", "order" = excluded."order";

insert into public.clinics ("id", "name", "slug", "region", "address", "lat", "lng", "phone", "kakao_url", "hours", "description", "specialties", "is_premium", "is_partner", "is_demo", "ad_review_no") values
  ('danhaneul', '단하늘성형외과', '단하늘성형외과', '서울 강남구', '서울특별시 강남구 신사동', 37.5216, 127.0204, null, null, '[{"label":"월·화·목·금","days":["Mo","Tu","Th","Fr"],"open":"10:00","close":"19:00"},{"label":"수","days":["We"],"open":"10:00","close":"21:00"},{"label":"토","days":["Sa"],"open":"10:00","close":"15:00"}]'::jsonb, '눈 성형과 코 성형을 중심으로 진료하는 성형외과입니다. 수요일은 오후 9시까지 진료합니다. 일요일·공휴일은 휴진합니다.', array['성형외과']::text[], false, false, true, null),
  ('hagyeol', '하결성형외과', '하결성형외과', '서울 서초구', '서울특별시 서초구 서초동', 37.4877, 127.0174, null, null, '[{"label":"월–금","days":["Mo","Tu","We","Th","Fr"],"open":"09:30","close":"18:30"},{"label":"토","days":["Sa"],"open":"09:30","close":"14:00"}]'::jsonb, '얼굴 윤곽 수술과 가슴 성형을 주로 진료하는 성형외과입니다. 수술 전 CT 촬영과 마취 상담을 같은 날 진행합니다. 일요일·공휴일은 휴진합니다.', array['성형외과']::text[], false, false, true, null),
  ('saesolgyeol', '새솔결의원', '새솔결의원', '경기 성남시 분당구', '경기도 성남시 분당구 정자동', 37.3595, 127.1086, null, null, '[{"label":"월–금","days":["Mo","Tu","We","Th","Fr"],"open":"10:00","close":"20:00"},{"label":"토","days":["Sa"],"open":"10:00","close":"16:00"}]'::jsonb, '피부 시술과 리프팅, 눈 성형을 진료하는 의원입니다. 평일은 오후 8시까지 진료합니다. 일요일·공휴일은 휴진합니다.', array['성형외과', '피부과']::text[], false, false, true, null)
on conflict ("id") do update set "name" = excluded."name", "slug" = excluded."slug", "region" = excluded."region", "address" = excluded."address", "lat" = excluded."lat", "lng" = excluded."lng", "phone" = excluded."phone", "kakao_url" = excluded."kakao_url", "hours" = excluded."hours", "description" = excluded."description", "specialties" = excluded."specialties", "is_premium" = excluded."is_premium", "is_partner" = excluded."is_partner", "is_demo" = excluded."is_demo", "ad_review_no" = excluded."ad_review_no";

insert into public.clinic_procedures ("clinic_id", "procedure_id", "price_low", "price_high", "price_note", "duration_min", "price_updated_at") values
  ('danhaneul', 'double-eyelid', 700000, 2200000, null, 60, '2026-10-01'::date),
  ('danhaneul', 'epicanthoplasty', 800000, 1800000, null, 40, '2026-10-01'::date),
  ('danhaneul', 'ptosis-correction', 1500000, 3200000, null, 90, '2026-10-01'::date),
  ('danhaneul', 'lower-fat-repositioning', 1300000, 2800000, null, 60, '2026-10-01'::date),
  ('danhaneul', 'rhinoplasty', 2000000, 5500000, null, 120, '2026-10-01'::date),
  ('hagyeol', 'square-jaw-reduction', 4000000, 7000000, null, 150, '2026-09-28'::date),
  ('hagyeol', 'zygoma-reduction', 4500000, 7500000, null, 120, '2026-09-28'::date),
  ('hagyeol', 'rhinoplasty', 1500000, 6000000, null, 120, '2026-09-28'::date),
  ('hagyeol', 'breast-augmentation', 6500000, 11000000, null, 120, '2026-09-28'::date),
  ('hagyeol', 'thread-lift', 800000, 3000000, null, 40, '2026-09-28'::date),
  ('saesolgyeol', 'laser-toning', 40000, 120000, '1회 기준', 20, '2026-10-05'::date),
  ('saesolgyeol', 'thread-lift', 600000, 2500000, null, 40, '2026-10-05'::date),
  ('saesolgyeol', 'double-eyelid', 600000, 1800000, null, 60, '2026-10-05'::date),
  ('saesolgyeol', 'lower-fat-repositioning', 1200000, 2600000, null, 60, '2026-10-05'::date)
on conflict ("clinic_id", "procedure_id") do update set "price_low" = excluded."price_low", "price_high" = excluded."price_high", "price_note" = excluded."price_note", "duration_min" = excluded."duration_min", "price_updated_at" = excluded."price_updated_at";

insert into public.posts ("id", "slug", "title", "summary", "content_mdx", "author_id", "published_at", "updated_at") values
  ('double-eyelid-consult-questions', '쌍꺼풀-수술-상담-질문', '쌍꺼풀 수술 상담 전에 준비할 질문 7가지', '매몰법과 절개법 중 무엇이 맞는지, 재수술 기준은 어떻게 되는지처럼 상담 자리에서 놓치기 쉬운 질문을 정리했습니다.', null, 'editorial', '2026-10-21'::date, '2026-10-23'::date),
  ('lower-fat-vs-lower-blepharoplasty', '눈밑지방재배치-하안검-차이', '눈밑지방재배치와 하안검 수술, 어떻게 다를까', '눈밑 그늘이 고민일 때 두 수술을 가르는 기준은 피부 처짐 정도입니다. 접근 방식과 회복 기간 차이를 표로 비교했습니다.', null, 'editorial', '2026-10-17'::date, '2026-10-17'::date),
  ('reading-surgery-quotes', '성형-견적서-읽는-법', '성형 견적서 읽는 법: 가격 범위에 포함되는 항목', '같은 시술도 병원마다 가격이 다른 이유는 마취, 검사, 사후 관리 포함 여부가 다르기 때문입니다. 견적서에서 확인할 항목을 정리했습니다.', null, 'editorial', '2026-10-12'::date, '2026-10-12'::date)
on conflict ("id") do update set "slug" = excluded."slug", "title" = excluded."title", "summary" = excluded."summary", "content_mdx" = excluded."content_mdx", "author_id" = excluded."author_id", "published_at" = excluded."published_at", "updated_at" = excluded."updated_at";
