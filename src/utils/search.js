/**
 * 중첩 객체 경로로 값 가져오기
 * 예: getNestedValue(obj, 'requester.dealerCode') → obj.requester?.dealerCode
 */
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

/**
 * 검색어가 아이템과 매칭되는지 확인
 * @param {Object} item - 검색 대상 아이템
 * @param {string} searchTerm - 검색어
 * @param {string[]} searchFields - 검색할 필드 목록 (중첩 경로 지원)
 * @returns {boolean}
 */
export const matchesSearch = (item, searchTerm, searchFields) => {
  if (!searchTerm || !searchFields || searchFields.length === 0) {
    return true
  }

  const searchLower = searchTerm.toLowerCase()

  return searchFields.some(field => {
    const value = getNestedValue(item, field)
    return value && String(value).toLowerCase().includes(searchLower)
  })
}
