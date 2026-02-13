import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useUIStore } from '../../stores/useUIStore'

function DocumentCard({ document, onEdit, onDelete }) {
  const expandedDocuments = useUIStore((state) => state.expandedDocuments)
  const toggleDocumentExpanded = useUIStore((state) => state.toggleDocumentExpanded)

  const isExpanded = expandedDocuments.has(document.id)
  
  const getPreview = () => {
    const lines = document.content.split('\n')
    return lines.slice(0, 3).join('\n')
  }
  
  const hasMore = document.content.split('\n').length > 3

  return (
    <div className={`document-card category-${document.category.replace(/\s+/g, '-')}`}>
      <div className="document-header">
        <div className="document-title-section">
          {/* 배지들을 item-badges-top으로 감싸서 일관성 유지 */}
          {(document.docCategory || document.isMarkdown) && (
            <div className="item-badges-top">
              {document.docCategory && document.docCategory !== '전체' && (
                <span className="badge-doc-category">{document.docCategory}</span>
              )}
              {document.isMarkdown && (
                <span className="badge-markdown">MD</span>
              )}
            </div>
          )}
          <h3
            className="document-title"
            onClick={(e) => {
              e.stopPropagation()
              toggleDocumentExpanded(document.id)
            }}
            style={{ cursor: 'pointer' }}
          >
            {document.title}
            {hasMore && (
              <span className="expand-icon">
                {isExpanded ? ' ▼' : ' ▶'}
              </span>
            )}
          </h3>
        </div>
        <span className="document-date">{document.date}</span>
      </div>
      
      {/* 조건부 렌더링 */}
      <div className="document-content-wrapper">
        {document.isMarkdown ? (
          // 마크다운 렌더링
          isExpanded ? (
            <div className="document-content document-content-full markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{document.content}</ReactMarkdown>
            </div>
          ) : (
            <>
              <div className="document-content document-content-preview markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{getPreview()}</ReactMarkdown>
              </div>
              {hasMore && (
                <button
                  type="button"
                  className="btn-expand"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    toggleDocumentExpanded(document.id)
                  }}
                >
                  더보기 ({document.content.split('\n').length}줄)
                </button>
              )}
            </>
          )
        ) : (
          // 일반 텍스트
          isExpanded ? (
            <pre className="document-content document-content-full">
              {document.content}
            </pre>
          ) : (
            <>
              <pre className="document-content document-content-preview">
                {getPreview()}
              </pre>
              {hasMore && (
                <button
                  type="button"
                  className="btn-expand"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    toggleDocumentExpanded(document.id)
                  }}
                >
                  더보기 ({document.content.split('\n').length}줄)
                </button>
              )}
            </>
          )
        )}
      </div>
      
      <div className="document-actions">
        <button
          type="button"
          className="edit-btn"
          onClick={(e) => {
            e.stopPropagation()
            onEdit(document)
          }}
        >
          수정
        </button>
        <button
          type="button"
          className="delete-btn"
          onClick={(e) => {
            e.stopPropagation()
            if (window.confirm('정말 삭제하시겠습니까?')) {
              onDelete(document.id)
            }
          }}
        >
          삭제
        </button>
        {isExpanded && (
          <button
            type="button"
            className="btn-collapse"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggleDocumentExpanded(document.id)
            }}
          >
            접기 ▲
          </button>
        )}
      </div>
    </div>
  )
}

export default DocumentCard