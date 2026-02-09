import { create } from 'zustand'

export const useUIStore = create((set) => ({
  selectedCategory: '메모',
  searchTerm: '',
  editingId: null,
  dateFilter: { type: 'all' },
  inquiryTypeFilter: '전체',
  expandedDocuments: new Set(), // 확장된 문서 ID들

  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setEditingId: (id) => set({ editingId: id }),
  setDateFilter: (filter) => set({ dateFilter: filter }),
  setInquiryTypeFilter: (filter) => set({ inquiryTypeFilter: filter }),

  // 문서 확장/축소
  toggleDocumentExpanded: (id) => set((state) => {
    const newExpanded = new Set(state.expandedDocuments)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    return { expandedDocuments: newExpanded }
  }),

  // 수정 취소
  cancelEdit: () => set({ editingId: null })
}))
