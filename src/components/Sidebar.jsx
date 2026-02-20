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

  const getCount = (categoryId) => {
    return items.filter(item => item.category === categoryId).length
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">⊞</span>
        <h1>Work Organizer</h1>
      </div>

      <div className="sidebar-divider" />

      <nav className="categories">
        <p className="nav-section-title">Main</p>
        {CATEGORY_LIST.map((category) => {
          const count = getCount(category.id)
          return (
            <button
              key={category.id}
              className={`category-btn ${selectedCategory === category.id ? 'active' : ''} color-${category.color}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-label">{category.label}</span>
              {count > 0 && (
                <span className="category-count">{count}</span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="sidebar-divider" />

      <div className="sidebar-footer">
        <p className="nav-section-title">Settings</p>
        <button className="settings-button" onClick={() => setShowSettings(true)}>
          <span className="category-icon">⚙</span>
          <span>Settings</span>
        </button>
      </div>

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </aside>
  )
}

export default Sidebar
