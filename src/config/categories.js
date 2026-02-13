import MemoForm from '../components/MemoForm'
import TemplateForm from '../components/TemplateForm'
import DocumentForm from '../components/DocumentForm'
import DeploymentForm from '../components/DeploymentForm'
import ItemCard from '../components/ItemCard'
import TemplateCard from '../components/TemplateCard'
import DocumentCard from '../components/DocumentCard'

/**
 * 카테고리 메타데이터
 * - 새 카테고리 추가 시 이 파일만 수정하면 됨
 */
export const CATEGORIES = {
  MEMO: {
    id: 'memo',
    label: '메모',
    displayName: '📝 메모',
    FormComponent: MemoForm,
    CardComponent: ItemCard,
    hasSearch: true,
    searchFields: ['title', 'content', 'contactInfo', 'requester.dealerCode', 'requester.dealerName', 'requester.name', 'requester.team', 'requester.freeText'],
    searchPlaceholder: '검색... (제목, 내용, 연락처, 대리점, 담당자)',
    hasAdvancedFilter: false,
    hasInputForm: true,
    color: 'blue'
  },

  COMPLETED: {
    id: 'completed',
    label: '완료',
    displayName: '✅ 완료',
    FormComponent: MemoForm,
    CardComponent: ItemCard,
    hasSearch: true,
    searchFields: ['title', 'content', 'contactInfo', 'requester.dealerCode', 'requester.dealerName', 'requester.name', 'requester.team', 'requester.freeText'],
    searchPlaceholder: '검색... (제목, 내용, 연락처, 대리점, 담당자)',
    hasAdvancedFilter: true,  // 날짜/방식 필터
    hasInputForm: true,
    color: 'green'
  },

  TEMPLATE: {
    id: 'template',
    label: '양식',
    displayName: '📋 양식',
    FormComponent: TemplateForm,
    CardComponent: TemplateCard,
    hasSearch: true,
    searchFields: ['title', 'content'],
    searchPlaceholder: '양식 검색...',
    hasAdvancedFilter: false,
    hasInputForm: true,
    color: 'purple'
  },

  DOCUMENT: {
    id: 'document',
    label: '문서',
    displayName: '📄 문서',
    FormComponent: DocumentForm,
    CardComponent: DocumentCard,
    hasSearch: true,
    searchFields: ['title', 'content'],
    searchPlaceholder: '문서 검색...',
    hasAdvancedFilter: false,
    hasInputForm: true,
    color: 'orange'
  },

  DEPLOYMENT: {
    id: 'deployment',
    label: '배포 기록',
    displayName: '🚀 배포 기록',
    FormComponent: DeploymentForm,
    CardComponent: ItemCard,  // 배포도 ItemCard 사용 (나중에 분리)
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
  CATEGORIES.MEMO,
  CATEGORIES.COMPLETED,
  CATEGORIES.TEMPLATE,
  CATEGORIES.DOCUMENT,
  CATEGORIES.DEPLOYMENT
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
