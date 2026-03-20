# Vault Gardener — 진행 현황

## 프로젝트 개요

옵시디언 플러그인. vault에서 방치된 파일을 찾아 정리하는 정원사 도구.

---

## 스택

| 항목 | 선택 |
|---|---|
| 언어 | TypeScript |
| 번들러 | esbuild |
| UI | 순수 Obsidian API (no Svelte/React) |
| 데이터 저장 | `plugin.loadData()` / `plugin.saveData()` |

---

## 현재 구현 상태

### 프로젝트 초기화
- [x] `package.json`, `tsconfig.json`, `esbuild.config.mjs`, `manifest.json`, `versions.json`, `.gitignore`
- [x] `npm install` 및 `npm run build` 통과

### 구현된 기능

#### `src/types.ts`
- `ViewRecord` — 조회수(`count`), 마지막 열람(`lastViewed`), 첫 열람(`firstViewed`)
- `PluginData` — 파일 경로 키 `ViewRecord` 맵 + `installedAt` 타임스탬프

#### `src/main.ts`
- `file-open` 이벤트 → `tracker.record()` 호출
- 사이드바 뷰(`VIEW_TYPE_GARDEN`) 등록
- 리본 아이콘(🌱) 및 커맨드 팔레트 명령 등록
- `loadData()` / `saveData()` 데이터 영속성

#### `src/features/tracker/tracker.ts`
- 열람 기록 로직 (500ms 중복 방지)

#### `src/features/garden-view/garden-view.ts`
- 사이드바 패널 (`ItemView`)
- **Viewed 탭**: 정렬(많이 본 순 / 적게 본 순 / 최근 본 순), 조회수 배지, 마지막 열람일 표시
- **Never Opened 탭**: 한 번도 안 열린 파일 목록, 기간 필터(7일/30일/90일/180일), 설치일 기준 "X일 후 신뢰도 높아짐" 안내 메시지

---

## 방향 전환 결정 (2026-03-20)

### 문제 인식

현재 "열람 추적" 기반 설계의 근본적 한계:

1. **콜드 스타트**: 플러그인 설치 전 이력 없음 → 대부분 파일이 "한 번도 안 열린 파일"로 잡힘
2. **자기오염**: 안 읽은 파일을 확인하려고 클릭하면 → 즉시 "읽은 파일"이 됨
3. **실용성 부재**: 조회수를 알아도 무엇을 해야 할지 불명확

### 새 방향: 그래프 + 메타데이터 기반

열람 추적 대신 **vault에 이미 존재하는 신호**를 활용:

| 신호 | API | 의미 |
|---|---|---|
| 마지막 수정일 | `TFile.stat.mtime` | 오래됐다 |
| 백링크 없음 | `app.metadataCache.getBacklinksForFile()` | 아무도 참조 안 함 |
| 아웃링크 없음 | `app.metadataCache.getLinks()` | 다른 노트와 연결 없음 |
| 내용 거의 없음 | `TFile.stat.size` | 미완성 스텁 |

**장점**: 플러그인 설치 당일부터 의미 있는 결과, 자기오염 없음

### 정원사 워크플로우 (목표)

1. **발견** — 고아 파일(백링크 없음 + 오래됨) 목록
2. **빠른 검토** — 내용 미리보기 (파일 열람 없이)
3. **처리** — 보관 / 삭제 / 유지 액션

---

## 다음 단계

- [ ] 기존 열람 추적 코드 정리 또는 유지 여부 결정
- [ ] 그래프+메타데이터 기반 "방치 파일 탐색" 기능 설계
- [ ] 미리보기 모달 (파일 열람 없이 내용 확인)
- [ ] 처리 액션 (보관/삭제) 구현
