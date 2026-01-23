import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function DocumentCard({ document, onEdit, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const getPreview = () => {
    const lines = document.content.split('\n')
    return lines.slice(0, 3).join('\n')
  }
  
  const hasMore = document.content.split('\n').length > 3

  return (
    <div className="document-card">
      <div className="document-header">
        <div className="document-title-section">
          {document.docCategory && document.docCategory !== '전체' && (
            <span className="badge-doc-category">{document.docCategory}</span>
          )}
          {document.isMarkdown && (
            <span className="badge-markdown">MD</span>
          )}
          <h3 
            className="document-title"
            onClick={() => setIsExpanded(!isExpanded)}
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
                  className="btn-expand"
                  onClick={() => setIsExpanded(true)}
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
                  className="btn-expand"
                  onClick={() => setIsExpanded(true)}
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
          className="edit-btn"
          onClick={() => onEdit(document)}
        >
          수정
        </button>
        <button
          className="delete-btn"
          onClick={() => {
            if (window.confirm('정말 삭제하시겠습니까?')) {
              onDelete(document.id)
            }
          }}
        >
          삭제
        </button>
        {isExpanded && (
          <button 
            className="btn-collapse"
            onClick={() => setIsExpanded(false)}
          >
            접기 ▲
          </button>
        )}
      </div>
    </div>
  )
}

export default DocumentCard