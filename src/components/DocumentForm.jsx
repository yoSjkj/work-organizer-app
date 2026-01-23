function DocumentForm({ 
  docCategory,
  title,
  content,
  isMarkdown,
  editingId,
  categories,
  onDocCategoryChange,
  onTitleChange,
  onContentChange,
  onIsMarkdownChange,
  onCancel,
  onSubmit 
}) {
  return (
    <>
      {/* 마크다운 체크박스 */}
      <label className="markdown-checkbox-wrapper">
        <input
          type="checkbox"
          checked={isMarkdown}
          onChange={(e) => onIsMarkdownChange(e.target.checked)}
        />
        <span className="markdown-checkbox-label">
          📝 마크다운으로 렌더링
        </span>
      </label>
      
      <div className="document-form-top">
        <select 
          value={docCategory} 
          onChange={(e) => onDocCategoryChange(e.target.value)}
          className="doc-category-select"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        
        <input
          type="text"
          placeholder="제목"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="doc-title-input"
        />
      </div>
      
      <textarea
        placeholder="내용을 입력하세요"
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        style={{ minHeight: '400px' }}
      />
      
      <div className="form-controls">
        <div className="button-group">
          {editingId && (
            <button onClick={onCancel} className="cancel-btn">
              취소
            </button>
          )}
          <button onClick={onSubmit} className="add-btn">
            {editingId ? '저장' : '추가'}
          </button>
        </div>
      </div>
    </>
  )
}

export default DocumentForm