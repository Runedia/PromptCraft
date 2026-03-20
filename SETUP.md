# 프로젝트 개발 환경 세팅 가이드 (Windows)

본 가이드는 **Windows** 운영체제를 기준으로 작성되었습니다. 다른 운영체제는 고려하지 않습니다.

## 1. NVM (Node Version Manager) 및 Node.js 설치

Node.js 버전을 유연하게 관리하기 위해 `nvm-windows`를 사용합니다.

1. [nvm-windows 릴리즈 페이지](https://github.com/coreybutler/nvm-windows)에서 다운로드하여 설치합니다.
2. 설치가 완료되면 터미널(명령 프롬프트 또는 PowerShell)을 관리자 권한으로 실행합니다.
3. 다음 명령어를 통해 Node.js 24 버전을 설치하고 적용합니다:

   ```bat
   nvm install 24
   nvm use 24
   ```

4. 정상적으로 적용되었는지 확인합니다:

   ```bat
   node -v
   ```

## 2. 전역 패키지 설치 (pnpm, node-gyp)

패키지 관리를 위한 `pnpm`과 C++ 애드온 빌드를 위한 `node-gyp`를 전역으로 설치합니다.

```bat
npm i -g pnpm
npm i -g node-gyp
```

## 3. 빌드 도구 설치 (Python, Visual Studio)

`better-sqlite3` 등 네이티브 모듈 컴파일(`node-gyp` 동작)을 위해 Python과 Visual Studio Build Tools가 필요합니다.

1. **Python 설치**: Python 3.12 버전을 권장합니다.
   - *주의:* 설치 시 환경 변수(PATH) 추가 옵션을 확인해주세요.
2. **Visual Studio 2022 설치**: C++ 빌드 환경이 필요합니다.
   - [VS2022 Community 다운로드 및 설치](https://aka.ms/vs/17/release/vs_community.exe)
   - 설치 프로그램에서 **"C++를 사용한 데스크톱 개발"** 워크로드를 선택하여 설치를 진행합니다.

## 4. 프로젝트 모듈 설치 및 빌드

사전 환경 설정이 끝났다면, 프로젝트 루트 디렉토리에서 패키지를 설치하고 네이티브 모듈을 수동으로 빌드합니다.

터미널을 열고 다음 명령어를 순서대로 실행합니다:

```bat
# 1. 프로젝트 패키지 설치
pnpm install

# 2. better-sqlite3 모듈 폴더로 이동
cd node_modules\better-sqlite3

# 3. node-gyp 설정 및 빌드 진행
node-gyp configure
node-gyp build
```

위 과정이 모두 에러 없이 완료되면 프로젝트 세팅이 성공적으로 완료된 것입니다.
