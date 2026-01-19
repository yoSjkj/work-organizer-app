function MemoForm({ 
  requestMethod,
  inquiryType,
  requesterType,
  dealerCode,
  dealerName,
  team,
  name,
  position,
  freeText,
  title,
  content,
  status,
  options,
  onRequestMethodChange,
  onInquiryTypeChange,
  onRequesterTypeChange,
  onDealerCodeChange,
  onDealerNameChange,
  onTeamChange,
  onNameChange,
  onPositionChange,
  onFreeTextChange,
  onTitleChange,
  onContentChange,
  onStatusChange,
  editingId,
  onCancel,
  onSubmit 
}) {
  // 요청자유형에 따라 다른 입력 폼 렌더링
  const renderRequesterFields = () => {
    switch(requesterType) {
      case '대리점':
        return (
          <div className="requester-fields">
            <input
              type="text"
              placeholder="대리점코드"
              value={dealerCode}
              onChange={(e) => onDealerCodeChange(e.target.value)}
            />
            <input
              type="text"
              placeholder="대리점명"
              value={dealerName}
              onChange={(e) => onDealerNameChange(e.target.value)}
            />
          </div>
        )
      
      case '현업':
        return (
          <div className="requester-fields">
            <input
              type="text"
              placeholder="팀명"
              value={team}
              onChange={(e) => onTeamChange(e.target.value)}
            />
            <input
              type="text"
              placeholder="이름"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
            />
            <input
              type="text"
              placeholder="직위"
              value={position}
              onChange={(e) => onPositionChange(e.target.value)}
            />
          </div>
        )
      
      default:
        return (
          <div className="requester-fields">
            <input
              type="text"
              placeholder="요청자 정보"
              value={freeText}
              onChange={(e) => onFreeTextChange(e.target.value)}
              className="full-width"
            />
          </div>
        )
    }
  }

  return (
    <>
      {/* 상단: 요청방식, 문의유형, 요청자유형 */}
      <div className="memo-form-top">
        <select value={requestMethod} onChange={(e) => onRequestMethodChange(e.target.value)}>
          {options.requestMethods.map(method => (
            <option key={method} value={method}>{method}</option>
          ))}
        </select>
        
        <input
          type="text"
          placeholder="문의유형"
          value={inquiryType}
          onChange={(e) => onInquiryTypeChange(e.target.value)}
          list="inquiry-types"
        />
        <datalist id="inquiry-types">
          {options.inquiryTypes.map(type => (
            <option key={type} value={type} />
          ))}
        </datalist>
        
        <select value={requesterType} onChange={(e) => onRequesterTypeChange(e.target.value)}>
          {options.requesterTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {/* 요청자 정보 (유형별로 다름) */}
      {renderRequesterFields()}
      
      {/* 제목 */}
      <input
        type="text"
        placeholder="제목"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
      />
      
      {/* 내용 */}
      <textarea
        placeholder="문의 내용을 입력하세요"
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        rows="4"
      />
      
      {/* 하단: 상태 선택, 추가 버튼 */}
      <div className="form-controls">
        <select value={status} onChange={(e) => onStatusChange(e.target.value)}>
          <option value="임시">📝 임시</option>
          <option value="진행">⚙️ 진행</option>
          <option value="완료">✅ 완료</option>
        </select>
        <button onClick={onSubmit} className="add-btn">
          {editingId ? '저장' : '추가'}
        </button>
      </div>
    </>
  )
}

export default MemoForm