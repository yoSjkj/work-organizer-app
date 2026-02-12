import { useFormStore } from '../stores/useFormStore'
import { useUIStore } from '../stores/useUIStore'

// 옵션 데이터
const OPTIONS = {
  requestMethods: ['전화', '이메일', 'CSR', '메신저', '직접방문'],
  inquiryTypes: [
    '계정 문의',
    '시스템 문의',
    'PC환경 문의',
    '조직이관 문의',
    '주문 문의',
    '통제자재 등록 요청',
    '부자재코드 생성 요청',
    '기능 CSR',
    '기타'
  ],
  requesterTypes: ['대리점', '현업', '시공사', 'IT담당자', '기타']
}

function MemoForm({ onSubmit }) {
  const memo = useFormStore((state) => state.memo)
  const setMemoField = useFormStore((state) => state.setMemoField)
  const editingId = useUIStore((state) => state.editingId)
  const cancelEdit = useUIStore((state) => state.cancelEdit)
  const resetForm = useFormStore((state) => state.resetForm)

  const handleCancel = () => {
    cancelEdit()
    resetForm('memo')
  }

  // 문의유형 변경 핸들러 (자동 입력 기능 포함)
  const handleInquiryTypeChange = (value) => {
    setMemoField('inquiryType', value)

    if (value === '부자재코드 생성 요청') {
      setMemoField('requestMethod', 'CSR')
      setMemoField('requesterType', '현업')
      setMemoField('team', '창호.지인스퀘어 수원')
      setMemoField('name', '장동희')
      setMemoField('position', '책임')
    } else if (value === '통제자재 등록 요청') {
      setMemoField('requestMethod', '메신저')
      setMemoField('requesterType', '현업')
      setMemoField('team', '창호.상품개발팀')
      setMemoField('name', '박범석')
      setMemoField('position', '선임')
      setMemoField('title', '통제자재 등록 요청')
    }
  }

  // 문의 방식별 연락처 필드 렌더링
  const renderContactField = () => {
    switch (memo.requestMethod) {
      case '전화':
        return (
          <div className="contact-field">
            <input
              type="tel"
              placeholder="전화번호 (예: 010-1234-5678)"
              value={memo.contactInfo}
              onChange={(e) => setMemoField('contactInfo', e.target.value)}
            />
          </div>
        )

      case '이메일':
        return (
          <div className="contact-field">
            <input
              type="email"
              placeholder="이메일 주소"
              value={memo.contactInfo}
              onChange={(e) => setMemoField('contactInfo', e.target.value)}
            />
          </div>
        )

      case 'CSR':
        return (
          <div className="contact-field">
            <input
              type="text"
              placeholder="CSR 처리번호 (예: RITM1234567)"
              value={memo.contactInfo}
              onChange={(e) => setMemoField('contactInfo', e.target.value)}
            />
          </div>
        )

      case '직접방문':
        return null

      default:
        return null
    }
  }

  // 요청자유형에 따라 다른 입력 폼 렌더링
  const renderRequesterFields = () => {
    switch (memo.requesterType) {
      case '대리점':
        return (
          <div className="requester-fields requester-fields-inline">
            <input
              type="text"
              placeholder="대리점코드"
              value={memo.dealerCode}
              onChange={(e) => setMemoField('dealerCode', e.target.value)}
              className="field-flex1"
            />
            <input
              type="text"
              placeholder="대리점명"
              value={memo.dealerName}
              onChange={(e) => setMemoField('dealerName', e.target.value)}
              className="field-flex1"
            />
          </div>
        )

      case '현업':
        return (
          <div className="requester-fields requester-fields-inline">
            <input
              type="text"
              placeholder="팀명"
              value={memo.team}
              onChange={(e) => setMemoField('team', e.target.value)}
              className="field-flex2"
            />
            <input
              type="text"
              placeholder="이름"
              value={memo.name}
              onChange={(e) => setMemoField('name', e.target.value)}
              className="field-flex1"
            />
            <input
              type="text"
              placeholder="직위"
              value={memo.position}
              onChange={(e) => setMemoField('position', e.target.value)}
              className="field-flex1"
            />
          </div>
        )

      default:
        return (
          <div className="requester-fields">
            <input
              type="text"
              placeholder="요청자 정보"
              value={memo.freeText}
              onChange={(e) => setMemoField('freeText', e.target.value)}
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
        <select
          value={memo.requestMethod}
          onChange={(e) => setMemoField('requestMethod', e.target.value)}
        >
          {OPTIONS.requestMethods.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="문의유형"
          value={memo.inquiryType}
          onChange={(e) => handleInquiryTypeChange(e.target.value)}
          list="inquiry-types"
        />
        <datalist id="inquiry-types">
          {OPTIONS.inquiryTypes.map((type) => (
            <option key={type} value={type} />
          ))}
        </datalist>

        <select
          value={memo.requesterType}
          onChange={(e) => setMemoField('requesterType', e.target.value)}
        >
          {OPTIONS.requesterTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* 연락 정보 (문의 방식별) */}
      {renderContactField()}

      {/* 요청자 정보 (유형별로 다름) */}
      {renderRequesterFields()}

      {/* 제목 */}
      <input
        type="text"
        placeholder="제목"
        value={memo.title}
        onChange={(e) => setMemoField('title', e.target.value)}
        required
      />

      {/* 내용 */}
      <textarea
        placeholder="문의 내용을 입력하세요"
        value={memo.content}
        onChange={(e) => setMemoField('content', e.target.value)}
        rows="4"
        required
      />

      {/* 하단: 상태 선택, 추가/취소 버튼 */}
      <div className="form-controls">
        <select
          value={memo.status}
          onChange={(e) => setMemoField('status', e.target.value)}
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

export default MemoForm
