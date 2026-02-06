import { useFormStore } from '../stores/useFormStore'
import { useUIStore } from '../stores/useUIStore'

function DeploymentForm({ onSubmit }) {
  const deployment = useFormStore((state) => state.deployment)
  const setDeploymentField = useFormStore((state) => state.setDeploymentField)
  const editingId = useUIStore((state) => state.editingId)
  const cancelEdit = useUIStore((state) => state.cancelEdit)
  const resetForm = useFormStore((state) => state.resetForm)

  const handleCancel = () => {
    cancelEdit()
    resetForm('deployment')
  }

  return (
    <>
      <input
        type="text"
        placeholder="배포할 파일명 입력 (예: ha0106SaveCmd.class)"
        value={deployment.file}
        onChange={(e) => setDeploymentField('file', e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && onSubmit()}
      />
      <textarea
        placeholder="변경사항 설명 (예: 쪽지 대량발송 기능 수정, 로그인 임계값 보안 패치)"
        value={deployment.changes}
        onChange={(e) => setDeploymentField('changes', e.target.value)}
        rows="3"
      />
      <div className="deployment-controls">
        <select
          value={deployment.target}
          onChange={(e) => setDeploymentField('target', e.target.value)}
        >
          <option value="운영">운영 배포</option>
          <option value="테스트">테스트 배포</option>
          <option value="개발">개발 배포</option>
        </select>
        <select
          value={deployment.status}
          onChange={(e) => setDeploymentField('status', e.target.value)}
        >
          <option value="진행중">진행중</option>
          <option value="완료">완료</option>
          <option value="실패">실패</option>
        </select>
      </div>
      <div className="form-controls">
        <div className="button-group">
          {editingId && (
            <button onClick={handleCancel} className="cancel-btn">
              취소
            </button>
          )}
          <button onClick={onSubmit} className="add-btn">
            {editingId ? '저장' : '배포 기록 추가'}
          </button>
        </div>
      </div>
    </>
  )
}

export default DeploymentForm
