import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useFormStore } from '../../stores/useFormStore'
import { useUIStore } from '../../stores/useUIStore'

function DeploymentForm({ onSubmit }) {
  const deployment = useFormStore((state) => state.deployment)
  const setDeploymentField = useFormStore((state) => state.setDeploymentField)
  const editingId = useUIStore((state) => state.editingId)
  const cancelEdit = useUIStore((state) => state.cancelEdit)
  const resetForm = useFormStore((state) => state.resetForm)

  // 날짜/설명 변경 시 경로 자동 생성
  useEffect(() => {
    if (deployment.date && deployment.description) {
      const dateStr = deployment.date.replace(/-/g, '')
      const desc = deployment.description.trim()
      setDeploymentField('backupPath', `C:\\운영배포\\backup\\${dateStr}\\${desc}\\`)
      setDeploymentField('newPath', `C:\\운영배포\\new\\${dateStr}\\${desc}\\`)
    } else if (deployment.date) {
      const dateStr = deployment.date.replace(/-/g, '')
      setDeploymentField('backupPath', `C:\\운영배포\\backup\\${dateStr}\\`)
      setDeploymentField('newPath', `C:\\운영배포\\new\\${dateStr}\\`)
    }
  }, [deployment.date, deployment.description, setDeploymentField])

  const [creatingFolders, setCreatingFolders] = useState(false)
  const [folderMessage, setFolderMessage] = useState('')

  const handleCancel = () => {
    cancelEdit()
    resetForm('deployment')
  }

  const createFolders = async () => {
    if (!deployment.backupPath || !deployment.newPath) {
      setFolderMessage('경로가 생성되지 않았습니다. 날짜와 설명을 입력하세요.')
      setTimeout(() => setFolderMessage(''), 3000)
      return
    }

    setCreatingFolders(true)
    setFolderMessage('')
    try {
      const result = await invoke('create_deployment_folders', {
        backupPath: deployment.backupPath,
        newPath: deployment.newPath
      })
      setFolderMessage('✓ ' + result)
      setTimeout(() => setFolderMessage(''), 3000)
    } catch (error) {
      setFolderMessage(`✗ 폴더 생성 실패: ${error}`)
      setTimeout(() => setFolderMessage(''), 3000)
    } finally {
      setCreatingFolders(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        // 복사 성공 시 시각적 피드백 (옵션)
      })
      .catch(err => {
        console.error('복사 실패:', err)
      })
  }

  const toggleChecklist = (key) => {
    setDeploymentField('checklist', {
      ...deployment.checklist,
      [key]: !deployment.checklist[key]
    })
  }

  return (
    <>
      {/* 날짜 & 설명 */}
      <div className="deployment-top-row">
        <input
          type="date"
          value={deployment.date}
          onChange={(e) => setDeploymentField('date', e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="배포 설명 (예: 쪽지대량발송)"
          value={deployment.description}
          onChange={(e) => setDeploymentField('description', e.target.value)}
          required
        />
      </div>

      {/* 경로 */}
      <div className="deployment-paths">
        <div className="path-input-group">
          <input
            type="text"
            placeholder="백업 경로 (자동 생성)"
            value={deployment.backupPath}
            onChange={(e) => setDeploymentField('backupPath', e.target.value)}
            readOnly
          />
          <button
            type="button"
            onClick={() => copyToClipboard(deployment.backupPath)}
            className="btn-copy-path"
            title="경로 복사"
          >
            복사
          </button>
        </div>

        <div className="path-input-group">
          <input
            type="text"
            placeholder="신규 파일 경로 (자동 생성)"
            value={deployment.newPath}
            onChange={(e) => setDeploymentField('newPath', e.target.value)}
            readOnly
          />
          <button
            type="button"
            onClick={() => copyToClipboard(deployment.newPath)}
            className="btn-copy-path"
            title="경로 복사"
          >
            복사
          </button>
        </div>

        {/* 폴더 생성 버튼 */}
        <button
          type="button"
          onClick={createFolders}
          className="btn-create-folders"
          disabled={creatingFolders || !deployment.description}
        >
          {creatingFolders ? '생성 중...' : '폴더 생성'}
        </button>

        {/* 폴더 생성 메시지 */}
        {folderMessage && (
          <div className="folder-message">
            {folderMessage}
          </div>
        )}
      </div>

      {/* 파일 목록 */}
      <textarea
        placeholder="수정한 파일명 (한 줄씩 입력)&#10;예: ha0106SaveCmd.class&#10;    UserController.java"
        value={deployment.fileList}
        onChange={(e) => setDeploymentField('fileList', e.target.value)}
        rows="4"
      />

      {/* 변경사항 */}
      <textarea
        placeholder="변경사항 요약&#10;예: 쪽지 대량발송 기능 수정&#10;    로그인 임계값 보안 패치"
        value={deployment.changes}
        onChange={(e) => setDeploymentField('changes', e.target.value)}
        rows="3"
      />

      {/* 체크리스트 */}
      <div className="deployment-checklist">
        <div className="checklist-items">
          <label className="checklist-item">
            <input
              type="checkbox"
              checked={deployment.checklist.backup}
              onChange={() => toggleChecklist('backup')}
            />
            <span>백업 완료</span>
          </label>
          <label className="checklist-item">
            <input
              type="checkbox"
              checked={deployment.checklist.diff}
              onChange={() => toggleChecklist('diff')}
            />
            <span>diff 확인 완료</span>
          </label>
          <label className="checklist-item">
            <input
              type="checkbox"
              checked={deployment.checklist.upload}
              onChange={() => toggleChecklist('upload')}
            />
            <span>FTP 업로드 완료</span>
          </label>
          <label className="checklist-item">
            <input
              type="checkbox"
              checked={deployment.checklist.verify}
              onChange={() => toggleChecklist('verify')}
            />
            <span>운영 확인 완료</span>
          </label>
        </div>
      </div>

      {/* 하단: 상태 선택, 추가/취소 버튼 */}
      <div className="form-controls">
        <select
          value={deployment.status}
          onChange={(e) => setDeploymentField('status', e.target.value)}
        >
          <option value="임시">임시</option>
          <option value="진행">진행</option>
          <option value="완료">완료</option>
        </select>
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

export default DeploymentForm
