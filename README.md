# Work Organizer App

업무 관리 데스크탑 애플리케이션 - 메모, 완료, 양식, 문서, 배포 기록 5가지 카테고리로 업무 항목을 관리합니다.

## 특징

✅ **완전 오프라인 동작** - 파일 기반 저장 (Tauri)
✅ **시스템 트레이 통합** - 백그라운드 실행
✅ **라이트/다크 테마** - 완벽한 테마 전환
✅ **마크다운 렌더링** - GFM 지원
✅ **검색 및 필터링** - 실시간 검색
✅ **데이터 백업/복원** - JSON 내보내기/가져오기
✅ **디자인 토큰 기반 CSS** - 체계적인 스타일 관리

## 기술스택

### Desktop Framework
- **Tauri** 2.x - Rust 기반 데스크탑 프레임워크
  - 시스템 트레이 통합
  - 파일 기반 데이터 저장
  - 자동 실행 지원

### Core
- **React** 19.2.0 - UI 라이브러리
- **Vite** (rolldown-vite 7.2.5) - 빌드 도구 (Rolldown 번들러 사용)

### 상태 관리
- **Zustand** 5.0.11 - 경량 상태관리 라이브러리
  - Tauri: 파일 기반 persist adapter
  - 웹: IndexedDB persist (개발용)

### UI/렌더링
- **react-markdown** 10.1.0 - 마크다운 렌더링
- **remark-gfm** 4.0.1 - GitHub Flavored Markdown 지원
- **디자인 토큰 기반 CSS** - tokens/components/features 구조

### 개발 도구
- **ESLint** 9.39.1 - 코드 린팅
- **@vitejs/plugin-react** 5.1.1 - React Fast Refresh

## 시작하기

### 웹 버전 (개발용)
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 코드 린팅
npm run lint
```

### 데스크탑 앱 (Tauri)
```bash
# Tauri 개발 모드 (핫 리로드)
npm run tauri:dev

# 데스크탑 앱 빌드 (exe 생성)
npm run tauri:build
```

**데이터 저장 위치**:
- 웹: IndexedDB (브라우저 로컬)
- Tauri: `%APPDATA%\work-organizer\workItems.json`

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
│   ├── useFormStore.js    # 폼 상태
│   ├── useThemeStore.js   # 테마 전환
│   └── tauriStorage.js    # Tauri 파일 저장 adapter
├── styles/             # 디자인 토큰 기반 CSS
│   ├── tokens/         # 색상, 간격, 타이포 (단일 소스)
│   ├── base/           # 리셋, 레이아웃
│   ├── components/     # 재사용 컴포넌트 (button, badge, card...)
│   ├── features/       # 기능별 스타일 (memo-card, document-card...)
│   └── modules/        # CSS 모듈 (*.module.css)
└── utils/              # 유틸리티 함수
```

## 카테고리

- **Notes** - 진행 중인 메모
- **Done** - 완료된 항목
- **Forms** - 재사용 가능한 양식
- **Docs** - 문서 관리
- **Releases** - 배포 기록

## 데이터 관리

설정 모달 (⚙️ 버튼)에서:
- **데이터 탭**: 백업/복원, 전체 삭제
- **기타 탭**: 다크 모드 전환, Windows 자동 실행

### 백업 파일 위치
- Tauri: `%APPDATA%\work-organizer\backups\`
- 웹: 다운로드 폴더

## 완료된 기능

### 🎨 UI/UX
- ✅ 라이트/다크 테마 완벽 지원
- ✅ 디자인 토큰 기반 CSS 아키텍처
- ✅ 체계적인 색상 시스템 (40% 코드 감소)

### 🖥️ 데스크탑
- ✅ 시스템 트레이 통합
- ✅ 파일 기반 데이터 저장
- ✅ Windows 자동 실행 지원

### 📝 기능
- ✅ 5가지 카테고리 관리 (Notes/Done/Forms/Docs/Releases)
- ✅ 마크다운 렌더링 (GFM)
- ✅ 실시간 검색/필터링
- ✅ 데이터 백업/복원

## 개발 중인 기능

### 🔄 자동 백업 (다음 작업)
- [ ] 매일 자동 백업 (기본: 자정)
- [ ] 백업 보관 기간: 7일
- [ ] 백업 관리 UI

---

**참고**: 전역 단축키, 드래그 앤 드롭 기능은 PC 환경 제약으로 보류
