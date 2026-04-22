# src/server — Express API 서버 레이어

**목적:** Express ^5.2.x 기반 HTTP API 서버. Web UI와 core 레이어를 연결.

## 컨벤션

- Express import 이 레이어에서만 허용
- 비즈니스 로직은 core 레이어에 위임
- `127.0.0.1`에서만 listen — 외부 네트워크 노출 금지
- `pathGuard` 미들웨어: 경로 traversal 방지 — 파일시스템 접근 라우트에 적용
- JSON body limit: 5mb

## API 라우트

| 메서드   | 경로                    | 설명                            |
| -------- | ----------------------- | ------------------------------- |
| `GET`    | `/api/trees`            | 워크플로우 목록                 |
| `GET`    | `/api/trees/:treeId`    | 트리 + 카드 정의 + roleMappings |
| `GET`    | `/api/cards`            | 카드 정의 전체                  |
| `POST`   | `/api/scan`             | 프로젝트 스캔                   |
| `GET`    | `/api/scan/last`        | 마지막 스캔 결과                |
| `GET`    | `/api/browse`           | 서버 사이드 폴더 탐색           |
| `POST`   | `/api/prompt/build`     | 프롬프트 빌드 + 히스토리 저장   |
| `GET`    | `/api/history`          | 히스토리 목록 조회              |
| `GET`    | `/api/history/:id`      | 히스토리 단건 조회              |
| `DELETE` | `/api/history/:id`      | 히스토리 삭제                   |
| `GET`    | `/api/templates`        | 템플릿 목록 조회                |
| `POST`   | `/api/templates`        | 템플릿 생성/수정                |
| `DELETE` | `/api/templates/:id`    | 템플릿 삭제                     |
| `GET`    | `/api/config`           | 설정 조회                       |
| `PUT`    | `/api/config`           | 설정 수정                       |
| `GET`    | `/api/mention/suggest`  | @멘션 파일 자동완성             |
| `POST`   | `/api/mention/read`     | 멘션 파일 읽기                  |

## 기타

- `GET *` → `dist/web/index.html` SPA 폴백 (프로덕션 빌드 서빙)
- SIGINT/SIGTERM 수신 시 graceful shutdown (10초 후 강제 종료)
