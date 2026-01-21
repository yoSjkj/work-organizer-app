import { useState, useEffect, useRef } from 'react'

export function useWorkItems() {
  const [items, setItems] = useState([])
  
  // 로컬스토리지에서 불러오기
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

  // 데이터 저장
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    localStorage.setItem('workItems', JSON.stringify(items))
  }, [items])

  // 항목 추가
  const addItem = (newItem) => {
    setItems([newItem, ...items])
  }

  // 항목 수정
  const updateItem = (id, updatedItem) => {
    setItems(items.map(item => item.id === id ? updatedItem : item))
  }

  // 항목 삭제
  const deleteItem = (id) => {
    setItems(items.filter(item => item.id !== id))
  }

  // 상태 변경
  const changeStatus = (id, newStatus) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: newStatus,
          category: newStatus === '완료' ? '완료' : item.category
        }
      }
      return item
    }))
  }

  // 데이터 내보내기
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

  // 데이터 가져오기
  const importData = (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        
        if (data.version && data.items) {
          setItems(data.items)
          alert(`백업 복원 완료!\n${data.items.length}개 항목 불러옴\n백업 날짜: ${new Date(data.exportDate).toLocaleString('ko-KR')}`)
        } else {
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

  // 전체 삭제
  const clearAllData = () => {
    if (window.confirm('⚠️ 모든 데이터를 삭제하시겠습니까?\n백업을 먼저 하는 것을 권장합니다!')) {
      if (window.confirm('정말로 삭제하시겠습니까? 복구할 수 없습니다!')) {
        setItems([])
        localStorage.removeItem('workItems')
        alert('모든 데이터가 삭제되었습니다.')
      }
    }
  }

  return {
    items,
    addItem,
    updateItem,
    deleteItem,
    changeStatus,
    exportData,
    importData,
    clearAllData
  }
}