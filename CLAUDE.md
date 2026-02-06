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

## 컨벤션

- 한국어 UI (날짜: YYMMDD 또는 YYYY-MM-DD 형식, dateUtils.js에서 파싱)
- 카테고리: memo, completed, template, document, deployment
- 컴포넌트 파일명: PascalCase.jsx
- 훅 파일명: useCamelCase.js
