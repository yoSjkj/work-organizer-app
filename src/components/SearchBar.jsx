import { useRef } from 'react'

function SearchBar({ onSearch, value = '', placeholder = "🔍 검색..." }) {
  const inputRef = useRef(null)

  const handleClear = () => {
    onSearch('')
    inputRef.current?.focus()
  }

  return (
    <div className="search-bar">
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onSearch(e.target.value)}
        onKeyDown={(e) => {
          // Enter: 포커스 해제
          // Escape: 포커스 해제
          if (e.key === 'Enter' || e.key === 'Escape') {
            e.target.blur()
          }
        }}
        className="search-input"
      />
      {value && (
        <button
          onClick={handleClear}
          onMouseDown={(e) => e.preventDefault()}
          className="search-clear"
        >
          ✕
        </button>
      )}
    </div>
  )
}

export default SearchBar