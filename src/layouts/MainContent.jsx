import { categoryLabels } from '../components/Sidebar'
import SearchBar from '../components/SearchBar'
import CompletedFilters from '../components/CompletedFilters'
import ItemList from '../components/ItemList'

/**
 * 메인 콘텐츠 영역 레이아웃
 * - 카테고리 제목
 * - 검색바 (조건부)
 * - 고급 필터 (조건부)
 * - 입력 폼 (조건부)
 * - 아이템 리스트
 */
function MainContent({
  // 카테고리 정보
  selectedCategory,
  currentCategory,

  // 검색
  searchTerm,
  onSearchChange,

  // 필터
  onDateFilterChange,
  onInquiryTypeChange,

  // 폼
  FormComponent,
  inputFormRef,
  onSubmit,

  // 아이템 리스트
  items,
  onDelete,
  onStatusChange,
  onEdit
}) {
  return (
    <main className="main-content">
      <h2 className={`category-title category-${selectedCategory.replace(/\s+/g, '-')}`}>
        {categoryLabels[selectedCategory]}
      </h2>

      {currentCategory?.hasSearch && (
        <SearchBar
          value={searchTerm}
          onSearch={onSearchChange}
          placeholder={currentCategory.searchPlaceholder || '검색...'}
        />
      )}

      {currentCategory?.hasAdvancedFilter && (
        <CompletedFilters
          onDateFilterChange={onDateFilterChange}
          onInquiryTypeChange={onInquiryTypeChange}
        />
      )}

      {currentCategory?.hasInputForm && FormComponent && (
        <form
          ref={inputFormRef}
          className="input-form"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
        >
          <FormComponent onSubmit={onSubmit} />
        </form>
      )}

      <ItemList
        items={items}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
        onEdit={onEdit}
        category={selectedCategory}
      />
    </main>
  )
}

export default MainContent
