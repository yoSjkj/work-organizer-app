import { useFormStore } from '../stores/useFormStore'
import { useUIStore } from '../stores/useUIStore'

const DOCUMENT_CATEGORIES = ['전체', '주문', '처리중', '조직이관', '인수인계', '기타']

function DocumentForm({ onSubmit }) {
  const document = useFormStore((state) => state.document)
  const setDocumentField = useFormStore((state) => state.setDocumentField)
  const editingId = useUIStore((state) => state.editingId)
  const cancelEdit = useUIStore((state) => state.cancelEdit)
  const resetForm = useFormStore((state) => state.resetForm)

  const handleCancel = () => {
    cancelEdit()
    resetForm('document')
  }

  return (
    <>
      {/* 마크다운 체크박스 */}
      <label className="markdown-checkbox-wrapper">
        <input
          type="checkbox"
          checked={document.isMarkdown}
          onChange={(e) => setDocumentField('isMarkdown', e.target.checked)}
        />
        <span className="markdown-checkbox-label">마크다운으로 렌더링</span>
      </label>

      <div className="document-form-top">
        <select
          value={document.docCategory}
          onChange={(e) => setDocumentField('docCategory', e.target.value)}
          className="doc-category-select"
        >
          {DOCUMENT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="제목"
          value={document.title}
          onChange={(e) => setDocumentField('title', e.target.value)}
          className="doc-title-input"
        />
      </div>

      <textarea
        placeholder="내용을 입력하세요"
        value={document.content}
        onChange={(e) => setDocumentField('content', e.target.value)}
        style={{ minHeight: '400px' }}
      />

      <div className="form-controls">
        <div className="button-group">
          {editingId && (
            <button onClick={handleCancel} className="cancel-btn">
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
