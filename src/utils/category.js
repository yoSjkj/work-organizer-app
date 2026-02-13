import { getCategoryByLabel, getCategoryById } from '../config/categories'

/**
 * 카테고리별 색상 매핑
 */
const CATEGORY_COLORS = {
  memo: 'blue',
  completed: 'green',
  template: 'purple',
  document: 'orange',
  deployment: 'red'
}

/**
 * 카테고리 색상 가져오기
 */
export const getCategoryColor = (categoryLabel) => {
  const category = getCategoryByLabel(categoryLabel)
  return category ? CATEGORY_COLORS[category.id] : 'gray'
}

/**
 * 카테고리 아이콘 가져오기 (이모지)
 */
export const getCategoryIcon = (categoryLabel) => {
  const category = getCategoryByLabel(categoryLabel)
  if (!category) return '📌'

  const icons = {
    memo: '📝',
    completed: '✅',
    template: '📋',
    document: '📄',
    deployment: '🚀'
  }

  return icons[category.id] || '📌'
}

/**
 * 카테고리가 검색 가능한지 확인
 */
export const isCategorySearchable = (categoryLabel) => {
  const category = getCategoryByLabel(categoryLabel)
  return category?.hasSearch || false
}

/**
 * 카테고리에 입력 폼이 있는지 확인
 */
export const hasCategoryInputForm = (categoryLabel) => {
  const category = getCategoryByLabel(categoryLabel)
  return category?.hasInputForm || false
}
