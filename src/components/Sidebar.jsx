import { useState } from 'react'
import { useItemsStore } from '../stores/useItemsStore'
import { useUIStore } from '../stores/useUIStore'
import SettingsModal from './SettingsModal'

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
  const selectedCategory = useUIStore((state) => state.selectedCategory)
  const setSelectedCategory = useUIStore((state) => state.setSelectedCategory)
  const [showSettings, setShowSettings] = useState(false)

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

      {/* 설정 버튼 */}
      <div className="settings-button-container">
        <button className="settings-button" onClick={() => setShowSettings(true)}>
          설정
        </button>
      </div>

      {/* 설정 모달 */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </aside>
  )
}

export default Sidebar
