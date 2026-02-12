import { useState, useEffect } from 'react'
import '../styles/features/completed-filters.css'

function CompletedFilters({ onDateFilterChange, onInquiryTypeChange }) {
  // 날짜 필터
  const [filterType, setFilterType] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  // 문의 방식 필터
  const [selectedType, setSelectedType] = useState('전체')
  
  const inquiryTypes = ['전체', '전화', '이메일', 'CSR', '메신저', '직접방문']

  // 컴포넌트 마운트 시 초기화 (추가!)
  useEffect(() => {
    onDateFilterChange({ type: 'all' })
    onInquiryTypeChange('전체')
  }, [])

  // 지난 보고 주간 계산
const getLastReportWeek = () => {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0(일) ~ 6(토)
  
  // 오늘이 목요일(4)이면 오늘 기준, 아니면 지난 목요일 기준
  let daysToSubtract
  if (dayOfWeek === 0) {
    // 일요일이면 3일 전 목요일
    daysToSubtract = 3
  } else if (dayOfWeek < 4) {
    // 월~수면 저저번주 목요일
    daysToSubtract = dayOfWeek + 3
  } else {
    // 목~토면 지난주 목요일
    daysToSubtract = dayOfWeek - 4 + 7
  }
  
  const thursday = new Date(today)
  thursday.setDate(today.getDate() - daysToSubtract)
  thursday.setHours(0, 0, 0, 0)
  
  const wednesday = new Date(thursday)
  wednesday.setDate(thursday.getDate() + 6)
  wednesday.setHours(23, 59, 59, 999)

  return { start: thursday, end: wednesday }
}

  // 날짜 필터 변경
  const handleDateFilterChange = (type) => {
    setFilterType(type)
    
    switch(type) {
      case 'all':
        onDateFilterChange({ type: 'all' })
        break
      case 'lastWeek': {
        const week = getLastReportWeek()
        onDateFilterChange({ 
          type: 'lastWeek', 
          start: week.start, 
          end: week.end 
        })
        break
      }
      case 'custom':
        if (startDate && endDate) {
          onDateFilterChange({ 
            type: 'custom', 
            start: new Date(startDate), 
            end: new Date(endDate + 'T23:59:59') 
          })
        }
        break
    }
  }

  // 커스텀 날짜 적용
  const applyCustomDate = () => {
    if (startDate && endDate) {
      handleDateFilterChange('custom')
    }
    // 날짜 미선택시 조용히 무시
  }

  // 초기화
  const resetFilters = () => {
    setStartDate('')
    setEndDate('')
    setFilterType('all')
    setSelectedType('전체')
    onDateFilterChange({ type: 'all' })
    onInquiryTypeChange('전체')
  }

  // 문의 방식 변경
  const handleInquiryTypeChange = (type) => {
    setSelectedType(type)
    onInquiryTypeChange(type)
  }

  return (
    <div className="completed-filters">
      {/* 날짜 필터 */}
      <div className="filter-section">
        <span className="filter-label">기간</span>
        <div className="filter-controls">
          <button 
            className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => handleDateFilterChange('all')}
          >
            전체
          </button>
          <button 
            className={`filter-btn ${filterType === 'lastWeek' ? 'active' : ''}`}
            onClick={() => handleDateFilterChange('lastWeek')}
          >
            주간보고
          </button>
          <div className="date-inputs">
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span>~</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <button onClick={applyCustomDate} className="apply-btn">
              검색
            </button>
          </div>
        </div>
      </div>

      {/* 문의 방식 필터 */}
      <div className="filter-section">
        <span className="filter-label">방식</span>
        <div className="filter-controls">
          {inquiryTypes.map(type => (
            <button
              key={type}
              className={`filter-btn ${selectedType === type ? 'active' : ''}`}
              onClick={() => handleInquiryTypeChange(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* 초기화 */}
      {(filterType !== 'all' || selectedType !== '전체') && (
        <button onClick={resetFilters} className="reset-all-btn">
          ✕ 초기화
        </button>
      )}
    </div>
  )
}

export default CompletedFilters