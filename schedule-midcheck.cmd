@echo off
schtasks /Create /F /SC ONCE /ST 05:30 /TN "realsurgery-midcheck" /TR "powershell -NoProfile -ExecutionPolicy Bypass -File C:\rs\run-midcheck.ps1" /RL LIMITED
echo scheduled: 05:30 realsurgery-midcheck
pause
