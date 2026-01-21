function TemplateForm({ 
  title,
  content,
  editingId,
  onTitleChange,
  onContentChange,
  onCancel,
  onSubmit 
}) {
  return (
    <>
      <input
        type="text"
        placeholder="양식 제목 (예: 비밀번호 초기화)"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
      />
      
      <textarea
        placeholder="양식 내용을 입력하세요"
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        rows="10"
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

export default TemplateForm