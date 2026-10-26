# 개선 루프 예약 해제
Unregister-ScheduledTask -TaskName "realsurgery-improve" -Confirm:$false -ErrorAction SilentlyContinue
"예약을 해제했습니다(진행 중인 사이클은 끝까지 돕니다)."
