function DeploymentCard({ item, onDelete, onEdit }) {
  return (
    <div className={`item-card deployment-card category-${item.category.replace(/\s+/g, '-')}`}>
      <div className="item-header">
        <div className="item-title-section">
          <h3>{item.title}</h3>
        </div>

        <div className="item-meta">
          {item.status && (
            <span className={`status-badge status-${item.status}`}>
              {item.status}
            </span>
          )}
          {item.target && (
            <span className="target-badge">{item.target}</span>
          )}
          <span className="item-date">
            {item.time ? `${item.date} ${item.time}` : item.date}
          </span>
        </div>
      </div>

      {/* 배포 기록 추가 정보 */}
      <div className="deployment-details">
        {/* 경로 */}
        {(item.backupPath || item.newPath) && (
          <div className="deployment-paths-display">
            {item.backupPath && (
              <div className="path-item">
                <code className="path-value">{item.backupPath}</code>
                <code className="path-value">{item.newPath}</code>
              </div>
            )}
          </div>
        )}

        {/* 파일 목록 */}
        {item.fileList && (
          <div className="deployment-files-display">
            <pre className="files-list">{item.fileList}</pre>
          </div>
        )}

        {/* 체크리스트 */}
        {item.checklist && (
          <div className="deployment-checklist-display">
            <div className="checklist-status">
              {item.checklist.backup && <span className="check-done">백업 ✓</span>}
              {item.checklist.diff && <span className="check-done">diff ✓</span>}
              {item.checklist.upload && <span className="check-done">FTP ✓</span>}
              {item.checklist.verify && <span className="check-done">확인 ✓</span>}
            </div>
          </div>
        )}
      </div>

      <p className="item-content">{item.content}</p>

      <div className="item-actions">
        <button
          className="edit-btn"
          onClick={() => onEdit(item)}
        >
          수정
        </button>
        <button
          className="delete-btn"
          onClick={() => onDelete(item.id)}
        >
          삭제
        </button>
      </div>
    </div>
  )
}

export default DeploymentCard
