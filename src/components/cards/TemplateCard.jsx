import { useItemsStore } from '../../stores/useItemsStore'

function TemplateCard({ template, onEdit, onDelete }) {
  if (!template) return null

  const toggleFavorite = useItemsStore((state) => state.toggleFavorite)
  const category = template.category || 'templates'

  const handleCopy = () => {
    navigator.clipboard.writeText(template.content)
      .catch(err => console.error('복사 실패:', err))
  }

  return (
    <div className={`template-card category-${category}`}>
      <div className="template-header">
        <h3 className="template-title">{template.title}</h3>
        <button
          className={`favorite-btn ${template.favorite ? 'active' : ''}`}
          onClick={() => toggleFavorite(template.id)}
          title={template.favorite ? '즐겨찾기 해제' : '즐겨찾기'}
        >
          {template.favorite ? '★' : '☆'}
        </button>
      </div>

      <pre className="template-content">{template.content}</pre>

      <div className="template-actions">
        <button onClick={handleCopy} className="btn-copy" title="복사">복사</button>
        <button onClick={() => onEdit(template)} className="edit-btn" title="수정">수정</button>
        <button
          onClick={() => { if (window.confirm('정말 삭제하시겠습니까?')) onDelete(template.id) }}
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
