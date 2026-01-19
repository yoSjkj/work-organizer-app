function Sidebar({ 
  categories, 
  selectedCategory, 
  onSelectCategory,
  onExport,
  onImport,
  onClearAll,
  itemCount
}) {
  // 카테고리별 아이콘
  const categoryIcons = {
    '메모': '📝',
    '완료': '✅',
    '매뉴얼': '📚',
    '문서': '📄',
    '배포 기록': '🚀'
  }
  
  return (
    <aside className="sidebar">
      <h1>업무 정리</h1>
      
      <div className="stats">
        <p>총 {itemCount}개 항목</p>
      </div>
      
      <nav className="categories">
        {categories.map(cat => (
          <button
            key={cat}
            className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => onSelectCategory(cat)}
          >
            <span className="category-icon">{categoryIcons[cat]}</span>
            <span>{cat}</span>
          </button>
        ))}
      </nav>
      
      {/* 접을 수 있는 데이터 관리 */}
      <details className="backup-section">
        <summary>데이터 관리</summary>
        <div className="backup-buttons">
          <button onClick={onExport} className="backup-btn export">
            💾 백업
          </button>
          <label className="backup-btn import">
            📂 복원
            <input 
              type="file" 
              accept=".json"
              onChange={onImport}
              style={{ display: 'none' }}
            />
          </label>
          <button onClick={onClearAll} className="backup-btn clear">
            🗑️ 전체삭제
          </button>
        </div>
      </details>
    </aside>
  )
}

export default Sidebar