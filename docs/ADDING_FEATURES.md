# ✨ 기능 추가 가이드

> 자주 하는 작업들의 단계별 가이드입니다.

## 📋 목차

1. [새 카테고리 추가하기](#새-카테고리-추가하기)
2. [폼에 필드 추가하기](#폼에-필드-추가하기)
3. [새 필드 컴포넌트 만들기](#새-필드-컴포넌트-만들기)
4. [카드 디자인 수정하기](#카드-디자인-수정하기)
5. [검색 필드 추가하기](#검색-필드-추가하기)

---

## 🎯 새 카테고리 추가하기

**예시:** "알림" 카테고리 추가

### 1단계: 카테고리 설정 추가

**파일:** `src/config/categories.js`

```js
export const CATEGORIES = {
  // 기존 카테고리...

  NOTIFICATION: {
    id: 'notification',
    label: '알림',
    displayName: '🔔 알림',
    FormComponent: NotificationForm,
    CardComponent: NotificationCard,
    hasSearch: true,
    searchFields: ['title', 'content', 'from'],
    searchPlaceholder: '알림 검색...',
    hasAdvancedFilter: false,
    hasInputForm: true,
    color: 'yellow'
  }
}

// CATEGORY_LIST에도 추가
export const CATEGORY_LIST = [
  CATEGORIES.MEMO,
  CATEGORIES.COMPLETED,
  CATEGORIES.TEMPLATE,
  CATEGORIES.DOCUMENT,
  CATEGORIES.DEPLOYMENT,
  CATEGORIES.NOTIFICATION  // ← 추가
]
```

### 2단계: 폼 컴포넌트 만들기

**파일:** `src/components/forms/NotificationForm.jsx`

```jsx
import { useFormStore } from '../../stores/useFormStore'
import { useUIStore } from '../../stores/useUIStore'
import { TextField, TextArea } from './fields'

function NotificationForm({ onSubmit }) {
  const notification = useFormStore((state) => state.notification)
  const setNotificationField = useFormStore((state) => state.setNotificationField)

  return (
    <>
      <TextField
        placeholder="발신자"
        value={notification.from}
        onChange={(val) => setNotificationField('from', val)}
        required
      />
      <TextField
        placeholder="제목"
        value={notification.title}
        onChange={(val) => setNotificationField('title', val)}
        required
      />
      <TextArea
        placeholder="내용"
        value={notification.content}
        onChange={(val) => setNotificationField('content', val)}
        required
      />
      <button type="submit" className="add-btn">추가</button>
    </>
  )
}

export default NotificationForm
```

### 3단계: 카드 컴포넌트 만들기

**파일:** `src/components/cards/NotificationCard.jsx`

```jsx
function NotificationCard({ item, onDelete, onEdit }) {
  return (
    <div className="item-card notification-card">
      <div className="item-header">
        <h3>{item.title}</h3>
        <span className="item-date">{item.date}</span>
      </div>
      <p className="notification-from">발신: {item.from}</p>
      <p className="item-content">{item.content}</p>
      <div className="item-actions">
        <button onClick={() => onEdit(item)}>수정</button>
        <button onClick={() => onDelete(item.id)}>삭제</button>
      </div>
    </div>
  )
}

export default NotificationCard
```

### 4단계: index.js에 export 추가

**파일:** `src/components/cards/index.js`

```js
export { default as NotificationCard } from './NotificationCard'
```

### 5단계: 폼 상태 추가

**파일:** `src/stores/useFormStore.js`

```js
notification: {
  from: '',
  title: '',
  content: ''
},

setNotificationField: (field, value) => {
  set((state) => ({
    notification: { ...state.notification, [field]: value }
  }))
},
```

### 6단계: Sidebar에 영문 라벨 추가

**파일:** `src/components/Sidebar.jsx`

```js
export const categoryLabels = {
  '메모': 'Notes',
  '완료': 'Done',
  '양식': 'Forms',
  '문서': 'Docs',
  '배포 기록': 'Releases',
  '알림': 'Notifications'  // ← 추가
}
```

### ✅ 완료!

이제 앱에서 "알림" 카테고리가 자동으로 나타납니다!

---

## 📝 폼에 필드 추가하기

**예시:** MemoForm에 "중요도" 필드 추가

### 1단계: 폼 컴포넌트 수정

**파일:** `src/components/forms/MemoForm.jsx`

```jsx
import { SelectField } from './fields'

// OPTIONS에 추가
const OPTIONS = {
  // ...
  priorities: ['낮음', '보통', '높음', '긴급']
}

// JSX에 추가
<SelectField
  value={memo.priority}
  onChange={(val) => setMemoField('priority', val)}
  options={OPTIONS.priorities}
/>
```

### 2단계: 폼 상태 추가

**파일:** `src/stores/useFormStore.js`

```js
memo: {
  // 기존 필드들...
  priority: '보통',  // ← 추가
}
```

### 3단계: 검색 필드에 추가 (선택사항)

**파일:** `src/config/categories.js`

```js
MEMO: {
  // ...
  searchFields: [
    'title',
    'content',
    'priority',  // ← 추가
    // ...
  ]
}
```

### ✅ 완료!

---

## 🧩 새 필드 컴포넌트 만들기

**예시:** 날짜 선택 필드 만들기

### 1단계: 필드 컴포넌트 생성

**파일:** `src/components/forms/fields/DateField.jsx`

```jsx
function DateField({ value, onChange, placeholder, required }) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
    />
  )
}

export default DateField
```

### 2단계: index.js에 export 추가

**파일:** `src/components/forms/fields/index.js`

```js
export { default as DateField } from './DateField'
```

### 3단계: 사용하기

```jsx
import { DateField } from './fields'

<DateField
  value={form.dueDate}
  onChange={(val) => setField('dueDate', val)}
  required
/>
```

### ✅ 완료!

---

## 🎨 카드 디자인 수정하기

**예시:** MemoCard 배경색 변경

### CSS만 수정하면 됨!

**파일:** `src/styles/features/memo-card.css` (또는 해당 스타일 파일)

```css
.memo-card {
  background: var(--bg-secondary);
  border-left: 3px solid var(--accent-primary);
  /* 원하는 스타일 추가 */
}
```

**컴포넌트 코드는 수정 불필요!** ✨

---

## 🔍 검색 필드 추가하기

**예시:** MemoCard에 "태그" 검색 추가

### 1단계: 카테고리 설정 수정

**파일:** `src/config/categories.js`

```js
MEMO: {
  // ...
  searchFields: [
    'title',
    'content',
    'tags',  // ← 추가
    // ...
  ]
}
```

### ✅ 완료!

`matchesSearch` 함수가 자동으로 처리합니다!

---

## 🚀 빠른 참조

| 작업 | 수정할 파일 | 소요 시간 |
|------|------------|----------|
| 카테고리 추가 | `config/categories.js` + 폼/카드 생성 | 10분 |
| 필드 추가 | 폼 컴포넌트 + 상태 | 2분 |
| 필드 컴포넌트 생성 | `forms/fields/` | 5분 |
| 카드 디자인 수정 | CSS 파일 | 1분 |
| 검색 필드 추가 | `config/categories.js` | 30초 |

---

## 💡 팁

### 기존 컴포넌트 참고하기

새 기능 추가 시 비슷한 기존 컴포넌트를 복사해서 수정하면 빠릅니다!

```bash
# 메모 카드를 복사해서 알림 카드 만들기
cp src/components/cards/MemoCard.jsx src/components/cards/NotificationCard.jsx
```

### 폼 필드 조합 활용

```jsx
// 기존 필드 조합으로 빠르게 만들기
<SelectField />
<TextField />
<TextArea />
<RequesterFields />
```

### config 우선 수정

새 기능 추가 시 항상 `config/categories.js`부터 수정하세요!
