import { useRef } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import MemoForm from './components/MemoForm'
import DeploymentForm from './components/DeploymentForm'
import TemplateForm from './components/TemplateForm'
import DocumentForm from './components/DocumentForm'
import ItemList from './components/ItemList'
import SearchBar from './components/SearchBar'
import CompletedFilters from './components/CompletedFilters'
import { useItemsStore } from './stores/useItemsStore'
import { useUIStore } from './stores/useUIStore'
import { useFormStore } from './stores/useFormStore'
import { parseKoreanDate } from './utils/dateUtils'

function App() {
  const inputFormRef = useRef(null)

  // Items store
  const items = useItemsStore((state) => state.items)
  const addItem = useItemsStore((state) => state.addItem)
  const updateItem = useItemsStore((state) => state.updateItem)
  const deleteItem = useItemsStore((state) => state.deleteItem)
  const changeStatus = useItemsStore((state) => state.changeStatus)

  // UI store
  const selectedCategory = useUIStore((state) => state.selectedCategory)
  const setSelectedCategory = useUIStore((state) => state.setSelectedCategory)
  const searchTerm = useUIStore((state) => state.searchTerm)
  const setSearchTerm = useUIStore((state) => state.setSearchTerm)
  const editingId = useUIStore((state) => state.editingId)
  const setEditingId = useUIStore((state) => state.setEditingId)
  const dateFilter = useUIStore((state) => state.dateFilter)
  const setDateFilter = useUIStore((state) => state.setDateFilter)
  const inquiryTypeFilter = useUIStore((state) => state.inquiryTypeFilter)
  const setInquiryTypeFilter = useUIStore((state) => state.setInquiryTypeFilter)

  // Form store
  const getFormData = useFormStore((state) => state.getFormData)
  const setFormData = useFormStore((state) => state.setFormData)
  const resetForm = useFormStore((state) => state.resetForm)
  const memo = useFormStore((state) => state.memo)
  const template = useFormStore((state) => state.template)
  const document = useFormStore((state) => state.document)
  const deployment = useFormStore((state) => state.deployment)

  // 항목 추가/수정
  const handleSubmit = () => {
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
    } else if (selectedCategory === '양식') {
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
    } else if (selectedCategory === '문서') {
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
    } else if (selectedCategory === '배포 기록') {
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
  }

  // 항목 수정 시작
  const startEdit = (item) => {
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

    setTimeout(() => {
      inputFormRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }, 100)
  }

  // 검색어 플레이스홀더 설정
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
      return <MemoForm onSubmit={handleSubmit} />
    } else if (selectedCategory === '양식') {
      return <TemplateForm onSubmit={handleSubmit} />
    } else if (selectedCategory === '문서') {
      return <DocumentForm onSubmit={handleSubmit} />
    } else if (selectedCategory === '배포 기록') {
      return <DeploymentForm onSubmit={handleSubmit} />
    }
    return null
  }

  // 필터링된 항목들
  const filteredItems = items
    .filter((item) => item.category === selectedCategory)
    .filter((item) => {
      if (!searchTerm) return true

      const searchLower = searchTerm.toLowerCase()

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
        <h2>{selectedCategory}</h2>

        {categoryConfig.hasSearch && (
          <SearchBar
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
          <div ref={inputFormRef} className="input-form">
            {renderInputForm()}
          </div>
        )}

        <ItemList
          items={filteredItems}
          onDelete={deleteItem}
          onStatusChange={changeStatus}
          onEdit={startEdit}
          isTemplate={selectedCategory === '양식'}
          isDocument={selectedCategory === '문서'}
        />
      </main>
    </div>
  )
}

export default App
