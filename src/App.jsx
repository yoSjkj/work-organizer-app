import { useRef, useDeferredValue, useEffect } from 'react'
import localforage from 'localforage'
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { isTauri } from './stores/tauriStorage'
import { useThemeStore } from './stores/useThemeStore'
import './App.css'
import AppLayout from './layouts/AppLayout'
import { useItemsStore } from './stores/useItemsStore'
import { useUIStore } from './stores/useUIStore'
import { getCategoryById } from './config/categories'
import { useFilteredItems } from './hooks/useFilteredItems'
import { useItemActions } from './hooks/useItemActions'

function App() {
  const inputFormRef = useRef(null)

  // Theme
  const theme = useThemeStore((state) => state.theme)

  // Items store
  const items = useItemsStore((state) => state.items)
  const deleteItem = useItemsStore((state) => state.deleteItem)
  const changeStatus = useItemsStore((state) => state.changeStatus)

  // UI store
  const selectedCategory = useUIStore((state) => state.selectedCategory)
  const searchTerm = useUIStore((state) => state.searchTerm)
  const setSearchTerm = useUIStore((state) => state.setSearchTerm)
  const dateFilter = useUIStore((state) => state.dateFilter)
  const setDateFilter = useUIStore((state) => state.setDateFilter)
  const inquiryTypeFilter = useUIStore((state) => state.inquiryTypeFilter)
  const setInquiryTypeFilter = useUIStore((state) => state.setInquiryTypeFilter)

  // 검색어를 지연시켜서 클릭 이벤트가 먼저 처리되도록
  const deferredSearchTerm = useDeferredValue(searchTerm)

  // 아이템 액션
  const { submitItem, handleEdit } = useItemActions(inputFormRef)

  // 테마 적용
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // 데이터 마이그레이션 (Tauri: IndexedDB → 파일)
  useEffect(() => {
    const migrateData = async () => {
      try {
        if (isTauri()) {
          // Tauri 환경: IndexedDB → 파일로 마이그레이션
          const migrated = localStorage.getItem('migrated-to-tauri')
          if (migrated) return

          const indexedDBData = await localforage.getItem('workItems')
          if (indexedDBData) {
            console.log('📦 IndexedDB → Tauri 파일 마이그레이션 시작...')
            await invoke('save_data', { data: indexedDBData })
            console.log('✅ Tauri 마이그레이션 완료!')

            localStorage.setItem('migrated-to-tauri', 'true')
            // IndexedDB 데이터는 유지 (백업용)
          }
        } else {
          // 웹 환경: localStorage → IndexedDB (기존 로직)
          const migrated = localStorage.getItem('migrated-to-indexeddb')
          if (migrated) return

          const oldData = localStorage.getItem('workItems')
          if (oldData) {
            console.log('📦 localStorage → IndexedDB 마이그레이션 시작...')
            await localforage.setItem('workItems', oldData)
            console.log('✅ 마이그레이션 완료!')

            localStorage.setItem('migrated-to-indexeddb', 'true')
            localStorage.removeItem('workItems')
          }
        }
      } catch (error) {
        console.error('마이그레이션 오류:', error)
      }
    }
    migrateData()
  }, [])

  // 빠른 메모 이벤트 리스너 (Tauri 전역 단축키)
  useEffect(() => {
    if (!isTauri()) return

    const currentWindow = getCurrentWebviewWindow()

    const unlisten = currentWindow.listen('quick-note-added', (event) => {
      const content = event.payload

      // 메모 추가
      const newItem = {
        id: Date.now(),
        category: 'tasks',
        status: '진행',
        requestMethod: 'POST',
        url: '',
        content: content,
        date: new Date().toLocaleDateString('ko-KR'),
        time: new Date().toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit'
        })
      }

      useItemsStore.getState().addItem(newItem)
      console.log('⚡ 빠른 메모 추가됨:', content.substring(0, 30) + '...')
    })

    return () => {
      unlisten.then(fn => fn())
    }
  }, [])

  // 카테고리 변경 시 검색어 초기화
  useEffect(() => {
    setSearchTerm('')
  }, [selectedCategory, setSearchTerm])


  // 현재 카테고리 설정
  const currentCategory = getCategoryById(selectedCategory)
  const FormComponent = currentCategory?.FormComponent

  // 필터링된 항목들
  const filteredItems = useFilteredItems({
    items,
    selectedCategory,
    searchTerm: deferredSearchTerm,
    dateFilter,
    inquiryTypeFilter,
    searchFields: currentCategory?.searchFields
  })

  return (
    <AppLayout
      selectedCategory={selectedCategory}
      currentCategory={currentCategory}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onDateFilterChange={setDateFilter}
      onInquiryTypeChange={setInquiryTypeFilter}
      FormComponent={FormComponent}
      inputFormRef={inputFormRef}
      onSubmit={submitItem}
      items={filteredItems}
      onDelete={deleteItem}
      onStatusChange={changeStatus}
      onEdit={handleEdit}
    />
  )
}

export default App
