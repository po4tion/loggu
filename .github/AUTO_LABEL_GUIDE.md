# PR 자동 라벨링 가이드

## 개요

PR이 생성되거나 업데이트될 때 **PR 제목**과 **커밋 메시지**를 분석하여 자동으로 라벨을 추가하는 GitHub Actions 워크플로우입니다.

## 작동 방식

### 트리거 시점

- PR 생성 시 (`opened`)
- PR 업데이트 시 (`synchronize`)
- PR 재오픈 시 (`reopened`)

### 라벨 매핑

워크플로우는 커밋 메시지의 **타입**과 **이모지**를 분석하여 라벨을 추가합니다.

#### 타입 기반 라벨링

| 커밋 타입   | 추가되는 라벨   | 예시                       |
| ----------- | --------------- | -------------------------- |
| `feat:`     | `feature`       | ✨ feat: 새로운 기능 추가  |
| `fix:`      | `bug`           | 🐛 fix: 버그 수정          |
| `docs:`     | `documentation` | 📚 docs: 문서 업데이트     |
| `style:`    | `style`         | 💎 style: 코드 포맷팅      |
| `refactor:` | `refactor`      | ♻️ refactor: 코드 리팩토링 |
| `perf:`     | `performance`   | ⚡ perf: 성능 개선         |
| `test:`     | `test`          | ✅ test: 테스트 추가       |
| `chore:`    | `chore`         | 🔧 chore: 빌드 설정 변경   |
| `hotfix:`   | `hotfix`        | 🚨 hotfix: 긴급 수정       |
| `ui:`       | `UI/UX`         | 🎨 ui: UI 개선             |
| `security:` | `security`      | 🔐 security: 보안 패치     |
| `release:`  | `release`       | 🚀 release: 배포           |

#### 이모지 기반 라벨링

| 이모지 | 추가되는 라벨   |
| ------ | --------------- |
| 🔐     | `security`      |
| 🎨     | `UI/UX`         |
| ✨     | `feature`       |
| 🐛     | `bug`           |
| 📚     | `documentation` |
| 💎     | `style`         |
| ♻️     | `refactor`      |
| ⚡     | `performance`   |
| ✅     | `test`          |
| 🔧     | `chore`         |
| 🚨     | `hotfix`        |
| 🚀     | `release`       |

## 필요한 설정

### 1. GitHub 저장소에 라벨 생성

다음 라벨들이 저장소에 존재해야 합니다:

```bash
# GitHub UI에서 Settings > Labels로 이동하여 다음 라벨들을 생성하세요
- feature (색상: #0075ca)
- bug (색상: #d73a4a)
- documentation (색상: #0075ca)
- style (색상: #ffd33d)
- refactor (색상: #fbca04)
- performance (색상: #d4c5f9)
- test (색상: #bfd4f2)
- chore (색상: #fef2c0)
- hotfix (색상: #b60205)
- UI/UX (색상: #1d76db)
- security (색상: #ee0701)
- release (색상: #6f42c1)
```

### 2. GitHub Actions 권한 확인

저장소의 Actions 권한이 올바르게 설정되어 있는지 확인하세요:

1. 저장소의 `Settings` > `Actions` > `General`로 이동
2. `Workflow permissions` 섹션에서:
   - ✅ "Read and write permissions" 선택
   - ✅ "Allow GitHub Actions to create and approve pull requests" 체크

## 사용 예시

### 예시 1: 단일 타입 커밋

```bash
git commit -m "✨ feat: 사용자 인증 기능 추가"
```

→ PR에 `feature` 라벨 자동 추가

### 예시 2: 여러 타입의 커밋

```bash
git commit -m "🐛 fix: 로그인 버그 수정"
git commit -m "🎨 ui: 버튼 디자인 개선"
git commit -m "📚 docs: README 업데이트"
```

→ PR에 `bug`, `UI/UX`, `documentation` 라벨 자동 추가

### 예시 3: 보안 기능

```bash
git commit -m "🔐 feat: Basic Authentication 추가"
```

→ PR에 `security`, `feature` 라벨 자동 추가

### 예시 4: main 브랜치로 릴리즈 PR

```bash
# PR 제목: release: 다크모드 기능
git commit -m "✨ feat: 다크모드 기능 구현"
```

→ PR에 `release`, `feature` 라벨 자동 추가

> **Note**: main 브랜치로 PR 생성 시 제목에 `release:` 접두사를 사용합니다.

## 문제 해결

### 라벨이 추가되지 않는 경우

1. **Actions 탭 확인**: PR에서 Actions 탭을 확인하여 워크플로우가 실행되었는지 확인
2. **로그 확인**: 워크플로우 로그에서 에러 메시지 확인
3. **라벨 존재 확인**: 저장소에 필요한 라벨이 모두 생성되어 있는지 확인
4. **권한 확인**: GitHub Actions의 write 권한이 활성화되어 있는지 확인

### 일부 라벨만 추가되는 경우

- 존재하지 않는 라벨은 자동으로 건너뛰어집니다
- 워크플로우 로그에서 어떤 라벨이 누락되었는지 확인하세요

## 워크플로우 파일 위치

`.github/workflows/auto-label-pr.yml`

## 커스터마이징

라벨 매핑을 변경하고 싶다면 `.github/workflows/auto-label-pr.yml` 파일의 `labelMap`과 `emojiMap` 객체를 수정하세요.

```javascript
const labelMap = {
  feat: 'feature', // 'feature' 대신 다른 라벨명 사용 가능
  fix: 'bug',
  // ... 추가 또는 수정
}

const emojiMap = {
  '🔐': 'security',
  '🎨': 'UI/UX',
  // ... 추가 또는 수정
}
```
