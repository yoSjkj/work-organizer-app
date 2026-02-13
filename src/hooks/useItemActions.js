import { useCallback } from 'react'
import { useItemsStore } from '../stores/useItemsStore'
import { useUIStore } from '../stores/useUIStore'
import { useFormStore } from '../stores/useFormStore'

/**
 * 아이템 CRUD 액션 훅
 * - submitItem: 폼 제출 (추가/수정)
 * - handleEdit: 아이템 수정 시작
 */
export function useItemActions(inputFormRef) {
  const addItem = useItemsStore((state) => state.addItem)
  const updateItem = useItemsStore((state) => state.updateItem)
  const startEdit = useItemsStore((state) => state.startEdit)

  const selectedCategory = useUIStore((state) => state.selectedCategory)
  const editingId = useUIStore((state) => state.editingId)
  const setEditingId = useUIStore((state) => state.setEditingId)
  const setSelectedCategory = useUIStore((state) => state.setSelectedCategory)

  const { getFormData, resetForm, memo, template, document, deployment } = useFormStore()

  /**
   * 폼 제출 (추가/수정)
   */
  const submitItem = useCallback(() => {
    // 메모/완료
    if (selectedCategory === '메모' || selectedCategory === '완료') {
      if (!memo.content.trim()) {
        return // HTML5 validation이 처리
      }

      const formData = getFormData('memo')
      let targetCategory
      if (formData.status === '완료') {
        targetCategory = '완료'
      } else if (formData.status === '임시' || formData.status === '진행') {
        targetCategory = '메모'
      } else {
        targetCategory = selectedCategory
      }

      const newItem = {
        id: editingId || Date.now(),
        ...formData,
        category: targetCategory,
        date: new Date().toLocaleDateString('ko-KR'),
        time: new Date().toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit'
        })
      }

      if (editingId) {
        updateItem(editingId, newItem)
        setEditingId(null)
      } else {
        addItem(newItem)
      }

      resetForm('memo')
      setSelectedCategory(targetCategory)
    }
    // 양식
    else if (selectedCategory === '양식') {
      if (!template.title.trim() || !template.content.trim()) {
        return // HTML5 validation이 처리
      }

      const newItem = {
        id: editingId || Date.now(),
        ...getFormData('template'),
        category: selectedCategory,
        date: new Date().toLocaleDateString('ko-KR'),
        time: new Date().toLocaleTimeString('ko-KR')
      }

      if (editingId) {
        updateItem(editingId, newItem)
        setEditingId(null)
      } else {
        addItem(newItem)
      }

      resetForm('template')
    }
    // 문서
    else if (selectedCategory === '문서') {
      if (!document.title.trim() || !document.content.trim()) {
        return // HTML5 validation이 처리
      }

      const newItem = {
        id: editingId || Date.now(),
        ...getFormData('document'),
        category: selectedCategory,
        date: new Date().toLocaleDateString('ko-KR'),
        time: new Date().toLocaleTimeString('ko-KR')
      }

      if (editingId) {
        updateItem(editingId, newItem)
        setEditingId(null)
      } else {
        addItem(newItem)
      }

      resetForm('document')
    }
    // 배포 기록
    else if (selectedCategory === '배포 기록') {
      const newItem = {
        id: editingId || Date.now(),
        ...getFormData('deployment'),
        category: selectedCategory,
        date: new Date().toLocaleDateString('ko-KR'),
        time: new Date().toLocaleTimeString('ko-KR')
      }

      if (editingId) {
        updateItem(editingId, newItem)
        setEditingId(null)
      } else {
        addItem(newItem)
      }

      resetForm('deployment')
    }
  }, [
    selectedCategory,
    editingId,
    setEditingId,
    setSelectedCategory,
    memo,
    template,
    document,
    deployment,
    getFormData,
    resetForm,
    addItem,
    updateItem
  ])

  /**
   * 아이템 수정 시작 (스크롤 포함)
   */
  const handleEdit = useCallback((item) => {
    startEdit(item)
    setTimeout(() => {
      inputFormRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }, 100)
  }, [startEdit, inputFormRef])

  return {
    submitItem,
    handleEdit
  }
}
