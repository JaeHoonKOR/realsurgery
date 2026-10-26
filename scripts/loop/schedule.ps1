# 개선 루프 예약 등록 — N시간마다 improve.ps1 을 실행한다(로그온 상태에서만, 관리자 권한 불필요).
# 사용: powershell -NoProfile -ExecutionPolicy Bypass -File C:\rs\scripts\loop\schedule.ps1 -Hours 3
param([int]$Hours = 3, [int]$StartInMinutes = 5)

$script = "C:\rs\scripts\loop\improve.ps1"
$action = New-ScheduledTaskAction -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$script`"" -WorkingDirectory "C:\rs"
$trigger = New-ScheduledTaskTrigger -Once -At ((Get-Date).AddMinutes($StartInMinutes)) `
  -RepetitionInterval (New-TimeSpan -Hours $Hours) -RepetitionDuration (New-TimeSpan -Days 365)
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd `
  -ExecutionTimeLimit (New-TimeSpan -Hours 4) -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName "realsurgery-improve" -Action $action -Trigger $trigger -Settings $settings `
  -Description "리얼성형 개선 루프 (/improve) — $Hours 시간마다" -Force | Out-Null

"등록 완료: $Hours 시간마다 실행, 첫 실행 $((Get-Date).AddMinutes($StartInMinutes).ToString('HH:mm'))"
"확인: Get-ScheduledTask -TaskName realsurgery-improve | Get-ScheduledTaskInfo"
"중지: powershell -ExecutionPolicy Bypass -File C:\rs\scripts\loop\unschedule.ps1"
