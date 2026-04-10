# src/server — Express API 서버 레이어

**목적:** Express ^5.x 기반 HTTP API 서버. Web UI와 core 레이어를 연결.

## 컨벤션

- Express import 이 레이어에서만 허용
- 비즈니스 로직은 core 레이어에 위임
- 포트: `:3000` (개발), Vite는 `:5173`

## API 라우트

| 경로 | 설명 |
|------|------|
| `GET /api/trees` | 워크플로우 목록 |
| `GET /api/trees/:id` | 트리 + 카드 정의 |
| `GET /api/cards` | 카드 정의 전체 |
| `POST /api/scan` | 프로젝트 스캔 |
| `GET /api/browse` | 서버 사이드 폴더 탐색 |
| `POST /api/prompt` | 프롬프트 빌드 |
| `GET/POST /api/history` | 히스토리 |
| `GET/POST /api/templates` | 템플릿 |
| `GET/POST /api/config` | 설정 |
