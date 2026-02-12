function ItemCard({ item, onDelete, onStatusChange, onEdit }) {
  const isMemo = item.requestMethod !== undefined
  const isDeployment = item.target !== undefined
  
  const getRequesterDisplay = () => {
    if (!item.requester) return null
    
    const { dealerCode, dealerName, team, name, position, freeText } = item.requester
    
    if (dealerCode || dealerName) {
      return (
        <div className="requester-display">
          {dealerCode && <span className="badge-code">코드: {dealerCode}</span>}
          {dealerName && <span className="badge-name">{dealerName}</span>}
        </div>
      )
    }
    
    if (team || name || position) {
      return (
        <div className="requester-display">
          {team && <span className="badge-team">{team}</span>}
          {name && <span className="badge-name">{name}</span>}
          {position && <span className="badge-position">{position}</span>}
        </div>
      )
    }
    
    if (freeText) {
      return <div className="requester-display"><span className="badge-free">{freeText}</span></div>
    }
    
    return null
  }
  
  return (
    <div className={`item-card ${isMemo ? 'memo-card' : 'deployment-card'} category-${item.category}`}>
      <div className="item-header">
        <div className="item-title-section">
          {isMemo ? (
            <>
              <div className="item-badges-top">
                {item.requestMethod && (
                  <span className="badge-method">{item.requestMethod}</span>
                )}
                {item.inquiryType && (
                  <span className="badge-inquiry">{item.inquiryType}</span>
                )}
                {item.contactInfo && (
                  <span className="badge-contact">{item.contactInfo}</span>
                )}
              </div>
              <h3>{item.title || '제목 없음'}</h3>
              
              {getRequesterDisplay()}
            </>
          ) : (
            <h3>{item.title}</h3>
          )}
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
      
      <p className="item-content">{item.content}</p>
      
      <div className="item-actions">
        <button 
          className="edit-btn"
          onClick={() => onEdit(item)}
        >
          수정
        </button>
        {isMemo && item.status !== '완료' && (
          <button 
            className="status-change-btn"
            onClick={() => onStatusChange(item.id, item.status === '임시' ? '진행' : '완료')}
          >
            {item.status === '임시' ? '진행으로 변경' : '완료 처리'}
          </button>
        )}
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

export default ItemCard