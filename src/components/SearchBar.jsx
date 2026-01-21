import { useState } from 'react'

function SearchBar({ onSearch, placeholder = "🔍 검색..." }) {
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
        placeholder={placeholder}
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