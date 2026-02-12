import { useRef, useDeferredValue, useEffect } from 'react'
import localforage from 'localforage'
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { isTauri } from './stores/tauriStorage'
import { useThemeStore } from './stores/useThemeStore'
import './App.css'
import Sidebar, { categoryLabels } from './components/Sidebar'
import MemoForm from './components/MemoForm'
import DeploymentForm from './components/DeploymentForm'
import TemplateForm from './components/TemplateForm'
import DocumentForm from './components/DocumentForm'
import ItemList from './components/ItemList'
import SearchBar from './components/SearchBar'
import CompletedFilters from './components/CompletedFilters'
import { useItemsStore } from './stores/useItemsStore'
import { useUIStore } from './stores/useUIStore'
import { parseKoreanDate } from './utils/dateUtils'

function App() {
  const inputFormRef = useRef(null)

  // Theme
  const theme = useThemeStore((state) => state.theme)

  // Items store
  const items = useItemsStore((state) => state.items)
  const submitItem = useItemsStore((state) => state.submitItem)
  const deleteItem = useItemsStore((state) => state.deleteItem)
  const changeStatus = useItemsStore((state) => state.changeStatus)
  const startEdit = useItemsStore((state) => state.startEdit)

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
        category: '메모',
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

  // 수정 시 스크롤
  const handleEdit = (item) => {
    startEdit(item)
    setTimeout(() => {
      inputFormRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }, 100)
  }

  // 검색어 플레이스홀더
  const searchPlaceholders = {
    '메모': '검색... (제목, 내용, 연락처, 대리점, 담당자)',
    '완료': '검색... (제목, 내용, 연락처, 대리점, 담당자)',
    '양식': '양식 검색...',
    '문서': '문서 검색...'
  }

  // 카테고리별 UI 설정
  const categoryConfig = {
    hasSearch: ['메모', '완료', '양식', '문서'].includes(selectedCategory),
    hasAdvancedFilter: selectedCategory === '완료',
    hasInputForm: ['메모', '완료', '양식', '문서', '배포 기록'].includes(selectedCategory)
  }

  // 입력 폼 렌더링
  const renderInputForm = () => {
    if (selectedCategory === '메모' || selectedCategory === '완료') {
      return <MemoForm onSubmit={submitItem} />
    } else if (selectedCategory === '양식') {
      return <TemplateForm onSubmit={submitItem} />
    } else if (selectedCategory === '문서') {
      return <DocumentForm onSubmit={submitItem} />
    } else if (selectedCategory === '배포 기록') {
      return <DeploymentForm onSubmit={submitItem} />
    }
    return null
  }

  // 필터링된 항목들
  const filteredItems = items
    .filter((item) => item.category === selectedCategory)
    .filter((item) => {
      if (!deferredSearchTerm) return true

      const searchLower = deferredSearchTerm.toLowerCase()

      if (item.title?.toLowerCase().includes(searchLower)) return true
      if (item.content?.toLowerCase().includes(searchLower)) return true
      if (item.contactInfo?.toLowerCase().includes(searchLower)) return true
      if (item.requester?.dealerCode?.toLowerCase().includes(searchLower)) return true
      if (item.requester?.dealerName?.toLowerCase().includes(searchLower)) return true
      if (item.requester?.name?.toLowerCase().includes(searchLower)) return true
      if (item.requester?.team?.toLowerCase().includes(searchLower)) return true
      if (item.requester?.freeText?.toLowerCase().includes(searchLower)) return true

      return false
    })
    .filter((item) => {
      if (dateFilter.type === 'all') return true

      const itemDate = parseKoreanDate(item.date)

      return itemDate >= dateFilter.start && itemDate <= dateFilter.end
    })
    .filter((item) => {
      if (inquiryTypeFilter === '전체') return true
      return item.requestMethod === inquiryTypeFilter
    })

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        <h2 className={`category-title category-${selectedCategory.replace(/\s+/g, '-')}`}>
          {categoryLabels[selectedCategory]}
        </h2>

        {categoryConfig.hasSearch && (
          <SearchBar
            value={searchTerm}
            onSearch={setSearchTerm}
            placeholder={searchPlaceholders[selectedCategory] || '검색...'}
          />
        )}

        {categoryConfig.hasAdvancedFilter && (
          <CompletedFilters
            onDateFilterChange={setDateFilter}
            onInquiryTypeChange={setInquiryTypeFilter}
          />
        )}

        {categoryConfig.hasInputForm && (
          <form
            ref={inputFormRef}
            className="input-form"
            onSubmit={(e) => {
              e.preventDefault()
              submitItem()
            }}
          >
            {renderInputForm()}
          </form>
        )}

        <ItemList
          items={filteredItems}
          onDelete={deleteItem}
          onStatusChange={changeStatus}
          onEdit={handleEdit}
          isTemplate={selectedCategory === '양식'}
          isDocument={selectedCategory === '문서'}
        />
      </main>
    </div>
  )
}

export default App
