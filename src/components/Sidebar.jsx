import { useState, useEffect } from 'react'
import { useItemsStore } from '../stores/useItemsStore'
import { useUIStore } from '../stores/useUIStore'
import { isTauri, getDataPath } from '../stores/tauriStorage'

const categories = ['메모', '완료', '양식', '문서', '배포 기록']

export const categoryLabels = {
  '메모': 'Notes',
  '완료': 'Done',
  '양식': 'Forms',
  '문서': 'Docs',
  '배포 기록': 'Releases'
}

function Sidebar() {
  const items = useItemsStore((state) => state.items)
  const exportData = useItemsStore((state) => state.exportData)
  const importData = useItemsStore((state) => state.importData)
  const clearAllData = useItemsStore((state) => state.clearAllData)

  const selectedCategory = useUIStore((state) => state.selectedCategory)
  const setSelectedCategory = useUIStore((state) => state.setSelectedCategory)

  const [dataPath, setDataPath] = useState(null)

  useEffect(() => {
    if (isTauri()) {
      getDataPath().then(path => setDataPath(path))
    }
  }, [])

  return (
    <aside className="sidebar">
      <h1>업무 정리</h1>

      <div className="stats">
        <p>총 {items.length}개 항목</p>
      </div>

      <nav className="categories">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            <span className="category-icon">
              {selectedCategory === cat ? '●' : '○'}
            </span>
            <span>{categoryLabels[cat]}</span>
          </button>
        ))}
      </nav>

      {/* 접을 수 있는 데이터 관리 */}
      <details className="backup-section">
        <summary>데이터 관리</summary>
        <div className="backup-buttons">
          <button onClick={exportData} className="backup-btn export">
            백업
          </button>
          <label className="backup-btn import">
            복원
            <input
              type="file"
              accept=".json"
              onChange={importData}
              style={{ display: 'none' }}
            />
          </label>
          <button onClick={clearAllData} className="backup-btn clear">
            전체삭제
          </button>
        </div>
        {dataPath && (
          <div className="data-path">
            <small>💾 저장 위치:</small>
            <small title={dataPath}>{dataPath}</small>
          </div>
        )}
      </details>
    </aside>
  )
}

export default Sidebar
