# 🛠️ 개발 워크플로우

> 일상적인 개발 작업의 플로우를 정리한 문서입니다.

## 🚀 시작하기

### 개발 서버 실행
```bash
npm run dev
```

### 빌드
```bash
npm run build
```

### Tauri 데스크탑 앱
```bash
npm run tauri:dev    # 개발
npm run tauri:build  # 배포용 exe
```

---

## 📝 일반적인 작업 플로우

### 1️⃣ 새 기능 추가

```
1. 요구사항 파악
   ↓
2. config/categories.js 확인 (카테고리 기능이면)
   ↓
3. 컴포넌트 작성
   - forms/ 또는 cards/ 또는 fields/
   ↓
4. 상태 추가 (필요시)
   - stores/useFormStore.js 등
   ↓
5. 테스트
   - npm run dev로 확인
   ↓
6. 커밋
```

### 2️⃣ 버그 수정

```
1. 버그 재현
   ↓
2. 파일 찾기
   - docs/STRUCTURE.md 참고
   ↓
3. 수정
   ↓
4. 테스트
   ↓
5. 커밋
```

### 3️⃣ 스타일 수정

```
1. 해당 컴포넌트 찾기
   ↓
2. styles/ 폴더에서 CSS 찾기
   - tokens/ 또는 components/ 또는 features/
   ↓
3. CSS 변수 우선 사용
   - var(--bg-primary) 등
   ↓
4. 테스트
   ↓
5. 커밋
```

---

## 🎯 작업별 빠른 가이드

### 카테고리 추가
→ [ADDING_FEATURES.md#새-카테고리-추가하기](./ADDING_FEATURES.md#새-카테고리-추가하기)

### 필드 추가
→ [ADDING_FEATURES.md#폼에-필드-추가하기](./ADDING_FEATURES.md#폼에-필드-추가하기)

### 카드 수정
→ [ADDING_FEATURES.md#카드-디자인-수정하기](./ADDING_FEATURES.md#카드-디자인-수정하기)

---

## 🗂️ 파일 찾기 치트시트

```
카드 관련    → components/cards/
폼 관련      → components/forms/
필드 관련    → components/forms/fields/
상태 관련    → stores/
로직 관련    → hooks/
유틸 관련    → utils/
설정 관련    → config/
스타일 관련  → styles/
```

---

## 🔧 주요 파일 역할

### `config/categories.js`
**언제 수정:** 새 카테고리 추가, 검색 필드 변경

### `stores/useFormStore.js`
**언제 수정:** 폼 상태 추가

### `stores/useItemsStore.js`
**언제 수정:** CRUD 로직 변경 (거의 안 함)

### `hooks/useItemActions.js`
**언제 수정:** 제출 로직 변경

### `hooks/useFilteredItems.js`
**언제 수정:** 필터링 로직 변경

---

## ✅ 커밋 컨벤션

### 타입
```
feat:     새 기능
fix:      버그 수정
refactor: 리팩토링
style:    스타일 수정
docs:     문서 수정
chore:    기타 작업
```

### 형식
```
<타입>: <간결한 설명>

- 구체적인 변경사항 1
- 구체적인 변경사항 2

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### 예시
```
feat: 알림 카테고리 추가

- config/categories.js에 NOTIFICATION 추가
- NotificationForm, NotificationCard 생성
- useFormStore에 notification 상태 추가

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## 🐛 디버깅 팁

### 1. 콘솔 로그 활용
```jsx
console.log('현재 상태:', state)
console.log('필터링된 아이템:', filteredItems)
```

### 2. React DevTools
- Chrome 확장 프로그램 설치
- 컴포넌트 상태 실시간 확인

### 3. Zustand DevTools
```js
// stores/useItemsStore.js
import { devtools } from 'zustand/middleware'

export const useItemsStore = create(
  devtools(
    persist(
      // ...
    )
  )
)
```

### 4. 빌드 에러 해결
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules
npm install

# 캐시 삭제
npm run build -- --force
```

---

## 🎨 스타일 작업 팁

### CSS 변수 사용
```css
/* ❌ 나쁜 예 */
background: #1a1a1a;

/* ✅ 좋은 예 */
background: var(--bg-primary);
```

### 테마별 색상
```css
/* styles/tokens/colors.css */
:root[data-theme="dark"] {
  --bg-primary: #1a1a1a;
}

:root[data-theme="light"] {
  --bg-primary: #ffffff;
}
```

### 공통 스타일 재사용
```css
/* components/button.css */
.btn-primary { /* 공통 버튼 스타일 */ }
```

---

## 🔄 상태 관리 패턴

### Store는 순수 CRUD만
```js
// ✅ Store
addItem: (item) => { ... }
updateItem: (id, item) => { ... }
deleteItem: (id) => { ... }
```

### 비즈니스 로직은 hooks로
```js
// ✅ Hook
export function useItemActions() {
  // 복잡한 로직...
  const submitItem = () => { ... }
  return { submitItem }
}
```

---

## 📦 빌드 최적화

### 번들 크기 확인
```bash
npm run build
# dist/assets/ 폴더 확인
```

### 큰 라이브러리 동적 import
```jsx
// ❌ 나쁜 예
import HeavyLibrary from 'heavy-library'

// ✅ 좋은 예
const HeavyLibrary = lazy(() => import('heavy-library'))
```

---

## 🚀 배포 전 체크리스트

- [ ] `npm run build` 성공
- [ ] 모든 카테고리 동작 확인
- [ ] 검색 기능 확인
- [ ] 폼 제출 확인
- [ ] 다크/라이트 테마 확인
- [ ] 콘솔 에러 없음
- [ ] 커밋 메시지 확인

---

## 💡 유용한 명령어

```bash
# 전체 파일 검색
grep -r "검색어" src/

# 특정 확장자만 검색
find src/ -name "*.jsx" | xargs grep "검색어"

# 파일 줄 수 확인
wc -l src/**/*.jsx

# 디렉토리 구조 확인
tree src -L 3
```

---

## 🆘 자주 묻는 질문

### Q: 새 카테고리 추가했는데 안 나타나요
**A:** `config/categories.js`의 `CATEGORY_LIST`에도 추가했는지 확인

### Q: 폼 제출이 안 돼요
**A:** HTML5 validation 확인 (required 속성)

### Q: 검색이 안 돼요
**A:** `config/categories.js`의 `searchFields` 확인

### Q: 스타일이 안 먹혀요
**A:** CSS 변수 사용 여부 확인, 테마별 정의 확인

---

## 📚 추가 참고 자료

- [프로젝트 구조](./STRUCTURE.md)
- [기능 추가 가이드](./ADDING_FEATURES.md)
- [React 공식 문서](https://react.dev)
- [Zustand 공식 문서](https://zustand-demo.pmnd.rs)
