import { useItemsStore } from '../stores/useItemsStore'
import { useUIStore } from '../stores/useUIStore'

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
      </details>
    </aside>
  )
}

export default Sidebar
