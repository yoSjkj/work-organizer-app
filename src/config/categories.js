import MemoForm from '../components/forms/MemoForm'
import TemplateForm from '../components/forms/TemplateForm'
import DocumentForm from '../components/forms/DocumentForm'
import DeploymentForm from '../components/forms/DeploymentForm'
import {
  MemoCard,
  CompletedCard,
  TemplateCard,
  DocumentCard,
  DeploymentCard
} from '../components/cards'

/**
 * 카테고리 메타데이터
 * - 새 카테고리 추가 시 이 파일만 수정하면 됨
 */
export const CATEGORIES = {
  TASKS: {
    id: 'tasks',
    label: 'Tasks',
    displayName: 'Tasks',
    icon: '✎',
    FormComponent: MemoForm,
    CardComponent: MemoCard,
    hasSearch: true,
    searchFields: ['title', 'content', 'contactInfo', 'requester.dealerCode', 'requester.dealerName', 'requester.name', 'requester.team', 'requester.freeText'],
    searchPlaceholder: '검색',
    hasAdvancedFilter: false,
    hasInputForm: true,
    color: 'blue'
  },

  COMPLETED: {
    id: 'completed',
    label: 'Completed',
    displayName: 'Completed',
    icon: '✓',
    FormComponent: MemoForm,
    CardComponent: CompletedCard,
    hasSearch: true,
    searchFields: ['title', 'content', 'contactInfo', 'requester.dealerCode', 'requester.dealerName', 'requester.name', 'requester.team', 'requester.freeText'],
    searchPlaceholder: '검색',
    hasAdvancedFilter: true,  // 날짜/방식 필터
    hasInputForm: true,
    color: 'green'
  },

  TEMPLATES: {
    id: 'templates',
    label: 'Templates',
    displayName: 'Templates',
    icon: '⊟',
    FormComponent: TemplateForm,
    CardComponent: TemplateCard,
    hasSearch: true,
    searchFields: ['title', 'content'],
    searchPlaceholder: '검색',
    hasAdvancedFilter: false,
    hasInputForm: true,
    color: 'purple'
  },

  DOCUMENTS: {
    id: 'documents',
    label: 'Documents',
    displayName: 'Documents',
    icon: '≡',
    FormComponent: DocumentForm,
    CardComponent: DocumentCard,
    hasSearch: true,
    searchFields: ['title', 'content'],
    searchPlaceholder: '검색',
    hasAdvancedFilter: false,
    hasInputForm: true,
    color: 'orange'
  },

  RELEASES: {
    id: 'releases',
    label: 'Releases',
    displayName: 'Releases',
    icon: '↑',
    FormComponent: DeploymentForm,
    CardComponent: DeploymentCard,
    hasSearch: false,
    searchFields: [],
    searchPlaceholder: '',
    hasAdvancedFilter: false,
    hasInputForm: true,
    color: 'red'
  }
}

/**
 * 카테고리 배열 (순서 유지)
 */
export const CATEGORY_LIST = [
  CATEGORIES.TASKS,
  CATEGORIES.COMPLETED,
  CATEGORIES.TEMPLATES,
  CATEGORIES.DOCUMENTS,
  CATEGORIES.RELEASES
]

/**
 * 레이블로 카테고리 찾기
 */
export const getCategoryByLabel = (label) => {
  return CATEGORY_LIST.find(cat => cat.label === label)
}

/**
 * ID로 카테고리 찾기
 */
export const getCategoryById = (id) => {
  return CATEGORY_LIST.find(cat => cat.id === id)
}

/**
 * 레이블 ↔ ID 변환
 */
export const labelToId = (label) => {
  const category = getCategoryByLabel(label)
  return category ? category.id : null
}

export const idToLabel = (id) => {
  const category = getCategoryById(id)
  return category ? category.label : null
}

/**
 * 검색 가능한 카테고리인지 확인
 */
export const isSearchableCategory = (label) => {
  const category = getCategoryByLabel(label)
  return category ? category.hasSearch : false
}

/**
 * 고급 필터가 있는 카테고리인지 확인
 */
export const hasAdvancedFilterCategory = (label) => {
  const category = getCategoryByLabel(label)
  return category ? category.hasAdvancedFilter : false
}

/**
 * 입력 폼이 있는 카테고리인지 확인
 */
export const hasInputFormCategory = (label) => {
  const category = getCategoryByLabel(label)
  return category ? category.hasInputForm : false
}
