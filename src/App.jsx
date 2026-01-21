import { useState, useRef } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import MemoForm from './components/MemoForm'
import DeploymentForm from './components/DeploymentForm'
import TemplateForm from './components/TemplateForm'
import ItemList from './components/ItemList'
import SearchBar from './components/SearchBar'
import CompletedFilters from './components/CompletedFilters'
import { useWorkItems } from './hooks/useWorkItems'
import { useMemoForm } from './hooks/useMemoForm'
import { useDeploymentForm } from './hooks/useDeploymentForm'
import { useTemplateForm } from './hooks/useTemplateForm'
import { parseKoreanDate } from './utils/dateUtils'

// 옵션 데이터 정의
const OPTIONS = {
  requestMethods: ['전화', '이메일', 'CSR', '메신저', '직접방문'],
  inquiryTypes: [
    '계정 문의',
    '시스템 문의',
    'PC환경 문의',
    '조직이관 문의',
    '주문 문의',
    '기타'
  ],
  requesterTypes: ['대리점', '현업', '시공사', 'IT담당자', '기타']
}

function App() {
  // 카테고리 목록 (메뉴 순서대로)
  const categories = ['메모', '완료', '양식', '매뉴얼', '문서', '배포 기록']
  
  // 커스텀 훅 사용
  const { 
    items, 
    addItem: addItemToList, 
    updateItem, 
    deleteItem, 
    changeStatus,
    exportData,
    importData,
    clearAllData
  } = useWorkItems()
  
  const memoForm = useMemoForm()
  const deploymentForm = useDeploymentForm()
  const templateForm = useTemplateForm()

  // 상태들
  const [selectedCategory, setSelectedCategory] = useState('메모')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [dateFilter, setDateFilter] = useState({ type: 'all' })
  const [inquiryTypeFilter, setInquiryTypeFilter] = useState('전체')
  
  // ref
  const inputFormRef = useRef(null)

  // 항목 추가/수정
  const handleSubmit = () => {
    // 메모, 완료
    if (selectedCategory === '메모' || selectedCategory === '완료') {
      if (!memoForm.content.trim()) return
      searchTerm
      const formData = memoForm.getFormData()
      const newItem = {
        id: editingId || Date.now(),
        ...formData,
        category: formData.status === '완료' ? '완료' : selectedCategory,
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
        addItemToList(newItem)
      }
      
      memoForm.resetForm()
      
      if (formData.status === '완료') {
        setSelectedCategory('완료')
      }
    }
    // 양식
    else if (selectedCategory === '양식') {
      if (!templateForm.title.trim()) return
      
      const newItem = {
        id: editingId || Date.now(),
        ...templateForm.getFormData(),
        category: selectedCategory,
        date: new Date().toLocaleDateString('ko-KR'),
        time: new Date().toLocaleTimeString('ko-KR')
      }
      
      if (editingId) {
        updateItem(editingId, newItem)
        setEditingId(null)
      } else {
        addItemToList(newItem)
      }
      
      templateForm.resetForm()
    }
    // 배포 기록
    else if (selectedCategory === '배포 기록') {
      if (!deploymentForm.file.trim()) return
      
      const newItem = {
        id: editingId || Date.now(),
        ...deploymentForm.getFormData(),
        category: selectedCategory,
        date: new Date().toLocaleDateString('ko-KR'),
        time: new Date().toLocaleTimeString('ko-KR')
      }
      
      if (editingId) {
        updateItem(editingId, newItem)
        setEditingId(null)
      } else {
        addItemToList(newItem)
      }
      
      deploymentForm.resetForm()
    }
  }

  // 항목 수정 시작
  const startEdit = (item) => {
    setEditingId(item.id)
    
    if (item.requestMethod) {
      // 메모 수정
      memoForm.setFormData(item)
    } else if (item.target) {
      // 배포 기록 수정
      deploymentForm.setFormData(item)
    } else {
      // 양식 수정
      templateForm.setFormData(item)
    }
    
    setSelectedCategory(item.category)
    
    setTimeout(() => {
      inputFormRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      })
    }, 100)
  }

  // 수정 취소
  const cancelEdit = () => {
    setEditingId(null)
    memoForm.resetForm()
    deploymentForm.resetForm()
    templateForm.resetForm()
  }

  // 입력 폼이 있는 카테고리 체크
  const hasInputForm = ['메모', '완료', '양식', '배포 기록'].includes(selectedCategory)

  // 입력 폼 렌더링
  const renderInputForm = () => {
    // 메모, 완료
    if (selectedCategory === '메모' || selectedCategory === '완료') {
      return (
        <MemoForm
          requestMethod={memoForm.requestMethod}
          inquiryType={memoForm.inquiryType}
          requesterType={memoForm.requesterType}
          contactInfo={memoForm.contactInfo}
          dealerCode={memoForm.dealerCode}
          dealerName={memoForm.dealerName}
          team={memoForm.team}
          name={memoForm.name}
          position={memoForm.position}
          freeText={memoForm.freeText}
          title={memoForm.title}
          content={memoForm.content}
          status={memoForm.status}
          options={OPTIONS}
          editingId={editingId}
          onRequestMethodChange={memoForm.setRequestMethod}
          onInquiryTypeChange={memoForm.setInquiryType}
          onRequesterTypeChange={memoForm.setRequesterType}
          onContactInfoChange={memoForm.setContactInfo}
          onDealerCodeChange={memoForm.setDealerCode}
          onDealerNameChange={memoForm.setDealerName}
          onTeamChange={memoForm.setTeam}
          onNameChange={memoForm.setName}
          onPositionChange={memoForm.setPosition}
          onFreeTextChange={memoForm.setFreeText}
          onTitleChange={memoForm.setTitle}
          onContentChange={memoForm.setContent}
          onStatusChange={memoForm.setStatus}
          onCancel={cancelEdit}
          onSubmit={handleSubmit}
        />
      )
    }
    // 양식
    else if (selectedCategory === '양식') {
      return (
        <TemplateForm
          title={templateForm.title}
          content={templateForm.content}
          editingId={editingId}
          onTitleChange={templateForm.setTitle}
          onContentChange={templateForm.setContent}
          onCancel={cancelEdit}
          onSubmit={handleSubmit}
        />
      )
    }
    // 배포 기록
    else if (selectedCategory === '배포 기록') {
      return (
        <DeploymentForm
          file={deploymentForm.file}
          changes={deploymentForm.changes}
          target={deploymentForm.target}
          status={deploymentForm.status}
          editingId={editingId}
          onFileChange={deploymentForm.setFile}
          onChangesChange={deploymentForm.setChanges}
          onTargetChange={deploymentForm.setTarget}
          onStatusChange={deploymentForm.setStatus}
          onCancel={cancelEdit}
          onSubmit={handleSubmit}
        />
      )
    }
    
    return null
  }

  // 검색어 플레이스홀더 설정
  const searchPlaceholders = {
    '메모': '🔍 검색... (제목, 내용, 연락처, 대리점, 담당자)',
    '완료': '🔍 검색... (제목, 내용, 연락처, 대리점, 담당자)',
    '양식': '🔍 양식 검색...',
    '매뉴얼': '🔍 매뉴얼 검색...',
    '문서': '🔍 문서 검색...'
  }

  // 카테고리별 UI 설정
  const categoryConfig = {
    hasSearch: ['메모', '완료', '양식', '매뉴얼', '문서'].includes(selectedCategory),
    hasAdvancedFilter: selectedCategory === '완료',
    hasInputForm: ['메모', '완료', '양식', '배포 기록'].includes(selectedCategory)
  }

  // 필터링된 항목들
  const filteredItems = items
    .filter(item => item.category === selectedCategory)
    .filter(item => {
      // 검색어 필터
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
    .filter(item => {
      // 날짜 필터
      if (dateFilter.type === 'all') return true
      
      const itemDate = parseKoreanDate(item.date)
      
      return itemDate >= dateFilter.start && itemDate <= dateFilter.end
    })
    .filter(item => {
      // 문의 방식 필터
      if (inquiryTypeFilter === '전체') return true
      return item.requestMethod === inquiryTypeFilter
    })

  return (
    <div className="app-container">
      {/* 사이드바 */}
      <Sidebar 
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onExport={exportData}
        onImport={importData}
        onClearAll={clearAllData}
        itemCount={items.length}
      />

      {/* 메인 콘텐츠 */}
      <main className="main-content">
        <h2>{selectedCategory}</h2>

        {/* 검색 */}
        {categoryConfig.hasSearch && (
          <SearchBar 
            onSearch={setSearchTerm} 
            placeholder={searchPlaceholders[selectedCategory] || '🔍 검색...'}
          />
        )}

        {/* 고급 필터 */}
        {categoryConfig.hasAdvancedFilter && (
          <CompletedFilters 
            onDateFilterChange={setDateFilter}
            onInquiryTypeChange={setInquiryTypeFilter}
          />
        )}

        {/* 입력 폼 */}
        {categoryConfig.hasInputForm && (
          <div ref={inputFormRef} className="input-form">
            {renderInputForm()}
          </div>
        )}

        {/* 목록 */}
        <ItemList 
          items={filteredItems}
          onDelete={deleteItem}
          onStatusChange={changeStatus}
          onEdit={startEdit}
          isTemplate={selectedCategory === '양식'}
        />
      </main>
    </div>
  )
}

export default App