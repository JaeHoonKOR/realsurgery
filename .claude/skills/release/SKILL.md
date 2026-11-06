---
name: release
description: 사이클 브랜치를 main에 머지하고 push해 GitHub Pages에 배포한 뒤 배포 URL에서 확인한다. 사용자만 /release로 실행한다.
disable-model-invocation: true
---
1. 현재 `cycle/` 브랜치에서 `git status`가 깨끗한지 확인한다. 아니면 멈추고 보고한다.
2. `pnpm build`와 `pnpm test`를 실행한다. 실패하면 멈추고 보고한다.
3. 머지 대상 커밋 목록(`git log main..HEAD --oneline`)을 사용자에게 보여주고, 이대로 배포할지 확인을 받는다.
4. `git switch main` → `git merge --no-ff <브랜치>` → `git push origin main`. push가 거부되면 멈추고 보고한다(강제 push 금지).
5. GitHub Actions 배포가 끝나면(`gh run list --workflow pages.yml --limit 1`) `.env.example`의 `NEXT_PUBLIC_SITE_URL`을 `evaluator`에게 넘겨 오늘 통과한 기능들의 steps를 배포 URL에서 다시 확인시킨다.
6. 결과를 progress.md 맨 위에 `release` 항목으로 남기고 커밋·push한다.
