import { lazy, Suspense } from 'react'
import Sidebar from '../components/Sidebar'
import MainContent from './MainContent'
import TitleBar from '../components/TitleBar'
import { MONITORING_IDS } from '../config/categories'

const Dashboard      = lazy(() => import('../components/monitoring/Dashboard'))
const CsrMonitor     = lazy(() => import('../components/monitoring/CsrMonitor'))
const MailMonitor    = lazy(() => import('../components/monitoring/MailMonitor'))
const AutomationPanel = lazy(() => import('../components/monitoring/AutomationPanel'))

const MONITORING_COMPONENTS = {
  'dashboard':    Dashboard,
  'csr-monitor':  CsrMonitor,
  'mail-monitor': MailMonitor,
  'automation':   AutomationPanel,
}

function AppLayout({
  selectedCategory,
  currentCategory,
  searchTerm,
  onSearchChange,
  onDateFilterChange,
  onInquiryTypeChange,
  FormComponent,
  inputFormRef,
  onSubmit,
  items,
  onDelete,
  onStatusChange,
  onEdit
}) {
  const MonitoringComponent = MONITORING_IDS.has(selectedCategory)
    ? MONITORING_COMPONENTS[selectedCategory]
    : null

  return (
    <div className="app-wrapper">
      <TitleBar />
      <div className="app-container">
        <Sidebar />

        {MonitoringComponent ? (
          <Suspense fallback={<main className="main-content" />}>
            <MonitoringComponent />
          </Suspense>
        ) : (
          <MainContent
            selectedCategory={selectedCategory}
            currentCategory={currentCategory}
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            onDateFilterChange={onDateFilterChange}
            onInquiryTypeChange={onInquiryTypeChange}
            FormComponent={FormComponent}
            inputFormRef={inputFormRef}
            onSubmit={onSubmit}
            items={items}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
          />
        )}
      </div>
    </div>
  )
}

export default AppLayout
