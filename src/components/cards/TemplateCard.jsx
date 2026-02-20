function TemplateCard({ template, onEdit, onDelete }) {
  // 데이터 검증
  if (!template) {
    return null
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(template.content)
      .catch(err => {
        console.error('복사 실패:', err)
        // 복사 실패는 조용히 처리
      })
  }

  // category 기본값 설정
  const category = template.category || 'templates'

  return (
    <div className={`template-card category-${category}`}>
      <div className="template-header">
        <h3 className="template-title">{template.title}</h3>
      </div>
      
      <pre className="template-content">{template.content}</pre>
      
      <div className="template-actions">
        <button 
          onClick={handleCopy}
          className="btn-copy"
          title="복사"
        >
          복사
        </button>
        <button 
          onClick={() => onEdit(template)}
          className="edit-btn"
          title="수정"
        >
          수정
        </button>
        <button
          onClick={() => {
            if (window.confirm('정말 삭제하시겠습니까?')) {
              onDelete(template.id)
            }
          }}
          className="delete-btn"
          title="삭제"
        >
          삭제
        </button>
      </div>
    </div>
  )
}

export default TemplateCard