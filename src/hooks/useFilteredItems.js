import { useMemo } from 'react'
import { parseKoreanDate } from '../utils/dateUtils'
import { matchesSearch } from '../utils/search'

/**
 * 필터링된 아이템 목록 반환
 * - 카테고리 필터
 * - 검색 필터
 * - 날짜 필터
 * - 문의 방식 필터
 */
export function useFilteredItems({
  items,
  selectedCategory,
  searchTerm,
  dateFilter,
  inquiryTypeFilter,
  searchFields
}) {
  return useMemo(() => {
    return items
      .filter((item) => item.category === selectedCategory)
      .filter((item) => {
        // 검색 필터
        return matchesSearch(item, searchTerm, searchFields || [])
      })
      .filter((item) => {
        // 날짜 필터
        if (dateFilter.type === 'all') return true
        const itemDate = parseKoreanDate(item.date)
        return itemDate >= dateFilter.start && itemDate <= dateFilter.end
      })
      .filter((item) => {
        // 문의 방식 필터
        if (inquiryTypeFilter === '전체') return true
        return item.requestMethod === inquiryTypeFilter
      })
  }, [items, selectedCategory, searchTerm, dateFilter, inquiryTypeFilter, searchFields])
}
