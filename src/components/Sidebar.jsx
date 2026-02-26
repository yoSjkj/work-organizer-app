import { useState } from 'react'
import { useItemsStore } from '../stores/useItemsStore'
import { useUIStore } from '../stores/useUIStore'
import { useMonitoringStore } from '../stores/useMonitoringStore'
import SettingsModal from './SettingsModal'
import { CATEGORY_LIST, MONITORING_CATEGORIES } from '../config/categories'

function Sidebar() {
  const items = useItemsStore((state) => state.items)
  const selectedCategory = useUIStore((state) => state.selectedCategory)
  const setSelectedCategory = useUIStore((state) => state.setSelectedCategory)
  const unreadCount = useMonitoringStore((state) => state.unreadCount)
  const csrItems = useMonitoringStore((state) => state.csrItems)
  const [showSettings, setShowSettings] = useState(false)

  const getCount = (categoryId) => {
    return items.filter(item => item.category === categoryId).length
  }

  const getMonitoringBadge = (id) => {
    if (id === 'mail-monitor' && unreadCount > 0) return unreadCount
    if (id === 'csr-monitor') {
      const newCount = csrItems.filter(i => i.isNew).length
      if (newCount > 0) return newCount
    }
    return null
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>Work Organizer</h1>
      </div>

      <div className="sidebar-divider" />

      {/* 모니터링 섹션 */}
      <nav className="categories">
        <p className="nav-section-title">Monitoring</p>
        {MONITORING_CATEGORIES.map((category) => {
          const badge = getMonitoringBadge(category.id)
          return (
            <button
              key={category.id}
              className={`category-btn ${selectedCategory === category.id ? 'active' : ''} color-${category.color}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-label">{category.label}</span>
              {badge != null && (
                <span className="category-count">{badge}</span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="sidebar-divider" />

      {/* 업무 관리 섹션 */}
      <nav className="categories">
        <p className="nav-section-title">Work</p>
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
