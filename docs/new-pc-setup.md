# 새 PC 셋업 (Windows)

> 다른 PC에서 이 프로젝트를 이어서 작업할 때의 체크리스트.
> 리포 안의 것은 `git clone`으로 끝나지만, **git에 들어가지 않는 파일**(시크릿·로컬 설정·Claude 메모리)은 따로 옮겨야 한다.

## 1. 도구 설치

| 도구 | 비고 |
|---|---|
| Git for Windows | **Git Bash 포함 필수** — `npm run dev:clean`이 POSIX `rm -rf`를 써서 PowerShell/cmd에서는 실패한다 |
| git-lfs | `git lfs install` 1회 실행 |
| PowerShell 7 | `.vscode/settings.json`이 `C:\Program Files\PowerShell\7\pwsh.exe`를 기본 터미널로 지정 |
| Node.js **20** | `.nvmrc`와 CI가 20 기준. 여러 버전이 필요하면 nvm-windows 사용 (`nvm install 20 && nvm use 20`) |
| VS Code + Claude Code 확장 | |
| (선택) Vercel CLI | `.env.local` 받기용. 설치 없이 `npx vercel`로도 가능 |
| (선택) Supabase CLI | `src/types/database.ts` 재생성 시 필요 (`supabase login`) — 이 파일은 직접 수정 금지 |
| (선택) GitHub CLI `gh` | PR 작업용 |

## 2. 리포 받기

```powershell
git clone https://github.com/a01056014453-bit/Grit.on-app.git C:\Grit.on-app
cd C:\Grit.on-app
git branch -r                  # 작업 중이던 브랜치 확인 후 checkout
npm install                    # puppeteer가 Chromium 수백 MB를 내려받는다
```

경로는 **`C:\Grit.on-app` 그대로** 쓰는 것을 권장한다. Claude Code가 프로젝트 메모리 폴더를 경로 기반 이름(`c--Grit-on-app`)으로 찾기 때문이다.

## 3. `.env.local` (필수, git 제외)

Vercel 프로젝트에 등록된 환경변수를 받아온다.

```powershell
npx vercel login
npx vercel link                # 기존 프로젝트 선택 → .vercel/ 생성 (gitignore됨)
npx vercel env pull .env.local
```

- 키 목록과 필수/선택 구분의 정본은 [`.env.example`](../.env.example).
- ⚠️ Vercel에는 프로덕션용 키만 있고 로컬 개발용 키(`NEXT_PUBLIC_DEV_TEST_*` 등)는 없을 수 있다. 받은 뒤 `npm run dev`로 로그인·AI 분석이 동작하는지 확인하고, 빠진 키가 있으면 기존 PC의 파일을 안전한 경로(개인 저장소·암호화 압축)로 옮긴다. **메신저·이메일·커밋으로 옮기지 말 것.**

## 4. git 전역 설정

```powershell
git config --global user.name  "<이름>"
git config --global user.email "<이메일>"
git config --global core.autocrlf input
```

그리고 전역 gitignore `%USERPROFILE%\.config\git\ignore`에 아래 한 줄을 넣는다. 프로젝트 `.gitignore`가 아니라 **전역**에서 제외하고 있으므로, 이게 없으면 로컬 Claude 권한 설정이 커밋 대상으로 잡힌다.

```
**/.claude/settings.local.json
```

## 5. Claude Code 설정 (git 제외 — 수동 이전)

| 파일 | 내용 |
|---|---|
| `%USERPROFILE%\.claude\settings.json` | 모델·언어(한국어)·플러그인(figma)·마켓플레이스·`cleanupPeriodDays` |
| `C:\Grit.on-app\.claude\settings.local.json` | 이 프로젝트의 권한 allow/deny (`.env*` 읽기 차단 규칙 포함) |
| `%USERPROFILE%\.claude\projects\c--Grit-on-app\memory\` | 이 프로젝트에 대한 Claude 메모리 |

- `.claude/agents/`와 `.mcp.json`은 리포에 커밋돼 있어 따로 옮길 필요 없다.
- 플러그인은 `settings.json`의 `enabledPlugins`/`extraKnownMarketplaces`를 보고 첫 실행 시 다시 설치된다 (`plugins/` 캐시는 옮기지 않는다).
- `cleanupPeriodDays`가 기본값(30일)이면 오래된 세션 기록이 자동 삭제된다. 긴 작업의 진행 상황은 세션이 아니라 리포 문서에 남길 것.

기존 PC에서 위 파일들을 묶은 이전 번들(`restore.ps1` 포함)을 만들었다면 리포 clone 후 번들 폴더에서 실행한다:

```powershell
pwsh -ExecutionPolicy Bypass -File .\restore.ps1
```

## 6. 인증 (새 PC마다 다시)

- **Supabase MCP** (`.mcp.json`) — Claude Code에서 `/mcp` → supabase 인증
- **claude.ai 커넥터**(Figma·Notion·Gmail 등) — claude.ai 커넥터 설정에서 승인
- `gh auth login`, `npx vercel login`, `supabase login` — 해당 CLI를 쓸 때

## 7. 확인

```powershell
node -v                        # v20.x
npm run dev                    # http://localhost:3000 — 로그인까지 확인
npm run test:ci                # unit 통과 (api 테스트는 TEST_BASE_URL 없으면 스킵)
npm run build
git status                     # .claude/settings.local.json 이 안 보여야 정상
```
