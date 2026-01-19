import { useState } from 'react'

function SearchBar({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = (value) => {
    setSearchTerm(value)
    onSearch(value)
  }

  const handleClear = () => {
    setSearchTerm('')
    onSearch('')
  }

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="검색... (제목, 내용, 대리점코드, 담당자)"
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        className="search-input"
      />
      {searchTerm && (
        <button onClick={handleClear} className="search-clear">
          ✕
        </button>
      )}
    </div>
  )
}

export default SearchBar