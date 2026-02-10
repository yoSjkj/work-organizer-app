import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import localforage from 'localforage'
import { useFormStore } from './useFormStore'
import { useUIStore } from './useUIStore'
import { tauriStorage, isTauri } from './tauriStorage'

// Tauri 환경이면 파일 저장, 아니면 IndexedDB
const storage = isTauri() ? tauriStorage : localforage

export const useItemsStore = create(
  persist(
    (set, get) => ({
      items: [],

      // 항목 추가/수정 (통합)
      submitItem: () => {
        const { selectedCategory, editingId, setEditingId, setSelectedCategory } = useUIStore.getState()
        const { getFormData, resetForm, memo, template, document, deployment } = useFormStore.getState()
        const { addItem, updateItem } = get()

        // 메모/완료
        if (selectedCategory === '메모' || selectedCategory === '완료') {
          if (!memo.content.trim()) {
            alert('내용을 입력해주세요!')
            return
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
          if (!template.title.trim()) {
            alert('제목을 입력해주세요!')
            return
          }
          if (!template.content.trim()) {
            alert('내용을 입력해주세요!')
            return
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
          if (!document.title.trim()) {
            alert('제목을 입력해주세요!')
            return
          }
          if (!document.content.trim()) {
            alert('내용을 입력해주세요!')
            return
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
          if (!deployment.file.trim()) {
            alert('파일명을 입력해주세요!')
            return
          }

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
      },

      // 항목 추가
      addItem: (newItem) => {
        set((state) => ({ items: [newItem, ...state.items] }))
      },

      // 항목 수정
      updateItem: (id, updatedItem) => {
        set((state) => ({
          items: state.items.map(item => item.id === id ? updatedItem : item)
        }))
      },

      // 항목 삭제
      deleteItem: (id) => {
        set((state) => ({
          items: state.items.filter(item => item.id !== id)
        }))
      },

      // 항목 수정 시작
      startEdit: (item) => {
        const { setEditingId, setSelectedCategory } = useUIStore.getState()
        const { setFormData } = useFormStore.getState()

        setEditingId(item.id)

        if (item.requestMethod) {
          setFormData('memo', item)
        } else if (item.target) {
          setFormData('deployment', item)
        } else if (item.docCategory) {
          setFormData('document', item)
        } else {
          setFormData('template', item)
        }

        setSelectedCategory(item.category)
      },

      // 상태 변경
      changeStatus: (id, newStatus) => {
        set((state) => ({
          items: state.items.map(item => {
            if (item.id === id) {
              return {
                ...item,
                status: newStatus,
                category: newStatus === '완료' ? '완료' : item.category
              }
            }
            return item
          })
        }))
      },

      // 데이터 내보내기
      exportData: () => {
        const { items } = get()
        const data = {
          items: items,
          exportDate: new Date().toISOString(),
          version: '1.0'
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json'
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `업무메모_백업_${new Date().toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '')}.json`
        a.click()
        URL.revokeObjectURL(url)
      },

      // 데이터 가져오기
      importData: (event) => {
        const file = event.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result)

            if (data.version && data.items) {
              set({ items: data.items })
              alert(`백업 복원 완료!\n${data.items.length}개 항목 불러옴\n백업 날짜: ${new Date(data.exportDate).toLocaleString('ko-KR')}`)
            } else {
              set({ items: data })
              alert(`백업 복원 완료!\n${data.length}개 항목 불러옴`)
            }
          } catch (error) {
            alert('백업 파일을 읽을 수 없습니다.')
            console.error(error)
          }
        }
        reader.readAsText(file)
      },

      // 전체 삭제
      clearAllData: () => {
        if (window.confirm('⚠️ 모든 데이터를 삭제하시겠습니까?\n백업을 먼저 하는 것을 권장합니다!')) {
          if (window.confirm('정말로 삭제하시겠습니까? 복구할 수 없습니다!')) {
            set({ items: [] })
            alert('모든 데이터가 삭제되었습니다.')
          }
        }
      }
    }),
    {
      name: 'workItems',
      storage: createJSONStorage(() => storage)
    }
  )
)
