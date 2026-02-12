import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useFormStore } from '../stores/useFormStore'
import { useUIStore } from '../stores/useUIStore'

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

  const handleCancel = () => {
    cancelEdit()
    resetForm('deployment')
  }

  const createFolders = async () => {
    if (!deployment.backupPath || !deployment.newPath) {
      alert('경로가 생성되지 않았습니다. 날짜와 설명을 입력하세요.')
      return
    }

    setCreatingFolders(true)
    try {
      const result = await invoke('create_deployment_folders', {
        backupPath: deployment.backupPath,
        newPath: deployment.newPath
      })
      alert(result)
    } catch (error) {
      alert(`폴더 생성 실패: ${error}`)
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
      {/* 날짜 */}
      <div className="deployment-date">
        <label>배포 날짜</label>
        <input
          type="date"
          value={deployment.date}
          onChange={(e) => setDeploymentField('date', e.target.value)}
        />
      </div>

      {/* 설명 */}
      <div className="deployment-description">
        <label>배포 설명</label>
        <input
          type="text"
          placeholder="쪽지대량발송"
          value={deployment.description}
          onChange={(e) => setDeploymentField('description', e.target.value)}
        />
      </div>

      {/* 경로 */}
      <div className="deployment-paths">
        <div className="path-group">
          <label>백업 경로</label>
          <div className="path-input-group">
            <input
              type="text"
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
        </div>

        <div className="path-group">
          <label>신규 파일 경로</label>
          <div className="path-input-group">
            <input
              type="text"
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
      </div>

      {/* 파일 목록 */}
      <div className="deployment-files">
        <label>수정 파일 목록</label>
        <textarea
          placeholder="ha0106SaveCmd.class&#10;UserController.java&#10;config.xml"
          value={deployment.fileList}
          onChange={(e) => setDeploymentField('fileList', e.target.value)}
          rows="4"
        />
      </div>

      {/* 변경사항 */}
      <div className="deployment-changes">
        <label>변경사항</label>
        <textarea
          placeholder="쪽지 대량발송 기능 수정&#10;로그인 임계값 보안 패치"
          value={deployment.changes}
          onChange={(e) => setDeploymentField('changes', e.target.value)}
          rows="3"
        />
      </div>

      {/* 체크리스트 */}
      <div className="deployment-checklist">
        <label>체크리스트</label>
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

      {/* 환경 & 상태 */}
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

      {/* 버튼 */}
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
