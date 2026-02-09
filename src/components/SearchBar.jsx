import { useRef, useEffect } from 'react'

function SearchBar({ onSearch, value = '', placeholder = "🔍 검색..." }) {
  const inputRef = useRef(null)
  const blurTimerRef = useRef(null)

  const handleSearch = (newValue) => {
    onSearch(newValue)

    // 이전 타이머 취소
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current)
    }

    // 입력 후 500ms 동안 추가 입력이 없으면 자동으로 blur
    blurTimerRef.current = setTimeout(() => {
      inputRef.current?.blur()
    }, 500)
  }

  const handleClear = () => {
    onSearch('')
    inputRef.current?.blur()
  }

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (blurTimerRef.current) {
        clearTimeout(blurTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="search-bar">
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleSearch(e.target.value)}
        onKeyDown={(e) => {
          // 엔터 키 누르면 즉시 포커스 제거
          if (e.key === 'Enter') {
            if (blurTimerRef.current) {
              clearTimeout(blurTimerRef.current)
            }
            e.target.blur()
          }
        }}
        className="search-input"
      />
      {value && (
        <button onClick={handleClear} className="search-clear">
          ✕
        </button>
      )}
    </div>
  )
}

export default SearchBar