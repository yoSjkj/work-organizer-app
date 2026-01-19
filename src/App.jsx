import { useState, useEffect, useRef } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import MemoForm from './components/MemoForm'
import DeploymentForm from './components/DeploymentForm'
import ItemList from './components/ItemList'
import SearchBar from './components/SearchBar'

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
  // 카테고리 목록
  const categories = ['메모', '완료', '매뉴얼', '문서', '배포 기록']
  
  // 상태들
  const [selectedCategory, setSelectedCategory] = useState('메모')
  const [items, setItems] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState(null)
  
  // 메모용 상태
  const [inputRequestMethod, setInputRequestMethod] = useState('전화')
  const [inputInquiryType, setInputInquiryType] = useState('')
  const [inputRequesterType, setInputRequesterType] = useState('대리점')

  // 대리점 정보
  const [inputDealerCode, setInputDealerCode] = useState('')
  const [inputDealerName, setInputDealerName] = useState('')

  // 현업 정보
  const [inputTeam, setInputTeam] = useState('')
  const [inputName, setInputName] = useState('')
  const [inputPosition, setInputPosition] = useState('')

  // 기타 정보
  const [inputFreeText, setInputFreeText] = useState('')

  // 공통
  const [inputTitle, setInputTitle] = useState('')
  const [inputContent, setInputContent] = useState('')
  const [inputStatus, setInputStatus] = useState('임시')
  
  // 배포 기록용 상태
  const [deploymentFile, setDeploymentFile] = useState('')
  const [deploymentChanges, setDeploymentChanges] = useState('')
  const [deploymentTarget, setDeploymentTarget] = useState('운영')
  const [deploymentStatus, setDeploymentStatus] = useState('진행중')

  // 로컬스토리지에서 데이터 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('workItems')
    if (saved) {
      try {
        setItems(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to load items:', error)
      }
    }
  }, [])

  // 데이터 저장 - 마운트 후에만
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    localStorage.setItem('workItems', JSON.stringify(items))
  }, [items])

  // 매일 첫 실행 시 자동 백업
  useEffect(() => {
    const lastBackup = localStorage.getItem('lastBackupDate')
    const today = new Date().toDateString()
    
    // 오늘 첫 실행이고 데이터가 있으면
    if (lastBackup !== today && items.length > 0) {
      setTimeout(() => {
        autoBackup()
        localStorage.setItem('lastBackupDate', today)
      }, 2000) // 2초 후 백업 (로딩 완료 후)
    }
  }, [items])

  // 항목 추가/수정
  const addItem = () => {
    if (selectedCategory === '배포 기록') {
      // 배포 기록
      if (!deploymentFile.trim()) return
      
      const newItem = {
        id: editingId || Date.now(),  // ← 수정
        title: deploymentFile,
        content: deploymentChanges,
        category: selectedCategory,
        date: new Date().toLocaleDateString('ko-KR'),
        time: new Date().toLocaleTimeString('ko-KR'),
        target: deploymentTarget,
        status: deploymentStatus
      }
      
      if (editingId) {
        // 수정 모드
        setItems(items.map(item => item.id === editingId ? newItem : item))
        setEditingId(null)
      } else {
        // 추가 모드
        setItems([newItem, ...items])
      }
      
      setDeploymentFile('')
      setDeploymentChanges('')
      setDeploymentTarget('운영')
      setDeploymentStatus('진행중')
      
    } else {
      // 일반 항목
      if (!inputContent.trim()) return
      
      let requesterInfo = {}
      switch(inputRequesterType) {
        case '대리점':
          requesterInfo = {
            dealerCode: inputDealerCode,
            dealerName: inputDealerName
          }
          break
        case '현업':
          requesterInfo = {
            team: inputTeam,
            name: inputName,
            position: inputPosition
          }
          break
        default:
          requesterInfo = {
            freeText: inputFreeText
          }
      }
      
      const newItem = {
        id: editingId || Date.now(),  // ← 수정
        requestMethod: inputRequestMethod,
        inquiryType: inputInquiryType,
        requesterType: inputRequesterType,
        requester: requesterInfo,
        title: inputTitle,
        content: inputContent,
        category: inputStatus === '완료' ? '완료' : selectedCategory,
        date: new Date().toLocaleDateString('ko-KR'),
        time: new Date().toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        status: inputStatus
      }
      
      if (editingId) {
        // 수정 모드
        setItems(items.map(item => item.id === editingId ? newItem : item))
        setEditingId(null)
      } else {
        // 추가 모드
        setItems([newItem, ...items])
      }
      
      // 초기화
      setInputRequestMethod('전화')
      setInputInquiryType('')
      setInputRequesterType('대리점')
      setInputDealerCode('')
      setInputDealerName('')
      setInputTeam('')
      setInputName('')
      setInputPosition('')
      setInputFreeText('')
      setInputTitle('')
      setInputContent('')
      setInputStatus('임시')
      
      if (inputStatus === '완료') {
        setSelectedCategory('완료')
      }
    }
  }

    // 항목 수정 시작
  const startEdit = (item) => {
    setEditingId(item.id)
    
    if (item.requestMethod) {
      // 메모 수정
      setInputRequestMethod(item.requestMethod)
      setInputInquiryType(item.inquiryType)
      setInputRequesterType(item.requesterType)
      
      // 요청자 정보
      if (item.requester) {
        setInputDealerCode(item.requester.dealerCode || '')
        setInputDealerName(item.requester.dealerName || '')
        setInputTeam(item.requester.team || '')
        setInputName(item.requester.name || '')
        setInputPosition(item.requester.position || '')
        setInputFreeText(item.requester.freeText || '')
      }
      
      setInputTitle(item.title || '')
      setInputContent(item.content)
      setInputStatus(item.status)
    } else {
      // 배포 기록 수정
      setDeploymentFile(item.title)
      setDeploymentChanges(item.content)
      setDeploymentTarget(item.target)
      setDeploymentStatus(item.status)
    }
    
    // 해당 카테고리로 이동
    setSelectedCategory(item.category)
    
    // 화면 최상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 수정 취소
  const cancelEdit = () => {
    setEditingId(null)
    // 입력칸 초기화
    setInputRequestMethod('전화')
    setInputInquiryType('')
    setInputRequesterType('대리점')
    setInputDealerCode('')
    setInputDealerName('')
    setInputTeam('')
    setInputName('')
    setInputPosition('')
    setInputFreeText('')
    setInputTitle('')
    setInputContent('')
    setInputStatus('임시')
  }

  // 항목 삭제
  const deleteItem = (id) => {
    setItems(items.filter(item => item.id !== id))
  }

  // 데이터 내보내기 (백업)
  const exportData = () => {
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
  }

  // 자동 백업
  const autoBackup = () => {
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
    a.download = `자동백업_${new Date().toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 데이터 가져오기 (복원)
  const importData = (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        
        // 버전 체크
        if (data.version && data.items) {
          setItems(data.items)
          alert(`백업 복원 완료!\n${data.items.length}개 항목 불러옴\n백업 날짜: ${new Date(data.exportDate).toLocaleString('ko-KR')}`)
        } else {
          // 구버전 호환
          setItems(data)
          alert(`백업 복원 완료!\n${data.length}개 항목 불러옴`)
        }
      } catch (error) {
        alert('백업 파일을 읽을 수 없습니다.')
        console.error(error)
      }
    }
    reader.readAsText(file)
  }

  // 전체 데이터 삭제
  const clearAllData = () => {
    if (window.confirm('⚠️ 모든 데이터를 삭제하시겠습니까?\n백업을 먼저 하는 것을 권장합니다!')) {
      if (window.confirm('정말로 삭제하시겠습니까? 복구할 수 없습니다!')) {
        setItems([])
        localStorage.removeItem('workItems')
        alert('모든 데이터가 삭제되었습니다.')
      }
    }
  }

  // 상태 변경
  const changeStatus = (id, newStatus) => {
    setItems(items.map(item => {
      if (item.id === id) {
        // 완료로 변경되면 카테고리도 '완료'로
        return {
          ...item,
          status: newStatus,
          category: newStatus === '완료' ? '완료' : item.category
        }
      }
      return item
    }))
    
    // 완료 처리 시 완료 탭으로 이동
    if (newStatus === '완료') {
      setSelectedCategory('완료')
    }
  }

  // 선택된 카테고리의 항목만 필터링
  const filteredItems = items
    .filter(item => item.category === selectedCategory)
    .filter(item => {
      if (!searchTerm) return true
      
      const searchLower = searchTerm.toLowerCase()
      
      // 제목 검색
      if (item.title?.toLowerCase().includes(searchLower)) return true
      
      // 내용 검색
      if (item.content?.toLowerCase().includes(searchLower)) return true
      
      // 대리점 정보 검색
      if (item.requester?.dealerCode?.toLowerCase().includes(searchLower)) return true
      if (item.requester?.dealerName?.toLowerCase().includes(searchLower)) return true
      
      // 현업 정보 검색
      if (item.requester?.name?.toLowerCase().includes(searchLower)) return true
      if (item.requester?.team?.toLowerCase().includes(searchLower)) return true
      
      // 기타 검색
      if (item.requester?.freeText?.toLowerCase().includes(searchLower)) return true
      
      return false
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

        {/* 검색바 추가 */}
        <SearchBar onSearch={setSearchTerm} />

        {/* 입력 폼 */}
        <div className="input-form">
          {selectedCategory === '배포 기록' ? (
            <DeploymentForm
              file={deploymentFile}
              changes={deploymentChanges}
              target={deploymentTarget}
              status={deploymentStatus}
              editingId={editingId}           // ← 추가
              onFileChange={setDeploymentFile}
              onChangesChange={setDeploymentChanges}
              onTargetChange={setDeploymentTarget}
              onStatusChange={setDeploymentStatus}
              onCancel={cancelEdit}           // ← 추가
              onSubmit={addItem}
            />
          ) : (
          <MemoForm
            requestMethod={inputRequestMethod}
            inquiryType={inputInquiryType}
            requesterType={inputRequesterType}
            dealerCode={inputDealerCode}
            dealerName={inputDealerName}
            team={inputTeam}
            name={inputName}
            position={inputPosition}
            freeText={inputFreeText}
            title={inputTitle}
            content={inputContent}
            status={inputStatus}
            options={OPTIONS}
            editingId={editingId}
            onRequestMethodChange={setInputRequestMethod}
            onInquiryTypeChange={setInputInquiryType}
            onRequesterTypeChange={setInputRequesterType}
            onDealerCodeChange={setInputDealerCode}
            onDealerNameChange={setInputDealerName}
            onTeamChange={setInputTeam}
            onNameChange={setInputName}
            onPositionChange={setInputPosition}
            onFreeTextChange={setInputFreeText}
            onTitleChange={setInputTitle}
            onContentChange={setInputContent}
            onStatusChange={setInputStatus}
            onCancel={cancelEdit}
            onSubmit={addItem}
          />
          )}
        </div>

        {/* 항목 목록 - 이 부분 추가! */}
        <ItemList 
          items={filteredItems}
          onDelete={deleteItem}
          onStatusChange={changeStatus}
          onEdit={startEdit}
        />
      </main>
    </div>
  )
}

export default App