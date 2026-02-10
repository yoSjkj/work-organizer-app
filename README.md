# Work Organizer App

업무 관리 웹 애플리케이션 - 메모, 완료, 양식, 문서, 배포 기록 5가지 카테고리로 업무 항목을 관리합니다.

## 특징

✅ 완전 오프라인 동작 (IndexedDB)
✅ 마크다운 렌더링 지원
✅ 검색 및 필터링 기능
✅ 데이터 백업/복원

## 기술스택

### Core
- **React** 19.2.0 - UI 라이브러리
- **Vite** (rolldown-vite 7.2.5) - 빌드 도구 (Rolldown 번들러 사용)

### 상태 관리
- **Zustand** 5.0.11 - 경량 상태관리 라이브러리
  - persist 미들웨어로 IndexedDB 자동 동기화

### 데이터 저장
- **localforage** 1.10.0 - IndexedDB/localStorage wrapper
- **dexie** 4.2.1 - IndexedDB 라이브러리

### UI/렌더링
- **react-markdown** 10.1.0 - 마크다운 렌더링
- **remark-gfm** 4.0.1 - GitHub Flavored Markdown 지원
- **Pure CSS** - 스타일링 (CSS 모듈화, 별도 라이브러리 없음)

### 개발 도구
- **ESLint** 9.39.1 - 코드 린팅
- **@vitejs/plugin-react** 5.1.1 - React Fast Refresh

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview

# 코드 린팅
npm run lint
```

## 프로젝트 구조

```
src/
├── components/          # React 컴포넌트
│   ├── Sidebar.jsx     # 카테고리 메뉴
│   ├── *Form.jsx       # 입력 폼들
│   └── *Card.jsx       # 카드 컴포넌트들
├── stores/             # Zustand 상태 관리
│   ├── useItemsStore.js   # 데이터 CRUD
│   ├── useUIStore.js      # UI 상태
│   └── useFormStore.js    # 폼 상태
├── styles/             # CSS 모듈
└── utils/              # 유틸리티 함수
```

## 카테고리

- **Notes** - 진행 중인 메모
- **Done** - 완료된 항목
- **Forms** - 재사용 가능한 양식
- **Docs** - 문서 관리
- **Releases** - 배포 기록

## 데이터 관리

사이드바의 "데이터 관리" 섹션에서:
- **백업**: JSON 파일로 내보내기
- **복원**: JSON 파일에서 불러오기
- **전체삭제**: 모든 데이터 삭제 (주의!)
