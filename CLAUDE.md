# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

업무 관리 웹 앱 - 메모, 완료, 양식, 문서, 배포 기록 5가지 카테고리로 업무 항목을 관리. localStorage 기반으로 완전 오프라인 동작.

## 명령어

```bash
npm run dev      # 개발 서버 (Vite)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint 검사
npm run preview  # 빌드 결과 미리보기
```

## 기술 스택

- React 19 + Vite (rolldown-vite)
- localStorage (데이터 저장)
- react-markdown + remark-gfm (마크다운 렌더링)
- CSS 모듈화 (styles/ 폴더)

## 아키텍처

### 데이터 흐름

```
useWorkItems (전역 상태, localStorage CRUD)
    ↓
App.jsx (카테고리별 필터링, 상태 관리 중심)
    ↓
Sidebar (카테고리 선택) + Form 컴포넌트들 (입력)
    ↓
ItemList + Card 컴포넌트들 (표시)
```

### 폼 관리 패턴

각 폼 타입별 커스텀 훅 제공:
- `useMemoForm` - 메모/완료 폼
- `useTemplateForm` - 양식 폼
- `useDocumentForm` - 문서 폼
- `useDeploymentForm` - 배포 기록 폼

모든 폼 훅은 동일한 인터페이스: `resetForm()`, `setFormData()`, `getFormData()`

### 핵심 훅

`useWorkItems.js` - 모든 데이터 CRUD 담당. 카테고리별 배열 반환, 추가/수정/삭제/검색/필터 기능 제공. localStorage에 자동 저장.

## 작업 원칙

### 새로운 기능 추가 시
1. **문서 우선**: 추측하지 말고 최신 공식 문서 먼저 검색
2. **구조 파악**: 현재 프로젝트 설정/구조 확인 후 작업
3. **단계별 진행**: 큰 작업은 단계를 나눠서 진행하고 중간 결과 확인
4. **대안 탐색**: 한 가지 방법이 막히면 다른 접근법 검색

### 에러 해결 시
1. 에러 메시지 전체 분석
2. 관련 설정 파일 모두 확인 (예: tauri.conf.json + capabilities/)
3. 공식 문서에서 해당 버전의 권장 방법 검색
4. 여러 파일에 설정이 분산되어 있을 가능성 고려

### Tauri 관련 작업
- tauri.conf.json과 capabilities/ 폴더 **둘 다** 확인
- 플러그인 추가 시: JS 패키지 + Rust 의존성 + 권한 설정 3가지 모두 필요
- 권한 에러 발생 시: tauri.conf.json의 inline 권한 설정 우선 확인

## 컨벤션

- 한국어 UI (날짜: YYMMDD 또는 YYYY-MM-DD 형식, dateUtils.js에서 파싱)
- 카테고리: memo, completed, template, document, deployment
- 컴포넌트 파일명: PascalCase.jsx
- 훅 파일명: useCamelCase.js

## 최근 작업 (2026-02-12)

### 완료된 작업
- **배포 기록 폼 간소화**: 환경 선택 제거, 상태 통일(임시/진행/완료), 라벨 제거
- **HTML5 form validation**: 모든 폼에 required 속성 추가, alert() 제거
- **데이터 구조 개선**: deploymentDate/date 필드 충돌 해결, deployment 감지 로직 수정

### 다음 작업
- **배포 카드 디자인 개선** (보류 → 재작업 예정)
  - 미니멀하면서도 구분 가능한 레이아웃 필요
  - 사용자 디자인 가이드 제공 후 진행
