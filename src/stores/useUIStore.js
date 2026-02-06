import { create } from 'zustand'

export const useUIStore = create((set) => ({
  selectedCategory: '메모',
  searchTerm: '',
  editingId: null,
  dateFilter: { type: 'all' },
  inquiryTypeFilter: '전체',

  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setEditingId: (id) => set({ editingId: id }),
  setDateFilter: (filter) => set({ dateFilter: filter }),
  setInquiryTypeFilter: (filter) => set({ inquiryTypeFilter: filter }),

  // 수정 취소
  cancelEdit: () => set({ editingId: null })
}))
