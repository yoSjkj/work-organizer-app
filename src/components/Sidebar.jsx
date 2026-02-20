import { useState } from 'react'
import { useItemsStore } from '../stores/useItemsStore'
import { useUIStore } from '../stores/useUIStore'
import SettingsModal from './SettingsModal'
import { CATEGORY_LIST } from '../config/categories'

function Sidebar() {
  const items = useItemsStore((state) => state.items)
  const selectedCategory = useUIStore((state) => state.selectedCategory)
  const setSelectedCategory = useUIStore((state) => state.setSelectedCategory)
  const [showSettings, setShowSettings] = useState(false)

  return (
    <aside className="sidebar">
      <h1>Work Organizer</h1>

      <div className="stats">
        <p>Total {items.length} items</p>
      </div>

      <nav className="categories">
        {CATEGORY_LIST.map((category) => (
          <button
            key={category.id}
            className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.id)}
          >
            <span className="category-icon">
              {selectedCategory === category.id ? '●' : '○'}
            </span>
            <span>{category.label}</span>
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
