# CLAUDE.md — Vault Gardener

## 프로젝트 개요

옵시디언 플러그인. 파일 열람 횟수를 추적해 자주/드물게 본 문서를 한눈에 보여주고, vault 정리를 돕는 도구.

- **스택:** TypeScript, esbuild, Obsidian API (no Svelte/React)
- **데이터 저장:** `plugin.loadData()` / `plugin.saveData()` (Obsidian 내장)
- **최소 버전:** Obsidian 1.4.0

---

## 파일 구조

```
src/
├── main.ts                    플러그인 진입점 — 등록만 담당, 로직 없음
├── types.ts                   전역 타입 및 기본값
└── features/                  기능 단위 폴더
    ├── tracker/               파일 열람 추적
    │   ├── tracker.ts         추적 로직
    │   └── tracker.types.ts   tracker 전용 타입 (필요 시)
    ├── garden-view/           사이드바 뷰
    │   ├── garden-view.ts     ItemView 구현
    │   └── garden-view.css    뷰 전용 스타일 (필요 시)
    └── settings/              설정 (추가 시)
        ├── settings.ts        PluginSettings 인터페이스
        └── settings-tab.ts    설정 탭 UI
styles.css                     Obsidian이 자동 로드하는 전역 스타일
manifest.json                  플러그인 메타데이터
```

---

## 아키텍처 원칙

### Feature 구조 규칙

- **기능 하나 = 폴더 하나.** `features/` 하위에 기능별 폴더를 만든다.
- 각 feature 폴더는 해당 기능에 필요한 모든 파일(로직, 타입, 스타일)을 자급자족한다.
- feature 간 직접 import는 지양한다. 공유가 필요하면 최상위 `types.ts` 또는 `shared/`로 추출한다.
- `main.ts`는 각 feature를 불러와 **등록만** 한다 — 비즈니스 로직을 직접 작성하지 않는다.

```ts
// main.ts — 좋은 예: 등록만
async onload() {
  this.tracker = new Tracker(this);
  this.registerView(VIEW_TYPE_GARDEN, (leaf) => new GardenView(leaf, this));
  this.registerEvent(this.app.workspace.on("file-open", (f) => this.tracker.record(f)));
}

// main.ts — 나쁜 예: 로직이 직접 들어옴
async onload() {
  this.registerEvent(this.app.workspace.on("file-open", (file) => {
    if (!file) return;
    const existing = this.data.records[file.path];
    if (existing) { existing.count += 1; ... }  // ← tracker.ts로 분리해야 함
  }));
}
```

### 책임 분리

| 레이어 | 책임 |
|---|---|
| `main.ts` | 플러그인 생명주기, feature 인스턴스 생성 및 등록 |
| `features/*/` | 기능별 로직과 UI — 서로 독립적 |
| `types.ts` | 전역 공유 타입 및 기본값 |

- feature의 view에서 `saveData()`를 직접 호출하지 않는다 — `plugin.*` 메서드를 통해 데이터를 변경한다.
- 타입은 해당 feature 폴더 안에 둔다. 두 개 이상의 feature가 공유하면 `types.ts`로 올린다.

### Obsidian API 사용 원칙

- DOM 조작은 `createEl()`, `createDiv()` 등 Obsidian API를 사용한다. `document.createElement()` 금지.
- 이벤트 등록은 `this.registerEvent()`로 감싼다 — 플러그인 언로드 시 자동 해제됨.
- 파일 작업은 `app.vault.*` API를 사용한다. `fs` 직접 접근 금지.
- 설정/데이터 저장은 `this.loadData()` / `this.saveData()`만 사용한다.

---

## 코딩 컨벤션

### 네이밍

```ts
// 클래스: PascalCase
class GardenView extends ItemView {}

// 상수: UPPER_SNAKE_CASE
export const VIEW_TYPE_GARDEN = "vault-gardener-view";

// 변수/함수: camelCase
const sortKey = "count-desc";
function recordView(file: TFile) {}

// CSS 클래스: kebab-case, vg- 접두사 (네임스페이스 충돌 방지)
container.createDiv({ cls: "vg-row" });
```

### 타입

- `any` 사용 금지 — 타입을 모를 경우 `unknown` 사용 후 narrowing.
- 함수 반환 타입은 명시한다 (추론 가능해도 public 메서드는 명시).

### 함수

- 함수 하나는 한 가지 일만 한다.
- 조건 중첩이 2단계를 넘으면 early return으로 평탄화한다.

```ts
// 나쁜 예
function recordView(file: TFile | null) {
  if (file) {
    if (this.data.records[file.path]) {
      // ...
    }
  }
}

// 좋은 예
function recordView(file: TFile | null) {
  if (!file) return;
  const existing = this.data.records[file.path];
  if (existing) {
    existing.count += 1;
    existing.lastViewed = Date.now();
    return;
  }
  // 신규 등록 ...
}
```

### 주석

- 코드로 표현 가능한 것은 주석을 달지 않는다.
- **왜(Why)** 이렇게 했는지 비자명한 경우에만 주석을 남긴다.

```ts
// 나쁜 예: 코드를 반복하는 주석
// count를 1 증가시킨다
existing.count += 1;

// 좋은 예: 이유를 설명하는 주석
// Obsidian은 같은 파일을 연속으로 열어도 file-open을 중복 발화함.
// 500ms 내 동일 파일은 무시한다.
if (Date.now() - existing.lastViewed < 500) return;
```

---

## 빌드 & 배포

```bash
npm run dev     # watch 모드 (개발 중)
npm run build   # 프로덕션 빌드 → main.js 생성
```

### 로컬 테스트

`{vault}/.obsidian/plugins/vault-gardener/`에 아래 세 파일 복사 후 플러그인 활성화:

```
main.js
manifest.json
styles.css
```

### 버전 업 시 체크리스트

1. `manifest.json`의 `version` 수정
2. `versions.json`에 `"버전": "minAppVersion"` 항목 추가
3. GitHub Release에 `main.js`, `manifest.json`, `styles.css` 첨부

---

## 스타일 (CSS)

- Obsidian 테마 변수를 사용한다 (`--background-primary`, `--color-accent` 등) — 하드코딩 금지.
- 모든 클래스에 `vg-` 접두사를 붙인다.

```css
/* 나쁜 예 */
.row { background: #1e1e1e; }

/* 좋은 예 */
.vg-row { background: var(--background-secondary); }
```

---

## 하지 말아야 할 것

- `console.log` 를 커밋에 포함시키지 않는다.
- `main.js`를 git에 커밋하지 않는다 (`.gitignore` 처리됨).
- 비동기 오류를 무시하지 않는다 — `await` 구문에는 try/catch 또는 상위 전파를 명시한다.
