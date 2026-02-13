import Sidebar from '../components/Sidebar'
import MainContent from './MainContent'

/**
 * 앱 전체 레이아웃
 * - Sidebar (왼쪽)
 * - MainContent (오른쪽)
 */
function AppLayout({
  // MainContent에 전달할 props
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
  return (
    <div className="app-container">
      <Sidebar />

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
    </div>
  )
}

export default AppLayout
