# Vault Gardener — 진행 현황

## 프로젝트 개요

옵시디언 플러그인. 문서를 열 때마다 조회수를 기록하고, 많이/적게 본 문서를 한눈에 보여줘서 쓰지 않는 문서를 정리하기 쉽게 만드는 도구.

---

## 스택

| 항목 | 선택 |
|---|---|
| 언어 | TypeScript |
| 번들러 | esbuild |
| UI | 순수 Obsidian API (no Svelte/React) |
| 데이터 저장 | `plugin.loadData()` / `plugin.saveData()` |

---

## 완료된 작업

### 프로젝트 초기화
- [x] `package.json` — 의존성 정의 (`obsidian`, `esbuild`, `typescript`)
- [x] `tsconfig.json` — TypeScript 컴파일러 설정
- [x] `esbuild.config.mjs` — dev(watch) / production 빌드 설정
- [x] `manifest.json` — 플러그인 메타데이터 (id: `vault-gardener`, minAppVersion: `1.4.0`)
- [x] `versions.json` — 버전 호환 테이블
- [x] `.gitignore` — `node_modules/`, `main.js` 제외
- [x] `npm install` 및 `npm run build` 통과 확인

### 핵심 기능 구현

#### `src/types.ts`
- `ViewRecord` — 조회수(`count`), 마지막 열람 시간(`lastViewed`), 첫 열람 시간(`firstViewed`)
- `PluginData` — 파일 경로를 키로 하는 `ViewRecord` 맵

#### `src/main.ts`
- `file-open` 이벤트 감지 → `recordView()` 호출로 조회수 기록
- 사이드바 뷰 등록 (`VIEW_TYPE_GARDEN`)
- 리본 아이콘(🌱) 및 커맨드 팔레트 명령 등록 (`Open Vault Gardener`)
- `loadData()` / `saveData()` 로 데이터 영속성 관리

#### `src/view.ts`
- 사이드바 패널 (`ItemView` 상속)
- 정렬 옵션: 많이 본 순 / 적게 본 순 / 최근 본 순
- 파일명, 경로, 조회수 배지, 마지막 열람 날짜 표시
- 한 번도 열지 않은 파일 수 집계 및 표시
- 항목 클릭 시 해당 문서 바로 열기

#### `styles.css`
- Obsidian 테마 변수(`--background-secondary`, `--color-accent` 등) 활용
- 사이드바 뷰 전용 스타일

---

## 파일 구조

```
vault-gardener/
├── src/
│   ├── main.ts
│   ├── view.ts
│   ├── types.ts
│   └── styles.css        # 소스 원본
├── styles.css             # Obsidian이 자동 로드하는 CSS
├── main.js                # 빌드 산출물 (git 제외)
├── manifest.json
├── versions.json
├── package.json
├── tsconfig.json
├── esbuild.config.mjs
└── .gitignore
```

---

## 로컬 테스트 방법

Vault의 `.obsidian/plugins/vault-gardener/` 폴더에 아래 세 파일 복사 후 플러그인 활성화:

```
main.js
manifest.json
styles.css
```

개발 중 실시간 빌드:
```bash
npm run dev
```

---

## 다음 단계 (미구현)

- [ ] 한 번도 열지 않은 파일 목록 별도 탭/섹션으로 표시
- [ ] 파일 삭제 / 이동 도우미 (정리 워크플로우)
- [ ] 설정 패널 (추적 제외 폴더, 조회수 초기화 등)
- [ ] 조회수 기반 히트맵 또는 바 차트 시각화
- [ ] 파일 이름 변경/삭제 시 데이터 자동 업데이트
