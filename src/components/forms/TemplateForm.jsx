import { useFormStore } from '../../stores/useFormStore'
import { useUIStore } from '../../stores/useUIStore'

function TemplateForm({ onSubmit }) {
  const template = useFormStore((state) => state.template)
  const setTemplateField = useFormStore((state) => state.setTemplateField)
  const editingId = useUIStore((state) => state.editingId)
  const cancelEdit = useUIStore((state) => state.cancelEdit)
  const resetForm = useFormStore((state) => state.resetForm)

  const handleCancel = () => {
    cancelEdit()
    resetForm('template')
  }

  return (
    <>
      <input
        type="text"
        placeholder="제목"
        value={template.title}
        onChange={(e) => setTemplateField('title', e.target.value)}
        required
      />

      <textarea
        placeholder="내용을 입력하세요"
        value={template.content}
        onChange={(e) => setTemplateField('content', e.target.value)}
        rows="10"
        required
      />

      <div className="form-controls">
        <div className="button-group">
          {editingId && (
            <button type="button" onClick={handleCancel} className="cancel-btn">
              취소
            </button>
          )}
          <button type="submit" className="add-btn">
            {editingId ? '저장' : '추가'}
          </button>
        </div>
      </div>
    </>
  )
}

export default TemplateForm
