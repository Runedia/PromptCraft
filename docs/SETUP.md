# 프로젝트 개발 환경 세팅 가이드 (Windows)

본 가이드는 **Windows** 운영체제를 기준으로 작성되었습니다. 다른 운영체제는 고려하지 않습니다.

## 1. Bun 설치

[Bun 공식 사이트](https://bun.sh)의 안내에 따라 설치합니다.

PowerShell에서 다음 명령어를 실행합니다:

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

설치 후 터미널을 재시작하고 정상 설치를 확인합니다:

```bat
bun --version
```

## 2. 프로젝트 모듈 설치 및 빌드

프로젝트 루트 디렉토리에서 순서대로 실행합니다:

```bat
# 1. 프로젝트 패키지 설치
bun install

# 2. TypeScript 빌드 (dist 생성)
bun run build

# 3. CLI 실행 확인
bun dist\bin\promptcraft.mjs --version
```

위 과정이 모두 에러 없이 완료되면 프로젝트 세팅이 성공적으로 완료된 것입니다.
