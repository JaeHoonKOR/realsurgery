@echo off
chcp 65001 >nul
cd /d "%~dp0"
xcopy /E /I /Y _claude-setup\agents .claude\agents >nul
xcopy /E /I /Y _claude-setup\commands .claude\commands >nul
rmdir /S /Q _claude-setup
where git >/dev/null 2>/dev/null && (git init -q && git add -A && git commit -q -m "chore: init agent workspace" && echo git 초기화 완료)
echo .claude 에이전트 설치 완료. 이제 이 폴더에서 claude 를 실행하고 /loop 를 입력하세요.
pause
