# src/cli — CLI 인터페이스 레이어

**목적:** Commander.js 기반 CLI 진입점 및 Ink 기반 인터랙티브 UI 컴포넌트.

## 컨벤션

- **JSX 금지**: `React.createElement()` 직접 사용 (JSX 트랜스파일 미적용)
- Commander.js / Ink import 이 레이어에서만 허용
- Core 레이어 함수 호출로 비즈니스 로직 위임 — CLI 레이어에 로직 직접 구현 금지

## 패턴

```ts
// 컴포넌트 정의
const MyComponent = (props: Props) =>
  React.createElement('div', null, React.createElement(Child, props));
```
