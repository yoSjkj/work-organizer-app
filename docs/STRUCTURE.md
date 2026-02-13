# 📁 프로젝트 구조

> 이 문서는 프로젝트의 디렉토리 구조와 각 파일의 역할을 설명합니다.

## 🗂️ 전체 구조

```
src/
├── config/          # 설정 파일 (카테고리 메타데이터)
├── layouts/         # 레이아웃 컴포넌트
├── components/      # UI 컴포넌트
│   ├── cards/       # 카드 컴포넌트 (표시 전용)
│   └── forms/       # 폼 컴포넌트 (입력 전용)
│       └── fields/  # 재사용 가능한 필드
├── hooks/           # 커스텀 훅 (재사용 로직)
├── stores/          # Zustand 상태 관리
├── utils/           # 유틸리티 함수
└── styles/          # CSS 파일
```

---

## 📂 디렉토리별 상세 설명

### `config/` - 설정 파일

**핵심 파일:** `categories.js`

- 모든 카테고리의 메타데이터를 정의
- 새 카테고리 추가 시 **여기만** 수정하면 됨

```js
export const CATEGORIES = {
  MEMO: {
    id: 'memo',
    label: '메모',
    FormComponent: MemoForm,
    CardComponent: MemoCard,
    hasSearch: true,
    searchFields: ['title', 'content', ...],
    // ...
  }
}
```

---

### `layouts/` - 레이아웃

| 파일 | 역할 |
|------|------|
| `AppLayout.jsx` | 전체 앱 레이아웃 (Sidebar + MainContent) |
| `MainContent.jsx` | 메인 영역 (제목, 검색, 필터, 폼, 리스트) |

---

### `components/cards/` - 카드 컴포넌트

**타입별 전용 카드 (조건부 렌더링 없음)**

| 파일 | 용도 |
|------|------|
| `MemoCard.jsx` | 메모 카드 |
| `CompletedCard.jsx` | 완료 카드 |
| `TemplateCard.jsx` | 양식 카드 |
| `DocumentCard.jsx` | 문서 카드 |
| `DeploymentCard.jsx` | 배포 기록 카드 |
| `index.js` | export 통합 |

**사용 예:**
```jsx
import { MemoCard } from './components/cards'
```

---

### `components/forms/` - 폼 컴포넌트

#### 폼 파일

| 파일 | 용도 |
|------|------|
| `MemoForm.jsx` | 메모/완료 입력 폼 |
| `TemplateForm.jsx` | 양식 입력 폼 |
| `DocumentForm.jsx` | 문서 입력 폼 |
| `DeploymentForm.jsx` | 배포 기록 입력 폼 |

#### `fields/` - 재사용 가능한 필드

| 파일 | 용도 |
|------|------|
| `SelectField.jsx` | 범용 select 박스 |
| `TextField.jsx` | 범용 input |
| `TextArea.jsx` | 범용 textarea |
| `ContactField.jsx` | 요청 방식별 연락처 입력 |
| `RequesterFields.jsx` | 요청자 유형별 입력 |
| `index.js` | export 통합 |

**사용 예:**
```jsx
import { SelectField, TextField } from './fields'

<SelectField
  value={value}
  onChange={onChange}
  options={OPTIONS}
/>
```

---

### `hooks/` - 커스텀 훅

| 파일 | 역할 |
|------|------|
| `useFilteredItems.js` | 필터링 로직 (카테고리, 검색, 날짜, 방식) |
| `useItemActions.js` | 아이템 CRUD 액션 (submitItem, handleEdit) |

**사용 예:**
```jsx
const filteredItems = useFilteredItems({
  items,
  selectedCategory,
  searchTerm,
  dateFilter,
  inquiryTypeFilter,
  searchFields
})

const { submitItem, handleEdit } = useItemActions(inputFormRef)
```

---

### `stores/` - 상태 관리

| 파일 | 역할 |
|------|------|
| `useItemsStore.js` | 아이템 CRUD (순수 상태만) |
| `useUIStore.js` | UI 상태 (카테고리, 검색, 필터) |
| `useFormStore.js` | 폼 상태 (메모, 양식, 문서, 배포) |
| `useThemeStore.js` | 테마 상태 (다크/라이트) |
| `tauriStorage.js` | Tauri 파일 저장 어댑터 |

**원칙:** Store는 순수 상태 관리만, 비즈니스 로직은 hooks로!

---

### `utils/` - 유틸리티

| 파일 | 역할 |
|------|------|
| `category.js` | 카테고리 헬퍼 함수 (색상, 아이콘 등) |
| `search.js` | 검색 로직 (중첩 객체 경로 지원) |
| `dateUtils.js` | 날짜 파싱 유틸리티 |

---

### `styles/` - CSS

```
styles/
├── tokens/      # 디자인 토큰 (색상, 간격, 타이포)
├── base/        # 리셋, 레이아웃
├── components/  # 버튼, 배지, 카드, 폼 등
├── features/    # 기능별 스타일
└── modules/     # CSS 모듈
```

---

## 🎯 핵심 원칙

### 1. **설정 기반**
- 카테고리 추가 → `config/categories.js`만 수정

### 2. **관심사 분리**
- `components/` → UI만
- `hooks/` → 로직만
- `stores/` → 상태만
- `utils/` → 헬퍼만

### 3. **조건부 렌더링 제거**
- 카드/폼은 타입별로 분리
- config에서 컴포넌트 선택

### 4. **재사용성**
- 필드 컴포넌트 조합으로 새 폼 생성
- 공통 로직은 hooks로

---

## 📍 빠른 참조

### 파일 찾기
```
카드 수정 → components/cards/
폼 수정 → components/forms/
필드 추가 → components/forms/fields/
카테고리 추가 → config/categories.js
로직 추가 → hooks/
상태 추가 → stores/
유틸 추가 → utils/
```

### 새 기능 추가
→ [ADDING_FEATURES.md](./ADDING_FEATURES.md) 참고
